"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import { createAndSendAccountVerificationCode } from "@/lib/account-verification";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { nigerianPhoneVariants, normalizeNigerianPhone } from "@/lib/phone";
import { notifyNewUserWelcome } from "@/lib/notifications";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const phone = normalizeNigerianPhone(rawPhone);
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || !email || password.length < 8 || !phone) {
    redirect("/register?error=invalid");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone: { in: nigerianPhoneVariants(phone) } }] : [])]
    }
  });

  if (existingUser) {
    redirect("/register?error=exists");
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role: "BUSINESS_OWNER",
      passwordHash: await bcrypt.hash(password, 12)
    }
  });

  await createAuditLog({
    actorId: user.id,
    action: "OWNER_ACCOUNT_REGISTERED",
    entityType: "User",
    entityId: user.id,
    metadata: {
      hasPhone: Boolean(phone),
      source: "registration"
    }
  });
  await createSession(user.id);
  const [verification] = await Promise.all([
    createAndSendAccountVerificationCode(user, "EMAIL"),
    notifyNewUserWelcome(user)
  ]);
  if (!verification.ok) {
    redirect(`/verify-account?error=${verification.reason}&method=email`);
  }
  redirect(`/verify-account?sent=email${verification.ok && verification.skipped ? "&delivery=skipped" : ""}`);
}
