"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyBusinessLead } from "@/lib/notifications";
import { getBusinessPlanState, isPhotoMediaType } from "@/lib/plans/benefits";
import { saveUpload, UploadValidationError } from "@/lib/uploads";

export async function uploadProfileMediaAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const business = await getOwnedBusinessOrRedirect(businessId, slug, user.id);
  const mediaType = normalizeMediaType(String(formData.get("mediaType") ?? "GALLERY"));
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/businesses/${slug}?media=invalid`);
  }

  const { benefits } = getBusinessPlanState(business);
  if (isPhotoMediaType(mediaType)) {
    const photoCount = await prisma.media.count({
      where: {
        businessId: business.id,
        type: { in: ["LOGO", "COVER", "GALLERY"] }
      }
    });

    if (photoCount >= benefits.maxPhotos) {
      redirect(`/businesses/${slug}?media=photo-limit`);
    }
  }

  let url: string;

  try {
    url = await saveUpload(file, `businesses/${business.id}`);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      redirect(`/businesses/${slug}?media=${error.code === "size" ? "upload-too-large" : "invalid"}`);
    }
    redirect(`/businesses/${slug}?media=upload-storage`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.media.create({
      data: {
        businessId: business.id,
        userId: user.id,
        type: mediaType,
        url,
        title: null
      }
    });

    if (mediaType === "LOGO") {
      await tx.business.update({ where: { id: business.id }, data: { logoUrl: url } });
    }

    if (mediaType === "COVER") {
      await tx.business.update({
        where: { id: business.id },
        data: {
          coverUrl: url,
          coverCropX: normalizeCropCoordinate(formData.get("coverCropX")),
          coverCropY: normalizeCropCoordinate(formData.get("coverCropY"))
        }
      });
    }
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath(`/dashboard/businesses/${business.id}/edit`);
  redirect(`/businesses/${slug}?media=uploaded`);
}

export async function updateProfileCoverCropAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const business = await getOwnedBusinessOrRedirect(businessId, slug, user.id);

  await prisma.business.update({
    where: { id: business.id },
    data: {
      coverCropX: normalizeCropCoordinate(formData.get("coverCropX")),
      coverCropY: normalizeCropCoordinate(formData.get("coverCropY"))
    }
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath(`/dashboard/businesses/${business.id}/edit`);
  redirect(`/businesses/${slug}?media=crop-saved`);
}

export async function deleteProfileMediaAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const business = await getOwnedBusinessOrRedirect(businessId, slug, user.id);
  const mediaId = String(formData.get("mediaId") ?? "");
  const media = await prisma.media.findFirst({
    where: {
      id: mediaId,
      businessId: business.id
    }
  });

  if (!media) {
    redirect(`/businesses/${slug}?media=missing`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.media.delete({ where: { id: media.id } });

    if (business.logoUrl === media.url) {
      await tx.business.update({ where: { id: business.id }, data: { logoUrl: null } });
    }

    if (business.coverUrl === media.url) {
      await tx.business.update({
        where: { id: business.id },
        data: {
          coverUrl: null,
          coverCropX: 50,
          coverCropY: 50
        }
      });
    }
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath(`/dashboard/businesses/${business.id}/edit`);
  redirect(`/businesses/${slug}?media=deleted`);
}

export async function submitReviewAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const rating = Number(formData.get("rating"));
  const title = optionalString(formData.get("title"));
  const body = String(formData.get("body") ?? "").trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 10) {
    redirect(`/businesses/${slug}?review=invalid`);
  }

  await prisma.review.upsert({
    where: {
      businessId_userId: {
        businessId,
        userId: user.id
      }
    },
    update: {
      rating,
      title,
      body,
      status: "PENDING"
    },
    create: {
      businessId,
      userId: user.id,
      rating,
      title,
      body,
      status: "PENDING"
    }
  });

  revalidatePath(`/businesses/${slug}`);
  revalidatePath("/admin");
  redirect(`/businesses/${slug}?review=submitted`);
}

export async function reportBusinessAction(businessId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const type = String(formData.get("type") ?? "Business report").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10) {
    redirect(`/businesses/${slug}?report=invalid`);
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      businessId,
      type,
      message
    }
  });

  revalidatePath("/admin");
  redirect(`/businesses/${slug}?report=submitted`);
}

export async function reportReviewAction(businessId: string, reviewId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const message = String(formData.get("message") ?? "").trim();

  if (message.length < 10) {
    redirect(`/businesses/${slug}?report=invalid`);
  }

  await prisma.report.create({
    data: {
      reporterId: user.id,
      businessId,
      reviewId,
      type: "Review report",
      message
    }
  });

  revalidatePath("/admin");
  redirect(`/businesses/${slug}?report=submitted`);
}

export async function submitBusinessLeadAction(businessId: string, slug: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = optionalString(formData.get("email"));
  const phone = optionalString(formData.get("phone"));
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2 || message.length < 10 || (!email && !phone)) {
    redirect(`/businesses/${slug}?enquiry=invalid`);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { owner: true }
  });

  if (!business || business.listingStatus !== "PUBLISHED") {
    redirect(`/businesses/${slug}?enquiry=invalid`);
  }

  const lead = await prisma.contactLead.create({
    data: {
      businessId,
      name,
      email,
      phone,
      message
    }
  });

  try {
    await notifyBusinessLead(business, lead);
  } catch (error) {
    console.error("Business lead notification failed", error);
  }

  revalidatePath("/dashboard");
  redirect(`/businesses/${slug}?enquiry=submitted`);
}

async function getOwnedBusinessOrRedirect(businessId: string, slug: string, ownerId: string) {
  const business = await prisma.business.findFirst({
    where: {
      id: businessId,
      ownerId
    },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      }
    }
  });

  if (!business) {
    redirect(`/businesses/${slug}?media=forbidden`);
  }

  return business;
}

function normalizeMediaType(value: string) {
  if (["LOGO", "COVER", "GALLERY", "DOCUMENT", "MENU", "BROCHURE"].includes(value)) {
    return value as "LOGO" | "COVER" | "GALLERY" | "DOCUMENT" | "MENU" | "BROCHURE";
  }

  return "GALLERY";
}

function normalizeCropCoordinate(value: FormDataEntryValue | null) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  return Math.min(Math.max(Math.round(number), 0), 100);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}
