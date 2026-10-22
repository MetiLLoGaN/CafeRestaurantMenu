import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import Navbar from '../../components/Navbar';
import { useTranslation } from 'react-i18next';
import { useFormatPrice } from '../../utils/currency';

/* Web Audio chime — no audio file needed */
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [1100, 0.18]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.22, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.55);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.6);
    });
  } catch (_) { /* AudioContext blocked — silent fail */ }
}

/* Notification Toast */
function Notification({ message, onClose, tableNumber }) {
  const { t } = useTranslation();
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-full shadow-lg flex items-center justify-between gap-4 animate-slide-up"
      style={{
        background: '#2C2C2C',
        color: 'var(--color-white)',
        maxWidth: '90%',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#EA4A0A' }}
        >
          <span className="text-lg">📍</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{message}</p>
          <p className="text-xs opacity-80">{t('orders.tableWaiting', { number: tableNumber })}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-lg opacity-60 hover:opacity-100 transition flex-shrink-0"
        aria-label={t('orders.dismiss')}
      >
        ›
      </button>
    </div>
  );
}

/* Individual Order Card */
function OrderCard({ order, onUpdate, kitchenOnline }) {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const [actionLoading, setActionLoading] = useState(false);

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { color: '#FCD34D', textColor: '#78350F' },
      preparing: { color: '#FED7AA', textColor: '#78350F' },
      ready: { color: '#86EFAC', textColor: '#166534' },
      completed: { color: '#D1D5DB', textColor: '#374151' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('orders.justNow');
    return t('common.timeAgo.minutes', { count: diffMins });
  };

  const handleConfirmOrder = async () => {
    if (order.status !== 'pending') return;
    setActionLoading(true);
    try {
      await api.patch(`/orders/${order._id}`, { status: 'preparing' });
      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (order.status !== 'preparing') return;
    setActionLoading(true);
    try {
      await api.patch(`/orders/${order._id}`, { status: 'ready' });
      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const isPending = order.status === 'pending';
  const isPreparing = order.status === 'preparing';

  return (
    <div
      className="rounded-3xl p-6 shadow-md transition-all"
      style={{ background: 'var(--color-white)', border: '1px solid #E8D5B7' }}
    >
      {/* Header: Table + Order ID + Status */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>
            {t('orders.tableLabel', { number: order.tableNumber })}
          </p>
          <h3 className="text-2xl font-black" style={{ color: 'var(--color-espresso)' }}>
            #{order._id.slice(-4).toUpperCase()}
          </h3>
        </div>
        <div
          className="px-4 py-2 rounded-full text-xs font-bold uppercase"
          style={{ background: statusInfo.color, color: statusInfo.textColor }}
        >
          {t(`common.statuses.${order.status}`, { defaultValue: order.status })}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2 mb-5 pb-5 border-b" style={{ borderColor: 'var(--color-divider)' }}>
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">
              {item.category === 'Drinks' ? '🥤' : '🍽️'}
            </span>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: 'var(--color-espresso)' }}>
                {item.name} x{item.quantity}
              </p>
              {item.specialInstructions && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                  {t('orders.note', { text: item.specialInstructions })}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Time + Total */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5" style={{ color: '#EA4A0A' }}>
          <span className="text-sm">⏱️</span>
          <span className="text-sm font-semibold">{getTimeAgo(order.createdAt)}</span>
        </div>
        <div>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('common.total')}</p>
          <p className="text-lg font-black" style={{ color: '#EA4A0A' }}>
            {formatPrice(order.totalAmount ?? order.totalPrice)}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      {isPending && (
        <button
          onClick={handleConfirmOrder}
          disabled={actionLoading}
          className="w-full py-3.5 rounded-2xl font-bold uppercase text-sm transition-all"
          style={{
            background: '#EA4A0A',
            color: 'var(--color-white)',
            opacity: actionLoading ? 0.7 : 1,
            cursor: actionLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {actionLoading ? t('orders.processing') : t('orders.confirmOrder')}
        </button>
      )}

      {isPreparing && (
        <button
          onClick={handleMarkReady}
          disabled={actionLoading}
          className="w-full py-3.5 rounded-2xl font-bold uppercase text-sm transition-all"
          style={{
            background: '#D1D5DB',
            color: '#374151',
            opacity: actionLoading ? 0.7 : 1,
            cursor: actionLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {actionLoading ? t('orders.processing') : t('orders.markReady')}
        </button>
      )}

      {order.status === 'ready' && (
        <div
          className="w-full py-3.5 rounded-2xl font-bold uppercase text-sm text-center"
          style={{ background: '#86EFAC', color: '#166534' }}
        >
          {t('orders.readyForPickup')}
        </div>
      )}
    </div>
  );
}

function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [notification, setNotification] = useState(null);
  const prevOrderIds                  = useRef(new Set());
  const [kitchenOnline, setKitchenOnline] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders');
      const newOrders     = data.orders || [];
      
      /* Sort orders: pending first, then preparing, then others */
      const sorted = newOrders.sort((a, b) => {
        const statusOrder = { pending: 0, preparing: 1, ready: 2, completed: 3, cancelled: 4 };
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
      });

      /* Detect brand-new order IDs */
      const newIds = sorted.map((o) => o._id);
      const isNew  = newIds.some((id) => !prevOrderIds.current.has(id));

      if (isNew && prevOrderIds.current.size > 0) {
        playChime();
        const newest = sorted.find((o) => !prevOrderIds.current.has(o._id));
        if (newest) {
          setNotification({
            message: t('orders.newOrder'),
            tableNumber: newest.tableNumber
          });
        }
      }

      prevOrderIds.current = new Set(newIds);
      setOrders(sorted);
    } catch (err) {
      console.error('Orders fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading) return <LoadingSpinner />;

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const activeOrders = [...pendingOrders, ...preparingOrders];

  return (
    <Navbar title={t('orders.title')}>
    <div
      className="min-h-screen pb-24 md:pb-8"
      style={{ background: 'var(--color-cream)' }}
    >
      {/* Page header (restaurant name, user, mobile hamburger) is the
          shared admin Navbar — same as every other admin page. */}

      {/* Main Content */}
      <div className="px-4 py-6 max-w-4xl mx-auto">

        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-4xl font-black mb-2" style={{ color: 'var(--color-espresso)' }}>
            {t('orders.title')}
          </h2>
          <p className="text-base" style={{ color: 'var(--color-muted)' }}>
            {t('orders.subtitle')}
          </p>
        </div>

        {/* Kitchen Status */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-full" 
          style={{ background: '#C6F6D5' }}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#22C55E' }}></span>
          <span className="font-semibold text-sm" style={{ color: '#166534' }}>{t('orders.kitchenOnline')}</span>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {activeOrders.length === 0 ? (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ background: 'var(--color-white)', border: '2px dashed #E8D5B7' }}
            >
              <p className="text-4xl mb-3">😌</p>
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--color-espresso)' }}>
                {t('orders.noActive')}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {t('orders.waiting')}
              </p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onUpdate={fetchOrders}
                kitchenOnline={kitchenOnline}
              />
            ))
          )}

          {/* Completed and Ready Orders - Collapsible */}
          {(orders.filter(o => o.status === 'ready' || o.status === 'completed').length > 0) && (
            <details className="mt-8">
              <summary
                className="cursor-pointer font-semibold py-3 px-4 rounded-lg inline-block"
                style={{ background: '#FEF3C7', color: '#78350F' }}
              >
                {t('orders.completed', { count: orders.filter(o => o.status === 'ready' || o.status === 'completed').length })}
              </summary>
              <div className="space-y-4 mt-4">
                {orders
                  .filter(o => o.status === 'ready' || o.status === 'completed')
                  .map((order) => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      onUpdate={fetchOrders}
                      kitchenOnline={kitchenOnline}
                    />
                  ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <Notification
          message={notification.message}
          tableNumber={notification.tableNumber}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav
        className="fixed bottom-0 inset-x-0 md:hidden z-40 grid grid-cols-4 gap-1 p-2"
        style={{ background: 'var(--color-white)', borderTop: '1px solid #E8D5B7' }}
      >
        <button className="py-3 px-2 flex flex-col items-center gap-2 rounded-xl transition"
          style={{ background: '#EA4A0A', color: 'var(--color-white)' }}>
          <span className="text-xl">🍴</span>
          <span className="text-xs font-semibold">{t('orders.nav.menu')}</span>
        </button>
        <button className="py-3 px-2 flex flex-col items-center gap-2 rounded-xl transition hover:bg-gray-100">
          <span className="text-xl">📋</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-espresso)' }}>{t('orders.nav.order')}</span>
        </button>
        <button className="py-3 px-2 flex flex-col items-center gap-2 rounded-xl transition hover:bg-gray-100">
          <span className="text-xl">☎️</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-espresso)' }}>{t('orders.nav.call')}</span>
        </button>
        <button className="py-3 px-2 flex flex-col items-center gap-2 rounded-xl transition hover:bg-gray-100">
          <span className="text-xl">💰</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--color-espresso)' }}>{t('orders.nav.bill')}</span>
        </button>
      </nav>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
    </Navbar>
  );
}


export default OrdersPage;
