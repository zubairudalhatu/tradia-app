# Tradia API Contract Draft

## Businesses

`GET /api/businesses`

Returns published businesses. Filters to add next: `q`, `category`, `location`, `verified`, `open`.

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
