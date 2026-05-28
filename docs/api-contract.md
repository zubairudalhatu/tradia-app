# Tradia API Contract Draft

## Businesses

`GET /api/businesses`

Returns published businesses.

Supported query parameters:

- `q`: search by business name, description, address, category, or location.
- `category`: category slug.
- `location`: location slug.
- `verified`: use `1`, `true`, or `yes` to return verified businesses only.
- `open`: use `1`, `true`, or `yes` to return businesses open now based on Nigeria time and saved opening hours.
- `limit`: results per page, capped at 100.
- `page`: positive page number.

`POST /api/businesses`

Creates a pending business listing.

Required body:

```json
{
  "name": "Aisha Fashion House",
  "description": "Contemporary clothing, tailoring, bridal fabrics, and custom fittings in central Kano.",
  "categoryId": "category_id",
  "locationId": "location_id",
  "address": "Kano Municipal",
  "whatsapp": "+234..."
}
```

## Claims

`POST /api/claims`

Creates a pending ownership claim.

## Verification

`POST /api/verification`

Creates a pending verification request.

## Next API Work

- Auth session enforcement.
- Admin approve/reject routes.
- Paystack checkout and webhook routes.
- Reviews and reports routes.
- Search endpoint backed by PostgreSQL indexes.
