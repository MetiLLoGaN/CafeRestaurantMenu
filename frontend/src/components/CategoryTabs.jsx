import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORY_EMOJIS = {
  starters:    '🥗',
  appetizers:  '🥗',
  mains:       '🍖',
  'main course':'🍖',
  desserts:    '🍰',
  drinks:      '🥤',
  beverages:   '🥤',
  pizza:       '🍕',
  pasta:       '🍝',
  salads:      '🥙',
  soups:       '🍲',
  seafood:     '🦐',
  grills:      '🔥',
  burgers:     '🍔',
  specials:    '⭐',
};

function getCategoryEmoji(name = '') {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_EMOJIS)) {
    if (key.includes(k)) return v;
  }
  return '🍽️';
}

function CategoryTabs({ categories = [], activeCategory, onCategoryChange }) {
  const { t } = useTranslation();
  const scrollRef  = useRef(null);
  const activeRef  = useRef(null);
  const [inkStyle, setInkStyle] = useState({ left: 0, width: 0 });

  /* Move ink underline to follow active tab */
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const tab   = activeRef.current;
      const rail  = scrollRef.current;
      const railRect = rail.getBoundingClientRect();
      const tabRect  = tab.getBoundingClientRect();
      setInkStyle({
        left:  tab.offsetLeft,
        width: tabRect.width,
      });
      /* Scroll tab into view (RTL documents use negative scroll coordinates) */
      const centerOffset = tab.offsetLeft - railRect.width / 2 + tabRect.width / 2;
      rail.scrollTo({
        left: document.documentElement.dir === 'rtl' ? -centerOffset : centerOffset,
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -220 : 220, behavior: 'smooth' });
    }
  };

  const isAll = activeCategory === null || activeCategory === 'all';

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        aria-label={t('categoryTabs.scrollLeft')}
        className="absolute start-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md focus-gold transition-transform hover:scale-110"
        style={{
          background: 'var(--color-white)',
          border: '1px solid var(--color-divider)',
          color: 'var(--color-espresso)',
        }}
      >
        ‹
      </button>

      {/* Scrollable rail */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-10 py-1 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Sliding ink indicator */}
        <div
          className="absolute bottom-0 h-0.5 transition-all duration-300"
          style={{
            left:  inkStyle.left,
            width: inkStyle.width,
            background: 'var(--color-gold)',
            borderRadius: '2px',
            transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />

        {/* "All" tab */}
        <button
          ref={isAll ? activeRef : null}
          onClick={() => onCategoryChange(null)}
          aria-pressed={isAll}
          className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all duration-250 focus-gold"
          style={{
            background: isAll ? 'var(--color-primary)' : 'var(--color-cream-dark)',
            color:      isAll ? 'var(--color-gold-light)' : 'var(--color-charcoal)',
            boxShadow:  isAll ? 'var(--shadow-sm)' : 'none',
            border:     '1.5px solid',
            borderColor: isAll ? 'var(--color-primary)' : 'var(--color-divider)',
            fontFamily:  isAll ? 'var(--font-display)' : 'var(--font-body)',
          }}
        >
          <span>🍽️</span>
          <span>{t('common.all')}</span>
        </button>

        {/* Category tabs */}
        {categories.map((cat) => {
          const isActive =
            activeCategory === cat._id || activeCategory === cat.name;
          const emoji = getCategoryEmoji(cat.name);

          return (
            <button
              key={cat._id || cat.name}
              ref={isActive ? activeRef : null}
              onClick={() => onCategoryChange(cat._id || cat.name)}
              aria-pressed={isActive}
              className="flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all duration-250 focus-gold"
              style={{
                background: isActive ? 'var(--color-primary)' : 'var(--color-cream-dark)',
                color:      isActive ? 'var(--color-gold-light)' : 'var(--color-charcoal)',
                boxShadow:  isActive ? 'var(--shadow-sm)' : 'none',
                border:     '1.5px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-divider)',
                fontFamily:  isActive ? 'var(--font-display)' : 'var(--font-body)',
              }}
            >
              <span>{emoji}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        aria-label={t('categoryTabs.scrollRight')}
        className="absolute end-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-md focus-gold transition-transform hover:scale-110"
        style={{
          background: 'var(--color-white)',
          border: '1px solid var(--color-divider)',
          color: 'var(--color-espresso)',
        }}
      >
        ›
      </button>
    </div>
  );
}

export default CategoryTabs;
