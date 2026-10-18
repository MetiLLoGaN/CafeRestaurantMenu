import { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useTranslation } from 'react-i18next';
import resolveImageUrl from '../../utils/resolveImageUrl';
import {
  DEFAULT_BRANDING,
  BRANDING_COLOR_GROUPS,
  BRANDING_COLOR_KEYS,
  normalizeHex,
  pickColors,
  applyTheme,
} from '../../utils/branding';

/* Client-side mirrors of the server rules — the server re-validates. */
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/* ── Accessible color field: native picker + hex text input ─── */
function ColorField({ id, labelKey, value, onChange }) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const pickerValue = normalizeHex(value) || '#000000';

  const handleText = (e) => {
    const raw = e.target.value;
    setText(raw);
    const normalized = normalizeHex(raw);
    if (normalized) onChange(normalized);
  };

  return (
    <div>
      <label className="label" htmlFor={id}>
        {t(labelKey)}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer p-1 flex-shrink-0"
          style={{
            border: '1.5px solid var(--color-divider)',
            background: 'var(--color-white)',
          }}
        />
        <input
          type="text"
          value={text}
          onChange={handleText}
          spellCheck={false}
          maxLength={7}
          className="input text-sm font-mono"
          style={{ maxWidth: '9rem' }}
          aria-label={`${t(labelKey)} — ${t('theme.colors.hexHint')}`}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   THEME & BRANDING SETTINGS
   Edits are applied instantly as a live preview (whole admin UI),
   but the saved theme only changes when the admin presses Save.
══════════════════════════════════════════════════════════════════ */
function ThemeSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    branding,
    loading,
    saveColors,
    uploadLogo,
    removeLogo,
    previewBranding,
    restoreBranding,
  } = useBranding();

  const [form, setForm] = useState(() => pickColors(DEFAULT_BRANDING));
  const [status, setStatus] = useState(null); /* { type, text } */
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null); /* object URL */
  const fileInputRef = useRef(null);

  /* Keep a ref so the unmount cleanup always restores the LATEST saved */
  const brandingRef = useRef(branding);
  useEffect(() => {
    brandingRef.current = branding;
  }, [branding]);

  /* Sync the form with the saved branding when it loads / changes */
  const savedColors = pickColors(branding);
  useEffect(() => {
    if (!loading) setForm(pickColors(branding));
  }, [loading, branding]);

  /* Leaving the page reverts any unsaved live preview */
  useEffect(() => {
    return () => applyTheme(brandingRef.current || DEFAULT_BRANDING);
  }, []);

  const dirty = BRANDING_COLOR_KEYS.some((key) => form[key] !== savedColors[key]);

  const updateColor = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      /* Live preview — nothing is persisted until Save */
      previewBranding({ ...branding, ...next });
      return next;
    });
    setStatus(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const result = await saveColors(form);
    setSaving(false);
    setStatus(
      result.success
        ? { type: 'success', text: t('theme.saved') }
        : { type: 'error', text: result.message || t('theme.saveError') }
    );
  };

  const handleDiscard = () => {
    setForm(pickColors(branding));
    setStatus(null);
    restoreBranding();
  };

  const handleRestoreDefaults = () => {
    const defaults = pickColors(DEFAULT_BRANDING);
    setForm(defaults);
    previewBranding({ ...branding, ...defaults });
    setStatus(null);
  };

  const handleLogoFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; /* allow re-picking the same file */
    if (!file) return;

    if (!LOGO_TYPES.includes(file.type)) {
      setStatus({ type: 'error', text: t('theme.logo.invalidType') });
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setStatus({ type: 'error', text: t('theme.logo.tooLarge') });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl); /* instant local preview */
    setLogoBusy(true);
    setStatus(null);

    const result = await uploadLogo(file);

    URL.revokeObjectURL(objectUrl);
    setLogoPreview(null);
    setLogoBusy(false);
    setStatus(
      result.success
        ? { type: 'success', text: t('theme.logo.uploadSuccess') }
        : { type: 'error', text: result.message || t('theme.logo.uploadError') }
    );
  };

  const handleRemoveLogo = async () => {
    if (!branding?.logo || logoBusy) return;
    if (!window.confirm(t('theme.logo.removeConfirm'))) return;

    setLogoBusy(true);
    setStatus(null);
    const result = await removeLogo();
    setLogoBusy(false);
    setStatus(
      result.success
        ? { type: 'success', text: t('theme.logo.removeSuccess') }
        : { type: 'error', text: result.message || t('theme.logo.uploadError') }
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const logoSrc =
    logoPreview || (branding?.logo ? resolveImageUrl(branding.logo) : null);

  const statusStyle =
    status?.type === 'success'
      ? { background: 'var(--success-pale)', color: '#166534' }
      : { background: 'var(--danger-pale)', color: 'var(--danger)' };

  return (
    <Navbar title={t('theme.title')}>
      <form onSubmit={handleSave} className="max-w-5xl mx-auto animate-fade-up">

        {/* ── Page header + actions ─────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <h1
              className="font-display text-2xl font-bold"
              style={{ color: 'var(--color-espresso)' }}
            >
              {t('theme.title')}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {t('theme.subtitle')}
            </p>
            {dirty && (
              <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--warning)' }}>
                {t('theme.unsaved')}
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
              type="button"
              onClick={handleRestoreDefaults}
              disabled={saving}
              className="btn btn-outline-gold text-sm px-4 py-2"
            >
              {t('theme.actions.restore')}
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

          {/* ── Left: logo + colors ─────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Logo card */}
            <div className="card-flat p-5">
              <h2
                className="font-display text-lg font-semibold mb-1"
                style={{ color: 'var(--color-espresso)' }}
              >
                {t('theme.logo.title')}
              </h2>
              <p className="text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
                {t('theme.logo.hint')}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    background: 'var(--color-cream-dark)',
                    border: '1px dashed var(--color-divider)',
                  }}
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={t('theme.logo.title')}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-3xl">🍽️</span>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-start">
                  <input
                    ref={fileInputRef}
                    id="logo-upload"
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                    onChange={handleLogoFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={logoBusy}
                    className="btn btn-outline-primary text-xs px-4 py-2"
                  >
                    {logoBusy ? (
                      <>
                        <span className="spinner spinner-sm" />
                        {t('theme.logo.uploading')}
                      </>
                    ) : branding?.logo ? (
                      t('theme.logo.replace')
                    ) : (
                      t('theme.logo.upload')
                    )}
                  </button>

                  {branding?.logo ? (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={logoBusy}
                      className="btn btn-danger text-xs px-4 py-2"
                    >
                      {t('theme.logo.remove')}
                    </button>
                  ) : (
                    <p className="text-2xs" style={{ color: 'var(--color-muted)' }}>
                      {t('theme.logo.defaultHint')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colors card */}
            <div className="card-flat p-5">
              <h2
                className="font-display text-lg font-semibold"
                style={{ color: 'var(--color-espresso)' }}
              >
                {t('theme.colors.title')}
              </h2>

              {BRANDING_COLOR_GROUPS.map((group) => (
                <div key={group.titleKey} className="mt-5">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {t(group.titleKey)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.fields.map((field) => (
                      <ColorField
                        key={field.key}
                        id={`branding-${field.key}`}
                        labelKey={field.labelKey}
                        value={form[field.key]}
                        onChange={(value) => updateColor(field.key, value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
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
                  {t('theme.preview.title')}
                </h2>
                <p className="text-xs mt-1 mb-4" style={{ color: 'var(--color-muted)' }}>
                  {t('theme.preview.subtitle')}
                </p>

                {/* Representative themed mini-UI */}
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: 'var(--color-cream)',
                    border: '1px solid var(--color-divider)',
                  }}
                >
                  {/* Brand header with logo */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <span>🍽️</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-display text-sm font-bold truncate"
                        style={{ color: 'var(--color-gold)' }}
                      >
                        {user?.restaurantName || t('sidebar.brandFallback')}
                      </p>
                      <p className="text-2xs" style={{ color: 'var(--sidebar-muted)' }}>
                        {t('sidebar.adminPanel')}
                      </p>
                    </div>
                  </div>

                  {/* Category tabs */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="category-tab active">{t('theme.preview.tabActive')}</span>
                    <span className="category-tab">{t('theme.preview.tabInactive')}</span>
                  </div>

                  {/* Menu card sample */}
                  <div
                    className="rounded-xl p-3 mb-3"
                    style={{
                      background: 'var(--color-white)',
                      border: '1px solid var(--color-divider)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="font-display text-sm font-semibold"
                        style={{ color: 'var(--color-espresso)' }}
                      >
                        {t('theme.preview.cardTitle')}
                      </p>
                      <span className="badge badge-primary">{t('theme.preview.badge')}</span>
                    </div>
                    <p className="text-2xs mt-1" style={{ color: 'var(--color-muted)' }}>
                      {t('theme.preview.cardText')}
                    </p>
                    <p
                      className="font-display text-sm font-bold mt-2"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {t('theme.preview.price')}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button type="button" className="btn btn-primary text-xs px-4 py-1.5">
                      {t('theme.preview.button')}
                    </button>
                    <button type="button" className="btn btn-gold text-xs px-4 py-1.5">
                      {t('theme.preview.secondaryButton')}
                    </button>
                    <button type="button" className="btn btn-ghost text-xs px-4 py-1.5">
                      {t('theme.preview.ghostButton')}
                    </button>
                  </div>

                  {/* Form control sample */}
                  <label className="label">{t('theme.preview.fieldLabel')}</label>
                  <input
                    className="input text-xs"
                    placeholder={t('theme.preview.fieldPlaceholder')}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Navbar>
  );
}

export default ThemeSettingsPage;
