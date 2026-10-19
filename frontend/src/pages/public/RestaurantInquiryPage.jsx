import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  HAS_CONTACT_PHONE,
} from "../../config/contact";

/* ══════════════════════════════════════════════════════════════════
   Public restaurant inquiry / service presentation page.
   Route: /restaurant-inquiry — NO authentication required, exposes
   no administrative routes, forms or credentials.

   Reached from the login page CTA «رستوران خود را ثبت کنید». There
   is deliberately NO online account-request submission here: the
   owner contacts the business (tel: link below) and the Super Admin
   creates the account through the protected dashboard.

   The official phone number comes from REACT_APP_CONTACT_PHONE
   (frontend/src/config/contact.js). Until one is configured the page
   shows a clearly-marked placeholder and no tel: link, so a fake
   number can never be mistaken for a real one.
══════════════════════════════════════════════════════════════════ */

const BENEFIT_ICONS = ["📱", "🧾", "🛠️", "🎨", "⚡", "🌐"];

function RestaurantInquiryPage() {
  const { t, i18n } = useTranslation();
  const contactRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.resolvedLanguage === "fa" ? "en" : "fa");
  };

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyPhone = async () => {
    if (!HAS_CONTACT_PHONE) return;
    try {
      await navigator.clipboard.writeText(CONTACT_PHONE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable — the number is still visible on screen */
    }
  };

  const benefits = [
    "benefitQr",
    "benefitManage",
    "benefitPanel",
    "benefitBranding",
    "benefitMobile",
    "benefitBilingual",
  ];

  const steps = ["stepContact", "stepRequest", "stepSetup"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream, #f7f3ed)",
        fontFamily: '"DM Sans", "Vazirmatn", system-ui, sans-serif',
      }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(247, 243, 237, 0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--divider, #d6c9b8)",
        }}>
        <div
          className="max-w-6xl mx-auto flex items-center justify-between gap-3"
          style={{ padding: "14px 20px" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--color-primary, #6b855e)" }}>
              🍽️
            </div>
            <div className="min-w-0">
              <p
                className="font-display font-bold leading-tight truncate"
                style={{ color: "var(--espresso, #2f2a24)" }}>
                {t("common.brand")}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "var(--muted, #8f8982)" }}>
                {t("inquiry.brandSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleLanguage}
              className="sidebar-link"
              aria-label={t("sidebar.changeLanguage")}
              title={t("sidebar.changeLanguage")}>
              <span style={{ fontSize: "16px" }}>🌐</span>
              <span>
                {i18n.resolvedLanguage === "fa" ? "English" : "فارسی"}
              </span>
            </button>
            <Link
              to="/admin/login"
              className="sidebar-link"
              aria-label={t("menu.restaurantLogin")}>
              <span style={{ fontSize: "16px" }}>🔐</span>
              <span>{t("inquiry.navLogin")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="max-w-4xl mx-auto text-center"
          style={{ padding: "72px 20px 56px" }}>
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest animate-fade-up"
            style={{
              color: "var(--color-primary, #6b855e)",
              background: "var(--primary-pale, #e9eee5)",
              padding: "6px 16px",
              borderRadius: "9999px",
              letterSpacing: "0.12em",
            }}>
            {t("inquiry.badge")}
          </span>
          <h1
            className="font-display font-bold animate-fade-up"
            style={{
              fontSize: "clamp(1.9rem, 4.5vw, 3.2rem)",
              color: "var(--espresso, #2f2a24)",
              lineHeight: 1.2,
              margin: "22px auto 18px",
              maxWidth: "46rem",
            }}>
            {t("inquiry.headline")}
          </h1>
          <p
            className="animate-fade-up"
            style={{
              fontSize: "clamp(0.95rem, 1.6vw, 1.1rem)",
              color: "var(--charcoal, #6b645b)",
              lineHeight: 1.9,
              maxWidth: "44rem",
              margin: "0 auto 34px",
            }}>
            {t("inquiry.subtitle")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={scrollToContact}
              className="animate-fade-up"
              style={{
                background: "var(--color-primary, #6b855e)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                padding: "15px 34px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "var(--shadow-gold, 0 4px 24px rgba(166,124,82,0.28))",
                transition: "background 0.2s ease, transform 0.15s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-primary-hover, #5b6f4f)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-primary, #6b855e)")
              }>
              {t("inquiry.cta")}
            </button>
            <a
              href="#benefits"
              className="animate-fade-up"
              style={{
                background: "transparent",
                color: "var(--gold-dark, #8f6a43)",
                border: "1.5px solid var(--gold-light, #d6b895)",
                borderRadius: "14px",
                padding: "14px 30px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
              }}>
              {t("inquiry.explore")}
            </a>
          </div>
        </div>
      </section>

      {/* ── Benefits ────────────────────────────────────────── */}
      <section id="benefits" style={{ padding: "24px 20px 56px" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="font-display font-bold text-center"
            style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              color: "var(--espresso, #2f2a24)",
              margin: "0 0 30px",
            }}>
            {t("inquiry.benefitsTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((key, i) => (
              <div
                key={key}
                className="card-restaurant p-5 animate-fade-up"
                style={{
                  animationDelay: `${i * 0.07}s`,
                  borderBottom: "3px solid var(--color-gold, #a67c52)",
                }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-primary, #6b855e) 12%, transparent)",
                  }}>
                  {BENEFIT_ICONS[i]}
                </div>
                <p
                  style={{
                    color: "var(--espresso, #2f2a24)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    lineHeight: 1.7,
                  }}>
                  {t(`inquiry.benefits.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section style={{ padding: "10px 20px 64px" }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="font-display font-bold text-center"
            style={{
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              color: "var(--espresso, #2f2a24)",
              margin: "0 0 34px",
            }}>
            {t("inquiry.stepsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((key, i) => (
              <div
                key={key}
                className="animate-fade-up text-center"
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div
                  className="font-display font-bold mx-auto mb-4"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "var(--color-primary, #6b855e)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.3rem",
                    boxShadow: "var(--shadow-sm, 0 2px 10px rgba(47,42,36,0.09))",
                  }}>
                  {i + 1}
                </div>
                <p
                  style={{
                    color: "var(--espresso, #2f2a24)",
                    fontSize: "0.98rem",
                    fontWeight: 600,
                    lineHeight: 1.8,
                    maxWidth: "20rem",
                    margin: "0 auto",
                  }}>
                  {t(`inquiry.steps.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <section ref={contactRef} style={{ padding: "10px 20px 80px" }}>
        <div className="max-w-2xl mx-auto">
          <div
            className="card-restaurant text-center animate-fade-up"
            style={{ padding: "40px 28px" }}>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ background: "var(--gold-pale, #f5ede3)" }}>
              📞
            </div>
            <h2
              className="font-display font-bold"
              style={{
                fontSize: "clamp(1.3rem, 3vw, 1.8rem)",
                color: "var(--espresso, #2f2a24)",
                margin: "0 0 12px",
              }}>
              {t("inquiry.contactTitle")}
            </h2>
            <p
              style={{
                color: "var(--charcoal, #6b645b)",
                lineHeight: 1.9,
                maxWidth: "34rem",
                margin: "0 auto 26px",
                fontSize: "0.95rem",
              }}>
              {t("inquiry.contactText")}
            </p>

            {HAS_CONTACT_PHONE ? (
              <div className="flex flex-col items-center gap-3">
                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="font-display font-bold"
                  dir="ltr"
                  style={{
                    fontSize: "1.5rem",
                    color: "var(--color-primary, #6b855e)",
                    textDecoration: "none",
                    letterSpacing: "0.02em",
                  }}>
                  {CONTACT_PHONE}
                </a>
                <button
                  onClick={copyPhone}
                  style={{
                    background: "transparent",
                    color: "var(--gold-dark, #8f6a43)",
                    border: "1.5px solid var(--gold-light, #d6b895)",
                    borderRadius: "10px",
                    padding: "8px 20px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}>
                  {copied ? t("inquiry.copied") : t("inquiry.copyPhone")}
                </button>
              </div>
            ) : (
              /* Clearly-marked placeholder — NOT a real number */
              <p
                dir="ltr"
                style={{
                  color: "var(--muted, #8f8982)",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  background: "var(--cream-mid, #eee6dc)",
                  borderRadius: "12px",
                  padding: "14px 20px",
                  maxWidth: "24rem",
                  margin: "0 auto",
                }}>
                {t("inquiry.phonePending")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid var(--divider, #d6c9b8)",
          padding: "22px 20px",
          textAlign: "center",
        }}>
        <Link
          to="/admin/login"
          style={{
            color: "var(--gold-dark, #8f6a43)",
            fontSize: "0.85rem",
            fontWeight: 600,
            textDecoration: "none",
          }}>
          {t("inquiry.backToLogin")} ›
        </Link>
      </footer>
    </div>
  );
}

export default RestaurantInquiryPage;
