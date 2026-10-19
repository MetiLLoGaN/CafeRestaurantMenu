import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

/* Platform overview — shows only what the database actually contains
   (fetched from GET /api/super-admin/stats). No fabricated metrics. */

function StatCard({ icon, label, value, accent, index }) {
  return (
    <div
      className="card-restaurant p-5 animate-fade-up"
      style={{
        animationDelay: `${index * 0.1}s`,
        borderBottom: `3px solid ${accent}`,
      }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)` }}>
          {icon}
        </div>
      </div>
      <p className="font-display text-3xl font-bold" style={{ color: 'var(--espresso)' }}>
        {(Number(value) || 0).toLocaleString()}
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
    </div>
  );
}

function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/super-admin/stats')
      .then(({ data }) => {
        if (!cancelled) setStats(data.stats);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || t('superAdmin.dashboard.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '32px 24px' }} className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="font-display text-2xl md:text-3xl font-bold"
            style={{ color: 'var(--espresso)' }}>
            {t('superAdmin.dashboard.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {t('superAdmin.dashboard.subtitle')}
          </p>
        </div>
        <Link
          to="/super-admin/users/create"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}>
          {t('superAdmin.nav.createUser')}
        </Link>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--danger-pale, #FEE2E2)',
            color: 'var(--danger, #991B1B)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            fontSize: '0.88rem',
          }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon="👥" label={t('superAdmin.dashboard.totalUsers')} value={stats?.totalUsers} accent="#4f6d8a" index={0} />
        <StatCard icon="🏪" label={t('superAdmin.dashboard.totalRestaurants')} value={stats?.totalRestaurants} accent="#6b855e" index={1} />
        <StatCard icon="👑" label={t('superAdmin.dashboard.totalSuperAdmins')} value={stats?.totalSuperAdmins} accent="#a67c52" index={2} />
        <StatCard icon="✅" label={t('superAdmin.dashboard.activeUsers')} value={stats?.activeUsers} accent="#6b855e" index={3} />
        <StatCard icon="🚫" label={t('superAdmin.dashboard.disabledUsers')} value={stats?.disabledUsers} accent="#b3544a" index={4} />
      </div>

      {/* Quick link */}
      <div className="mt-8">
        <Link
          to="/super-admin/users"
          style={{
            color: 'var(--gold-dark, #8f6a43)',
            fontWeight: 600,
            fontSize: '0.92rem',
            textDecoration: 'none',
          }}>
          {t('superAdmin.dashboard.manageUsers')} →
        </Link>
      </div>
    </div>
  );
}

export default SuperAdminDashboardPage;
