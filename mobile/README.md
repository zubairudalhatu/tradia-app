# Tradia Mobile

Expo/React Native app for Tradia on Google Play Store and Apple App Store.

## First Run

```bash
npm install
npm run start
```

## Store Build Path

1. Create an Expo account and install EAS CLI.
2. Run `eas build:configure`.
3. Build Android: `eas build --platform android --profile production`.
4. Build iOS: `eas build --platform ios --profile production`.
5. Submit with `eas submit --platform android` and `eas submit --platform ios`.

## Current Scope

- Native business discovery screen.
- Search published businesses from `https://www.tradia.business/api/businesses`.
- Business detail screen with call, WhatsApp, email, website, and web profile actions.
- Add Business and Account actions open the secure Tradia website.

Native login, owner dashboard, media upload, payments, and admin flows can be added in later app releases after the first store-ready foundation is stable.
