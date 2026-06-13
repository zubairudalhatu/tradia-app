"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyVerificationSubmitted } from "@/lib/notifications";
import { getBusinessPlanState, isPhotoMediaType } from "@/lib/plans/benefits";
import { updateOwnedBusiness } from "@/lib/queries/businesses";
import { saveUpload, UploadValidationError } from "@/lib/uploads";
import { businessProfileUpdateSchema } from "@/lib/validations/business";

export async function updateBusinessProfileAction(businessId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = businessProfileUpdateSchema.safeParse({
    name: formData.get("name"),
    slug: normalizeSlug(formData.get("slug")),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    locationId: formData.get("locationId"),
    address: formData.get("address"),
    phone: optionalString(formData.get("phone")),
    whatsapp: optionalString(formData.get("whatsapp")),
    email: optionalString(formData.get("email")),
    website: optionalString(formData.get("website"))
  });

  if (!parsed.success) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=invalid`);
  }

  try {
    const business = await updateOwnedBusiness(businessId, user.id, parsed.data);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/businesses/${businessId}/edit`);
    revalidatePath(`/businesses/${business.slug}`);
  } catch (error) {
    if (error instanceof Error && error.message === "BUSINESS_SLUG_TAKEN") {
      redirect(`/dashboard/businesses/${businessId}/edit?error=slug-taken`);
    }

    throw error;
  }

  redirect(`/dashboard/businesses/${businessId}/edit?saved=1`);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/https?:\/\/(?:www\.)?tradia\.business\/businesses\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function uploadBusinessMediaAction(businessId: string, formData: FormData) {
  const user = await getActiveUserOrRedirect(businessId);
  const business = await getOwnedBusinessOrThrow(businessId, user.id);
  const mediaType = String(formData.get("mediaType") ?? "GALLERY");
  const normalizedMediaType = normalizeMediaType(mediaType);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=media`);
  }

  const { benefits } = getBusinessPlanState(business);
  if (isPhotoMediaType(normalizedMediaType)) {
    const photoCount = await prisma.media.count({
      where: {
        businessId: business.id,
        type: {
          in: ["LOGO", "COVER", "GALLERY"]
        }
      }
    });

    if (photoCount >= benefits.maxPhotos) {
      redirect(`/dashboard/businesses/${businessId}/edit?error=photo-limit`);
    }
  }

  let url: string;

  try {
    url = await saveUpload(file, `businesses/${business.id}`);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      redirect(`/dashboard/businesses/${businessId}/edit?error=${error.code === "size" ? "upload-too-large" : "media"}`);
    }
    redirect(`/dashboard/businesses/${businessId}/edit?error=upload-storage`);
  }

  await prisma.media.create({
    data: {
      businessId: business.id,
      userId: user.id,
      type: normalizedMediaType,
      url,
      title: null
    }
  });

  if (mediaType === "LOGO") {
    await prisma.business.update({ where: { id: business.id }, data: { logoUrl: url } });
  }

  if (mediaType === "COVER") {
    await prisma.business.update({
      where: { id: business.id },
      data: {
        coverUrl: url,
        coverCropX: 50,
        coverCropY: 50
      }
    });
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath(`/businesses/${business.slug}`);
  redirect(`/dashboard/businesses/${businessId}/edit?media=uploaded`);
}

export async function updateCoverCropAction(businessId: string, formData: FormData) {
  const user = await requireUser();
  const business = await getOwnedBusinessOrThrow(businessId, user.id);
  const coverCropX = normalizeCropCoordinate(formData.get("coverCropX"));
  const coverCropY = normalizeCropCoordinate(formData.get("coverCropY"));

  await prisma.business.update({
    where: { id: business.id },
    data: {
      coverCropX,
      coverCropY
    }
  });

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath(`/businesses/${business.slug}`);
  redirect(`/dashboard/businesses/${businessId}/edit?media=crop-saved`);
}

export async function submitVerificationRequestAction(businessId: string, formData: FormData) {
  const user = await getActiveUserOrRedirect(businessId);
  const business = await getOwnedBusinessOrThrow(businessId, user.id);
  const { benefits } = getBusinessPlanState(business);
  const documentType = String(formData.get("documentType") ?? "").trim();
  const notes = optionalString(formData.get("notes"));
  const file = formData.get("document");

  if (!benefits.canRequestVerification) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=verification-plan`);
  }

  if (business.verificationStatus === "VERIFIED") {
    redirect(`/dashboard/businesses/${businessId}/edit?verification=already-verified`);
  }

  if (!documentType || !(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=verification`);
  }

  let documentUrl: string;

  try {
    documentUrl = await saveUpload(file, `verification/${business.id}`);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      redirect(`/dashboard/businesses/${businessId}/edit?error=${error.code === "size" ? "upload-too-large" : "verification"}`);
    }
    redirect(`/dashboard/businesses/${businessId}/edit?error=upload-storage`);
  }

  const verificationRequest = await prisma.verificationRequest.create({
    data: {
      businessId: business.id,
      submittedBy: user.id,
      documentType,
      documentUrl,
      notes,
      status: "PENDING"
    }
  });

  await createAuditLog({
    actorId: user.id,
    action: "BUSINESS_VERIFICATION_REQUESTED",
    entityType: "VerificationRequest",
    entityId: verificationRequest.id,
    metadata: {
      businessId: business.id,
      businessName: business.name,
      documentType
    }
  });
  await notifyVerificationSubmitted(
    {
      id: business.id,
      name: business.name,
      slug: business.slug,
      owner: { name: user.name, email: user.email }
    },
    documentType
  );

  await prisma.business.update({
    where: { id: business.id },
    data: { verificationStatus: "PENDING" }
  });

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath("/admin");
  redirect(`/dashboard/businesses/${businessId}/edit?verification=submitted`);
}

export async function respondToReviewAction(businessId: string, formData: FormData) {
  const user = await requireUser();
  await getOwnedBusinessOrThrow(businessId, user.id);
  const reviewId = String(formData.get("reviewId") ?? "");
  const ownerResponse = String(formData.get("ownerResponse") ?? "").trim();

  if (ownerResponse.length < 2) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=response`);
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      ownerResponse,
      ownerRespondedAt: new Date()
    }
  });

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  redirect(`/dashboard/businesses/${businessId}/edit?response=saved`);
}

async function getOwnedBusinessOrThrow(businessId: string, ownerId: string) {
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
    throw new Error("Business not found or not owned by current user.");
  }

  return business;
}

async function getActiveUserOrRedirect(businessId: string) {
  const user = await getCurrentUser();

  if (!user || user.status !== "ACTIVE") {
    redirect(`/login?next=/dashboard/businesses/${businessId}/edit`);
  }

  return user;
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
