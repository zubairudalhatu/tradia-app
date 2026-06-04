"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import { createAndSendAccountVerificationCode } from "@/lib/account-verification";
import { prisma } from "@/lib/db";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (name.length < 2 || !email || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, ...(phone ? [{ phone }] : [])]
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

  await createSession(user.id);
  const verification = await createAndSendAccountVerificationCode(user, "EMAIL");
  redirect(`/verify-account?sent=email${verification.ok && verification.skipped ? "&delivery=skipped" : ""}`);
}
