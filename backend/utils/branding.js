/* ══════════════════════════════════════════════════════════════════
   RESTAURANT BRANDING — defaults, validation and normalization.

   The defaults mirror the application's existing design tokens
   (deep burgundy primary, aged gold secondary/accent, warm cream
   background, espresso text) so restaurants that never configured
   branding render exactly as before — no migration required.
══════════════════════════════════════════════════════════════════ */

const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

const DEFAULT_BRANDING = Object.freeze({
  logo: '',
  primaryColor: '#8b1a1a',
  primaryHoverColor: '#a82020',
  secondaryColor: '#c9a84c',
  accentColor: '#c9a84c',
  backgroundColor: '#fdf6ec',
  surfaceColor: '#ffffff',
  primaryTextColor: '#2c1a0e',
  secondaryTextColor: '#8c7b6b',
  primaryDarkColor: '#5c0e0e',
  primaryPaleColor: '#fbeaea'
});

/* Whitelisted, client-settable color fields. `logo` is intentionally NOT
   part of this list — it can only change through the dedicated upload and
   delete endpoints. */
const COLOR_FIELDS = Object.freeze([
  'primaryColor',
  'primaryHoverColor',
  'secondaryColor',
  'accentColor',
  'backgroundColor',
  'surfaceColor',
  'primaryTextColor',
  'secondaryTextColor',
  'primaryDarkColor',
  'primaryPaleColor'
]);

/* Normalize to lowercase 6-digit hex, or null when invalid. */
const normalizeHex = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!HEX_COLOR.test(v)) return null;
  const short = v.length === 4;
  const r = short ? v[1] + v[1] : v.slice(1, 3);
  const g = short ? v[2] + v[2] : v.slice(3, 5);
  const b = short ? v[3] + v[3] : v.slice(5, 7);
  return `#${r}${g}${b}`.toLowerCase();
};

/* Extract only known, valid color fields from an arbitrary client payload.
   Returns { values, invalid } where `invalid` lists offending field names. */
const validateBrandingColors = (input = {}) => {
  const values = {};
  const invalid = [];

  for (const field of COLOR_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    const normalized = normalizeHex(input[field]);
    if (normalized) {
      values[field] = normalized;
    } else {
      invalid.push(field);
    }
  }

  return { values, invalid };
};

/* Build the effective branding for a user document (lean or mongoose).
   Stored values win; anything missing or invalid falls back to defaults,
   which is what keeps pre-existing restaurants working untouched. */
const getEffectiveBranding = (user) => {
  const stored = user && user.branding;
  const plain =
    stored && typeof stored.toObject === 'function'
      ? stored.toObject()
      : stored && typeof stored === 'object'
        ? stored
        : {};

  const effective = { ...DEFAULT_BRANDING };

  if (typeof plain.logo === 'string' && plain.logo.startsWith('/uploads/')) {
    effective.logo = plain.logo;
  }

  for (const field of COLOR_FIELDS) {
    const normalized = normalizeHex(plain[field]);
    if (normalized) effective[field] = normalized;
  }

  return effective;
};

module.exports = {
  DEFAULT_BRANDING,
  COLOR_FIELDS,
  HEX_COLOR,
  normalizeHex,
  validateBrandingColors,
  getEffectiveBranding
};
