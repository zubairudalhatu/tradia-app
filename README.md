# Tradia App

Production scaffold for Tradia, Nigeria's trusted social business directory.

## Stack

- Next.js App Router
- TypeScript
- PostgreSQL
- Prisma
- Auth.js/NextAuth
- Paystack first, Flutterwave later
- Cloudinary/S3-ready media layer

## Local Setup

Package installation is not available in the current Codex sandbox, so this folder is a source-ready scaffold. On a normal development machine:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

For production deployment, copy `.env.production.example`, set real service credentials, then run:

```bash
npm run db:deploy
npm run check:production
npm run build
```

## Local Admin Login

- Email: `tradia@zamkah.com.ng`
- Password: `TradiaAdmin2026!`

## Initial Build Scope

- Public directory pages
- Business profile pages
- Business owner dashboard
- Admin dashboard
- Listing approval
- Claim and verification flows
- Subscription/payment foundation

## Production Readiness

- Health check: `/api/health`
- Production env validation: `npm run check:production`
- Launch checklist: `docs/LAUNCH.md`
- Media uploads use Cloudinary when `CLOUDINARY_*` credentials are present, with local uploads kept for development.
