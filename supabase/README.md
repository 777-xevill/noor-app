# Accounts and cloud sync (Supabase)

The app works fully without an account. Accounts only back up and sync a person's own data
between phones. They switch on when the build is given a Supabase project.

## Set up (about 10 minutes)

1. Create a project at supabase.com. Pick the Singapore region, which is the closest to Bangladesh.
2. **SQL Editor**: run `migrations/0001_user_data.sql`.
3. **Authentication → Sign In / Providers → Email**: keep Email on. Turn **Confirm email** on.
4. **Authentication → Email Templates → Magic Link**: the app signs in with a 6-digit code, so
   make the template show the code. For example:

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
