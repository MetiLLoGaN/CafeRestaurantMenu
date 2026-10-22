import { useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import resolveImageUrl from '../utils/resolveImageUrl';
import { useFormatPrice } from '../utils/currency';
import { UtensilsIcon, ClockIcon, FlameIcon } from './icons';

/* ══════════════════════════════════════════════════════════════════
   MENU ITEM CARD — compact horizontal (row) layout.

   Image sits on the inline-start edge and the info column flows next
   to it, so the card mirrors automatically in RTL. Long names and
   descriptions are clamped, the info column is min-w-0, and the price
   / add-to-cart row is pinned to the bottom — the card never grows
   sideways, overlaps neighbours or breaks the grid.
══════════════════════════════════════════════════════════════════ */
function MenuItemCard({ item, index = 0 }) {
  const { t, i18n } = useTranslation();
  const formatPrice = useFormatPrice();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('fa')
    ? 'fa'
    : 'en';

  /* Admin-defined attribute badge — label in the active language with
     a fallback to the other one, optional color, default otherwise. */
  const attributeLabel = (attribute) => {
    const entry = attribute && attribute.name;
    if (!entry) return '';
    return entry[lang] || entry[lang === 'fa' ? 'en' : 'fa'] || '';
  };
  const attributeStyle = (attribute) =>
    attribute.color
      ? { background: attribute.color, color: '#ffffff' }
      : { background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' };

  const { addItem, updateQuantity, items: cartItems } = useCart();
  const cartItem = cartItems.find((ci) => ci._id === item._id);
  const quantity = cartItem?.quantity || 0;
  const [showDetail, setShowDetail] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  /* Transient "+1" confirmation. Adding an item replaces the add button
     with the quantity stepper in the same render, so the feedback has to
     live next to the stepper (and be announced to screen readers). */
  const [addedAt, setAddedAt] = useState(0);
  const addedTimer = useRef(null);

  const flashAdded = () => {
    setAddedAt(Date.now());
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedAt(0), 900);
  };

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const handleAdd = () => {
    if (!item.isAvailable) return;
    addItem(item);
    flashAdded();
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    updateQuantity(item._id, quantity + 1);
    flashAdded();
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    updateQuantity(item._id, quantity - 1);
  };

  const hasMeta =
    Boolean(item.preparationTime) ||
    Boolean(item.isSpicy) ||
    (item.allergens && item.allergens.length > 0);

  return (
    <>
      {/* ── Card (horizontal row) ──────────────────────────── */}
      <div
        className="card-restaurant animate-fade-up flex items-stretch"
        style={{ animationDelay: `${index * 0.07}s` }}
        role="article"
        aria-label={item.name}
      >
        {/* Image — inline-start column */}
        <div
          className="relative flex-shrink-0 cursor-pointer"
          style={{ width: '108px', background: 'var(--color-cream-dark)' }}
          onClick={() => setShowDetail(true)}
        >
          {item.image && !imgFailed ? (
            <img
              src={resolveImageUrl(item.image)}
              alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ color: 'var(--color-muted)' }}
            >
              <UtensilsIcon size={26} />
            </div>
          )}

          {/* Unavailable overlay */}
          {!item.isAvailable && (
            <div
              className="absolute inset-0 flex items-center justify-center px-1"
              style={{ background: 'rgba(44,26,14,0.65)' }}
            >
              <span
                className="text-2xs font-semibold px-2 py-0.5 rounded-full text-center leading-tight"
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

          {/* Badges — top inline-start */}
          {(item.isPopular || item.isVegetarian) && (
            <div className="absolute top-1.5 start-1.5 flex flex-col gap-1 items-start">
              {item.isPopular && (
                <span
                  className="badge badge-popular animate-pop-in"
                  style={{ fontSize: '10px', padding: '2px 7px' }}
                >
                  {t('itemCard.popularBadge')}
                </span>
              )}
              {item.isVegetarian && (
                <span
                  className="badge badge-veg"
                  style={{ fontSize: '10px', padding: '2px 7px' }}
                >
                  {t('itemCard.veg')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0 p-3 flex flex-col">
          {/* Name */}
          <h3
            className="font-display text-sm sm:text-base font-semibold leading-snug cursor-pointer hover:underline clamp-1"
            style={{ color: 'var(--color-espresso)', textDecorationColor: 'var(--color-gold)' }}
            onClick={() => setShowDetail(true)}
          >
            {item.name}
          </h3>

          {/* Description */}
          <p
            className="text-xs mt-0.5 clamp-2 leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {item.description}
          </p>

          {/* Admin-defined attribute badges */}
          {Array.isArray(item.attributes) && item.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.attributes.map((attribute, aIdx) => (
                <span
                  key={attribute._id || `${attributeLabel(attribute)}-${aIdx}`}
                  className="text-2xs font-semibold px-2 py-0.5 rounded-full"
                  style={attributeStyle(attribute)}
                >
                  {attributeLabel(attribute)}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          {hasMeta && (
            <div
              className="flex items-center gap-2.5 mt-1.5 text-2xs"
              style={{ color: 'var(--color-muted)' }}
            >
              {item.preparationTime && (
                <span className="flex items-center gap-1 flex-shrink-0">
                  <ClockIcon size={12} />
                  <span>{t('itemCard.minutes', { count: item.preparationTime })}</span>
                </span>
              )}
              {item.isSpicy && (
                <span
                  title={t('itemCard.spicyBadge')}
                  className="flex items-center flex-shrink-0"
                  style={{ color: 'var(--danger)' }}
                >
                  <FlameIcon size={13} />
                </span>
              )}
              {item.allergens && item.allergens.length > 0 && (
                <span
                  title={t('itemCard.containsTitle', { list: item.allergens.join(', ') })}
                  className="cursor-help truncate"
                >
                  {t('itemCard.allergens')}
                </span>
              )}
            </div>
          )}

          {/* Price + action — pinned to the bottom of the row */}
          <div className="relative flex items-center justify-between gap-2 mt-auto pt-2">
            <span
              className="font-display text-sm sm:text-base font-bold truncate"
              style={{ color: 'var(--color-primary)' }}
            >
              {formatPrice(item.price)}
            </span>

            {/* Visible add confirmation, keyed so repeat taps re-animate */}
            {addedAt > 0 && (
              <span
                key={addedAt}
                aria-hidden="true"
                className="pointer-events-none absolute -top-1 end-0 font-display text-xs font-bold animate-fade-up"
                style={{ color: 'var(--success)' }}
              >
                +1
              </span>
            )}

            {/* Screen-reader announcement for the same action */}
            <span className="sr-only" role="status" aria-live="polite">
              {addedAt > 0 ? t('itemCard.addedToCart', { name: item.name }) : ''}
            </span>

            {item.isAvailable &&
              (quantity > 0 ? (
                /* Quantity stepper */
                <div
                  className="flex items-center rounded-full flex-shrink-0 animate-pop-in"
                  style={{
                    background: 'var(--color-cream-dark)',
                    border: '1.5px solid var(--color-divider)',
                  }}
                >
                  <button
                    onClick={handleDecrement}
                    aria-label={t('itemCard.removeOne')}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-transform active:scale-90 focus-gold"
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
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold transition-transform active:scale-90 focus-gold"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    +
                  </button>
                </div>
              ) : (
                /* Add to cart — compact pill */
                <button
                  onClick={handleAdd}
                  aria-label={t('itemCard.addToCart', { name: item.name })}
                  className="btn-primary focus-gold rounded-full flex items-center gap-1 flex-shrink-0"
                  style={{
                    padding: '0 0.9rem',
                    height: '36px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
                  <span>{t('common.add')}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────── */}
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
            {item.image && !imgFailed && (
              <div style={{ height: '240px', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              </div>
            )}

            <div className="p-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {item.isPopular && <span className="badge badge-popular">{t('itemCard.popularBadge')}</span>}
                {item.isVegetarian && (
                  <span className="badge badge-veg">{t('itemCard.vegetarianBadge')}</span>
                )}
                {item.isSpicy && (
                  <span className="badge badge-spicy">{t('itemCard.spicyBadge')}</span>
                )}
                {Array.isArray(item.attributes) &&
                  item.attributes.map((attribute, aIdx) => (
                    <span
                      key={attribute._id || `${attributeLabel(attribute)}-${aIdx}`}
                      className="text-2xs font-semibold px-2 py-1 rounded-full"
                      style={attributeStyle(attribute)}
                    >
                      {attributeLabel(attribute)}
                    </span>
                  ))}
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
                {item.allergens && item.allergens.length > 0 && (
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
                      className="btn-primary rounded-full"
                      style={{ height: '38px', padding: '0 1.1rem', fontSize: '13px', fontWeight: 600 }}
                    >
                      + {t('itemCard.addToOrder')}
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
