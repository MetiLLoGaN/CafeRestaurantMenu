import { useState } from 'react';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import resolveImageUrl from '../utils/resolveImageUrl';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormatPrice } from '../utils/currency';

function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    totalPrice,
    tableNumber,
    ownerId,
    clearCart,
    updateQuantity,
  } = useCart();

  const [customerNote, setCustomerNote]   = useState('');
  const [failedImages, setFailedImages]   = useState({});
  const [loading, setLoading]             = useState(false);
  const [placing, setPlacing]             = useState(false); // overlay animation
  const [error, setError]                 = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();

  const serviceFee   = Math.round(totalPrice * 0.05);
  const grandTotal   = totalPrice + serviceFee;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setError('');
    setLoading(true);

    try {
      const orderItems = items.map((item) => ({
        menuItemId: item._id,
        quantity: item.quantity,
      }));

      await api.post('/orders', {
        tableNumber,
        ownerId,
        items: orderItems,
        customerNote,
      });

      /* Show the "sending to kitchen" overlay before navigating */
      setLoading(false);
      setPlacing(true);
      setTimeout(() => {
        clearCart();
        closeCart();
        navigate(`/order-success?table=${tableNumber}`);
      }, 1800);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || t('cart.orderFailed'));
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="cart-overlay" role="dialog" aria-modal="true" aria-label={t('cart.title')}>

      {/* Backdrop — click to close */}
      <div className="absolute inset-0" onClick={closeCart} />

      {/* Slide-in panel */}
      <div className="cart-panel">

        {/* ── Header ───────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            borderBottom: '1px solid var(--color-divider)',
            borderTop: '4px solid var(--color-primary)',
          }}
        >
          <div>
            <h2
              className="font-display text-xl"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('cart.title')}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
              📍 {t('common.table', { number: tableNumber || '--' })}
            </p>
          </div>
          <button
            onClick={closeCart}
            aria-label={t('cart.closeCart')}
            className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110 focus-gold"
            style={{
              background: 'var(--color-cream-dark)',
              color: 'var(--color-charcoal)',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Items list ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {items.length === 0 && (
            <div className="text-center py-16 animate-fade-up">
              <div className="text-5xl mb-3 animate-float">🛒</div>
              <p className="font-display text-lg" style={{ color: 'var(--color-espresso)' }}>
                {t('cart.emptyTitle')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {t('cart.emptySub')}
              </p>
              <button
                onClick={closeCart}
                className="btn-outline-gold mt-5 text-sm px-5 py-2"
              >
                {t('cart.browseMenu')}
              </button>
            </div>
          )}

          {items.map((item, i) => (
            <div
              key={item._id}
              className="flex items-center gap-3 pb-3 animate-fade-up"
              style={{
                borderBottom: '1px solid var(--color-divider)',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              {/* Thumbnail */}
              {item.image && !failedImages[item._id] ? (
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={() => setFailedImages(prev => ({ ...prev, [item._id]: true }))}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'var(--color-cream-dark)' }}
                >
                  🍽️
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-display text-sm font-semibold truncate"
                  style={{ color: 'var(--color-espresso)' }}
                >
                  {item.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {t('cart.unitPrice', { price: formatPrice(item.price) })}
                </p>
              </div>

              {/* Qty controls + line total */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <p
                  className="font-display text-sm font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {formatPrice(item.price * item.quantity)}
                </p>
                <div
                  className="flex items-center rounded-full"
                  style={{
                    background: 'var(--color-cream-dark)',
                    border: '1.5px solid var(--color-divider)',
                  }}
                >
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    aria-label={t('cart.decreaseQuantity')}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition active:scale-90"
                    style={{ background: item.quantity === 1 ? '#DC2626' : 'var(--color-primary)' }}
                  >
                    {item.quantity === 1 ? '🗑' : '−'}
                  </button>
                  <span
                    className="w-7 text-center text-sm font-bold font-display"
                    style={{ color: 'var(--color-espresso)' }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    aria-label={t('cart.increaseQuantity')}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition active:scale-90"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        {items.length > 0 && (
          <div
            className="flex-shrink-0 px-5 py-4 space-y-3"
            style={{ borderTop: '1px solid var(--color-divider)', background: 'var(--color-cream)' }}
          >
            {/* Special requests */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--color-muted)' }}
              >
                💬 {t('cart.specialRequests')}
              </label>
              <textarea
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder={t('cart.specialPlaceholder')}
                rows={2}
                className="input-bordered text-sm resize-none"
                style={{ fontStyle: 'italic' }}
              />
            </div>

            {/* Price breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--color-muted)' }}>
                <span>{t('cart.subtotal', { count: items.reduce((s, i) => s + i.quantity, 0) })}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between" style={{ color: 'var(--color-muted)' }}>
                <span>{t('cart.service')}</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div
                className="flex justify-between font-display text-lg font-bold pt-2"
                style={{
                  color: 'var(--color-espresso)',
                  borderTop: '1px solid var(--color-divider)',
                }}
              >
                <span>{t('common.total')}</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p
                className="text-xs px-3 py-2 rounded-lg animate-fade-up"
                style={{ background: '#FEE2E2', color: '#991B1B' }}
              >
                {error}
              </p>
            )}

            {/* Place order */}
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 focus-gold"
              style={{ borderRadius: '14px' }}              aria-label={t('cart.placeOrderAria')}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '18px', height: '18px' }} />
                  <span>{t('cart.placingOrder')}</span>
                </>
              ) : (
                <>
                  <span>🍽️</span>
                  <span>{t('cart.placeOrder', { price: formatPrice(grandTotal) })}</span>
                </>
              )}
            </button>

            <p
              className="text-center text-xs"
              style={{ color: 'var(--color-muted)' }}
            >
              🔒 {t('cart.secureNote')}
            </p>
          </div>
        )}
      </div>

      {/* ── "Sending to kitchen" overlay ─────────────────── */}
      {placing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-50 animate-fade-in"
          style={{ background: 'rgba(44,26,14,0.88)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="text-6xl mb-4"
            style={{ animation: 'plateSpin 1.5s ease-out forwards' }}
          >
            🍽️
          </div>
          <p
            className="font-display text-2xl animate-fade-up"
            style={{ color: 'var(--color-gold)', animationDelay: '0.3s' }}
          >
            {t('cart.sendingToKitchen')}
          </p>
          <p
            className="text-sm mt-2 animate-fade-up"
            style={{ color: 'rgba(253,246,236,0.7)', animationDelay: '0.5s' }}
          >
            {t('cart.pleaseWait')}
          </p>
        </div>
      )}
    </div>
  );
}

export default CartDrawer;
