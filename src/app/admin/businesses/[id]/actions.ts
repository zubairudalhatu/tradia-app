"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { addYears } from "@/lib/time";
import type { Prisma } from "@prisma/client";

export async function updateAdminBusinessAction(businessId: string, formData: FormData) {
  const admin = await requireAdminAction(formData);

  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(formData.get("slug"));
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const ownerId = optionalString(formData.get("ownerId"));
  const planId = optionalString(formData.get("planId"));

  if (name.length < 2 || slug.length < 3 || description.length < 20 || address.length < 5 || !categoryId || !locationId) {
    redirect(`/admin/businesses/${businessId}?error=invalid`);
  }

  const existingSlugOwner = await prisma.business.findUnique({ where: { slug } });
  if (existingSlugOwner && existingSlugOwner.id !== businessId) {
    redirect(`/admin/businesses/${businessId}?error=slug-taken`);
  }

  try {
    const business = await prisma.$transaction(async (tx) => {
      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: {
          name,
          slug,
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

      await syncAdminAssignedSubscription(tx, businessId, planId, admin.id);
      return updatedBusiness;
    });

    await createAuditLog({
      actorId: admin.id,
      action: "UPDATED_BUSINESS",
      entityType: "Business",
      entityId: business.id,
      metadata: { businessName: business.name }
    });
  } catch {
    redirect(`/admin/businesses/${businessId}?error=save`);
  }

  revalidatePath("/admin");
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${slug}`);
  redirect(`/admin/businesses/${businessId}?saved=1`);
}

async function syncAdminAssignedSubscription(
  tx: Prisma.TransactionClient,
  businessId: string,
  planId: string | null,
  adminId: string
) {
  const now = new Date();
  const activeSubscription = await tx.subscription.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
      endsAt: { gt: now }
    },
    orderBy: { endsAt: "desc" }
  });
  const selectedPlan = planId ? await tx.plan.findUnique({ where: { id: planId } }) : null;
  const isPaidPlan = Boolean(selectedPlan && selectedPlan.annualPrice > 0);

  if (!isPaidPlan) {
    if (activeSubscription) {
      await tx.subscription.updateMany({
        where: {
          businessId,
          status: "ACTIVE",
          endsAt: { gt: now }
        },
        data: {
          status: "CANCELLED",
          endsAt: now
        }
      });
    }

    return;
  }

  if (activeSubscription?.planId === planId) {
    return;
  }

  await tx.subscription.updateMany({
    where: {
      businessId,
      status: "ACTIVE",
      endsAt: { gt: now }
    },
    data: {
      status: "CANCELLED",
      endsAt: now
    }
  });

  await tx.subscription.create({
    data: {
      businessId,
      planId: planId!,
      status: "ACTIVE",
      startsAt: now,
      endsAt: addYears(now, 1),
      paymentProvider: "ADMIN",
      providerReference: `admin-${Date.now()}-${businessId.slice(0, 8)}-${adminId.slice(0, 8)}`
    }
  });
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

function normalizeSlug(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/https?:\/\/(?:www\.)?tradia\.business\/businesses\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
