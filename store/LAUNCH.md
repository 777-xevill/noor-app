# Launch checklist

Everything in the app is ready to build. These steps need your own accounts, in roughly this
order.

## 1. Decide
- [ ] **Final name.** "Noor: Prayer Times & Quran" is the working title. Check it's free on both
      stores.
- [ ] **Bundle ID.** The config uses `com.xevill.noor`. It's permanent once the app ships, so
      change it now if you want a different one (app.json and the expo-widgets plugin).
- [ ] **Support email** for the privacy policy, terms and store listings. Search `site/` for
      "support email to be added".

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
- [ ] Set `EXPO_PUBLIC_SITE_URL` so the app shows the Privacy and Terms links. Apple requires
      them next to subscriptions.

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
- [ ] Buy and restore Plus in sandbox (if RevenueCat is on).

## 6. Store listings
- [ ] Texts: `store/listing.md` (English and Bangla).
- [ ] Privacy answers: `store/privacy-labels.md`.
- [ ] Screenshots: the list is in `store/listing.md`. Demo builds (`EXPO_PUBLIC_DEMO_DATA=1`)
      fill the screens with sample data.
- [ ] Content rating questionnaire: no violence, gambling or user-to-user chat, so it rates
      4+ / Everyone.
- [ ] App Review note: "Prayer times are calculated on the device. Location is used only for
      that and never leaves the phone. Sign-in is optional."

## 7. Ship
```
npx eas build --profile production --platform all
npx eas submit --platform ios       # TestFlight first
npx eas submit --platform android   # internal track, as a draft
```
