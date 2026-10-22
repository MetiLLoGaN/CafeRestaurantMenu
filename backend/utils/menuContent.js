/* ══════════════════════════════════════════════════════════════════
   MENU CONTENT — validation and normalization (backend).

   Per-restaurant, bilingual (fa/en) customer-facing text for the
   public menu (heading, tagline, CTAs, …). Any field a restaurant
   never fills in falls back to the application's default translation
   on the client, so restaurants only ever store what they customize.

   Field list must stay in sync with the menuContent schema in
   models/User.js (same convention as utils/branding.js).
══════════════════════════════════════════════════════════════════ */

const MENU_CONTENT_FIELDS = Object.freeze([
  'heading',
  'tagline',
  'subtitle',
  'description',
  'instructions',
  'menuButtonLabel',
  'orderButtonLabel'
]);

const LANGS = Object.freeze(['fa', 'en']);
const MAX_LENGTH = 600;

/* Extract only known fields and languages from an arbitrary client
   payload. Empty strings clear an override; unknown keys and invalid
   types are rejected (listed in `invalid`), never silently stored. */
const sanitizeMenuContent = (input) => {
  const values = {};

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { values, invalid: ['menuContent'] };
  }

  const invalid = [];

  for (const field of MENU_CONTENT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;

    const raw = input[field];

    /* null / '' clears the override for this field */
    if (raw === null || raw === '') {
      values[field] = { fa: '', en: '' };
      continue;
    }

    if (typeof raw !== 'object' || Array.isArray(raw)) {
      invalid.push(field);
      continue;
    }

    const entry = {};
    let bad = false;

    for (const lang of LANGS) {
      if (!Object.prototype.hasOwnProperty.call(raw, lang)) continue;
      const v = raw[lang];
      if (typeof v !== 'string' || v.trim().length > MAX_LENGTH) {
        bad = true;
        break;
      }
      entry[lang] = v.trim();
    }

    if (bad) {
      invalid.push(field);
    } else {
      values[field] = { fa: entry.fa || '', en: entry.en || '' };
    }
  }

  return { values, invalid };
};

/* Public-safe view for the menu endpoint: only non-empty strings are
   exposed (never email or any other account data). Works with both
   lean documents and mongoose documents. */
const getEffectiveMenuContent = (user) => {
  const stored = user && user.menuContent;
  const plain =
    stored && typeof stored.toObject === 'function'
      ? stored.toObject()
      : stored && typeof stored === 'object'
        ? stored
        : {};

  const out = {};

  for (const field of MENU_CONTENT_FIELDS) {
    const entry = plain[field];
    if (!entry || typeof entry !== 'object') continue;
    const fa = typeof entry.fa === 'string' ? entry.fa.trim() : '';
    const en = typeof entry.en === 'string' ? entry.en.trim() : '';
    if (fa || en) out[field] = { fa, en };
  }

  return out;
};

module.exports = {
  MENU_CONTENT_FIELDS,
  LANGS,
  MAX_LENGTH,
  sanitizeMenuContent,
  getEffectiveMenuContent
};
