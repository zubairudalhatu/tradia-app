# Tradia Codex Project Handoff

Use this file when opening Tradia in a fresh Codex Project.

## Project

Tradia is a Nigerian business discovery platform with:

- Public website: `https://www.tradiabusiness.com`
- The old `tradia.business` domain must keep its Vercel DNS records so it can redirect old links to the new domain.
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
- Search published businesses from `https://www.tradiabusiness.com/api/businesses`.
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
- A fresh preview build was queued after that fix and finished successfully:
  `https://expo.dev/accounts/zamkah/projects/tradia/builds/c892c3b0-10ed-40be-b989-25e254a0bb4c`
- Preview APK artifact:
  `https://expo.dev/artifacts/eas/qLwmWGGedYJxg5mrWZMbb9.apk`
- Local downloaded APK:
  `C:\Users\zubai\OneDrive\Documents\Tradia\tradia-preview-c892c3b0.apk`
- APK SHA-256:
  `AD338A0ACA14BAE2FB23B6BEB022AE06176008ED98C2E9DE23FF0FAF47076842`
- Local mobile typecheck passed on 2026-06-01.
- Android device sideload testing was blocked by Google Play Protect on 2026-06-02 because the developer/app was not yet recognized. The APK file reached the phone intact at 61.81 MB, but Android showed "App blocked to protect your device" and then "The app wasn't installed."
- A production Android App Bundle for Google Play internal testing was built successfully:
  `https://expo.dev/accounts/zamkah/projects/tradia/builds/b00a8601-3e84-4093-b584-b8ace2fa8270`
- Production AAB artifact:
  `https://expo.dev/artifacts/eas/nJPErJdkRBt8rhcZK7gzbQ.aab`
- Local downloaded AAB:
  `C:\Users\zubai\OneDrive\Documents\Tradia\tradia-production-b00a8601.aab`
- AAB SHA-256:
  `79E0431C20A2432DE1DD04F6E1B41B116C7F3559A966547CD40726BBAE00BFA3`
- Google Play rejected the versionCode 2 AAB because it targeted Android API 34. The mobile app now uses `expo-build-properties` to set Android `compileSdkVersion` and `targetSdkVersion` to 35.
- Replacement production Android App Bundle targeting API 35 was built successfully:
  `https://expo.dev/accounts/zamkah/projects/tradia/builds/8fdf4d4d-793e-4611-b711-5bc8b4d0693a`
- Replacement API 35 AAB artifact:
  `https://expo.dev/artifacts/eas/iLqGj94fPLZwphm7Tmx9h3.aab`
- Local downloaded API 35 AAB:
  `C:\Users\zubai\OneDrive\Documents\Tradia\tradia-production-api35-8fdf4d4d.aab`
- API 35 AAB SHA-256:
  `CB08748633796D7EE9060B35DB5447389ADE05535165C5DB7786A8D51F4C02AA`
- Google Play reported that version code 3 had already been used, so a fresh API 35 production build with version code 4 was created:
  `https://expo.dev/accounts/zamkah/projects/tradia/builds/18bd994b-726e-426f-971d-1c6423a16670`
- Current upload target for Google Play internal testing:
  `C:\Users\zubai\OneDrive\Documents\Tradia\tradia-production-api35-v4-18bd994b.aab`
- Version code 4 AAB artifact:
  `https://expo.dev/artifacts/eas/44cheL2x8TsPMNLEVKwc9m.aab`
- Version code 4 AAB SHA-256:
  `35BF46653C0868F3E4F66A0B50CEA152784B259702A02D7C70CB517C0D8DA84D`

## Environment Notes

Production website uses Vercel with:

- Neon PostgreSQL
- Cloudinary uploads
- Squad payments
- Resend email delivery
- Google AdSense
- Google Search Console

Do not expose secrets in code or docs.

The new-domain migration was deployed on 2026-06-11. See `docs/DOMAIN_MIGRATION.md` for the remaining old-domain redirect and external-service checklist.

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

1. Remove older AABs from the draft Google Play internal testing release and upload the API 35 version code 4 AAB.
2. Install and test Tradia from the Play internal testing link.
3. Prepare Play Store screenshots, short description, long description, privacy/data safety answers, and content rating.
4. Continue improving native mobile flows so the app is not only a website wrapper.
