# Privacy answers for the stores

These answers match what the code does. Re-check them whenever a feature starts sending data
off the phone.

## What leaves the phone

| Data | When | Where | Purpose |
|---|---|---|---|
| Email address | Only if the person signs in | Supabase (auth) | Sign-in |
| Prayer log, Quran progress and bookmarks, journal, fasts, dhikr counts, saved duas, Ramadan plan, milestones, settings | Only if signed in | Supabase (`user_data`, row-level security) | Sync and backup |
| Purchase history and an anonymous app user ID | Only when buying or restoring Plus | RevenueCat, Apple or Google | Noor Plus |
| A dua request (and optional first name) | Only if the person posts one | Supabase (`dua_requests`, author never exposed) | Community |
| A question to Ask Noor, with the passages found for it, and a random install ID for the daily limit | Only when asking | Supabase → Groq | Ask Noor |
| A reported Ask Noor question and answer | Only if the person reports it | Supabase (`private.ask_reports`) | Review |
| A rough area, rounded to about 2 km | Only when searching for nearby mosques or halal food | Public OpenStreetMap (Overpass) servers | Nearby places |
| Jamaat times shared or confirmed | Only if the person shares them | Supabase (`mosque_jamaat`) | Community |
| A chosen first name and the juz taken | Only in a family circle | Supabase (`circle_members`) | Family circles |
| Which verse or section is opened | When opening tafsir, hadith or audio | api.quran.com, cdn.jsdelivr.net, audio.qurancdn.com | Reading and listening |
| Which verse is playing | When recitation is played | everyayah.com (audio file request) | Recitation |

**Never leaves the phone:** exact location (used on-device for prayer times, Qibla and distances), Zakat figures,
the giving log, women's mode, and everything else when signed out. Android cloud backup is off (`allowBackup: false`)
so these don't reach Google either. There are no ads, analytics or tracking SDKs, and no data is sold or shared for
advertising.

## App Store — App Privacy

- **Tracking:** No.
- **Data linked to the user,** collected only with an account or a purchase:
  - Contact Info → Email Address. Purpose: App Functionality.
  - User Content → Other User Content (journal, logs). Purpose: App Functionality.
  - Sensitive Info → Religious beliefs (the prayer log and similar, once synced). Purpose: App Functionality.
  - Purchases → Purchase History, only once Noor Plus is on sale. Purpose: App Functionality.
- **Data not linked to the user:** Location → Coarse Location (nearby search, rounded to about 2 km). Identifiers →
  Device ID (the random install ID for Ask Noor limits). Purpose: App Functionality.
- **Not collected:** Precise Location, Health, Identifiers for advertising, Usage Data, Diagnostics.

## Google Play — Data safety

Declare the following as collected. All are optional, for App functionality (and Account management for the email), and
encrypted in transit.

- Personal info: Email address; Name (a chosen first name, in dua requests and family circles); Political or religious
  beliefs (prayer log and similar, synced only when signed in).
- Location: Approximate location (nearby search only, processed ephemerally, not kept by Noor).
- App activity: Other user-generated content (journal, logs, dua requests, Ask Noor questions); Other actions.
- App info and performance: none.
- Device or other IDs: yes (the random install ID for Ask Noor limits).
- Financial info: only once Noor Plus is on sale (Purchase history).
- Data shared with third parties: No. These go to service providers or happen because the person asked for them.
- Users can request deletion: Yes. In the app (Settings → Account → Delete account), and on the web at
  `<site>/delete-account.html`. Enter that URL in the Data deletion question.
- Not collected: Precise location (the exact position never leaves the phone), Health and fitness (women's mode is
  on the phone only), Photos (the profile photo stays on the phone).

## Permissions and why

- **Location (while using the app):** prayer times and Qibla for where you are.
- **Notifications:** prayer, Sehri and Iftar alerts.
- **Exact alarms (Android):** so alerts arrive on the exact minute of each prayer. This uses `SCHEDULE_EXACT_ALARM`,
  which the person grants, not the restricted `USE_EXACT_ALARM`.
- **Microphone:** not requested. It is blocked on Android and removed from iOS.
- **Foreground services, storage, overlay, camera (Android):** blocked. Recitation stops when the app leaves the
  screen, so no foreground service declaration is needed. If background recitation is added, remove the block and
  fill in that declaration with a demo video.
