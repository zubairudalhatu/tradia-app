SELECT
  b.name,
  c.name AS category,
  l.name AS location,
  b."listingStatus",
  b."verificationStatus"
FROM "Business" b
JOIN "Category" c ON c.id = b."categoryId"
JOIN "Location" l ON l.id = b."locationId"
ORDER BY b.name;
