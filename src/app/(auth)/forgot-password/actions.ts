"use server";

import { redirect } from "next/navigation";
import { paragraphEmail, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { createPasswordResetRequest } from "@/lib/password-reset";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?sent=1");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.status === "ACTIVE") {
    const token = await createPasswordResetRequest(user.id);
    const resetUrl = `${(process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your Tradia password",
      html: paragraphEmail("Reset your password", [
        `Hi ${user.name},`,
        "Use the button below to reset your Tradia password. This link expires in 1 hour.",
        "If you did not request this, you can safely ignore this email."
      ], { label: "Reset Password", url: resetUrl })
    });
  }

  redirect("/forgot-password?sent=1");
}
