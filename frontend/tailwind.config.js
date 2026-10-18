/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],

  theme: {
    extend: {

      /* ── Colors — bound to the CSS custom properties so
             utilities like bg-primary / text-gold follow the
             per-restaurant theme (see src/utils/branding.js).
             Literal fallbacks keep SSR-less first paint safe. ── */
      colors: {
        /* Brand */
        primary:   {
          DEFAULT: 'var(--primary, #8B1A1A)',
          hover:   'var(--primary-hover, #A82020)',
          dark:    'var(--primary-dark, #5C0E0E)',
          pale:    'var(--primary-pale, #FBEAEA)',
        },
        gold: {
          DEFAULT: 'var(--gold, #C9A84C)',
          light:   'var(--gold-light, #E8C97A)',
          dark:    'var(--gold-dark, #9A7A2E)',
          pale:    'var(--gold-pale, #FBF3DC)',
        },

        /* Warm neutrals */
        cream: {
          DEFAULT: 'var(--cream, #FDF6EC)',
          mid:     'var(--cream-mid, #F5E6D0)',
          deep:    'var(--cream-deep, #EDD9B8)',
          deeper:  'var(--cream-deeper, #E0C89A)',
        },
        espresso: 'var(--espresso, #2C1A0E)',
        charcoal: 'var(--charcoal, #3D2B1F)',
        muted:    'var(--muted, #8C7B6B)',
        divider:  'var(--divider, #E8D5B7)',

        /* Semantic */
        success: {
          DEFAULT: '#16A34A',
          pale:    '#DCFCE7',
        },
        warning: {
          DEFAULT: '#D97706',
          pale:    '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          pale:    '#FEE2E2',
        },
        info: {
          DEFAULT: '#2563EB',
          pale:    '#DBEAFE',
        },

        /* Legacy — keep so existing classes don't break */
        secondary: 'var(--secondary, #C9A84C)',
        dark:      'var(--espresso, #2C1A0E)',
      },

      /* ── Typography ───────────────────────────────────────── */
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
        body:    ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        accent:  ['"Dancing Script"', 'cursive'],
        sans:    ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        'xs':  ['0.72rem', { lineHeight: '1.1rem' }],
        'sm':  ['0.84rem', { lineHeight: '1.4rem' }],
        'base':['0.94rem', { lineHeight: '1.65rem' }],
        'lg':  ['1.05rem', { lineHeight: '1.6rem' }],
        'xl':  ['1.20rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.45rem', { lineHeight: '1.35rem' }],
        '3xl': ['1.80rem', { lineHeight: '1.25rem' }],
        '4xl': ['2.20rem', { lineHeight: '1.15rem' }],
        '5xl': ['2.80rem', { lineHeight: '1.1rem' }],
      },

      /* ── Border radius ────────────────────────────────────── */
      borderRadius: {
        'none':  '0',
        'sm':    '8px',
        DEFAULT: '12px',
        'md':    '12px',
        'lg':    '16px',
        'xl':    '20px',
        '2xl':   '28px',
        '3xl':   '36px',
        'full':  '9999px',
      },

      /* ── Box shadows ──────────────────────────────────────── */
      boxShadow: {
        'xs':   '0 1px 4px  rgba(44,26,14,0.07)',
        'sm':   '0 2px 10px rgba(44,26,14,0.09)',
        DEFAULT:'0 4px 20px rgba(44,26,14,0.13)',
        'md':   '0 4px 20px rgba(44,26,14,0.13)',
        'lg':   '0 8px 36px rgba(44,26,14,0.18)',
        'xl':   '0 16px 56px rgba(44,26,14,0.24)',
        'gold': 'var(--shadow-gold, 0 4px 24px rgba(201,168,76,0.28))',
        'card': '0 2px 12px rgba(44,26,14,0.08), 0 1px 3px rgba(44,26,14,0.05)',
        'inner-gold': 'inset 0 0 0 2px rgba(201,168,76,0.4)',
        'none': 'none',
      },

      /* ── Spacing extras ───────────────────────────────────── */
      spacing: {
        '4.5':  '1.125rem',
        '5.5':  '1.375rem',
        '13':   '3.25rem',
        '15':   '3.75rem',
        '17':   '4.25rem',
        '18':   '4.50rem',
        '22':   '5.50rem',
        '26':   '6.50rem',
        '30':   '7.50rem',
        '34':   '8.50rem',
        '68':   '17rem',
        '72':   '18rem',
        '76':   '19rem',
        '84':   '21rem',
        '88':   '22rem',
        '96':   '24rem',
        '112':  '28rem',
        '128':  '32rem',
      },

      /* ── Min / Max sizes ──────────────────────────────────── */
      minHeight: {
        '12': '3rem',
        '14': '3.5rem',
        '16': '4rem',
        'screen-1/2': '50vh',
        'screen-3/4': '75vh',
      },
      maxWidth: {
        'xxs':  '16rem',
        'xs':   '20rem',
        'card': '22rem',
        '8xl':  '96rem',
      },

      /* ── Z-index scale ────────────────────────────────────── */
      zIndex: {
        '5':   5,
        '15':  15,
        '25':  25,
        '35':  35,
        '45':  45,
        '55':  55,
        '60':  60,
        '70':  70,
      },

      /* ── Animation durations ──────────────────────────────── */
      transitionDuration: {
        '0':    '0ms',
        '175':  '175ms',
        '250':  '250ms',
        '350':  '350ms',
        '400':  '400ms',
        '600':  '600ms',
        '800':  '800ms',
        '1200': '1200ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1.00)',
        'sharp':  'cubic-bezier(0.40, 0.00, 0.20, 1.00)',
        'in':     'cubic-bezier(0.55, 0.00, 1.00, 0.45)',
      },

      /* ── Custom keyframes (Tailwind animate-* classes) ─────── */
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'     },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0)',    opacity: '0' },
          '55%':  { transform: 'scale(1.18)', opacity: '1' },
          '75%':  { transform: 'scale(0.94)'              },
          '90%':  { transform: 'scale(1.04)'              },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        popIn: {
          '0%':   { transform: 'scale(0.65)', opacity: '0' },
          '70%':  { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1.00)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition:  '600px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':       { transform: 'translateY(-9px)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(-12deg)' },
          '50%':       { transform: 'rotate(12deg)'  },
        },
        goldGlow: {
          '0%, 100%': { boxShadow: '0 0 6px  rgba(201,168,76,0.3)' },
          '50%':       { boxShadow: '0 0 22px rgba(201,168,76,0.65)' },
        },
        heartbeat: {
          '0%':   { transform: 'scale(1.00)' },
          '14%':  { transform: 'scale(1.15)' },
          '28%':  { transform: 'scale(1.00)' },
          '42%':  { transform: 'scale(1.12)' },
          '70%':  { transform: 'scale(1.00)' },
          '100%': { transform: 'scale(1.00)' },
        },
        toastSlideIn: {
          '0%':   { transform: 'translateX(110%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        countUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        plateSpin: {
          '0%':   { transform: 'scale(0) rotate(0deg)',   opacity: '0' },
          '50%':  { transform: 'scale(1.2) rotate(180deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(360deg)', opacity: '1' },
        },
        confettiFall: {
          '0%':   { transform: 'translateY(-20px) rotate(0deg)',   opacity: '1' },
          '80%':  {                                                  opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        morphBlob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%':       { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      },
      animation: {
        'fade-up':         'fadeUp       0.50s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'fade-down':       'fadeDown     0.50s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'fade-in':         'fadeIn       0.40s ease both',
        'slide-in-right':  'slideInRight 0.40s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'slide-in-left':   'slideInLeft  0.40s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'bounce-in':       'bounceIn     0.60s cubic-bezier(0.34,1.56,0.64,1) both',
        'pop-in':          'popIn        0.40s cubic-bezier(0.34,1.56,0.64,1) both',
        'shimmer':         'shimmer      1.60s linear infinite',
        'float':           'float        3.00s ease-in-out infinite',
        'wave':            'wave         1.00s ease-in-out infinite',
        'gold-glow':       'goldGlow     2.20s ease-in-out infinite',
        'heartbeat':       'heartbeat    1.30s ease-in-out',
        'toast-in':        'toastSlideIn 0.40s cubic-bezier(0.34,1.56,0.64,1) both',
        'count-up':        'countUp      0.60s cubic-bezier(0.25,0.46,0.45,0.94) both',
        'plate-spin':      'plateSpin    1.50s ease-out forwards',
        'confetti-fall':   'confettiFall 2.50s ease-in forwards',
        'morph-blob':      'morphBlob    8.00s ease-in-out infinite',
        'spin-slow':       'spin         3.00s linear infinite',
        'pulse-slow':      'pulse        2.50s ease-in-out infinite',
        'checkmark':       'drawCheck    0.60s ease-out forwards',
      },

      /* ── Background image helpers ─────────────────────────── */
      backgroundImage: {
        'gradient-hero':   'linear-gradient(145deg, #5C0E0E 0%, #8B1A1A 60%, #A01F1F 100%)',
        'gradient-gold':   'linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%)',
        'gradient-cream':  'linear-gradient(180deg, #FDF6EC 0%, #F5E6D0 100%)',
        'shimmer-base':    'linear-gradient(90deg, #F5E6D0 25%, #EDD9B8 50%, #F5E6D0 75%)',
        'shimmer-gold':    'linear-gradient(90deg, rgba(201,168,76,0) 0%, rgba(201,168,76,0.3) 50%, rgba(201,168,76,0) 100%)',
      },

      /* ── Aspect ratios ────────────────────────────────────── */
      aspectRatio: {
        'card':  '4 / 3',
        'menu':  '3 / 2',
        'hero':  '16 / 5',
        'qr':    '1 / 1',
      },
    },
  },

  plugins: [],
};
