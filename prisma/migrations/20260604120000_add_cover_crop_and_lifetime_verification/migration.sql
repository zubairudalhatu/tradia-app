ALTER TABLE "Business"
ADD COLUMN "coverCropX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "coverCropY" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN "verificationGrantedAt" TIMESTAMP(3),
ADD COLUMN "verificationGrantedBy" TEXT,
ADD COLUMN "verificationRevokedAt" TIMESTAMP(3),
ADD COLUMN "verificationRevokedBy" TEXT;

