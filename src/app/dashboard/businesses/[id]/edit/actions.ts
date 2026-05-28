"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyVerificationSubmitted } from "@/lib/notifications";
import { updateOwnedBusiness } from "@/lib/queries/businesses";
import { saveUpload } from "@/lib/uploads";
import { businessCreateSchema } from "@/lib/validations/business";

export async function updateBusinessProfileAction(businessId: string, formData: FormData) {
  const user = await requireUser();
  const parsed = businessCreateSchema.safeParse({
    name: formData.get("name"),
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

  await updateOwnedBusiness(businessId, user.id, parsed.data);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  redirect(`/dashboard/businesses/${businessId}/edit?saved=1`);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}

export async function uploadBusinessMediaAction(businessId: string, formData: FormData) {
  const user = await getActiveUserOrRedirect(businessId);
  const business = await getOwnedBusinessOrThrow(businessId, user.id);
  const mediaType = String(formData.get("mediaType") ?? "GALLERY");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=media`);
  }

  let url: string;

  try {
    url = await saveUpload(file, `businesses/${business.id}`);
  } catch {
    redirect(`/dashboard/businesses/${businessId}/edit?error=upload-storage`);
  }

  await prisma.media.create({
    data: {
      businessId: business.id,
      userId: user.id,
      type: normalizeMediaType(mediaType),
      url,
      title: file.name
    }
  });

  if (mediaType === "LOGO") {
    await prisma.business.update({ where: { id: business.id }, data: { logoUrl: url } });
  }

  if (mediaType === "COVER") {
    await prisma.business.update({ where: { id: business.id }, data: { coverUrl: url } });
  }

  revalidatePath(`/dashboard/businesses/${businessId}/edit`);
  revalidatePath(`/businesses/${business.slug}`);
  redirect(`/dashboard/businesses/${businessId}/edit?media=uploaded`);
}

export async function submitVerificationRequestAction(businessId: string, formData: FormData) {
  const user = await getActiveUserOrRedirect(businessId);
  const business = await getOwnedBusinessOrThrow(businessId, user.id);
  const documentType = String(formData.get("documentType") ?? "").trim();
  const notes = optionalString(formData.get("notes"));
  const file = formData.get("document");

  if (!documentType || !(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/businesses/${businessId}/edit?error=verification`);
  }

  let documentUrl: string;

  try {
    documentUrl = await saveUpload(file, `verification/${business.id}`);
  } catch {
    redirect(`/dashboard/businesses/${businessId}/edit?error=upload-storage`);
  }

  await prisma.verificationRequest.create({
    data: {
      businessId: business.id,
      submittedBy: user.id,
      documentType,
      documentUrl,
      notes,
      status: "PENDING"
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
