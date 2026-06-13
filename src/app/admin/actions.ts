"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getBusinessPlanState } from "@/lib/plans/benefits";
import type { Prisma } from "@prisma/client";
import {
  notifyBusinessDecision,
  notifyVerificationDecision,
  notifyWalletAddOnFulfillmentUpdated
} from "@/lib/notifications";
import { createHomepagePlacement, deactivateBusinessPlacements } from "@/lib/queries/featured";
import { refreshBusinessRating } from "@/lib/ratings";
import { sendAdminBroadcast, type BroadcastChannel } from "@/lib/admin-broadcast";

const MAX_BROADCAST_RECIPIENTS = 250;

export async function sendBroadcastAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  if (!["ADMIN", "SUPER_ADMIN"].includes(admin.role)) redirect("/admin?broadcast=forbidden");

  const channel = normalizeBroadcastChannel(String(formData.get("channel") ?? ""));
  const audience = normalizeBroadcastAudience(String(formData.get("audience") ?? ""));
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 120);
  const message = String(formData.get("message") ?? "").trim().slice(0, 500);
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();

  if (!channel || !audience || message.length < 10 || confirmation !== "SEND" || (channel === "EMAIL" && subject.length < 3)) {
    redirect("/admin?broadcast=invalid");
  }

  const recipients = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      ...(audience === "BUSINESS_OWNERS"
        ? { businesses: { some: {} } }
        : audience === "REGULAR_USERS"
        ? { businesses: { none: {} } }
        : {}),
      ...(channel === "EMAIL"
        ? { emailVerifiedAt: { not: null } }
        : { phone: { not: null }, phoneVerifiedAt: { not: null } })
    },
    select: { id: true, name: true, email: true, phone: true },
    orderBy: { createdAt: "asc" },
    take: MAX_BROADCAST_RECIPIENTS
  });

  let delivered = 0;
  for (const batch of chunk(recipients, 20)) {
    const results = await Promise.allSettled(
      batch.map((recipient) => sendAdminBroadcast({ channel, recipient, subject: subject || "Tradia update", message }))
    );
    delivered += results.filter((result) => result.status === "fulfilled" && result.value).length;
  }

  await createAuditLog({
    actorId: admin.id,
    action: "SENT_USER_BROADCAST",
    entityType: "Broadcast",
    entityId: crypto.randomUUID(),
    metadata: {
      channel,
      audience,
      subject,
      message,
      eligibleRecipients: recipients.length,
      delivered,
      failed: recipients.length - delivered
    }
  });

  revalidatePath("/admin");
  redirect(`/admin?broadcast=sent&delivered=${delivered}&attempted=${recipients.length}`);
}

export async function approveBusinessAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "PUBLISHED" },
    include: { owner: true }
  });

  await notifyBusinessDecision(business, "approved");
  await createAuditLog({
    actorId: admin.id,
    action: "APPROVED_BUSINESS",
    entityType: "Business",
    entityId: business.id,
    metadata: { businessName: business.name }
  });

  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectBusinessAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  const business = await prisma.business.update({
    where: { id: businessId },
    data: { listingStatus: "REJECTED" },
    include: { owner: true }
  });

  await notifyBusinessDecision(business, "rejected");
  await createAuditLog({
    actorId: admin.id,
    action: "REJECTED_BUSINESS",
    entityType: "Business",
    entityId: business.id,
    metadata: { businessName: business.name }
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

  const business = await prisma.business.update({
    where: { id: request.businessId },
    data: {
      verificationStatus: "VERIFIED",
      verificationGrantedAt: new Date(),
      verificationGrantedBy: admin.id,
      verificationRevokedAt: null,
      verificationRevokedBy: null
    },
    include: { owner: true }
  });

  const submitter = await prisma.user.findUnique({ where: { id: request.submittedBy } });
  if (submitter) {
    await notifyVerificationDecision(business, submitter, "approved");
  }
  await createAuditLog({
    actorId: admin.id,
    action: "APPROVED_VERIFICATION",
    entityType: "VerificationRequest",
    entityId: request.id,
    metadata: { businessId: business.id, businessName: business.name }
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

  const existingBusiness = await prisma.business.findUnique({
    where: { id: request.businessId },
    select: { verificationStatus: true }
  });
  const business = await prisma.business.update({
    where: { id: request.businessId },
    data: existingBusiness?.verificationStatus === "VERIFIED" ? {} : { verificationStatus: "REJECTED" },
    include: { owner: true }
  });

  const submitter = await prisma.user.findUnique({ where: { id: request.submittedBy } });
  if (submitter) {
    await notifyVerificationDecision(business, submitter, "rejected");
  }
  await createAuditLog({
    actorId: admin.id,
    action: "REJECTED_VERIFICATION",
    entityType: "VerificationRequest",
    entityId: request.id,
    metadata: { businessId: business.id, businessName: business.name }
  });

  revalidatePath("/admin");
}

export async function publishReviewAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "PUBLISHED" }
  });

  await refreshBusinessRating(review.businessId);
  await createAuditLog({
    actorId: admin.id,
    action: "PUBLISHED_REVIEW",
    entityType: "Review",
    entityId: review.id,
    metadata: { businessId: review.businessId }
  });
  revalidatePath("/admin");
  revalidatePath("/businesses");
}

