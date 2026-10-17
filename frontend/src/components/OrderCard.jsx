import { useState } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(price);

const getTimeAgo = (date, t) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return t('common.timeAgo.seconds', { count: secs });
  if (secs < 3600) return t('common.timeAgo.minutes', { count: Math.floor(secs / 60) });
  return t('common.timeAgo.hours', { count: Math.floor(secs / 3600) });
};

const STATUS_META = {
  pending:   { class: 'badge-pending',   next: 'confirmed',  action: 'confirmOrder',    emoji: '⏳' },
  confirmed: { class: 'badge-confirmed', next: 'preparing',  action: 'startPreparing',  emoji: '✅' },
  preparing: { class: 'badge-preparing', next: 'ready',      action: 'markReady',       emoji: '👨‍🍳' },
  ready:     { class: 'badge-ready',     next: 'completed',  action: 'markCompleted',   emoji: '🔔' },
  completed: { class: 'badge-completed', next: null,         action: null,              emoji: '✓' },
  cancelled: { class: 'badge-cancelled', next: null,         action: null,              emoji: '✕' },
};

function OrderCard({ order, onUpdate }) {
  const { t } = useTranslation();
  const [status, setStatus]     = useState(order.status);
  const [updating, setUpdating] = useState(false);

  const meta = STATUS_META[status] || STATUS_META.pending;

  const handleAdvance = async () => {
    if (!meta.next) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: meta.next });
      setStatus(meta.next);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (status === 'completed' || status === 'cancelled') return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${order._id}/status`, { status: 'cancelled' });
      setStatus('cancelled');
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="card-restaurant p-4 animate-fade-up"
      style={{ border: '1px solid var(--color-divider)' }}
    >
      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="font-display text-xl font-bold"
            style={{ color: 'var(--color-espresso)' }}
          >
            {t('common.table', { number: order.tableNumber })}
          </span>
          <span className={`badge ${meta.class}`}>
            {meta.emoji} {t(`common.statuses.${status}`)}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
          {getTimeAgo(order.createdAt, t)}
        </span>
      </div>

      {/* ── Items list ─────────────────────────────────── */}
      <div
        className="space-y-1.5 mb-3 pb-3"
        style={{ borderBottom: '1px dashed var(--color-divider)' }}
      >
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span style={{ color: 'var(--color-charcoal)' }}>
              <span
                className="font-bold mr-1.5 font-display"
                style={{ color: 'var(--color-primary)' }}
              >
                {item.quantity}×
              </span>
              {item.name}
            </span>
            <span style={{ color: 'var(--color-muted)' }}>
              {formatPrice(item.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* ── Customer note ──────────────────────────────── */}
      {order.customerNote && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-xl mb-3 text-sm"
          style={{ background: 'var(--color-cream-dark)' }}
        >
          <span>💬</span>
          <p style={{ color: 'var(--color-charcoal)', fontStyle: 'italic' }}>
            {order.customerNote}
          </p>
        </div>
      )}

      {/* ── Total ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('common.total')}</span>
        <span
          className="font-display text-lg font-bold"
          style={{ color: 'var(--color-primary)' }}
        >
          {formatPrice(order.totalAmount)}
        </span>
      </div>

      {/* ── Action buttons ─────────────────────────────── */}
      {status !== 'completed' && status !== 'cancelled' && (
        <div className="flex gap-2">
          {meta.next && (
            <button
              onClick={handleAdvance}
              disabled={updating}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5 focus-gold"
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-gold-light)',
                fontFamily: 'var(--font-display)',
              }}
            >
              {updating ? (
                <span className="spinner" style={{ width: '14px', height: '14px', borderColor: 'var(--color-gold-light)', borderTopColor: 'transparent' }} />
              ) : (
                <>
                  <span>{STATUS_META[meta.next]?.emoji}</span>
                  <span>{t(`orderCard.${meta.action}`)}</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleCancel}
            disabled={updating}
            aria-label={t('orderCard.cancelOrder')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition hover:scale-105 focus-gold flex-shrink-0"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Completed / cancelled state */}
      {(status === 'completed' || status === 'cancelled') && (
        <div
          className="text-center py-1.5 rounded-xl text-sm"
          style={{
            background: status === 'completed' ? '#DCFCE7' : '#FEE2E2',
            color:      status === 'completed' ? '#166534' : '#991B1B',
          }}
        >
          {status === 'completed' ? t('orderCard.orderCompleted') : t('orderCard.orderCancelled')}
        </div>
      )}
    </div>
  );
}

export default OrderCard;
