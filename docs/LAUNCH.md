# Tradia Launch Checklist

## Production Services

- Host the Next.js app on Vercel, Render, Railway, or a VPS with Node.js 20+.
- Use managed PostgreSQL for `DATABASE_URL`.
- Use Cloudinary for uploaded logos, gallery images, brochures, and verification documents.
- Set the public site URL in `NEXTAUTH_URL`.
- Configure Paystack callback URL as `https://your-domain.com/billing/callback`.
- Configure Paystack webhook URL as `https://your-domain.com/api/paystack/webhook`.

## Required Environment Variables

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
TRADIA_SUPPORT_EMAIL=tradia@zamkah.com.ng
TRADIA_WHATSAPP=+2349055091300
```

## Deploy Steps

```bash
npm install
npm run db:generate
npm run db:deploy
npm run check:production
npm run build
npm run start
```

## Vercel Setup

1. Import the `tradia-app` project into Vercel.
2. Copy values from `.env.production.example` into Vercel project environment variables.
3. Use a managed PostgreSQL URL with SSL enabled.
4. Run `npm run db:deploy` after the production database URL is set.
5. Add the live domain to Vercel and update `NEXTAUTH_URL` to that exact HTTPS URL.

## Post-Deploy Checks

- Visit `/api/health` and confirm `status` and `database` are both `ok`.
- Submit a business as a new owner.
- Approve the listing from `/admin`.
- Upload a logo and verification document.
- Start a Paystack payment from `/pricing` and confirm the callback activates the plan.
- Check `/sitemap.xml` and `/robots.txt`.
