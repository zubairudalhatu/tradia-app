"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createHomepagePlacement, deactivateBusinessPlacements } from "@/lib/queries/featured";
import { refreshBusinessRating } from "@/lib/ratings";

export async function approveBusinessAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");

  await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "PUBLISHED" }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectBusinessAction(formData: FormData) {
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");

  await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "REJECTED" }
  });

  revalidatePath("/admin");
}

export async function approveVerificationAction(formData: FormData) {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REJECTED" }
  });

  await refreshBusinessRating(review.businessId);
  revalidatePath("/admin");
}

export async function removeReviewAction(formData: FormData) {
  await requireAdmin();
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
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
  const businessId = String(formData.get("businessId") ?? "");

  await deactivateBusinessPlacements(businessId);

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/businesses");
}
