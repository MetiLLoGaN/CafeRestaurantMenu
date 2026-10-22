import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';

/* ── Editable customer-facing fields (must match backend
      utils/menuContent.js). `defaultKey` shows the built-in wording
      as a placeholder so admins know what an empty field falls back
      to; `heading` falls back to the restaurant name. ──────────── */
const CONTENT_FIELDS = [
  { key: 'heading',          labelKey: 'content.fields.heading',          max: 80,  multiline: false },
  { key: 'tagline',          labelKey: 'content.fields.tagline',          max: 120, multiline: false, defaultKey: 'menu.tagline' },
  { key: 'subtitle',         labelKey: 'content.fields.subtitle',         max: 160, multiline: false, defaultKey: 'menu.subtitle' },
  { key: 'description',      labelKey: 'content.fields.description',      max: 600, multiline: true },
  { key: 'instructions',     labelKey: 'content.fields.instructions',     max: 300, multiline: true },
  { key: 'menuButtonLabel',  labelKey: 'content.fields.menuButtonLabel',  max: 40,  multiline: false, defaultKey: 'menu.viewMenu' },
];

const emptyForm = () =>
  Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, { fa: '', en: '' }]));

/* ══════════════════════════════════════════════════════════════════
   MENU CONTENT SETTINGS
   Bilingual (fa/en) editing of the text the public QR menu shows.
   Empty fields fall back to the app's default translations.
══════════════════════════════════════════════════════════════════ */
function MenuContentPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); /* { type, text } */
  const [savedForm, setSavedForm] = useState(emptyForm);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/menu-content')
      .then(({ data }) => {
        if (cancelled) return;
        const next = emptyForm();
        const stored = data.menuContent || {};
        Object.keys(next).forEach((key) => {
          if (stored[key] && typeof stored[key] === 'object') {
            next[key] = {
              fa: stored[key].fa || '',
              en: stored[key].en || '',
            };
          }
        });
        setForm(next);
        setSavedForm(JSON.parse(JSON.stringify(next)));
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load menu content:', error);
          setStatus({ type: 'error', text: t('content.loadError') });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  /* The preview mirrors the public menu: the active admin language wins,
     then the other language, then the built-in default. */
  const previewLang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('fa') ? 'fa' : 'en';
  const previewFallbackLang = previewLang === 'fa' ? 'en' : 'fa';
  const previewText = (field) => {
    const entry = form[field] || {};
    return entry[previewLang] || entry[previewFallbackLang] || '';
  };

  const updateField = (key, lang, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [lang]: value },
    }));
    setStatus(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      /* Trim + cap client-side; the server re-validates everything */
      const payload = {};
      CONTENT_FIELDS.forEach((field) => {
        payload[field.key] = {
          fa: (form[field.key].fa || '').trim().slice(0, field.max),
          en: (form[field.key].en || '').trim().slice(0, field.max),
        };
      });
      const { data } = await api.put('/menu-content', payload);
      const next = emptyForm();
      Object.keys(next).forEach((key) => {
        if (data.menuContent && data.menuContent[key]) {
          next[key] = {
            fa: data.menuContent[key].fa || '',
            en: data.menuContent[key].en || '',
          };
        }
      });
      setForm(next);
      setSavedForm(JSON.parse(JSON.stringify(next)));
      setStatus({ type: 'success', text: t('content.saved') });
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.response?.data?.message || t('content.saveError'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(JSON.parse(JSON.stringify(savedForm)));
    setStatus(null);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statusStyle =
    status?.type === 'success'
      ? { background: 'var(--success-pale)', color: '#166534' }
      : { background: 'var(--danger-pale)', color: 'var(--danger)' };

  const placeholderFor = (field) => {
    if (field.key === 'heading') return user?.restaurantName || '';
    if (field.defaultKey) return t(field.defaultKey);
    return t('content.hiddenWhenEmpty');
  };

  return (
    <Navbar title={t('content.title')}>
      <form onSubmit={handleSave} className="max-w-4xl mx-auto animate-fade-up">

        {/* ── Page header + actions ─────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('content.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {t('content.subtitle')}
            </p>
            {dirty && (
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--warning)' }}>
                {t('content.unsaved')}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty || saving}
              className="btn btn-ghost text-sm px-4 py-2"
            >
              {t('theme.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving || !dirty}
              className="btn btn-primary text-sm px-5 py-2"
            >
              {saving ? (
                <>
                  <span className="spinner spinner-sm" />
                  {t('theme.actions.saving')}
                </>
              ) : (
                t('theme.actions.save')
              )}
            </button>
          </div>
        </div>

        {/* ── Status message ────────────────────────────────── */}
        {status && (
          <div
            role="status"
            className="mb-5 px-4 py-3 rounded-xl text-sm animate-fade-in"
            style={statusStyle}
          >
            {status.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: fields ────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Page introduction card */}
            <div className="card-flat p-5">
              <h2
                className="font-display text-lg font-semibold mb-4"
                style={{ color: 'var(--color-espresso)' }}
              >
                {t('content.introSection')}
              </h2>

              <div className="space-y-4">
                {CONTENT_FIELDS.filter((f) => !f.multiline).map((field) => (
                  <div key={field.key}>
                    <span className="label">{t(field.labelKey)}</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-2xs mb-1 block" style={{ color: 'var(--color-muted)' }}>
                          {t('content.language.fa')}
                        </span>
                        <input
                          type="text"
                          dir="rtl"
                          lang="fa"
                          maxLength={field.max}
                          value={form[field.key].fa}
                          onChange={(e) => updateField(field.key, 'fa', e.target.value)}
                          placeholder={placeholderFor(field)}
                          className="input text-sm"
                        />
                      </div>
                      <div>
                        <span className="text-2xs mb-1 block" style={{ color: 'var(--color-muted)' }}>
                          {t('content.language.en')}
                        </span>
                        <input
                          type="text"
                          dir="ltr"
                          lang="en"
                          maxLength={field.max}
                          value={form[field.key].en}
                          onChange={(e) => updateField(field.key, 'en', e.target.value)}
                          placeholder={placeholderFor(field)}
                          className="input text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Longer text card */}
            <div className="card-flat p-5">
              <h2
                className="font-display text-lg font-semibold mb-4"
                style={{ color: 'var(--color-espresso)' }}
              >
                {t('content.buttonsSection')}
              </h2>

              <div className="space-y-4">
                {CONTENT_FIELDS.filter((f) => f.multiline).map((field) => (
                  <div key={field.key}>
                    <span className="label">{t(field.labelKey)}</span>
                    <p className="text-2xs mb-2" style={{ color: 'var(--color-muted)' }}>
                      {t('content.hiddenWhenEmpty')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <textarea
                        dir="rtl"
                        lang="fa"
                        rows={3}
                        maxLength={field.max}
                        value={form[field.key].fa}
                        onChange={(e) => updateField(field.key, 'fa', e.target.value)}
                        className="input text-sm resize-y"
                        aria-label={`${t(field.labelKey)} — ${t('content.language.fa')}`}
                      />
                      <textarea
                        dir="ltr"
                        lang="en"
                        rows={3}
                        maxLength={field.max}
                        value={form[field.key].en}
                        onChange={(e) => updateField(field.key, 'en', e.target.value)}
                        className="input text-sm resize-y"
                        aria-label={`${t(field.labelKey)} — ${t('content.language.en')}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: live preview ─────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <div className="card-flat p-5">
                <h2
                  className="font-display text-lg font-semibold"
                  style={{ color: 'var(--color-espresso)' }}
                >
                  {t('content.preview')}
                  <span
                    className="ms-2 align-middle text-2xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}
                  >
                    {t('content.language.' + previewLang)}
                  </span>
                </h2>
                <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-muted)' }}>
                  {t('content.previewSubtitle')}
                </p>

                {/* Representative hero, using the restaurant's theme */}
                <div
                  className="rounded-xl p-5 text-center"
                  style={{
                    background:
                      'linear-gradient(145deg, var(--color-primary-dark) 0%, var(--color-primary) 60%, var(--color-primary-hover) 100%)',
                  }}
                >
                  <p
                    className="font-display text-lg font-bold leading-tight"
                    style={{ color: 'var(--color-white)', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                  >
                    {previewText('heading') || user?.restaurantName || t('sidebar.brandFallback')}
                  </p>
                  <p
                    className="text-xs mt-1.5"
                    style={{ color: 'var(--color-cream)', fontFamily: 'var(--font-accent)', fontSize: '14px' }}
                  >
                    {previewText('tagline') || t('menu.tagline')}
                  </p>
                  <p className="text-2xs mt-1" style={{ color: 'var(--color-cream)', opacity: 0.75 }}>
                    {previewText('subtitle') || t('menu.subtitle')}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <span
                      className="text-2xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: 'var(--gold)', color: 'var(--color-espresso)' }}
                    >
                      {previewText('menuButtonLabel') || t('menu.viewMenu')}
                    </span>
                  </div>

                  {(previewText('description') || previewText('instructions')) && (
                    <div
                      className="mt-4 pt-3 text-2xs leading-relaxed"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-cream)' }}
                    >
                      {previewText('description')}
                      {previewText('instructions') && (
                        <p
                          className="mt-2 inline-block px-3 py-1 rounded-full"
                          style={{ background: 'var(--gold-tint)', border: '1px solid var(--gold-tint-strong)' }}
                        >
                          {previewText('instructions')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Navbar>
  );
}

export default MenuContentPage;
