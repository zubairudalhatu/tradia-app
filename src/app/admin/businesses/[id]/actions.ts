"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function updateAdminBusinessAction(businessId: string, formData: FormData) {
  await requireAdminAction(formData);

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const ownerId = optionalString(formData.get("ownerId"));
  const planId = optionalString(formData.get("planId"));

  if (name.length < 2 || description.length < 20 || address.length < 5 || !categoryId || !locationId) {
    redirect(`/admin/businesses/${businessId}?error=invalid`);
  }

  try {
    await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        description,
        categoryId,
        locationId,
        address,
        ownerId,
        planId,
        phone: optionalString(formData.get("phone")),
        whatsapp: optionalString(formData.get("whatsapp")),
        email: optionalString(formData.get("email")),
        website: optionalString(formData.get("website")),
        listingStatus: normalizeListingStatus(String(formData.get("listingStatus") ?? "DRAFT")),
        verificationStatus: normalizeVerificationStatus(String(formData.get("verificationStatus") ?? "UNVERIFIED"))
      }
    });
  } catch {
    redirect(`/admin/businesses/${businessId}?error=save`);
  }

  revalidatePath("/admin");
  revalidatePath("/businesses");
  redirect(`/admin/businesses/${businessId}?saved=1`);
}

async function requireAdminAction(formData: FormData) {
  const user = await getCurrentUser();

  if (user?.status === "ACTIVE" && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
    return user;
  }

  const tokenUser = await getAdminFromActionToken(String(formData.get("adminActionToken") ?? ""));
  if (tokenUser) return tokenUser;

  redirect(user ? "/dashboard" : "/login");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

function normalizeListingStatus(value: string) {
  if (["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "SUSPENDED"].includes(value)) {
    return value as "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SUSPENDED";
  }

  return "DRAFT";
}

function normalizeVerificationStatus(value: string) {
  if (["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].includes(value)) {
    return value as "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  }

  return "UNVERIFIED";
}
