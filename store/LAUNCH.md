# Launch checklist

These steps need your own accounts, in roughly this order.

## 0. Blockers (as of 3 Nov 2026)
- [ ] **Backend is down.** Supabase project `syagdyrrhhotctfcqolf` no longer resolves, so sign-in, sync, Ask Noor, dua
      requests, jamaat times and family circles fail. Its owner must restore it, or make a new project and run every
      migration, then update the keys in `eas.json`, `.env.local` and `.env.server.local`. Free projects pause when idle,
      so a public launch needs a paid plan.
- [ ] **Apply `supabase/migrations/0008_ask_reports.sql`** once the backend is back. The Report button needs it.
- [ ] **Optional: scholar review** of `src/data/hajj.ts` and `src/data/kidsSalah.ts`. They were compared with published guides (`store/SOURCE_CHECK.md`) and the app says so, along with saying no scholar has reviewed them in person.

## 1. Decide
- [ ] **Final name.** "Noor: Prayer Times & Quran" is the working title. Check it's free on both
      stores.
- [ ] **Bundle ID.** The config uses `com.xevill.noor`. It's permanent once the app ships, so
      change it now if you want a different one (app.json and the expo-widgets plugin).
- [ ] **Support email** for the privacy policy, terms, account deletion page and store listings. Search `site/` for
      "support email to be added" and its Bangla version.

## 2. Accounts
- [ ] Expo account, then `npx eas login` and `npx eas init` (adds the project ID to app.json).
- [ ] Apple Developer Program ($99/year) and Google Play Console ($25 once).
- [ ] Optional: Supabase for accounts and sync (see `supabase/README.md`) and RevenueCat for
      Noor Plus (entitlement id `plus`, with yearly, monthly and lifetime products in the current
      offering).

## 3. Secrets
Add them as EAS environment variables for the `preview` and `production` environments. Use
`.env.local` for local runs. The list is in `.env.example`:
`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_IOS_KEY`,
`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_SITE_URL`.

## 4. Website
- [ ] Host `site/` on Cloudflare Pages, GitHub Pages or Netlify. It's plain HTML with no build
      step.
- [ ] Set `EXPO_PUBLIC_SITE_URL` in the `production` env in `eas.json` so the app shows the Privacy and Terms links.
      Google Play requires the privacy link inside the app, so do this before the production build.

## 5. Build and test on real phones
```
npx eas build --profile preview --platform android   # installable APK
npx eas build --profile development --platform ios   # dev build (register your iPhone first)
```
Check on a real device:
- [ ] Adhan alert plays at a prayer time, including when the phone is locked.
- [ ] On Android, alerts arrive on the exact minute. If not, allow "Alarms & reminders" in
      Prayer settings.
- [ ] Home-screen and Lock Screen widgets move on at a prayer time by themselves (iOS).
- [ ] Qibla compass points correctly outdoors, away from metal.
- [ ] Bangla throughout: onboarding, alerts and widgets.
- [ ] Sign in, sync to a second phone, delete account (if Supabase is on).
- [ ] Home-screen widget, photo picker, offline audio and Report this answer in a release build. These confirm the
      code shrinking (R8) didn't remove anything they need.
- [ ] Buy and restore Plus in sandbox (if RevenueCat is on).

## 6. Store listings
- [ ] Texts: `store/listing.md` (English and Bangla).
- [ ] Privacy answers: `store/privacy-labels.md`.
- [ ] Screenshots: the list is in `store/listing.md`. Demo builds (`EXPO_PUBLIC_DEMO_DATA=1`)
      fill the screens with sample data.
- [ ] Content rating questionnaire: no violence or gambling. Answer **yes** to users interacting or sharing content
      (dua requests, jamaat times, family circles), which may raise the rating. Don't call it "no user content".
- [ ] Play Console, App content: target audience **13 and over** (not children, so the Families policy doesn't apply to
      the whole app); ads **no**; financial features **none**; health apps **none**; privacy policy
      `<site>/privacy.html`; account deletion `<site>/delete-account.html`.
- [ ] App access: most of the app is open, but posting needs an account. Give Google a working test login.
- [ ] Play graphics: 512×512 icon, 1024×500 feature graphic, at least 2 phone screenshots.
- [ ] App Review note: "Prayer times are calculated on the device. Location is used only for
      that and never leaves the phone. Sign-in is optional."

## 7. Ship
```
npx eas build --profile production --platform all
npx eas submit --platform ios       # TestFlight first
npx eas submit --platform android   # internal track, as a draft
```

Google Play specifics:
- [ ] Upload the first `.aab` by hand in Play Console. Google only accepts API uploads (`eas submit`) after that.
- [ ] **Personal developer accounts** made after 13 Nov 2023 must run a closed test with at least 12 opted-in testers
      for 14 days in a row, then apply for production access. Allow at least 3 weeks. Organization accounts are exempt.
