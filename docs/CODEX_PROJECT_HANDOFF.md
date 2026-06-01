# Tradia Codex Project Handoff

Use this file when opening Tradia in a fresh Codex Project.

## Project

Tradia is a Nigerian business discovery platform with:

- Public website: `https://www.tradia.business`
- GitHub repo: `https://github.com/zubairudalhatu/tradia-app`
- Main app folder: `tradia-app`
- Mobile app folder: `tradia-app/mobile`
- Google Play Console account ID: `5237067421982255990`

## Website Status

The website is live and includes:

- Business listings, search, filters, state/area support, and category pages.
- User registration, login, password reset, account editing, and profile management.
- Business submission, editing, admin approval, verification requests, and admin moderation.
- Media upload through Cloudinary.
- Squad payment gateway for premium plans.
- Paid plan enforcement for photo limits, featured status, verification eligibility, and analytics.
- Receipts for payments.
- Contact page, terms, privacy, refund, and verification policy pages.
- Google AdSense script and ad placement sections.
- Google Search Console verification and sitemap support.
- SEO metadata for listing pages.

## Mobile App Status

The Expo mobile app is in `mobile/`.

Current scope:

- Native home/business discovery screen.
- Search published businesses from `https://www.tradia.business/api/businesses`.
- Native filters for category, location, and verified status.
- Native business detail screen.
- Contact actions for call, WhatsApp, email, website.
- Account, Add Business, and protected owner flows open inside an in-app WebView.

Important commands from `mobile/`:

```powershell
npm.cmd run start
npm.cmd run typecheck
npx.cmd eas-cli@latest build --platform android --profile preview
npx.cmd eas-cli@latest build --platform android --profile production
```

Use `npm.cmd`, not `npm`, in Windows PowerShell if script execution policy blocks `npm.ps1`.

## EAS / Play Store

Expo project:

- Owner: `zamkah`
- Project slug: `tradia`
- Project ID: `f29d87ab-f149-4701-a6c5-7b733c9ed13f`

Android identity:

- Package: `business.tradia.app`
- Keep this unchanged after first Google Play upload.

Build profiles:

- `preview`: internal APK for Android testing.
- `production`: Android App Bundle (`.aab`) for Google Play.

Recent Android build issue:

- Old EAS build failed because Expo SDK 52 expected `react-native@0.76.9`.
- This was fixed in commit `76d9377 Align mobile React Native version`.
- A fresh preview build was queued after that fix:
  `https://expo.dev/accounts/zamkah/projects/tradia/builds/c892c3b0-10ed-40be-b989-25e254a0bb4c`

## Environment Notes

Production website uses Vercel with:

- Neon PostgreSQL
- Cloudinary uploads
- Squad payments
- Resend email delivery
- Google AdSense
- Google Search Console

Do not expose secrets in code or docs.

## Useful Local Paths

Workspace root:

```text
C:\Users\zubai\Documents\Codex\2026-05-27\files-mentioned-by-the-user-business
```

Repo:

```text
C:\Users\zubai\Documents\Codex\2026-05-27\files-mentioned-by-the-user-business\tradia-app
```

Mobile app:

```text
C:\Users\zubai\Documents\Codex\2026-05-27\files-mentioned-by-the-user-business\tradia-app\mobile
```

## Recommended Next Work

1. Check the fresh EAS Android preview build status.
2. If it succeeds, download and test the APK on Android.
3. If Android testing passes, create a Google Play internal testing release.
4. Prepare Play Store screenshots, short description, long description, privacy/data safety answers, and content rating.
5. Continue improving native mobile flows so the app is not only a website wrapper.
