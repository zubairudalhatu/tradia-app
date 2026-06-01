# Tradia Mobile Release

Google Play Console account ID: `5237067421982255990`

## App Identity

- App name: `Tradia`
- Android package: `business.tradia.app`
- iOS bundle ID: `business.tradia.app`
- Website: `https://www.tradia.business`
- Privacy policy: `https://www.tradia.business/privacy`
- Support email: `tradia@zamkah.com.ng`
- Current app version: `1.0.0`

Keep the Android package unchanged after the first Google Play upload.

## Build Commands

Run these from `mobile/`:

```powershell
npm.cmd run typecheck
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build --platform android --profile preview
npx.cmd eas-cli@latest build --platform android --profile production
```

Use the `preview` build for direct Android testing. Use the `production` build for Google Play because it creates an Android App Bundle (`.aab`).

## Google Play Console Setup

Create the app in the Play Console account above:

- App name: `Tradia`
- Default language: English
- App or game: App
- Free or paid: Free

Upload the production `.aab` to Internal testing first. After testing, move to Closed testing, Open testing, or Production depending on the account requirements shown in Play Console.

## Store Listing Draft

Short description:

```text
Discover verified Nigerian businesses and grow your visibility.
```

Long description:

```text
Tradia helps customers discover businesses across Nigeria and gives SMEs a trusted digital presence.

Use Tradia to search by business name, category, location, and verification status. View business profiles, photos, contact details, ratings, and trust signals, then call, email, visit a website, or start a WhatsApp conversation directly.

Business owners can list their business, manage their profile, request verification, and upgrade visibility through Tradia premium plans.
```

## Play Data Safety Notes

Declare only what the app and website actually collect or process:

- Account information for registered business owners.
- Business profile details, such as name, category, address, phone, WhatsApp, email, website, and description.
- Uploaded business media or verification documents when owners choose to submit them.
- Payment status for premium plans. Card details are handled by the payment provider and are not stored by Tradia.
- Basic usage and listing analytics, such as profile views, contact clicks, enquiries, and reviews.

## Screenshots Needed

Capture phone screenshots for:

- Home/business discovery
- Search results or filters
- Business detail page
- Contact actions
- Account or add business flow

Use clean, real-looking listings and avoid exposing private user data.
