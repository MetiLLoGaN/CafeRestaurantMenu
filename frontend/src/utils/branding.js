/* ══════════════════════════════════════════════════════════════════
   RESTAURANT BRANDING — CSS CUSTOM PROPERTY ENGINE (frontend)

   The whole UI already consumes CSS variables (--primary, --gold,
   --color-*, …) defined in index.css :root. This module turns a
   restaurant's persisted branding object into an override map for
   those base tokens and applies it to <html>, so every admin surface
   and the public menu pick up the tenant's palette from ONE place —
   no scattered inline colors.

   Defaults exactly mirror index.css, so a restaurant that never
   customized its branding renders pixel-identical to before.
══════════════════════════════════════════════════════════════════ */

/* Must stay in sync with backend/utils/branding.js */
export const DEFAULT_BRANDING = Object.freeze({
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
  primaryPaleColor: '#fbeaea',
});

/* Editable color fields, in settings-page order, grouped for the UI */
export const BRANDING_COLOR_GROUPS = Object.freeze([
  {
    titleKey: 'theme.colors.brand',
    fields: [
      { key: 'primaryColor', labelKey: 'theme.colors.primary' },
      { key: 'primaryHoverColor', labelKey: 'theme.colors.primaryHover' },
      { key: 'secondaryColor', labelKey: 'theme.colors.secondary' },
      { key: 'accentColor', labelKey: 'theme.colors.accent' },
    ],
  },
  {
    titleKey: 'theme.colors.surfaces',
    fields: [
      { key: 'backgroundColor', labelKey: 'theme.colors.background' },
      { key: 'surfaceColor', labelKey: 'theme.colors.surface' },
    ],
  },
  {
    titleKey: 'theme.colors.text',
    fields: [
      { key: 'primaryTextColor', labelKey: 'theme.colors.primaryText' },
      { key: 'secondaryTextColor', labelKey: 'theme.colors.secondaryText' },
    ],
  },
  {
    titleKey: 'theme.colors.variants',
    fields: [
      { key: 'primaryDarkColor', labelKey: 'theme.colors.primaryDark' },
      { key: 'primaryPaleColor', labelKey: 'theme.colors.primaryPale' },
    ],
  },
]);

export const BRANDING_COLOR_KEYS = Object.freeze(
  BRANDING_COLOR_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
);

/* Exact current values of every derived token in index.css — used when
   the source field has NOT been customized, so defaults never drift. */
const TOKEN_DEFAULTS = {
  goldDark: '#9a7a2e',
  goldLight: '#e8c97a',
  goldPale: '#fbf3dc',
  creamMid: '#f5e6d0',
  creamDeep: '#edd9b8',
  creamDeeper: '#e0c89a',
  charcoal: '#3d2b1f',
  divider: '#e8d5b7',
  sidebarBg: '#1a0a04',
  sidebarText: '#fdf6ec',
};

/* ── Color math ─────────────────────────────────────────────── */
const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export const normalizeHex = (value) => {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!HEX_COLOR.test(v)) return null;
  const short = v.length === 4;
  const r = short ? v[1] + v[1] : v.slice(1, 3);
  const g = short ? v[2] + v[2] : v.slice(3, 5);
  const b = short ? v[3] + v[3] : v.slice(5, 7);
  return `#${r}${g}${b}`.toLowerCase();
};

const toRgb = (hex) => {
  const h = normalizeHex(hex) || '#000000';
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
};

const toHexByte = (n) =>
  Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

/* mix(a, b, t) → (1 - t)·a + t·b */
const mix = (a, b, t) => {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return (
    '#' +
    toHexByte(r1 * (1 - t) + r2 * t) +
    toHexByte(g1 * (1 - t) + g2 * t) +
    toHexByte(b1 * (1 - t) + b2 * t)
  );
};

const tint = (c, t) => mix(c, '#FFFFFF', t);
const shade = (c, t) => mix(c, '#000000', t);

const rgba = (hex, alpha) => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* Perceived brightness 0..1 — used to keep sidebar text readable over
   the always-dark sidebar, whatever palette the restaurant picks. */
