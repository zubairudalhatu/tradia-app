"use server";

import { redirect } from "next/navigation";
import {
  confirmAccountVerificationCode,
  createAndSendAccountVerificationCode,
  normalizeAccountVerificationMethod
} from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { nigerianPhoneVariants, normalizeNigerianPhone } from "@/lib/phone";

export async function sendAccountVerificationCodeAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=/verify-account");

  const method = normalizeAccountVerificationMethod(formData.get("method"));
  const result = await createAndSendAccountVerificationCode(user, method);

  if (!result.ok) {
    redirect(`/verify-account?error=${result.reason}&method=${method.toLowerCase()}`);
  }

  redirect(`/verify-account?sent=${method.toLowerCase()}${result.skipped ? "&delivery=skipped" : ""}`);
}

export async function confirmAccountVerificationCodeAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=/verify-account");

  const method = normalizeAccountVerificationMethod(formData.get("method"));
  const code = String(formData.get("code") ?? "").trim();
  const result = await confirmAccountVerificationCode(user, method, code);

  if (!result.ok) {
    redirect(`/verify-account?error=${result.reason}&method=${method.toLowerCase()}`);
  }

  redirect("/dashboard?account=verified");
}

export async function updateVerificationPhoneAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/verify-account");

  const phone = normalizeNigerianPhone(formData.get("phone"));
  if (!phone) redirect("/verify-account?error=phone-invalid");

  const duplicate = await prisma.user.findFirst({
    where: { id: { not: user.id }, phone: { in: nigerianPhoneVariants(phone) } },
    select: { id: true }
  });
  if (duplicate) redirect("/verify-account?error=phone-exists");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      phoneVerifiedAt: normalizeNigerianPhone(user.phone) === phone ? user.phoneVerifiedAt : null
    }
  });

  redirect("/verify-account?saved=phone");
}
