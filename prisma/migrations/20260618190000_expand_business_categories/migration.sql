-- Keep existing slugs stable while making the broad categories clearer.
UPDATE "Category"
SET
  "name" = 'Hotels & Hospitality',
  "description" = 'Hotels, guest houses, resorts, bars, lounges, and tourism services.',
  "sortOrder" = 1
WHERE "slug" = 'hospitality';

UPDATE "Category"
SET
  "name" = 'Agriculture & Agro Services',
  "description" = 'Farms, food processing, agro suppliers, livestock, and produce businesses.',
  "sortOrder" = 14
WHERE "slug" = 'agriculture-food';

INSERT INTO "Category" ("id", "name", "slug", "description", "sortOrder", "isActive")
VALUES
  ('category-restaurants-food-services', 'Restaurants & Food Services', 'restaurants-food-services', 'Restaurants, cafes, bakeries, caterers, grills, and prepared food services.', 2, true),
  ('category-printing-services', 'Printing Services', 'printing-services', 'Commercial printing, signage, photocopying, packaging print, and related services.', 7, true),
  ('category-real-estate-property', 'Real Estate & Property', 'real-estate-property', 'Estate agents, property developers, property managers, valuers, and facility services.', 9, true),
  ('category-logistics-delivery', 'Logistics & Delivery', 'logistics-delivery', 'Courier, dispatch, haulage, freight, warehousing, and delivery companies.', 11, true),
  ('category-events-event-services', 'Events & Event Services', 'events-event-services', 'Event planners, venues, decorators, rentals, and celebration services.', 18, true)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true;

-- Re-space the retained categories around the new additions.
UPDATE "Category" SET "sortOrder" = 3 WHERE "slug" = 'healthcare';
UPDATE "Category" SET "sortOrder" = 4 WHERE "slug" = 'education';
UPDATE "Category" SET "sortOrder" = 5 WHERE "slug" = 'retail';
UPDATE "Category" SET "sortOrder" = 6 WHERE "slug" = 'professional-services';
UPDATE "Category" SET "sortOrder" = 8 WHERE "slug" = 'home-construction';
UPDATE "Category" SET "sortOrder" = 10 WHERE "slug" = 'automotive-transport';
UPDATE "Category" SET "sortOrder" = 12 WHERE "slug" = 'technology';
UPDATE "Category" SET "sortOrder" = 13 WHERE "slug" = 'beauty-fashion';
UPDATE "Category" SET "sortOrder" = 15 WHERE "slug" = 'finance-insurance';
UPDATE "Category" SET "sortOrder" = 16 WHERE "slug" = 'manufacturing-industrial';
UPDATE "Category" SET "sortOrder" = 17 WHERE "slug" = 'media-entertainment';
UPDATE "Category" SET "sortOrder" = 19 WHERE "slug" = 'public-community-services';
UPDATE "Category" SET "sortOrder" = 20 WHERE "slug" = 'services';

-- Move only strong, obvious matches. This runs once and will not override later admin edits.
UPDATE "Business"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'restaurants-food-services')
WHERE "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" IN ('hospitality', 'agriculture-food', 'services')
  )
  AND lower("name" || ' ' || "description") ~ '(restaurant|eatery|cafe|café|cafeteria|grill|kitchen|shawarma|pizza|bakery|food court|suya|cater)';

UPDATE "Business"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'printing-services')
WHERE "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" IN ('professional-services', 'manufacturing-industrial', 'media-entertainment', 'services')
  )
  AND lower("name" || ' ' || "description") ~ '(printing|print press|printing press|photocopy|large format|signage|screen print|digital print)';

UPDATE "Business"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'real-estate-property')
WHERE "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" IN ('home-construction', 'professional-services', 'services')
  )
  AND lower("name" || ' ' || "description") ~ '(real estate|property developer|property management|estate agent|realtor|facility management|property valuation)';

UPDATE "Business"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'logistics-delivery')
WHERE "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" IN ('automotive-transport', 'professional-services', 'services')
  )
  AND lower("name" || ' ' || "description") ~ '(logistics|courier|dispatch|haulage|freight|warehousing|parcel delivery|delivery service)';

UPDATE "Business"
SET "categoryId" = (SELECT "id" FROM "Category" WHERE "slug" = 'events-event-services')
WHERE "categoryId" IN (
    SELECT "id" FROM "Category" WHERE "slug" IN ('hospitality', 'media-entertainment', 'professional-services', 'services')
  )
  AND lower("name" || ' ' || "description") ~ '(event planner|event planning|event management|event centre|event center|event venue|wedding planner|event decoration|party rental)';
