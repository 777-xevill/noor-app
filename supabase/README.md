# Accounts and cloud sync (Supabase)

The app works fully without an account. Accounts only back up and sync a person's own data
between phones. They switch on when the build is given a Supabase project.

## Set up (about 10 minutes)

1. Create a project at supabase.com. Pick the Singapore region, which is the closest to Bangladesh.
2. **SQL Editor**: run `migrations/0001_user_data.sql`.
3. **Authentication → Sign In / Providers → Email**: keep Email on. Turn **Confirm email** on.
4. **Authentication → Email Templates → Magic Link** and **Confirm signup** (a first sign-in uses
   Confirm signup): the app signs in with a 6-digit code, so make both templates show the code. For example:

   ```html
   <h2>Your Noor sign-in code</h2>
   <p>Enter this code in the app: <strong>{{ .Token }}</strong></p>
   <p>If you didn't ask for it, you can ignore this email.</p>
   ```

5. **Authentication → SMTP**: Supabase's built-in email only sends a few messages an hour. That
   is fine for testing. Before launch, connect a real sender such as Resend, Postmark or
   Amazon SES.
6. **Project Settings → API**: copy the Project URL and the anon (publishable) key into
   `mobile/.env.local`, using `.env.example` as the template. For EAS builds, add the same two
   values as EAS environment variables.

## What is synced

Settings (not the theme), prayer log, Quran progress and bookmarks, journal, fasts, dhikr counts,
saved duas, the Ramadan plan and milestones. Zakat figures stay on the phone.

## How conflicts are handled

Normally a phone pushes its copy after a change and takes the cloud copy when another phone wrote
first. If both changed since they last synced, the two are merged:

- Logged days are combined.
- Counters keep the higher value.
- Each journal day keeps its newest edit.
- Settings follow whichever copy changed last.

The rules are in `src/features/sync/merge.ts` and are checked by `npm run verify`.

## Deleting an account

Settings → Account → Delete account calls `delete_my_account()`. This removes the login and the
cloud copy. The phone keeps its own data.

## Articles (optional)

Run `migrations/0002_articles.sql`, then write articles in Studio's table editor, one row per
language (`en` or `bn`) with the same `slug`. An article appears in Lessons only when two things
are true:

- `reviewed_by` names the scholar who checked it.
- `published_at` is in the past.

Row-level security enforces both. Quote the Quran and hadith exactly as a named source gives them,
and list the sources in `sources` as `[{ "title": "Sahih al-Bukhari 1", "url": "https://…" }]`.

## Dua requests (optional)

Run `migrations/0003_community.sql`. The app reads the `dua_feed` view and writes only through
checked functions, so nobody can see who wrote an anonymous request.

**Moderation.** Three reports hide a request automatically. To review one:

1. In Studio, open `dua_reports` joined with `dua_requests`.
2. To restore a request, set `hidden = false` and `report_count = 0`.
3. To remove it, delete the row. For repeated abuse, delete the user from Authentication.

Apple and Google require this reporting, blocking and removal for apps with user posts. The
community rules are in `site/terms.html`.

## Ask Noor (Groq, free tier)

1. Create a key at console.groq.com. The free tier is enough to start.
2. Run `migrations/0004_ask.sql`, which sets a limit of 30 questions per user per day.
3. Set the key as a secret and deploy the function:
   `supabase secrets set GROQ_API_KEY=... && supabase functions deploy ask`
   Optionally set `GROQ_MODEL`. The default is `openai/gpt-oss-120b`.

**How it stays grounded:**
1. The model first turns the question into English search words.
2. The app searches its own verified Quran and Hisnul Muslim texts.
3. The model answers from only those passages and must cite them, for example `[Q 2:153]`.
4. The app removes any citation it didn't provide.
5. Sources are always shown from the app's own text, never the model's wording.

Keep `functions/ask/prompts.ts` identical to `src/features/ask/prompts.ts`. `npm run verify`
checks this.

For quick testing without Supabase, set `EXPO_PUBLIC_GROQ_API_KEY` in `.env.local`. Never ship
a build with it, because the key can be read out of the app.

## Mosque jamaat times (optional)

Run `migrations/0005_jamaat.sql`. People follow a mosque and type its jamaat times on their own
phone, which needs no server. With Supabase on, they can also share the times, and others can
use, confirm or report them. The app reads the `jamaat_public` view and writes only through checked
functions. Shared times are always shown as "not checked by Noor".

**Moderation.** Three reports hide an entry. In Studio, open `mosque_jamaat`: to restore an entry set
`hidden = false` and `report_count = 0`; to remove it, delete the row. Times confirmed by two people
can't be replaced for 30 days unless they are reported first.

## Family circles (optional)

Run `migrations/0006_circles.sql`. A circle is a private group that shares out the 30 juz to finish
a khatm together. People join with a 6-letter code and see only the names they chose for the circle.
Everything goes through functions; no table is readable by app users. There is no chat.
