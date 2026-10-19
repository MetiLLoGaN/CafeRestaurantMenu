import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/* Layout for the /super-admin area. Deliberately separate from the
   restaurant-admin Sidebar (which shows restaurant branding): the
   super admin is a platform operator, not a restaurant tenant. */

const navItems = [
  { path: '/super-admin', labelKey: 'superAdmin.nav.dashboard', icon: '📊', end: true },
  { path: '/super-admin/users', labelKey: 'superAdmin.nav.users', icon: '👥' },
  { path: '/super-admin/users/create', labelKey: 'superAdmin.nav.createUser', icon: '➕' },
];

function SuperAdminLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.resolvedLanguage === 'fa' ? 'en' : 'fa');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SA';

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--cream)' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="w-full md:w-64 md:min-h-screen flex flex-col"
        style={{ background: 'var(--sidebar-bg)' }}>
        {/* Brand */}
        <div className="px-6 py-6" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'var(--color-gold, #a67c52)' }}>
              👑
            </div>
            <div className="min-w-0">
              <h1
                className="font-display text-base font-bold leading-tight truncate"
                style={{ color: 'var(--color-gold, #a67c52)' }}>
                {t('superAdmin.title')}
              </h1>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-muted)' }}>
                {t('superAdmin.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-5 space-y-1">
          {navItems.map((item, i) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link animate-fade-left stagger-${i + 1} ${isActive ? 'active' : ''}`
              }
              aria-label={t(item.labelKey)}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card + logout + language */}
        <div className="px-4 py-5" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl mb-3"
            style={{ background: 'var(--sidebar-hover-bg)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display flex-shrink-0"
              style={{ background: 'var(--color-gold, #a67c52)', color: '#fff' }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-cream)' }}>
                {user?.name || t('superAdmin.title')}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--sidebar-muted)' }}>
                {user?.email || ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="sidebar-link flex-1 justify-center"
              style={{ color: '#FCA5A5' }}
              aria-label={t('sidebar.logout')}>
              <span style={{ fontSize: '18px' }}>🚪</span>
              <span>{t('sidebar.logout')}</span>
            </button>

            <button
              onClick={toggleLanguage}
              className="sidebar-link flex-1 justify-center"
              aria-label={t('sidebar.changeLanguage')}
              title={t('sidebar.changeLanguage')}>
              <span style={{ fontSize: '18px' }}>🌐</span>
              <span>{i18n.resolvedLanguage === 'fa' ? 'English' : 'فارسی'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export default SuperAdminLayout;
