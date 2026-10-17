import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(price);

function MenuItemCard({ item, index = 0 }) {
  const { t } = useTranslation();
  const { addItem, updateQuantity, items: cartItems } = useCart();
  const cartItem = cartItems.find((ci) => ci._id === item._id);
  const quantity = cartItem?.quantity || 0;
  const [adding, setAdding] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const handleAdd = () => {
    if (!item.isAvailable) return;
    setAdding(true);
    addItem(item);
    setTimeout(() => setAdding(false), 600);
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(item._id, quantity + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(item._id, quantity - 1);
  };

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────── */}
      <div
        className="card-restaurant animate-fade-up focus-gold"
        style={{ animationDelay: `${index * 0.07}s` }}
        role="article"
        aria-label={item.name}
      >
        {/* Image */}
        <div
          className="img-zoom-wrap relative"
          style={{ height: '190px', backgroundColor: 'var(--color-cream-dark)' }}
          onClick={() => setShowDetail(true)}
          style={{ cursor: 'pointer', height: '190px', backgroundColor: 'var(--color-cream-dark)' }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl opacity-40">🍽️</span>
            </div>
          )}

          {/* Unavailable overlay */}
          {!item.isAvailable && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(44,26,14,0.65)' }}
            >
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {t('itemCard.currentlyUnavailable')}
              </span>
            </div>
          )}

          {/* Badges — top left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {item.isPopular && (
              <span
                className="badge badge-popular animate-pop-in text-xs px-2.5 py-1"
                style={{ fontFamily: 'var(--font-accent)', fontSize: '13px' }}
              >
                {t('itemCard.popularBadge')}
              </span>
            )}
            {item.isVegetarian && (
              <span className="badge text-xs px-2 py-0.5" style={{ background:'#D1FAE5', color:'#065F46' }}              >
                {t('itemCard.veg')}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Name */}
          <h3
            className="font-display text-lg leading-snug mb-1 cursor-pointer hover:underline"
            style={{ color: 'var(--color-espresso)', textDecorationColor: 'var(--color-gold)' }}
            onClick={() => setShowDetail(true)}
          >
            {item.name}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 text-sm mb-3" style={{ color: 'var(--color-muted)' }}>
            {item.description}
          </p>

          {/* Gold divider */}
          <div className="gold-divider">
            <span className="gold-divider-icon">◆</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            {item.preparationTime && (
              <span className="flex items-center gap-1">
                <span>⏱</span>
                <span>{t('itemCard.minutes', { count: item.preparationTime })}</span>
              </span>
            )}
            {item.isSpicy && <span title={t('itemCard.spicyBadge')}>🌶</span>}
            {item.allergens?.length > 0 && (
              <span title={t('itemCard.containsTitle', { list: item.allergens.join(', ') })} className="cursor-help">
                {t('itemCard.allergens')}
              </span>
            )}
          </div>

          {/* Price + CTA row */}
          <div className="flex items-center justify-between">
            <span
              className="font-display text-lg font-bold"
              style={{ color: 'var(--color-primary)' }}
            >
              {formatPrice(item.price)}
            </span>

            {item.isAvailable && (
              quantity > 0 ? (
                /* Quantity controls */
                <div
                  className="flex items-center gap-2 rounded-full px-1 py-1"
                  style={{ background: 'var(--color-cream-dark)', border: '1.5px solid var(--color-divider)' }}
                >
                  <button
                    onClick={handleDecrement}
                    aria-label={t('itemCard.removeOne')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-transform active:scale-90 focus-gold"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    −
                  </button>
                  <span
                    className="w-6 text-center font-bold font-display text-sm"
                    style={{ color: 'var(--color-espresso)' }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    aria-label={t('itemCard.addOneMore')}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold transition-transform active:scale-90 focus-gold"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    +
                  </button>
                </div>
              ) : (
                /* Add to cart button */
                <button
                  onClick={handleAdd}
                  aria-label={t('itemCard.addToCart', { name: item.name })}
                  className="btn-primary focus-gold text-sm px-4 py-2 flex items-center gap-1.5"
                  style={{
                    borderRadius: '9999px',
                    padding: '0.45rem 1rem',
                    animation: adding ? 'heartbeat 0.6s ease-in-out' : 'none',
                  }}
                >
                  {adding ? (
                    <span className="animate-bounce-in">✓</span>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>+</span>
                      <span>{t('common.add')}</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────── */}
      {showDetail && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetail(false)}
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            {/* Image */}
            {item.image && (
              <div style={{ height: '240px', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {item.isPopular && <span className="badge badge-popular">{t('itemCard.popularBadge')}</span>}
                {item.isVegetarian && (
                  <span className="badge" style={{ background:'#D1FAE5', color:'#065F46' }}>{t('itemCard.vegetarianBadge')}</span>
                )}
                {item.isSpicy && (
                  <span className="badge" style={{ background:'#FEE2E2', color:'#991B1B' }}>{t('itemCard.spicyBadge')}</span>
                )}
              </div>

              <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--color-espresso)' }}>
                {item.name}
              </h2>
              <div className="gold-divider"><span className="gold-divider-icon">◆</span></div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--color-charcoal)' }}>
                {item.description}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                {item.preparationTime && (
                  <span>{t('itemCard.minPrep', { count: item.preparationTime })}</span>
                )}
                {item.allergens?.length > 0 && (
                  <span>{t('itemCard.contains', { list: item.allergens.join(', ') })}</span>
                )}
              </div>

              {/* Price + Add */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
                <span className="font-display text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {formatPrice(item.price)}
                </span>
                {item.isAvailable ? (
                  quantity > 0 ? (
                    <div
                      className="flex items-center gap-3 rounded-full px-2 py-1"
                      style={{ background: 'var(--color-cream-dark)', border: '1.5px solid var(--color-divider)' }}
                    >
                      <button
                        onClick={handleDecrement}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: 'var(--color-primary)' }}
                      >−</button>
                      <span className="font-bold font-display w-5 text-center" style={{ color: 'var(--color-espresso)' }}>
                        {quantity}
                      </span>
                      <button
                        onClick={handleIncrement}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ background: 'var(--color-primary)' }}
                      >+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { handleAdd(); setShowDetail(false); }}
                      className="btn-primary"
                    >
                      {t('itemCard.addToOrder')}
                    </button>
                  )
                ) : (
                  <span className="badge badge-cancelled">{t('itemCard.unavailable')}</span>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => setShowDetail(false)}
                className="mt-4 w-full py-2 text-sm rounded-xl transition"
                style={{
                  background: 'var(--color-cream-dark)',
                  color: 'var(--color-muted)',
                }}
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MenuItemCard;
