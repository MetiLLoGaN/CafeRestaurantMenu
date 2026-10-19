import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useBranding } from '../../context/BrandingContext';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import MenuItemCard from '../../components/MenuItemCard';
import CategoryTabs from '../../components/CategoryTabs';
import CartDrawer from '../../components/CartDrawer';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  SearchIcon,
  XIcon,
  CartIcon,
  UtensilsIcon,
  ArmchairIcon,
  AlertIcon,
} from '../../components/icons';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useFormatPrice } from '../../utils/currency';

/* ── Skeleton card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--color-divider)', background: 'var(--color-white)' }}
    >
      <div className="skeleton" style={{ height: '190px' }} />
      <div className="p-4 space-y-2">
        <div className="skeleton" style={{ height: '18px', width: '70%' }} />
        <div className="skeleton" style={{ height: '13px', width: '90%' }} />
        <div className="skeleton" style={{ height: '13px', width: '55%' }} />
        <div className="skeleton mt-3" style={{ height: '36px' }} />
      </div>
    </div>
  );
}

/* ── Gold divider ──────────────────────────────────────────────── */
function GoldDivider() {
  return (
    <div className="gold-divider">
      <span className="gold-divider-icon">◆</span>
    </div>
  );
}

/* ── Featured carousel ─────────────────────────────────────────── */
function FeaturedCarousel({ items }) {
  const { t } = useTranslation();
  const formatPrice = useFormatPrice();
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const { addItem, items: cartItems, updateQuantity } = useCart();

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 4000);
  };

  useEffect(() => {
    if (items.length > 1) startTimer();
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) return null;

  const item     = items[current];
  const cartItem = cartItems.find((ci) => ci._id === item._id);
  const qty      = cartItem?.quantity || 0;

  const goTo = (idx) => {
    setCurrent(idx);
    startTimer();
  };

  return (
    <div className="mt-4">
      {/* Slide */}
      <div
        key={current}
        className="rounded-2xl overflow-hidden relative animate-fade-in"
        style={{
          height: '220px',
          background: 'linear-gradient(135deg, var(--color-espresso), var(--color-primary))',
        }}
      >
        {/* Background image */}
        {item.image && (
          <img
            src={resolveImageUrl(item.image)}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.35 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          {/* Popular badge */}
          <span
            className="badge badge-popular self-start mb-2"
            style={{ fontFamily: 'var(--font-accent)', fontSize: '13px' }}
          >
            {t('menu.chefsPick')}
          </span>

          <h3
            className="font-display text-xl font-bold leading-tight mb-1"
            style={{ color: 'var(--color-white)' }}
          >
            {item.name}
          </h3>

          <p
            className="text-xs line-clamp-2 mb-3"
            style={{ color: 'var(--color-cream)', opacity: 0.8 }}
          >
            {item.description}
          </p>

          {/* Price + CTA */}
          <div className="flex items-center justify-between">
            <span
              className="font-display text-lg font-bold"
              style={{ color: 'var(--color-gold)' }}
            >
              {formatPrice(item.price)}
            </span>

            {qty > 0 ? (
              <div
                className="flex items-center gap-2 rounded-full px-1 py-1"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
              >
                <button
                  onClick={() => updateQuantity(item._id, qty - 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >−</button>
                <span className="text-white font-bold font-display w-5 text-center">{qty}</span>
                <button
                  onClick={() => updateQuantity(item._id, qty + 1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'var(--color-primary)' }}
                >+</button>
              </div>
            ) : (
              <button
                onClick={() => addItem(item)}
                className="btn-gold text-sm px-4 py-2 flex items-center gap-1.5"
                style={{ borderRadius: '9999px', padding: '0.4rem 1.1rem' }}
              >
                <span>+</span>
                <span>{t('common.add')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Slide counter */}
        {items.length > 1 && (
          <div
            className="absolute top-3 end-3 text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.8)' }}
          >
            {current + 1} / {items.length}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={t('menu.goToSlide', { number: i + 1 })}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === current ? '20px' : '8px',
                height: '8px',
                background: i === current ? 'var(--color-primary)' : 'var(--color-divider)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MENU PAGE
══════════════════════════════════════════════════════════════════ */
function MenuPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const { t } = useTranslation();
  const { setTableNumber, setOwnerId, totalItems, openCart } = useCart();
  const { previewBranding, restoreBranding } = useBranding();

  const [menu, setMenu]               = useState([]);
  const [categories, setCategories]   = useState([]);
  const [restaurantName, setRestaurantName] = useState(t('common.digitalMenu'));
  const [restaurantLogo, setRestaurantLogo] = useState('');
  const [restaurantBranding, setRestaurantBranding] = useState(null);
  const [heroLogoFailed, setHeroLogoFailed] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [showSearch, setShowSearch]   = useState(false);
  const [dietaryFilters, setDietaryFilters] = useState([]);
  const searchInputRef = useRef(null);

  const ownerId     = searchParams.get('owner');
  const tableNumber = searchParams.get('table');

  /* ── Fetch menu ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!ownerId) {
      setError(t('menu.invalidQr'));
      setLoading(false);
      return;
    }

    setTableNumber(tableNumber);
    setOwnerId(ownerId);

    const fetchMenu = async () => {
      try {
        const { data } = await api.get(`/menu/public?ownerId=${ownerId}`);
        const menuData = data.menu || data.categories || [];
        setMenu(menuData);
        setRestaurantName(data.restaurantName || t('common.digitalMenu'));

        /* Apply this restaurant's persisted branding (logo + palette) to
           the page. Saved theme stays untouched — restoring happens on
           unmount / error via restoreBranding(). */
        setRestaurantLogo(data.branding?.logo || '');
        setHeroLogoFailed(false);
        setRestaurantBranding(data.branding || null);
        previewBranding(data.branding || null);

        /* Build unique category list */
        const seen = new Set();
        const cats = [];
        menuData.forEach((group) => {
          const key = group.category || group.name;
          if (key && !seen.has(key)) {
            seen.add(key);
            cats.push({ _id: group._id || key, name: key });
          }
        });
        setCategories(cats);
      } catch (err) {
        setError(t('menu.loadError'));
        setRestaurantBranding(null);
        restoreBranding();
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();

    /* Leaving the menu (or switching restaurants) restores whatever
       theme this browser session would otherwise show. */
    return () => restoreBranding();
  }, [ownerId, tableNumber, setTableNumber, setOwnerId]);

  /* ── Auto-focus search ─────────────────────────────────────── */
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  /* ── Featured items ─────────────────────────────────────────── */
  const featuredItems = useMemo(() => {
    const all = menu.flatMap((g) => g.items || []);
    return all.filter((i) => i.isPopular).slice(0, 5);
  }, [menu]);

  /* ── Filtered items ─────────────────────────────────────────── */
  const filteredGroups = useMemo(() => {
    let groups = activeCategory
      ? menu.filter((g) => (g.category || g.name) === activeCategory)
      : menu;

    return groups
      .map((group) => ({
        ...group,
        items: (group.items || []).filter((item) => {
          const term = searchTerm.toLowerCase();
          const matchSearch =
            !searchTerm ||
            item.name.toLowerCase().includes(term) ||
            (item.description || '').toLowerCase().includes(term);

          const matchDiet =
            dietaryFilters.length === 0 ||
            (dietaryFilters.includes('vegetarian') && item.isVegetarian) ||
            (dietaryFilters.includes('spicy')      && item.isSpicy) ||
            (dietaryFilters.includes('popular')    && item.isPopular) ||
            (dietaryFilters.includes('quick')      && item.preparationTime < 10);

          return matchSearch && matchDiet;
        }),
      }))
      .filter((g) => g.items.length > 0);
  }, [menu, activeCategory, searchTerm, dietaryFilters]);

  const toggleDiet = (f) =>
    setDietaryFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  /* ── Loading ─────────────────────────────────────────────────── */
  if (loading) return <LoadingSpinner fullScreen label={t('menu.settingTable')} />;

  /* ── Error ───────────────────────────────────────────────────── */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--color-cream)' }}
      >
        <div className="text-center animate-fade-up max-w-sm">
          <div className="flex justify-center mb-4" style={{ color: 'var(--color-muted)' }}>
            <AlertIcon size={44} />
          </div>
          <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--color-espresso)' }}>
            {t('common.oops')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--color-cream)' }}>

      {/* Cart drawer — fixed overlay (receives the restaurant branding so
          the order-success page can keep the same theme) */}
      <CartDrawer branding={restaurantBranding} />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-5 py-12 sm:py-16"
        style={{
          /* Fully themed hero: dark primary gradient so the light/gold
             header text always has a readable, restaurant-specific base */
          background:
            'linear-gradient(145deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, var(--color-primary-hover) 100%)',
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -top-16 -end-16 w-56 h-56 rounded-full opacity-10"
          style={{ background: 'var(--color-gold)' }}
        />
        <div
          className="absolute -bottom-10 -start-10 w-40 h-40 rounded-full"
          style={{ background: 'var(--color-gold-light)', opacity: 0.08 }}
        />

        <div className="relative mx-auto max-w-xl text-center">
          {/* Table badge */}
          {tableNumber && (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 animate-fade-down"
              style={{
                background: 'var(--gold-tint)',
                color: 'var(--color-gold-light)',
                border: '1px solid var(--gold-tint-strong)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <ArmchairIcon size={14} />
              <span>{t('common.table', { number: tableNumber })}</span>
            </div>
          )}

          {/* Restaurant logo (custom, falls back to hidden when absent) */}
          {restaurantLogo && !heroLogoFailed && (
            <img
              src={resolveImageUrl(restaurantLogo)}
              alt={restaurantName}
              className="mx-auto mb-5 h-20 sm:h-24 w-auto object-contain animate-fade-down"
              style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.35))' }}
              onError={() => setHeroLogoFailed(true)}
            />
          )}

          {/* Restaurant name */}
          <h1
            className="font-display text-4xl sm:text-5xl font-bold leading-tight animate-fade-up"
            style={{ color: 'var(--color-white)', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            {restaurantName}
          </h1>

          {/* Ornamental divider */}
          <div
            className="flex items-center justify-center gap-3 my-4 animate-fade-up stagger-2"
          >
            <div className="h-px w-14" style={{ background: 'var(--color-gold)', opacity: 0.6 }} />
            <span style={{ color: 'var(--color-gold)', fontSize: '16px' }}>◆</span>
            <div className="h-px w-14" style={{ background: 'var(--color-gold)', opacity: 0.6 }} />
          </div>

          {/* Tagline */}
          <p
            className="text-base sm:text-lg opacity-85 animate-fade-up stagger-3"
            style={{
              color: 'var(--color-cream)',
              fontFamily: 'var(--font-accent)',
              fontSize: '20px',
            }}
          >
            {t('menu.tagline')}
          </p>

          <p
            className="mt-2 text-sm opacity-65 animate-fade-up stagger-4"
            style={{ color: 'var(--color-cream)' }}
          >
            {t('menu.subtitle')}
          </p>

          {/* Owner login */}
          <button
            onClick={() => navigate('/admin/login')}
            className="btn-outline-gold mt-6 text-xs px-5 py-2 animate-fade-up stagger-5"
          >
            {t('menu.restaurantLogin')}
          </button>
        </div>
      </section>

      {/* ── Featured carousel ──────────────────────────────────── */}
      {featuredItems.length > 0 && (
        <section className="px-4 sm:px-6 pt-10 pb-2">
          <div className="mx-auto max-w-2xl">
            <h2
              className="font-display text-xl text-center animate-fade-up"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('menu.chefsRecommendations')}
            </h2>
            <GoldDivider />
            <FeaturedCarousel items={featuredItems} />
          </div>
        </section>
      )}

      {/* ── Sticky search + filters + tabs ─────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-3 space-y-3"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--color-divider)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto">
          {showSearch ? (
            <div className="flex items-center gap-2 animate-fade-down">
              <SearchIcon size={16} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{
                  borderBottom: '2px solid var(--color-gold)',
                  paddingBottom: '4px',
                  color: 'var(--color-espresso)',
                  fontFamily: 'var(--font-body)',
                }}
              />
              <button
                onClick={() => { setShowSearch(false); setSearchTerm(''); }}
                className="text-lg"
                style={{ color: 'var(--color-muted)' }}
                aria-label={t('menu.closeSearch')}
              >
                <XIcon size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-start transition hover:opacity-90"
              style={{
                background: 'var(--color-cream-dark)',
                border: '1px solid var(--color-divider)',
                color: 'var(--color-muted)',
                fontStyle: 'italic',
              }}
            >
              {t('menu.searchDishes')}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="max-w-2xl mx-auto">
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Dietary filter pills */}
        <div className="flex flex-wrap gap-2 max-w-2xl mx-auto">
          {[
            { id: 'vegetarian', label: t('menu.filters.vegetarian') },
            { id: 'spicy',      label: t('menu.filters.spicy')      },
            { id: 'popular',    label: t('menu.filters.popular')    },
            { id: 'quick',      label: t('menu.filters.quick')      },
          ].map((f) => {
            const active = dietaryFilters.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleDiet(f.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 focus-gold"
                style={{
                  background:  active ? 'var(--color-primary)' : 'transparent',
                  color:       active ? 'var(--color-gold-light)' : 'var(--color-charcoal)',
                  border:      `1.5px solid ${active ? 'var(--color-primary)' : 'var(--color-divider)'}`,
                  transform:   active ? 'scale(1.04)' : 'scale(1)',
                }}
                aria-pressed={active}
              >
                {f.label}
              </button>
            );
          })}

          {/* Clear filters */}
          {(dietaryFilters.length > 0 || searchTerm) && (
            <button
              onClick={() => { setDietaryFilters([]); setSearchTerm(''); setShowSearch(false); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition animate-pop-in"
              style={{ background: 'var(--danger-pale)', color: 'var(--danger)' }}
            >
              {t('menu.clear')}
            </button>
          )}
        </div>
      </div>

      {/* ── Menu sections ──────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-2xl space-y-12">

          {/* Skeleton loading */}
          {loading && (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* No results */}
          {!loading && filteredGroups.length === 0 && (
            <div className="text-center py-16 animate-fade-up">
              <div className="flex justify-center mb-3" style={{ color: 'var(--color-muted)' }}>
                <UtensilsIcon size={44} />
              </div>
              <p className="font-display text-xl" style={{ color: 'var(--color-espresso)' }}>
                {t('menu.noResults')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {t('menu.noResultsSub')}
              </p>
              <button
                onClick={() => { setDietaryFilters([]); setSearchTerm(''); setActiveCategory(null); }}
                className="btn-outline-gold mt-4 text-sm px-5 py-2"
              >
                {t('menu.showAll')}
              </button>
            </div>
          )}

          {/* Category groups */}
          {filteredGroups.map((group, gIdx) => (
            <div key={group._id || group.category || gIdx}>

              {/* Section heading */}
              <div
                className="animate-fade-up"
                style={{ animationDelay: `${gIdx * 0.08}s` }}
              >
                <h2
                  className="font-display text-2xl sm:text-3xl"
                  style={{ color: 'var(--color-espresso)' }}
                >
                  {group.category || group.name}
                </h2>
                {group.description && (
                  <p
                    className="text-sm mt-1 mb-1"
                    style={{ color: 'var(--color-muted)', fontStyle: 'italic' }}
                  >
                    {group.description}
                  </p>
                )}
                <GoldDivider />
              </div>

              {/* Cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {group.items.map((item, iIdx) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    index={gIdx * 10 + iIdx}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Floating cart button ────────────────────────────────── */}
      {totalItems > 0 && (
        <button
          onClick={openCart}
          aria-label={t('menu.viewCart', { count: totalItems })}
          className="fixed bottom-6 end-5 z-30 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition hover:scale-110 active:scale-95 animate-bounce-in focus-gold"
          style={{ background: 'var(--color-primary)', boxShadow: 'var(--shadow-float)', color: 'var(--color-gold-light)' }}
        >
          <CartIcon size={26} />
          {/* Count badge */}
          <span
            className="absolute -top-1.5 -end-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-display animate-pop-in"
            style={{
              background: 'var(--color-gold)',
              color: 'var(--color-espresso)',
            }}
          >
            {totalItems}
          </span>
        </button>
      )}
    </div>
  );
}

export default MenuPage;
