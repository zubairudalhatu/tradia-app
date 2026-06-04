-- CreateEnum
CREATE TYPE "AccountVerificationMethod" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateTable
CREATE TABLE "AccountVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" "AccountVerificationMethod" NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountVerificationToken_userId_method_createdAt_idx" ON "AccountVerificationToken"("userId", "method", "createdAt");

-- CreateIndex
CREATE INDEX "AccountVerificationToken_expiresAt_idx" ON "AccountVerificationToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "AccountVerificationToken" ADD CONSTRAINT "AccountVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
