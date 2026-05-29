INSERT INTO "Subscription" (
  "id",
  "businessId",
  "planId",
  "status",
  "startsAt",
  "endsAt",
  "paymentProvider",
  "providerReference",
  "createdAt",
  "updatedAt"
)
SELECT
  'admin_backfill_' || b."id",
  b."id",
  b."planId",
  CASE
    WHEN b."updatedAt" + INTERVAL '1 year' > NOW()
      THEN 'ACTIVE'::"SubscriptionStatus"
    ELSE 'EXPIRED'::"SubscriptionStatus"
  END,
  b."updatedAt",
  b."updatedAt" + INTERVAL '1 year',
  'ADMIN',
  'admin-backfill-' || b."id",
  NOW(),
  NOW()
FROM "Business" b
JOIN "Plan" p ON p."id" = b."planId"
WHERE p."annualPrice" > 0
  AND NOT EXISTS (
    SELECT 1
    FROM "Subscription" s
    WHERE s."businessId" = b."id"
      AND s."status" = 'ACTIVE'
      AND s."endsAt" > NOW()
  );
