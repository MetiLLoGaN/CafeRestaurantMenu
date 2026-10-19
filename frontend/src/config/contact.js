/* ══════════════════════════════════════════════════════════════════
   Public business contact configuration (restaurant inquiry page).

   The official phone number is NOT hardcoded in any component.
   Configure it once, in `frontend/.env` (do not commit real .env
   files):

     REACT_APP_CONTACT_PHONE=+98 21 1234 5678

   Until a real number is configured, the inquiry page displays a
   clearly-marked placeholder ("official number pending") and the
   tel: link / copy button are not offered, so no fake number can be
   mistaken for a real one.
══════════════════════════════════════════════════════════════════ */

const RAW = (process.env.REACT_APP_CONTACT_PHONE || "").trim();

/* Loose sanity check: at least 7 digits worth of characters */
export const HAS_CONTACT_PHONE = /^[+]?[\d\s()-]{7,}$/.test(RAW);

export const CONTACT_PHONE = HAS_CONTACT_PHONE ? RAW : "";

/* tel:-ready form: strip spaces */
export const CONTACT_PHONE_TEL = CONTACT_PHONE.replace(/[\s()-]/g, "");

export default CONTACT_PHONE;
