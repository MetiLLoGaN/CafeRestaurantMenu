import { useEffect, useState } from 'react';
import api from '../api/axios';
import LoadingSpinner from './LoadingSpinner';
import { useTranslation } from 'react-i18next';

/* Mirrors the server limits in backend/utils + ProductAttribute schema */
const MAX_NAME = 40;

const emptyForm = () => ({ fa: '', en: '', color: '', isActive: true });

/* Badge preview swatch — no color means the design-system default. */
function AttributeChip({ attribute, lang }) {
  const { t } = useTranslation();
  const label =
    (attribute.name && attribute.name[lang]) ||
    (attribute.name && attribute.name[lang === 'fa' ? 'en' : 'fa']) ||
    '';

  return (
    <span
      className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={
        attribute.color
          ? { background: attribute.color, color: '#ffffff' }
          : { background: 'var(--color-primary)', color: '#ffffff' }
      }
      title={t('attributes.preview')}
    >
      {label || '—'}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT ATTRIBUTES MANAGER — «ویژگی‌های محصول»
   Full CRUD for the badges an admin assigns to products (Popular, Hot,
   Cold, Special, … or anything else). Nothing is hardcoded: every
   attribute here is created by the admin, in Persian and English, with
   an optional badge color and an active switch.

   Rendered as a section inside the Categories page ("Product
   Attributes" tab). No Navbar here — the host page provides the
   admin layout.
══════════════════════════════════════════════════════════════════ */
function AttributeManager() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('fa')
    ? 'fa'
    : 'en';

  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // attribute | null (create)
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAttributes = async () => {
    setLoadError('');
    try {
      const { data } = await api.get('/attributes');
      setAttributes(data.attributes || []);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
      setLoadError(t('attributes.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (attribute) => {
    setEditing(attribute);
    setForm({
      fa: (attribute.name && attribute.name.fa) || '',
      en: (attribute.name && attribute.name.en) || '',
      color: attribute.color || '',
      isActive: attribute.isActive !== false
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const payload = {
      name: { fa: form.fa.trim(), en: form.en.trim() },
      color: form.color || '',
      isActive: form.isActive
    };

    if (!payload.name.fa && !payload.name.en) {
      setFormError(t('attributes.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/attributes/${editing._id}`, payload);
      } else {
        await api.post('/attributes', payload);
      }
      await fetchAttributes();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save attribute:', error);
      setFormError(
        error.response?.data?.message || t('attributes.saveFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (attribute) => {
    try {
      await api.put(`/attributes/${attribute._id}`, {
        name: attribute.name,
        color: attribute.color || '',
        isActive: attribute.isActive === false
      });
      fetchAttributes();
    } catch (error) {
      console.error('Failed to toggle attribute:', error);
      setLoadError(error.response?.data?.message || t('attributes.saveFailed'));
    }
  };

  const handleDelete = async (attribute) => {
    if (!window.confirm(t('attributes.deleteConfirm'))) return;
    try {
      await api.delete(`/attributes/${attribute._id}`);
      fetchAttributes();
    } catch (error) {
      console.error('Failed to delete attribute:', error);
      setLoadError(error.response?.data?.message || t('attributes.saveFailed'));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">{t('attributes.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('attributes.subtitle')}</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
        >
          {t('attributes.add')}
        </button>
      </div>

      {loadError && (
        <p className="text-sm text-red-500 mb-4" role="alert">{loadError}</p>
      )}

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : attributes.length === 0 && !loadError ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
          <p className="mb-4">{t('attributes.empty')}</p>
          <button
            onClick={openCreate}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
          >
            {t('attributes.add')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attributes.map((attribute) => (
            <div key={attribute._id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <AttributeChip attribute={attribute} lang={lang} />
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    attribute.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {attribute.isActive !== false
                    ? t('common.active')
                    : t('common.inactive')}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p>
                  <span className="text-gray-400">{t('attributes.nameFa')}: </span>
                  {(attribute.name && attribute.name.fa) || '—'}
                </p>
                <p>
                  <span className="text-gray-400">{t('attributes.nameEn')}: </span>
                  {(attribute.name && attribute.name.en) || '—'}
                </p>
                <p>
                  <span className="text-gray-400">{t('attributes.color')}: </span>
                  {attribute.color ? (
                    <span
                      className="inline-block w-4 h-4 rounded align-middle"
                      style={{ background: attribute.color, border: '1px solid var(--color-divider)' }}
                    />
                  ) : (
                    t('attributes.noColor')
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => openEdit(attribute)} className="text-primary">
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleToggleActive(attribute)}
                  className="text-gray-600"
                >
                  {attribute.isActive !== false
                    ? t('attributes.deactivate')
                    : t('attributes.activate')}
                </button>
                <button onClick={() => handleDelete(attribute)} className="text-red-500">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? t('attributes.edit') : t('attributes.add')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('attributes.nameFa')}
                </label>
                <input
                  type="text"
                  dir="rtl"
                  lang="fa"
                  maxLength={MAX_NAME}
                  value={form.fa}
                  onChange={(e) => setForm({ ...form, fa: e.target.value })}
                  placeholder={t('attributes.nameFaPlaceholder')}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('attributes.nameEn')}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  lang="en"
                  maxLength={MAX_NAME}
                  value={form.en}
                  onChange={(e) => setForm({ ...form, en: e.target.value })}
                  placeholder={t('attributes.nameEnPlaceholder')}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('attributes.color')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color || '#6b855e'}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded border p-0.5"
                    aria-label={t('attributes.color')}
                  />
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: form.color || 'var(--color-primary)' }}
                  >
                    {form.fa.trim() || form.en.trim() || t('attributes.preview')}
                  </span>
                  {form.color && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, color: '' })}
                      className="text-xs underline text-gray-500"
                    >
                      {t('attributes.noColor')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('attributes.colorHint')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="attr-active"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="attr-active">{t('attributes.activeLabel')}</label>
              </div>

              {formError && (
                <p className="text-sm text-red-500" role="alert">{formError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary text-white py-2 rounded-lg"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttributeManager;
