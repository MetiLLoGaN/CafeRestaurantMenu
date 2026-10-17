import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/* ── Exact colors from the design image ───────────────────────── */
const C = {
  pageBg:       '#F5EDE4',   /* warm pinkish-cream page background  */
  cardBg:       '#FFFFFF',   /* pure white card                      */
  orange:       '#C2501F',   /* burnt orange — button, accents       */
  orangeHover:  '#A8431A',   /* darker orange on hover               */
  textDark:     '#1C1108',   /* near-black dark brown — headings     */
  textBody:     '#5A4033',   /* medium warm brown — body text        */
  textMuted:    '#9C7B6B',   /* muted warm gray-brown — labels       */
  inputBg:      '#F5EDE4',   /* same as page bg — input fill         */
  inputIcon:    '#B89080',   /* muted icon color inside inputs       */
  placeholder:  '#C0A090',   /* very muted placeholder text          */
  footerText:   '#9C7B6B',   /* bottom bar muted text                */
  footerBorder: '#DDD0C4',   /* thin border above footer bar         */
};

function LoginPage() {
  const navigate  = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email.trim()) {
      setError(t('login.errors.enterEmail'));
      return;
    }
    if (!password.trim()) {
      setError(t('login.errors.enterPassword'));
      return;
    }
    
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || t('login.errors.invalidCredentials'));
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      C.pageBg,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'space-between',
        fontFamily:      '"DM Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Main content (logo + card) ──────────────────────── */}
      <div
        style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          width:         '100%',
          maxWidth:      '440px',
          padding:       '48px 20px 32px',
        }}
      >

        {/* ── Top: icon + restaurant name ─────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          {/* Fork & spoon icon in burnt orange circle */}
          <div
            style={{
              width:           '80px',
              height:          '80px',
              borderRadius:    '50%',
              background:      C.orange,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              margin:          '0 auto 20px',
              boxShadow:       '0 8px 28px rgba(194,80,31,0.35)',
              animation:       'bounceIn 0.6s ease both',
            }}
          >
            {/* SVG fork and spoon crossed — exactly as in design */}
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              {/* Fork */}
              <path
                d="M11 4 L11 12 M9 4 L9 10 M13 4 L13 10 M11 12 L11 28"
                stroke="white" strokeWidth="2.2" strokeLinecap="round"
              />
              {/* Spoon */}
              <path
                d="M26 4 C26 4 29 7 29 10 C29 13 27 14.5 26 15 L26 28"
                stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Restaurant name */}
          <h1
            style={{
              fontSize:    '2.2rem',
              fontWeight:  '800',
              color:       C.textDark,
              margin:      '0 0 6px',
              lineHeight:  '1.1',
              letterSpacing: '-0.02em',
              fontFamily:  '"Playfair Display", Georgia, serif',
            }}
          >
            {t('common.brand')}
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize:    '0.9rem',
              color:       C.textMuted,
              margin:      0,
              letterSpacing: '0.01em',
            }}
          >
            {t('login.subtitle')}
          </p>
        </div>

        {/* ── White card ───────────────────────────────────── */}
        <div
          style={{
            background:    C.cardBg,
            borderRadius:  '24px',
            padding:       '32px 28px 28px',
            width:         '100%',
            boxShadow:     '0 4px 40px rgba(92,40,14,0.10)',
          }}
        >
          {/* Card heading */}
          <h2
            style={{
              fontSize:    '1.75rem',
              fontWeight:  '800',
              color:       C.textDark,
              margin:      '0 0 8px',
              letterSpacing: '-0.02em',
            }}
          >
            {t('login.welcomeBack')}
          </h2>
          <p
            style={{
              fontSize:  '0.88rem',
              color:     C.textBody,
              margin:    '0 0 28px',
              lineHeight: 1.5,
            }}
          >
            {t('login.welcomeDesc')}
          </p>

          {/* Error banner */}
          {error && (
            <div
              style={{
                background:   '#FEE2E2',
                color:        '#991B1B',
                borderRadius: '12px',
                padding:      '10px 14px',
                fontSize:     '0.83rem',
                marginBottom: '20px',
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                animation:    'fadeDown 0.3s ease both',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── Email field ────────────────────────────── */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display:       'block',
                  fontSize:      '0.70rem',
                  fontWeight:    '700',
                  color:         C.textDark,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  marginBottom:  '8px',
                }}
              >
                {t('login.ownerEmail')}
              </label>
              <div
                style={{
                  display:       'flex',
                  alignItems:    'center',
                  background:    C.inputBg,
                  borderRadius:  '14px',
                  padding:       '0 16px',
                  height:        '52px',
                  gap:           '10px',
                }}
              >
                {/* @ icon */}
                <span style={{ color: C.inputIcon, fontSize: '16px', flexShrink: 0, fontWeight: 600 }}>@</span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  autoComplete="email"
                  style={{
                    flex:        1,
                    border:      'none',
                    background:  'transparent',
                    outline:     'none',
                    fontSize:    '0.88rem',
                    color:       C.textDark,
                    fontFamily:  'inherit',
                  }}
                />
              </div>
            </div>

            {/* ── Password field ─────────────────────────── */}
            <div>
              {/* Label row */}
              <div
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  marginBottom:   '8px',
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontSize:      '0.70rem',
                    fontWeight:    '700',
                    color:         C.textDark,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('login.secureKey')}
                </label>
                <button
                  type="button"
                  style={{
                    background:  'none',
                    border:      'none',
                    color:       C.orange,
                    fontSize:    '0.78rem',
                    fontWeight:  '600',
                    cursor:      'pointer',
                    padding:     0,
                    fontFamily:  'inherit',
                  }}
                  onClick={() => {}}
                  tabIndex={-1}
                >
                  {t('login.forgotAccess')}
                </button>
              </div>

              {/* Input */}
              <div
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  background:   C.inputBg,
                  borderRadius: '14px',
                  padding:      '0 16px',
                  height:       '52px',
                  gap:          '10px',
                }}
              >
                {/* Lock icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="3" y="7" width="10" height="8" rx="2" stroke={C.inputIcon} strokeWidth="1.5"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke={C.inputIcon} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>

                <input
                  id="password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    flex:        1,
                    border:      'none',
                    background:  'transparent',
                    outline:     'none',
                    fontSize:    '0.88rem',
                    color:       C.textDark,
                    fontFamily:  'inherit',
                    letterSpacing: showPw ? 'normal' : '0.15em',
                  }}
                />

                {/* Eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? t('common.hidePassword') : t('common.showPassword')}
                  style={{
                    background:  'none',
                    border:      'none',
                    cursor:      'pointer',
                    padding:     0,
                    color:       C.inputIcon,
                    display:     'flex',
                    alignItems:  'center',
                    flexShrink:  0,
                  }}
                >
                  {showPw ? (
                    /* Eye-off */
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M2 2l14 14M7.5 7.6A2 2 0 0011.4 11M5 5.2C3.5 6.3 2.3 7.5 1.5 9c1.5 3 4.5 5 7.5 5 1.3 0 2.6-.4 3.7-1M8 4c.3 0 .7 0 1 .1C12.5 4.6 15 7 16.5 9c-.4.8-1 1.6-1.7 2.2" stroke={C.inputIcon} strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    /* Eye */
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M1.5 9C3 6 5.8 4 9 4s6 2 7.5 5c-1.5 3-4.3 5-7.5 5S3 12 1.5 9z" stroke={C.inputIcon} strokeWidth="1.4"/>
                      <circle cx="9" cy="9" r="2" stroke={C.inputIcon} strokeWidth="1.4"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ── Remember me checkbox ───────────────────── */}
            <label
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         '10px',
                cursor:      'pointer',
                userSelect:  'none',
              }}
            >
              <div
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  width:        '18px',
                  height:       '18px',
                  borderRadius: '4px',
                  border:       `2px solid ${rememberMe ? C.orange : '#D4C4BA'}`,
                  background:   rememberMe ? C.orange : 'transparent',
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  flexShrink:   0,
                  transition:   'all 0.2s ease',
                  cursor:       'pointer',
                }}
              >
                {rememberMe && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: '0.86rem',
                  color:    C.textBody,
                }}
              >
                {t('login.staySignedIn')}
              </span>
            </label>

            {/* ── Submit button ──────────────────────────── */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:         '100%',
                height:        '54px',
                background:    loading ? C.orangeHover : C.orange,
                color:         '#FFFFFF',
                border:        'none',
                borderRadius:  '14px',
                fontSize:      '0.80rem',
                fontWeight:    '800',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor:        loading ? 'not-allowed' : 'pointer',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                gap:           '12px',
                boxShadow:     '0 6px 24px rgba(194,80,31,0.40)',
                transition:    'background 0.2s ease, transform 0.15s ease',
                transform:     loading ? 'scale(0.98)' : 'scale(1)',
                fontFamily:    'inherit',
                marginTop:     '4px',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = C.orangeHover; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = C.orange; }}
            >
              {loading ? (
                <>
                  <span>{t('login.enteringDashboard')}</span>
                  {/* Spinner ring — exactly as in design (right side) */}
                  <div
                    style={{
                      width:           '22px',
                      height:          '22px',
                      border:          '2.5px solid rgba(255,255,255,0.35)',
                      borderTopColor:  'rgba(255,255,255,0)',
                      borderRightColor:'rgba(255,255,255,0.8)',
                      borderRadius:    '50%',
                      animation:       'spin 0.8s linear infinite',
                      flexShrink:      0,
                    }}
                  />
                </>
              ) : (
                <>
                  <span>{t('login.enteringDashboard')}</span>
                  {/* Static ring icon when idle — matches design */}
                  <div
                    style={{
                      width:        '22px',
                      height:       '22px',
                      border:       '2.5px solid rgba(255,255,255,0.5)',
                      borderRadius: '50%',
                      flexShrink:   0,
                    }}
                  />
                </>
              )}
            </button>

          </form>

          {/* ── Card footer ────────────────────────────────── */}
          <div
            style={{
              marginTop:  '28px',
              textAlign:  'center',
            }}
          >
            <p
              style={{
                fontSize:     '0.84rem',
                color:        C.textMuted,
                margin:       '0 0 6px',
              }}
            >
              {t('login.newToSystem')}
            </p>
            <Link
              to="/admin/register"
              style={{
                background:  'none',
                border:      'none',
                color:       C.orange,
                fontSize:    '0.88rem',
                fontWeight:  '700',
                cursor:      'pointer',
                padding:     0,
                fontFamily:  'inherit',
                display:     'inline-flex',
                alignItems:  'center',
                gap:         '4px',
                textDecoration: 'none',
              }}
            >
              {t('login.registerRestaurant')}
              <span style={{ fontSize: '14px' }}>›</span>
            </Link>
          </div>
        </div>
        {/* end white card */}

      </div>
      {/* end main content */}

      {/* ── Bottom footer bar ──────────────────────────────── */}
      <div
        style={{
          width:          '100%',
          borderTop:      `1px solid ${C.footerBorder}`,
          padding:        '16px 24px',
          display:        'flex',
          justifyContent: 'space-around',
          alignItems:     'center',
          background:     C.pageBg,
        }}
      >
        {[t('footer.systemStatus'), t('footer.privacyProtocol'), t('footer.contactConcierge')].map((item) => (
          <button
            key={item}
            type="button"
            style={{
              background:    'none',
              border:        'none',
              color:         C.footerText,
              fontSize:      '0.62rem',
              fontWeight:    '700',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              cursor:        'pointer',
              padding:       0,
              fontFamily:    'inherit',
              lineHeight:    1.3,
              textAlign:     'center',
            }}
          >
            {/* Split into two lines like the design */}
            {item.includes(' ') ? (
              <>
                {item.split(' ')[0]}
                <br />
                {item.split(' ').slice(1).join(' ')}
              </>
            ) : item}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeDown {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default LoginPage;
