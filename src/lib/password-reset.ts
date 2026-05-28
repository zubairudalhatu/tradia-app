import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { addHours } from "@/lib/time";
import { prisma } from "@/lib/db";

export function createPasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetRequest(userId: string) {
  await ensurePasswordResetSchema();

  const token = createPasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: addHours(new Date(), 1)
    }
  });

  return token;
}

export async function findValidPasswordResetToken(token: string) {
  await ensurePasswordResetSchema();

  return prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashPasswordResetToken(token),
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });
}

async function ensurePasswordResetSchema() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
    )
  `;
  await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`;
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt")`;
  await prisma.$executeRaw(
    Prisma.sql`
      DO $$
      BEGIN
        ALTER TABLE "PasswordResetToken"
        ADD CONSTRAINT "PasswordResetToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `
  );
}
