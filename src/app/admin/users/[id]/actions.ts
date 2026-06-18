"use server";

import { redirect } from "next/navigation";
import { getAdminFromActionToken, getCurrentUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { nigerianPhoneVariants, normalizeNigerianPhone } from "@/lib/phone";

export async function updateAdminUserAction(userId: string, formData: FormData) {
  const admin = await requireAdminAction(formData);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPhone = optionalString(formData.get("phone"));
  const phone = normalizeNigerianPhone(rawPhone);
  const role = normalizeRole(String(formData.get("role") ?? "USER"));
  const status = normalizeStatus(String(formData.get("status") ?? "ACTIVE"));

  if (name.length < 2 || !isValidEmail(email) || (rawPhone && !phone)) {
    redirect(`/admin/users/${userId}?error=invalid`);
  }

  try {
    const currentUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (phone) {
      const duplicate = await prisma.user.findFirst({ where: { id: { not: userId }, phone: { in: nigerianPhoneVariants(phone) } }, select: { id: true } });
      if (duplicate) redirect(`/admin/users/${userId}?error=save`);
    }
    const managedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        emailVerifiedAt: currentUser.email === email ? currentUser.emailVerifiedAt : null,
        phoneVerifiedAt: normalizeNigerianPhone(currentUser.phone) === phone ? currentUser.phoneVerifiedAt : null,
        role,
        status
      }
    });
    await createAuditLog({
      actorId: admin.id,
      action: "UPDATED_USER",
      entityType: "User",
      entityId: managedUser.id,
      metadata: { userEmail: managedUser.email, role: managedUser.role, status: managedUser.status }
    });
  } catch {
    redirect(`/admin/users/${userId}?error=save`);
  }

  redirect(`/admin/users/${userId}?saved=1`);
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeRole(value: string) {
  if (["USER", "BUSINESS_OWNER", "AGENT", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(value)) {
    return value as "USER" | "BUSINESS_OWNER" | "AGENT" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";
  }

  return "USER";
}

function normalizeStatus(value: string) {
  if (["ACTIVE", "SUSPENDED", "DELETED"].includes(value)) {
    return value as "ACTIVE" | "SUSPENDED" | "DELETED";
  }

  return "ACTIVE";
}
