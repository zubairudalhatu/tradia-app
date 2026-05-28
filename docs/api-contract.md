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

Creates a pending ownership claim for a published business. Requires a signed-in active user.

## Verification

`POST /api/verification`

Creates a pending verification request for a business owned by the signed-in user. The business must be on a plan that allows verification requests.

## Reviews

`POST /api/reviews`

Creates or updates the signed-in user's pending review for a published business. Reviews require admin moderation before they affect public ratings.

Required body:

```json
{
  "businessId": "business_id",
  "rating": 5,
  "title": "Helpful service",
  "body": "The team responded quickly and handled the work professionally."
}
```

## Reports

`POST /api/reports`

Creates a report for a published business or review. Requires a signed-in active user.

Business report body:

```json
{
  "businessId": "business_id",
  "type": "Incorrect information",
  "message": "The listed phone number appears to be wrong."
}
```

Review report body:

```json
{
  "reviewId": "review_id",
  "message": "This review looks abusive or unrelated to the business."
}
```

## Admin Moderation

All admin moderation routes require a signed-in active admin, super admin, or moderator.

`POST /api/admin/businesses/:id/moderation`

Body:

```json
{ "action": "approve" }
```

Allowed actions: `approve`, `reject`.

`POST /api/admin/verification/:id/moderation`

Body:

```json
{ "action": "approve" }
```

Allowed actions: `approve`, `reject`.

`POST /api/admin/reviews/:id/moderation`

Body:

```json
{ "action": "publish" }
```

Allowed actions: `publish`, `reject`, `remove`.

`POST /api/admin/reports/:id/status`

Body:

```json
{ "action": "resolve" }
```

Allowed actions: `resolve`, `dismiss`.

## Next API Work

- Auth session enforcement.
- Paystack checkout and webhook routes.
- Search endpoint backed by PostgreSQL indexes.
