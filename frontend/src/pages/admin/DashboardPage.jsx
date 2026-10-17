import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const formatPrice = (p) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency', currency: 'UGX', minimumFractionDigits: 0,
  }).format(p || 0);

/* Animated count-up number */
function CountUp({ target, prefix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    const start  = performance.now();
    const run    = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); /* ease-out cubic */
      setDisplay(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(run);
    };
    frame.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return <>{prefix}{display.toLocaleString()}</>;
}

/* Stat card */
function StatCard({ icon, label, value, prefix = '', accent, index }) {
  const { t } = useTranslation();
  return (
    <div
      className="card-restaurant p-5 animate-fade-up"
      style={{
        animationDelay: `${index * 0.1}s`,
        borderBottom: `3px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${accent}18` }}
        >
          {icon}
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${accent}18`, color: accent }}
        >
          {t('dashboard.today')}
        </span>
      </div>
      <p
        className="font-display text-3xl font-bold animate-count-up"
        style={{ color: 'var(--color-espresso)' }}
      >
        <CountUp target={Number(value) || 0} prefix={prefix} />
      </p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
    </div>
  );
}

/* Status badge */
const STATUS_COLORS = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  preparing: { bg: '#FFEDD5', text: '#9A3412' },
  ready:     { bg: '#DCFCE7', text: '#166534' },
  completed: { bg: '#F3F4F6', text: '#374151' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

/* Sparkline bar chart — orders by hour */
function SparklineChart({ data = [] }) {
  const { t } = useTranslation();
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-1"
          title={t('dashboard.ordersTooltip', { hour: d.hour, count: d.count })}
        >
          <div
            className="w-full rounded-t transition-all duration-700"
            style={{
              height: `${Math.max((d.count / max) * 52, d.count > 0 ? 6 : 2)}px`,
              background:
                d.count > 0
                  ? 'var(--color-primary)'
                  : 'var(--color-cream-deeper)',
              animation: `progressFill 0.8s ease-out ${i * 0.04}s both`,
            }}
          />
          <span
            className="text-xs"
            style={{ color: 'var(--color-muted)', fontSize: '9px' }}
          >
            {d.hour}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Gold divider */
function GoldDivider() {
  return (
    <div className="gold-divider my-4">
      <span className="gold-divider-icon">◆</span>
    </div>
  );
}

function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats]             = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [hourlyData, setHourlyData]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const buildHourlyData = (orders) => {
    const now    = new Date();
    const hours  = [];
    for (let h = 8; h <= 22; h++) {
      const label = h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
      const count = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getDate()  === now.getDate() &&
          d.getHours() === h
        );
      }).length;
      hours.push({ hour: label, count });
    }
    return hours;
  };

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/orders/stats'),
        api.get('/orders'),
      ]);
      setStats(statsRes.data.stats);
      const orders = ordersRes.data.orders || [];
      setRecentOrders(orders.slice(0, 6));
      setHourlyData(buildHourlyData(orders));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner />;

  const statCards = [
    {
      icon: '📋',
      label: t('dashboard.ordersToday'),
      value: stats?.totalOrdersToday || 0,
      accent: 'var(--color-primary)',
    },
    {
      icon: '💰',
      label: t('dashboard.revenueToday'),
      value: stats?.totalRevenueToday || 0,
      prefix: 'UGX ',
      accent: 'var(--color-gold-dark)',
    },
    {
      icon: '🍽️',
      label: t('dashboard.menuItems'),
      value: stats?.menuItemsCount || 0,
      accent: '#2563EB',
    },
    {
      icon: '⏳',
      label: t('dashboard.pendingOrders'),
      value: stats?.pendingOrders || 0,
      accent: '#D97706',
    },
  ];

  return (
    <Navbar title={t('dashboard.title')}>
      {/* ── Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((c, i) => (
          <StatCard key={c.label} {...c} index={i} />
        ))}
      </div>

      {/* ── Two-column layout ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders — 2/3 width */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 animate-fade-up stagger-4"
          style={{
            background: 'var(--color-white)',
            border: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2
              className="font-display text-xl"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('dashboard.recentOrders')}
            </h2>
            <a
              href="/admin/orders"
              className="text-xs font-semibold transition hover:opacity-70"
              style={{ color: 'var(--color-primary)' }}
            >
              {t('dashboard.viewAll')}
            </a>
          </div>
          <GoldDivider />

          {recentOrders.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🛒</div>
              <p style={{ color: 'var(--color-muted)' }}>{t('dashboard.noOrdersToday')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, i) => {
                const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <div
                    key={order._id}
                    className="flex items-center justify-between py-3 animate-fade-up"
                    style={{
                      borderBottom: '1px dashed var(--color-divider)',
                      animationDelay: `${0.4 + i * 0.06}s`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm"
                        style={{ background: 'var(--color-cream-dark)', color: 'var(--color-primary)' }}
                      >
                        {order.tableNumber}
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: 'var(--color-espresso)' }}
                        >
                          {t('common.table', { number: order.tableNumber })}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {t('dashboard.itemCount', { count: order.items?.length || 0 })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="badge text-xs"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {t(`common.statuses.${order.status}`, { defaultValue: order.status })}
                      </span>
                      <span
                        className="font-display text-sm font-bold"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Hourly chart */}
          <div
            className="rounded-2xl p-5 animate-fade-up stagger-5"
            style={{
              background: 'var(--color-white)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              className="font-display text-base mb-1"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('dashboard.ordersByHour')}
            </h3>
            <GoldDivider />
            <SparklineChart data={hourlyData} />
          </div>

          {/* Quick stats */}
          <div
            className="rounded-2xl p-5 animate-fade-up stagger-6"
            style={{
              background: 'var(--color-white)',
              border: '1px solid var(--color-divider)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3
              className="font-display text-base mb-1"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('dashboard.quickStats')}
            </h3>
            <GoldDivider />
            <div className="space-y-3 text-sm">
              {[
                { label: t('dashboard.avgOrderValue'), value: formatPrice((stats?.totalRevenueToday || 0) / Math.max(stats?.totalOrdersToday || 1, 1)) },
                { label: t('dashboard.completedToday'), value: stats?.completedOrders || 0 },
                { label: t('dashboard.cancelledToday'), value: stats?.cancelledOrders || 0 },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center">
                  <span style={{ color: 'var(--color-muted)' }}>{r.label}</span>
                  <span className="font-display font-bold" style={{ color: 'var(--color-espresso)' }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last refresh */}
          <p
            className="text-xs text-center animate-fade-in"
            style={{ color: 'var(--color-muted)' }}
          >
            {t('dashboard.lastUpdated', { time: lastRefresh.toLocaleTimeString() })}
          </p>
        </div>
      </div>
    </Navbar>
  );
}

export default DashboardPage;
