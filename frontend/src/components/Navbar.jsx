import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';

function Navbar({ children, title }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream)' }}>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label={t('common.openMenu')}
        className="fixed top-4 start-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg md:hidden transition hover:scale-110"
        style={{ background: 'var(--color-primary)' }}
      >
        ☰
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 md:hidden animate-fade-in"
            style={{ background: 'rgba(44,26,14,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed start-0 top-0 z-50 md:hidden animate-slide-in-left h-full">
            <Sidebar />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed start-0 top-0 bottom-0 z-30">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="md:ms-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            className="font-display text-lg ms-12 md:ms-0"
            style={{ color: 'var(--color-espresso)' }}
          >
            {title || ''}
          </h2>

          <div className="flex items-center gap-4">
            {/* Restaurant name */}
            <span
              className="hidden sm:block text-sm font-semibold font-display"
              style={{ color: 'var(--color-charcoal)' }}
            >
              {user?.restaurantName}
            </span>
            <span style={{ color: 'var(--color-divider)' }}>|</span>
            {/* User name */}
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {user?.name}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Navbar;
