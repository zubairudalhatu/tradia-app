"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { paragraphEmail, sendEmail } from "@/lib/email";
import { verifyHumanChallenge } from "@/lib/human-verification";

export async function createSupportRequestAction(formData: FormData) {
  const user = await getCurrentUser();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = optionalString(formData.get("phone"));
  const topic = normalizeTopic(String(formData.get("topic") ?? ""));
  const message = String(formData.get("message") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const humanToken = String(formData.get("humanToken") ?? "");
  const humanAnswer = String(formData.get("humanAnswer") ?? "");

  if (website) redirect("/contact?sent=1");
  if (!verifyHumanChallenge(humanToken, humanAnswer)) {
    redirect("/contact?error=verification#support-form");
  }
  if (name.length < 2 || !isValidEmail(email) || message.length < 15 || message.length > 3000) {
    redirect("/contact?error=invalid#support-form");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recentRequestCount, duplicateRequest] = await Promise.all([
    prisma.supportRequest.count({ where: { email, createdAt: { gte: oneHourAgo } } }),
    prisma.supportRequest.findFirst({ where: { email, message, createdAt: { gte: oneHourAgo } }, select: { id: true } })
  ]);
  if (duplicateRequest) redirect("/contact?sent=1#support-form");
  if (recentRequestCount >= 3) redirect("/contact?error=rate-limit#support-form");

  const request = await prisma.supportRequest.create({
    data: { userId: user?.id, name, email, phone, topic, message }
  });

  const supportEmail = process.env.TRADIA_SUPPORT_EMAIL?.trim() || "tradia@zamkah.com.ng";
  await sendEmail({
    to: supportEmail,
    subject: `Tradia support: ${topic}`,
    html: paragraphEmail("New Tradia support request", [
      `From: ${name} (${email})${phone ? `, ${phone}` : ""}`,
      `Topic: ${topic}`,
      message,
      `Reference: ${request.id}`
    ])
  });

  redirect("/contact?sent=1#support-form");
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeTopic(value: string) {
  const topics = ["Account help", "Business listing", "Verification", "Payment or wallet", "Partnership", "Technical issue", "Other"];
  return topics.includes(value) ? value : "Other";
}
