import { createHash, randomInt } from "node:crypto";
import type { AccountVerificationMethod, User } from "@prisma/client";
import { paragraphEmail, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { addMinutes } from "@/lib/time";

const CODE_TTL_MINUTES = 15;

type VerificationUser = Pick<User, "id" | "name" | "email" | "phone" | "emailVerifiedAt" | "phoneVerifiedAt">;

export function isUserAccountVerified(user: Pick<User, "emailVerifiedAt" | "phoneVerifiedAt">) {
  return Boolean(user.emailVerifiedAt || user.phoneVerifiedAt);
}

export function normalizeAccountVerificationMethod(value: FormDataEntryValue | string | null): AccountVerificationMethod {
  const method = String(value ?? "").toUpperCase();

  if (method === "SMS" || method === "WHATSAPP") return method;

  return "EMAIL";
}

export async function createAndSendAccountVerificationCode(user: VerificationUser, method: AccountVerificationMethod) {
  const destination = getVerificationDestination(user, method);

  if (!destination) {
    return { ok: false, reason: "missing-destination" as const };
  }

  if (method === "EMAIL" && user.emailVerifiedAt) {
    return { ok: false, reason: "already-verified" as const };
  }

  if ((method === "SMS" || method === "WHATSAPP") && user.phoneVerifiedAt) {
    return { ok: false, reason: "already-verified" as const };
  }

  const code = createVerificationCode();
  const codeHash = hashVerificationCode(user.id, method, destination, code);

  await prisma.$transaction([
    prisma.accountVerificationToken.updateMany({
      where: {
        userId: user.id,
        method,
        usedAt: null
      },
      data: { usedAt: new Date() }
    }),
    prisma.accountVerificationToken.create({
      data: {
        userId: user.id,
        method,
        destination,
        codeHash,
        expiresAt: addMinutes(new Date(), CODE_TTL_MINUTES)
      }
    })
  ]);

  const delivery = await sendVerificationCode({ user, method, destination, code });

  if (delivery.failed) return { ok: false, reason: "delivery-failed" as const };

  return { ok: true, skipped: Boolean(delivery.skipped) };
}

export async function confirmAccountVerificationCode(user: VerificationUser, method: AccountVerificationMethod, rawCode: string) {
  const code = rawCode.replace(/\D/g, "");

  if (code.length !== 6) return { ok: false, reason: "invalid-code" as const };

  const token = await prisma.accountVerificationToken.findFirst({
    where: {
      userId: user.id,
      method,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });

  if (!token) return { ok: false, reason: "expired" as const };

  const codeHash = hashVerificationCode(user.id, method, token.destination, code);

  if (codeHash !== token.codeHash) return { ok: false, reason: "invalid-code" as const };

  await prisma.$transaction([
    prisma.accountVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() }
    }),
    prisma.accountVerificationToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null
      },
      data: { usedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: method === "EMAIL" ? { emailVerifiedAt: new Date() } : { phoneVerifiedAt: new Date() }
    })
  ]);

  return { ok: true };
}

function createVerificationCode() {
  return String(randomInt(100000, 1000000));
}

function hashVerificationCode(userId: string, method: AccountVerificationMethod, destination: string, code: string) {
  return createHash("sha256")
    .update(`${userId}:${method}:${destination}:${code}:${process.env.NEXTAUTH_SECRET ?? "development-secret"}`)
    .digest("hex");
}

function getVerificationDestination(user: VerificationUser, method: AccountVerificationMethod) {
  if (method === "EMAIL") return user.email;
  return user.phone;
}

async function sendVerificationCode(input: {
  user: VerificationUser;
  method: AccountVerificationMethod;
  destination: string;
  code: string;
}) {
  const message = `Your Tradia verification code is ${input.code}. It expires in ${CODE_TTL_MINUTES} minutes.`;

  if (input.method === "EMAIL") {
    return sendEmail({
      to: input.destination,
      subject: "Verify your Tradia account",
      text: message,
      html: paragraphEmail("Verify your Tradia account", [
        `Hi ${input.user.name},`,
        message,
        "Enter this code on Tradia to finish creating your account."
      ])
    });
  }

  return sendPhoneVerificationCode(input.destination, message, input.method);
}

async function sendPhoneVerificationCode(destination: string, message: string, method: "SMS" | "WHATSAPP") {
  const apiKey = process.env.TERMII_API_KEY?.trim();

  if (!apiKey) {
    console.info(`${method} verification skipped because TERMII_API_KEY is not configured`, {
      to: destination
    });
    return { skipped: true };
  }

  const response = await fetch("https://api.ng.termii.com/api/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      to: destination,
      from: process.env.TERMII_SENDER_ID?.trim() || "Tradia",
      sms: message,
      type: "plain",
      channel: method === "WHATSAPP" ? "whatsapp" : "generic"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`${method} verification send failed`, {
      status: response.status,
      body: body.slice(0, 500)
    });
    return { skipped: false, failed: true };
  }

  return response.json();
}
