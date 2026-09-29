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
| A question to Ask Noor, with the passages found for it | Only when asking | Supabase edge function → Groq | Ask Noor |
| Which verse is playing | When recitation is played | everyayah.com (audio file request) | Recitation |

**Never leaves the phone:** location (used on-device for prayer times and Qibla), Zakat figures, the giving log,
and everything else when signed out. There are no ads, analytics or tracking SDKs, and no data is
sold or shared for advertising.

## App Store — App Privacy

- **Tracking:** No.
- **Data linked to the user,** collected only with an account or a purchase:
  - Contact Info → Email Address. Purpose: App Functionality.
  - User Content → Other User Content (journal, logs). Purpose: App Functionality.
  - Purchases → Purchase History. Purpose: App Functionality.
- **Not collected:** Location (it's processed on the device only), Health, Identifiers for
  advertising, Usage Data, Diagnostics.

## Google Play — Data safety

- Data collected: Email address (Personal info), Other user-generated content (App activity),
  Purchase history (Financial info). All are optional, for App functionality and Account
  management, and encrypted in transit.
- Data shared with third parties: None.
- Users can request deletion: Yes, in the app (Settings → Account → Delete account).
- Location: not collected. It's processed on the device only.

## Permissions and why

- **Location (while using the app):** prayer times and Qibla for where you are.
- **Notifications:** prayer, Sehri and Iftar alerts.
- **Exact alarms (Android):** so alerts arrive on the exact minute of each prayer.
- **Microphone:** not requested. It is blocked on Android and removed from iOS.
