import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { useTranslation } from "react-i18next";
import resolveImageUrl from "../utils/resolveImageUrl";

const navItems = [
  { path: "/admin/dashboard", labelKey: "sidebar.dashboard", icon: "📊" },
  { path: "/admin/menu", labelKey: "sidebar.menuItems", icon: "🍽️" },
  { path: "/admin/categories", labelKey: "sidebar.categories", icon: "📂",
    /* Attributes are managed inside the Categories page (tab), but the
       legacy /admin/attributes deep link must still light this entry up */
    match: ["/admin/attributes"] },
  { path: "/admin/orders", labelKey: "sidebar.liveOrders", icon: "🛒" },
  { path: "/admin/tables", labelKey: "sidebar.tablesQr", icon: "🪑" },
  { path: "/admin/theme", labelKey: "sidebar.theme", icon: "🎨" },
  { path: "/admin/content", labelKey: "sidebar.content", icon: "📝" },
];

function Sidebar() {
  const { logout, user } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const [logoFailed, setLogoFailed] = useState(false);

  /* Reset the fallback flag whenever a new logo arrives */
  useEffect(() => {
    setLogoFailed(false);
  }, [branding?.logo]);

  const customLogo = branding?.logo && !logoFailed
    ? resolveImageUrl(branding.logo)
    : null;

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  /* Initials avatar */
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "R";

  const toggleLanguage = () => {
    const nextLanguage = i18n.resolvedLanguage === "fa" ? "en" : "fa";
    i18n.changeLanguage(nextLanguage);
  };

  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{ background: "var(--sidebar-bg)" }}>
      {/* ── Brand ──────────────────────────────────────────── */}
      <div
        className="px-6 py-7"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        {/* Logo mark — the restaurant's own logo, or the default brand mark */}
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl overflow-hidden flex-shrink-0 animate-gold-glow"
            style={{ background: "var(--color-primary)" }}>
            {customLogo ? (
              <img
                src={customLogo}
                alt={user?.restaurantName || t("sidebar.brandFallback")}
                className="w-full h-full object-contain p-0.5"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span>🍽️</span>
            )}
          </div>
          <div>
            <h1
              className="font-display text-base font-bold leading-tight"
              style={{ color: "var(--color-gold)" }}>
              {user?.restaurantName || t("sidebar.brandFallback")}
            </h1>
            <p className="text-xs" style={{ color: "var(--sidebar-muted)" }}>
              {t("sidebar.adminPanel")}
            </p>
          </div>
        </div>

        {/* Gold divider */}
        <div
          className="mt-4 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, var(--color-gold), transparent)",
            opacity: 0.35,
          }}
        />
      </div>

      {/* ── Nav links ─────────────────────────────────────── */}
      <nav className="flex-1 px-4 py-5 space-y-1">
        {navItems.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => {
              const active = isActive || (item.match || []).includes(pathname);
              return `sidebar-link animate-fade-left stagger-${i + 1} ${active ? "active" : ""}`;
            }}
            aria-label={t(item.labelKey)}>
            <span style={{ fontSize: "18px", flexShrink: 0 }}>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── User card + logout ─────────────────────────────── */}      <div className="px-4 py-5"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        {/* User info */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-3"
          style={{ background: "var(--sidebar-hover-bg)" }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display flex-shrink-0"
            style={{
              background: "var(--color-primary)",
              color: "var(--color-gold-light)",
            }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--color-cream)" }}>
              {user?.name || t("sidebar.ownerFallback")}
            </p>            <p className="text-xs truncate"
              style={{ color: "var(--sidebar-muted)" }}>
              {user?.email || ""}
            </p>
          </div>
        </div>

        {/* Logout + Language */}
        <div className="flex gap-2">
          <button
            onClick={handleLogout}
            className="sidebar-link flex-1 justify-center"
            style={{ color: "#FCA5A5" }}
            aria-label={t("sidebar.logout")}>
            <span style={{ fontSize: "18px" }}>🚪</span>
            <span>{t("sidebar.logout")}</span>
          </button>

          <button
            onClick={toggleLanguage}
            className="sidebar-link flex-1 justify-center"
            aria-label={t("sidebar.changeLanguage")}
            title={t("sidebar.changeLanguage")}>
            <span style={{ fontSize: "18px" }}>🌐</span>
            <span>{i18n.resolvedLanguage === "fa" ? "English" : "فارسی"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
