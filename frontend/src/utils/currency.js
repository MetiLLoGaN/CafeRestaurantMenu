/* ── Centralized currency formatting ─────────────────────────────
   The application's sole displayed currency is Iranian Toman (تومان).

   Convention: `CURRENCY_CODE` ('IRT') is an APPLICATION-SPECIFIC
   identifier for internal use (docs, logging, future API metadata).
   It is NOT an official ISO 4217 code — Toman is not an ISO currency
   (the official Iranian currency is the Rial, IRR; 1 Toman = 10 Rial).

   Stored price values (menu items, order items, totals) are plain
   numbers interpreted as Toman. No Rial/Toman conversion is ever
   performed anywhere in the app: values are never multiplied or
   divided by 10/100, and historical amounts keep their meaning.

   All price DISPLAY goes through this module — do not add separate
   Intl.NumberFormat/toLocaleString currency formatting elsewhere. */
import { useTranslation } from 'react-i18next';

export const CURRENCY_CODE = 'IRT';

/* Currency label per application language */
export const CURRENCY_LABELS = {
  fa: 'تومان',
  en: 'Toman',
};

/* Number-grouping locale per application language:
   fa → Persian digits with ٬ separators (۱۵۰٬۰۰۰)
   en → Latin digits with , separators (150,000) */
const NUMBER_LOCALES = {
  fa: 'fa-IR',
  en: 'en-US',
};

const FALLBACK_LANGUAGE = 'en';

/* Cache formatters per locale — the dashboard animates prices
   frame-by-frame and re-creating Intl.NumberFormat is wasteful. */
const formatterCache = {};
const getFormatter = (lang) => {
  if (!formatterCache[lang]) {
    formatterCache[lang] = new Intl.NumberFormat(NUMBER_LOCALES[lang], {
      maximumFractionDigits: 0,
    });
  }
  return formatterCache[lang];
};

/**
 * Format a monetary amount as a Toman price for the given language.
 *
 * - 0 and other non-negative amounts → "0 Toman" / "۰ تومان"
 * - fractional inputs are rounded to whole Toman for display only
 *   (avoids floating-point artifacts like 14999.999999999998)
 * - invalid / missing / negative values → "—" so we never silently
 *   display a misleading price
 */
export const formatPrice = (value, language = FALLBACK_LANGUAGE) => {
  /* Accept region-suffixed tags like 'fa-IR' or 'en-US' */
  const base = String(language || FALLBACK_LANGUAGE).split('-')[0];
  const lang = CURRENCY_LABELS[base] ? base : FALLBACK_LANGUAGE;

  /* Numeric strings are accepted (forms/broadcast state); '', null,
     undefined, NaN, Infinity and anything non-coercible are not. */
  const amount =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;

  if (
    amount === null ||
    amount === undefined ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return '—';
  }

  return `${getFormatter(lang).format(Math.round(amount))} ${
    CURRENCY_LABELS[lang]
  }`;
};

/**
 * React binding: formats prices in the currently active i18n language.
 * Components should use this instead of calling formatPrice directly:
 *
 *   const formatPrice = useFormatPrice();
 *   … {formatPrice(item.price)}
 *
 * Any component that renders prices already uses useTranslation(), so
 * it re-renders when the language changes and picks up the new locale.
 */
export const useFormatPrice = () => {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || FALLBACK_LANGUAGE;
  return (value) => formatPrice(value, language);
};
