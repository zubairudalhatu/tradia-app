"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createHomepagePlacement, deactivateBusinessPlacements } from "@/lib/queries/featured";
import { refreshBusinessRating } from "@/lib/ratings";

export async function approveBusinessAction(formData: FormData) {
  await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "PUBLISHED" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectBusinessAction(formData: FormData) {
  await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "REJECTED" }
  });

  revalidatePath("/admin");
}

export async function approveVerificationAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const requestId = String(formData.get("requestId") ?? "");

  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedBy: admin.id,
      reviewedAt: new Date()
    }
  });

  await prisma.business.update({
    where: { id: request.businessId },
    data: { verificationStatus: "VERIFIED" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectVerificationAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const requestId = String(formData.get("requestId") ?? "");

  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      reviewedBy: admin.id,
      reviewedAt: new Date()
    }
  });

  await prisma.business.update({
    where: { id: request.businessId },
    data: { verificationStatus: "REJECTED" }
  });

  revalidatePath("/admin");
}

export async function publishReviewAction(formData: FormData) {
  await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "PUBLISHED" }
  });

  await refreshBusinessRating(review.businessId);
  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectReviewAction(formData: FormData) {
  await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REJECTED" }
  });

  await refreshBusinessRating(review.businessId);
  revalidatePath("/admin");
}

export async function removeReviewAction(formData: FormData) {
  await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" }
  });

  await refreshBusinessRating(review.businessId);
  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const reportId = String(formData.get("reportId") ?? "");

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "RESOLVED",
      resolvedBy: admin.id,
      resolvedAt: new Date()
    }
  });

  revalidatePath("/admin");
}

export async function dismissReportAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const reportId = String(formData.get("reportId") ?? "");

  await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedBy: admin.id,
      resolvedAt: new Date()
    }
  });

  revalidatePath("/admin");
}

export async function featureBusinessAction(formData: FormData) {
  await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  const existingPlacement = await prisma.featuredPlacement.findFirst({
    where: {
      businessId,
      status: "ACTIVE",
      placementType: "HOMEPAGE",
      endsAt: { gte: new Date() }
    }
  });

  if (!existingPlacement) {
    await createHomepagePlacement(businessId);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/businesses");
}

export async function unfeatureBusinessAction(formData: FormData) {
  await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  await deactivateBusinessPlacements(businessId);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/businesses");
}

async function requireAdminAction(formData: FormData) {
  const user = await getCurrentUser();

  if (user?.status === "ACTIVE" && ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(user.role)) {
    return user;
  }

  const tokenUser = await getAdminFromActionToken(String(formData.get("adminActionToken") ?? ""));

  if (tokenUser) {
    return tokenUser;
  }

  if (user) redirect("/dashboard");

  redirect("/login");
}
