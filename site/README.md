# Noor website

Plain HTML and CSS, with no build step: `index.html` (landing, English and Bangla),
`privacy.html` and `terms.html`. Host the folder anywhere static, such as Cloudflare Pages,
GitHub Pages or Netlify. Then set `EXPO_PUBLIC_SITE_URL` in the app so it links here.

- The Quran quote on the landing page (24:35) is copied from the app's Quran data, and
  `npm run verify` checks that it still matches.
- The screenshots in `img/` come from the web preview's demo mode.
- `img/mark.svg` is produced by `scripts/brand/render-icons.mjs`, the same source as the app
  icons.
- Before going live, replace "support email to be added" in `privacy.html` and `terms.html`.
