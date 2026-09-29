// The Noor website (site/): privacy policy and terms. Set EXPO_PUBLIC_SITE_URL once it's hosted;
// until then the links are hidden rather than pointing somewhere that doesn't exist.
const base = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '');

export const PRIVACY_URL = base ? `${base}/privacy.html` : null;
export const TERMS_URL = base ? `${base}/terms.html` : null;
