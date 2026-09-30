# Yearly upkeep

Do this every year, ideally two months before Ramadan.

## Dates and prayer times
- [ ] Ramadan, Eid and the Sunnah-fast dates in the app come from the Hijri calendar in `src/lib/hijri.ts`.
      Check the coming year's Ramadan and Eid dates against the Umm al-Qura calendar and a Bangladesh moon-sighting announcement.
- [ ] Run `npm run verify`. The checks against api.aladhan.com use fixed dates; move `DATES` in
      `scripts/verify/verify-religious.ts` forward a year (keep one near each solstice and equinox).
- [ ] One known check, London Asr on the winter date, sits at the edge of its tolerance and can fail. It is not an app bug.

## Data
- [ ] `python scripts/data/fetch_data.py` (all parts) refetches Quran, duas, names and cities; `wbw_all`, `nawawi` and
      `hadith_index` refetch the word-by-word, tajweed and hadith data. Run `npm run verify` after, and read any diff before shipping.
- [ ] Places demo snapshot: `python scripts/data/fetch_data.py places_demo`.

## Content that needs a scholar
- [ ] `src/data/hajj.ts` and `src/data/kidsSalah.ts` are written for Noor, not sourced. Have a qualified scholar review them
      before Hajj (about mid-May 2027), then set `HAJJ_REVIEWED` / `KIDS_REVIEWED` to true and fill `REVIEWED_BY`.
- [ ] Charity partners (`src/features/donate/partners.ts`) and lecture channels (`src/features/lectures/channels.ts`):
      re-check that each is still active and still what we described.

## App and tools
- [ ] Update Expo SDK (`npx expo install expo@latest --fix`, then `npx expo-doctor`, `npm run typecheck`, `npm run lint`).
- [ ] Rotate keys that have been shared anywhere (Groq, RevenueCat, Supabase service key).
- [ ] Rebuild the preview with `node scripts/build-preview.mjs` and grep the output for `gsk_` before publishing.
- [ ] Renew the Apple developer membership ($99/year) and check Play Store policy changes.
