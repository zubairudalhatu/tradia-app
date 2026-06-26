# Tradia Mobile

Expo/React Native app for Tradia on Google Play Store and Apple App Store.

## First Run

```bash
npm install
npm run start
```

## Store Build Path

1. Create or log in to an Expo account and install EAS CLI.
2. Run `eas init` once from this `mobile` folder if the app has not yet been linked to an Expo project.
3. Build a clearly labeled local-test APK: `npm run release:android:preview`.
4. Build the Play Store AAB: `npm run release:android:production`.
5. Upload the `.aab` manually in Google Play Console, or configure a Play service account and run `eas submit --platform android --profile production`.

The Android package name is `business.tradia.app`. Do not change it after the first Play Console upload.

## Current Scope

- Native business discovery screen.
- Search published businesses from `https://www.tradiabusiness.com/api/businesses`.
- Business detail screen with call, WhatsApp, email, website, and web profile actions.
- Add Business and Account actions open the secure Tradia website.

Native login, owner dashboard, media upload, payments, and admin flows can be added in later app releases after the first store-ready foundation is stable.
