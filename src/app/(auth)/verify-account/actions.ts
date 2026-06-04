"use server";

import { redirect } from "next/navigation";
import {
  confirmAccountVerificationCode,
  createAndSendAccountVerificationCode,
  normalizeAccountVerificationMethod
} from "@/lib/account-verification";
import { getCurrentUser } from "@/lib/auth/session";

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
