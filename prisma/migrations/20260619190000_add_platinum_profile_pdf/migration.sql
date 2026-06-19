ALTER TABLE "Plan"
ADD COLUMN "profilePdfEnabled" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Plan"
SET "profilePdfEnabled" = true
WHERE "name" = 'Platinum';