const brightness = (hex) => {
  const [r, g, b] = toRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const readableOnDark = (hex) => (brightness(hex) > 0.5 ? hex : '#FFFFFF');

/* ── Merge any incoming object over the defaults ─────────────── */
export const withDefaults = (branding) => {
  const merged = { ...DEFAULT_BRANDING, ...(branding || {}) };
  for (const key of Object.keys(DEFAULT_BRANDING)) {
    if (key === 'logo') continue;
    merged[key] = normalizeHex(merged[key]) || DEFAULT_BRANDING[key];
  }
  return merged;
};

/* ── Build the CSS custom property override map ───────────────── */
export const buildThemeTokens = (branding) => {
  const b = withDefaults(branding);

  const primary = b.primaryColor;
  const secondary = b.secondaryColor;
  const accent = b.accentColor;
  const bg = b.backgroundColor;
  const surface = b.surfaceColor;
  const text = b.primaryTextColor;
  const subText = b.secondaryTextColor;

  const changed = (key) =>
    normalizeHex(b[key]) !== normalizeHex(DEFAULT_BRANDING[key]);

  /* Light gold highlights follow the accent; if the structural gold
     itself changed, highlights re-derive from it to stay harmonious. */
  const goldSource = changed('secondaryColor')
    ? secondary
    : changed('accentColor')
      ? accent
      : null;

  const sidebarText = !changed('backgroundColor') && !changed('surfaceColor')
    ? TOKEN_DEFAULTS.sidebarText
    : readableOnDark(surface);

  return {
    /* Primary family (directly stored) */
    '--primary': primary,
    '--primary-hover': b.primaryHoverColor,
    '--primary-dark': b.primaryDarkColor,
    '--primary-pale': b.primaryPaleColor,

    /* Secondary + accent — the gold family */
    '--secondary': secondary,
    '--accent': accent,
    '--gold': secondary,
    '--gold-dark': changed('secondaryColor')
      ? shade(secondary, 0.22)
      : TOKEN_DEFAULTS.goldDark,
    '--gold-light': goldSource ? tint(goldSource, 0.35) : TOKEN_DEFAULTS.goldLight,
    '--gold-pale': goldSource ? tint(goldSource, 0.88) : TOKEN_DEFAULTS.goldPale,

    /* Page + surfaces */
    '--cream': bg,
    '--cream-mid': changed('backgroundColor') ? mix(bg, secondary, 0.1) : TOKEN_DEFAULTS.creamMid,
    '--cream-deep': changed('backgroundColor') ? mix(bg, secondary, 0.2) : TOKEN_DEFAULTS.creamDeep,
    '--cream-deeper': changed('backgroundColor') ? mix(bg, secondary, 0.32) : TOKEN_DEFAULTS.creamDeeper,
    '--white': surface,

    /* Text */
    '--espresso': text,
    '--charcoal': changed('primaryTextColor') ? tint(text, 0.12) : TOKEN_DEFAULTS.charcoal,
    '--muted': subText,
    '--divider': changed('backgroundColor') ? mix(bg, secondary, 0.3) : TOKEN_DEFAULTS.divider,

    /* Admin sidebar (always a dark surface) */
    '--sidebar-bg': changed('primaryColor') ? shade(primary, 0.8) : TOKEN_DEFAULTS.sidebarBg,
    '--sidebar-link': rgba(sidebarText, 0.55),
    '--sidebar-muted': rgba(sidebarText, 0.45),
    '--sidebar-hover-bg': rgba(secondary, 0.1),
    '--sidebar-active-bg': rgba(secondary, 0.18),
    '--sidebar-border': rgba(secondary, 0.2),
    '--sidebar-border-strong': rgba(secondary, 0.4),

    /* Gold shadows / rings / tints / translucent header */
    '--shadow-gold': `0 4px 24px ${rgba(secondary, 0.28)}`,
    '--shadow-gold-hover': `0 12px 48px ${rgba(secondary, 0.35)}`,
    '--ring-gold': rgba(accent, 0.18),
    '--gold-tint': rgba(secondary, 0.18),
    '--gold-tint-strong': rgba(secondary, 0.3),
    '--header-bg': rgba(bg, 0.93),
  };
};

/* All tokens this module may override — used by clearTheme() */
const THEME_TOKEN_KEYS = Object.keys(buildThemeTokens(DEFAULT_BRANDING));

/* Apply a restaurant's branding to <html>. Passing nothing/invalid data
   falls back to the application defaults. */
export const applyTheme = (branding) => {
  if (typeof document === 'undefined') return;
  const tokens = buildThemeTokens(branding);
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

/* Remove every override so the :root defaults from index.css apply. */
export const clearTheme = () => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  THEME_TOKEN_KEYS.forEach((key) => root.style.removeProperty(key));
};

/* Pick just the color fields (used by the settings form) */
export const pickColors = (branding) => {
  const b = withDefaults(branding);
  const out = {};
  BRANDING_COLOR_KEYS.forEach((key) => {
    out[key] = b[key];
  });
  return out;
};
