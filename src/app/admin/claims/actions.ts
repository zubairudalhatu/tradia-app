"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notifyClaimDecision, notifyPreviousOwnerClaimTransfer } from "@/lib/notifications";

export async function approveClaimAction(claimId: string, formData: FormData) {
  const admin = await requireClaimAdmin(true);
  const adminNotes = optionalString(formData.get("adminNotes"));

  const claim = await prisma.businessClaim.findUnique({
    where: { id: claimId },
    include: { business: { include: { owner: true } }, user: true }
  });

  if (!claim || claim.status !== "PENDING") redirect("/admin/claims?error=processed");
  if (claim.user.status !== "ACTIVE") redirect("/admin/claims?error=inactive-user");

  const previousOwnerId = claim.business.ownerId;

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.businessClaim.updateMany({
        where: { id: claim.id, status: "PENDING" },
        data: { status: "APPROVED", adminNotes, reviewedBy: admin.id, reviewedAt: new Date() }
      });
      if (locked.count !== 1) throw new Error("CLAIM_ALREADY_PROCESSED");

      await tx.business.update({ where: { id: claim.businessId }, data: { ownerId: claim.userId } });
      await tx.businessClaim.updateMany({
        where: { businessId: claim.businessId, status: "PENDING", id: { not: claim.id } },
        data: { status: "REJECTED", adminNotes: "Another ownership claim was approved.", reviewedBy: admin.id, reviewedAt: new Date() }
      });
      if (claim.user.role === "USER") {
        await tx.user.update({ where: { id: claim.userId }, data: { role: "BUSINESS_OWNER" } });
      }
    });
  } catch {
    redirect("/admin/claims?error=save");
  }

  await createAuditLog({
    actorId: admin.id,
    action: "APPROVED_BUSINESS_CLAIM",
    entityType: "BusinessClaim",
    entityId: claim.id,
    metadata: { businessId: claim.businessId, businessName: claim.business.name, claimantId: claim.userId, previousOwnerId }
  });
  await notifyClaimDecision(claim.business, claim.user, "approved", adminNotes);
  if (claim.business.owner && claim.business.owner.id !== claim.userId) {
    await notifyPreviousOwnerClaimTransfer(claim.business, claim.business.owner, claim.user);
  }
  revalidateClaimPaths(claim.business.slug);
  redirect("/admin/claims?saved=approved");
}

export async function rejectClaimAction(claimId: string, formData: FormData) {
  const admin = await requireClaimAdmin(false);
  const adminNotes = optionalString(formData.get("adminNotes"));
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId }, include: { business: true, user: true } });
  if (!claim || claim.status !== "PENDING") redirect("/admin/claims?error=processed");

  const result = await prisma.businessClaim.updateMany({
    where: { id: claim.id, status: "PENDING" },
    data: { status: "REJECTED", adminNotes, reviewedBy: admin.id, reviewedAt: new Date() }
  });
  if (result.count !== 1) redirect("/admin/claims?error=processed");

  await createAuditLog({
    actorId: admin.id,
    action: "REJECTED_BUSINESS_CLAIM",
    entityType: "BusinessClaim",
    entityId: claim.id,
    metadata: { businessId: claim.businessId, businessName: claim.business.name, claimantId: claim.userId }
  });
  await notifyClaimDecision(claim.business, claim.user, "rejected", adminNotes);
  revalidateClaimPaths(claim.business.slug);
  redirect("/admin/claims?saved=rejected");
}

async function requireClaimAdmin(transferOwnership: boolean) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/claims");
  const roles = transferOwnership ? ["ADMIN", "SUPER_ADMIN"] : ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
  if (user.status !== "ACTIVE" || !roles.includes(user.role)) redirect("/admin/claims?error=permission");
  return user;
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function revalidateClaimPaths(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/claims");
  revalidatePath("/dashboard");
  revalidatePath(`/businesses/${slug}`);
}
