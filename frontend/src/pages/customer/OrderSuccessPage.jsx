import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

function OrderSuccessPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t } = useTranslation();
  const [tableNumber, setTableNumber] = useState(null);
  const [owner, setOwner]             = useState(null);
  const [visible, setVisible]         = useState(false);
  const confettiRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setTableNumber(params.get('table'));
    setOwner(params.get('owner'));
    /* Trigger entrance animations */
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [location]);

  /* Simple CSS confetti burst using random spans */
  const confettiPieces = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    color: ['var(--color-gold)', 'var(--color-primary)', '#F97316', '#16A34A', '#2563EB'][i % 5],
    left:  `${Math.random() * 90 + 5}%`,
    delay: `${Math.random() * 0.8}s`,
    size:  `${Math.random() * 8 + 6}px`,
    rot:   `${Math.random() * 360}deg`,
  }));

  const handleBack = () => {
    const base = `/menu?table=${tableNumber || ''}`;
    navigate(owner ? `${base}&owner=${owner}` : '/');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 overflow-hidden"
      style={{ background: 'var(--color-cream)' }}
    >
      {/* Confetti burst */}
      <div ref={confettiRef} className="fixed inset-0 pointer-events-none overflow-hidden">
        {visible && confettiPieces.map((p) => (
          <span
            key={p.id}
            className="absolute"
            style={{
              left: p.left,
              top: '-10px',
              width: p.size,
              height: p.size,
              background: p.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall 2.5s ease-in forwards`,
              animationDelay: p.delay,
              transform: `rotate(${p.rot})`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(95vh) rotate(720deg);  opacity: 0; }
        }
        @keyframes drawCircle {
          from { stroke-dashoffset: 283; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      <div
        className={`w-full max-w-sm text-center transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Animated checkmark SVG */}
        <div className="flex justify-center mb-6">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background circle */}
            <circle cx="50" cy="50" r="48" fill="#DCFCE7" />
            {/* Animated circle border */}
            <circle
              cx="50" cy="50" r="44"
              stroke="var(--color-success)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="283"
              strokeDashoffset="283"
              style={{
                animation: visible ? 'drawCircle 0.7s ease-out 0.1s forwards' : 'none',
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
            {/* Animated checkmark */}
            <path
              d="M28 52 L44 68 L72 36"
              stroke="var(--color-success)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="100"
              strokeDashoffset="100"
              style={{
                animation: visible ? 'drawCheck 0.5s ease-out 0.8s forwards' : 'none',
              }}
            />
          </svg>
        </div>

        {/* Heading */}
        <h1
          className="font-display text-3xl sm:text-4xl font-bold mb-2"
          style={{
            color: 'var(--color-espresso)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.5s ease 0.9s, transform 0.5s ease 0.9s',
          }}
        >
          {t('orderSuccess.title')}
        </h1>

        {/* Gold divider */}
        <div
          className="gold-divider justify-center my-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.4s ease 1.1s',
          }}
        >
          <span className="gold-divider-icon">◆</span>
        </div>

        {/* Message */}
        <p
          className="text-base mb-2"
          style={{
            color: 'var(--color-charcoal)',
            fontFamily: 'var(--font-accent)',
            fontSize: '18px',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.4s ease 1.2s',
          }}
        >
          {t('orderSuccess.subtitle')}
        </p>
        <p
          className="text-sm mb-6"
          style={{
            color: 'var(--color-muted)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.4s ease 1.3s',
          }}
        >
          {t('orderSuccess.relax')}
        </p>

        {/* Info card */}
        <div
          className="rounded-2xl p-5 mb-7 text-start space-y-3 ornament-corners"
          style={{
            background: 'var(--color-white)',
            border: '1.5px solid var(--color-gold)',
            boxShadow: 'var(--shadow-gold)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.5s ease 1.4s',
          }}
        >
          {tableNumber && (
            <div className="flex items-center gap-3">
              <span className="text-xl">🪑</span>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{t('orderSuccess.tableLabel')}</p>
                <p className="font-display text-lg font-bold" style={{ color: 'var(--color-espresso)' }}>
                  {t('common.table', { number: tableNumber })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xl">⏱</span>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{t('orderSuccess.estimatedTime')}</p>
              <p className="font-display text-lg font-bold" style={{ color: 'var(--color-espresso)' }}>                  {t('orderSuccess.timeRange')}
                </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">👨‍🍳</span>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{t('orderSuccess.statusLabel')}</p>
              <p className="font-display text-lg font-bold" style={{ color: 'var(--color-success)' }}>                  {t('orderSuccess.receivedByKitchen')}
                </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          className="space-y-3"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.4s ease 1.6s',
          }}
        >
          <button
            onClick={handleBack}
            className="btn-primary w-full py-3.5 text-base"
            style={{ borderRadius: '14px' }}
          >
            {t('orderSuccess.backToMenu')}
          </button>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {t('orderSuccess.addMore')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccessPage;
