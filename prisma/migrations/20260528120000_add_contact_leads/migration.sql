CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED', 'SPAM');

CREATE TABLE "ContactLead" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'PROFILE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactLead_businessId_status_createdAt_idx" ON "ContactLead"("businessId", "status", "createdAt");

ALTER TABLE "ContactLead" ADD CONSTRAINT "ContactLead_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