export async function rejectReviewAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REJECTED" }
  });

  await refreshBusinessRating(review.businessId);
  await createAuditLog({
    actorId: admin.id,
    action: "REJECTED_REVIEW",
    entityType: "Review",
    entityId: review.id,
    metadata: { businessId: review.businessId }
  });
  revalidatePath("/admin");
}

export async function removeReviewAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status: "REMOVED" }
  });

  await refreshBusinessRating(review.businessId);
  await createAuditLog({
    actorId: admin.id,
    action: "REMOVED_REVIEW",
    entityType: "Review",
    entityId: review.id,
    metadata: { businessId: review.businessId }
  });
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
  await createAuditLog({
    actorId: admin.id,
    action: "RESOLVED_REPORT",
    entityType: "Report",
    entityId: reportId
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
  await createAuditLog({
    actorId: admin.id,
    action: "DISMISSED_REPORT",
    entityType: "Report",
    entityId: reportId
  });

  revalidatePath("/admin");
}

export async function featureBusinessAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plan: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endsAt: "desc" }
      }
    }
  });

  if (!business || !getBusinessPlanState(business).benefits.canBeFeatured) {
    revalidatePath("/admin");
    return;
  }

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
    await createAuditLog({
      actorId: admin.id,
      action: "FEATURED_BUSINESS",
      entityType: "Business",
      entityId: businessId
    });
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/businesses");
}

export async function unfeatureBusinessAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const businessId = String(formData.get("businessId") ?? "");

  await deactivateBusinessPlacements(businessId);
  await createAuditLog({
    actorId: admin.id,
    action: "UNFEATURED_BUSINESS",
    entityType: "Business",
    entityId: businessId
  });

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/businesses");
}

export async function updateAdminLeadStatusAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const leadId = String(formData.get("leadId") ?? "");
  const status = normalizeLeadStatus(String(formData.get("status") ?? "NEW"));

  const lead = await prisma.contactLead.update({
    where: { id: leadId },
    data: { status },
    include: { business: true }
  });

  await createAuditLog({
    actorId: admin.id,
    action: `ADMIN_MARKED_LEAD_${status}`,
    entityType: "ContactLead",
    entityId: lead.id,
    metadata: { businessId: lead.businessId, businessName: lead.business.name }
  });

  revalidatePath("/admin");
}

export async function updateWalletFulfillmentAction(formData: FormData) {
  const admin = await requireAdminAction(formData);
  const walletTransactionId = String(formData.get("walletTransactionId") ?? "");
  const fulfillmentStatus = String(formData.get("fulfillmentStatus") ?? "") === "FULFILLED" ? "FULFILLED" : "OPEN";
  const fulfillmentNote = optionalFulfillmentNote(formData.get("fulfillmentNote"));

  const transaction = await prisma.walletTransaction.findUnique({
    where: { id: walletTransactionId },
    select: {
      id: true,
      type: true,
      description: true,
      businessId: true,
      metadata: true,
      user: {
        select: {
          name: true,
          email: true
        }
      },
      business: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  });

  if (!transaction || transaction.type !== "DEBIT") {
    revalidatePath("/admin");
    return;
  }

  const metadata = jsonObject(transaction.metadata);
  const nextMetadata = {
    ...metadata,
    fulfillmentStatus,
    fulfilledAt: fulfillmentStatus === "FULFILLED" ? new Date().toISOString() : null,
    fulfilledBy: fulfillmentStatus === "FULFILLED" ? admin.id : null,
    fulfillmentNote: fulfillmentNote ?? metadata.fulfillmentNote ?? null,
    fulfillmentUpdatedAt: new Date().toISOString(),
    fulfillmentUpdatedBy: admin.id
  };

  await prisma.walletTransaction.update({
    where: { id: transaction.id },
    data: { metadata: nextMetadata as Prisma.InputJsonValue }
  });

  await createAuditLog({
    actorId: admin.id,
    action: fulfillmentStatus === "FULFILLED" ? "FULFILLED_WALLET_ADD_ON" : "REOPENED_WALLET_ADD_ON",
    entityType: "WalletTransaction",
    entityId: transaction.id,
    metadata: {
      businessId: transaction.businessId,
      description: transaction.description
    }
  });

  const productName = typeof metadata.productName === "string" ? metadata.productName : transaction.description;
  await safeAdminNotification(() =>
    notifyWalletAddOnFulfillmentUpdated(transaction.business, transaction.user, productName, fulfillmentStatus)
  );

  revalidatePath("/admin");
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

function normalizeLeadStatus(value: string) {
  if (["NEW", "CONTACTED", "CLOSED", "SPAM"].includes(value)) {
    return value as "NEW" | "CONTACTED" | "CLOSED" | "SPAM";
  }

  return "NEW";
}

function optionalFulfillmentNote(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text.slice(0, 500) : null;
}

function jsonObject(value: Prisma.JsonValue | null) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

async function safeAdminNotification(send: () => Promise<unknown>) {
  try {
    await send();
  } catch (error) {
    console.error("Admin notification failed", error);
  }
}

function normalizeBroadcastChannel(value: string): BroadcastChannel | null {
  if (["EMAIL", "SMS", "WHATSAPP"].includes(value)) return value as BroadcastChannel;
  return null;
}

function normalizeBroadcastAudience(value: string) {
  if (["ALL_ACTIVE", "BUSINESS_OWNERS", "REGULAR_USERS"].includes(value)) {
    return value as "ALL_ACTIVE" | "BUSINESS_OWNERS" | "REGULAR_USERS";
  }

  return null;
}

function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}
