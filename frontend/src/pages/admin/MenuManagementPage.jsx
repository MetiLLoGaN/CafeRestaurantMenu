import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import resolveImageUrl from '../../utils/resolveImageUrl';
import { useTranslation } from 'react-i18next';
import { useFormatPrice } from '../../utils/currency';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB — mirrors the server limit

function MenuManagementPage() {
  const { t, i18n } = useTranslation();
  const formatPrice = useFormatPrice();
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').startsWith('fa')
    ? 'fa'
    : 'en';
  const [menuItems, setMenuItems] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Categories are fetched independently of menu items/attributes so a
     failure in any other request can never leave the Add/Edit form
     without its category list. Own loading / error state for the select. */
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isPopular: false,
    preparationTime: '',
    attributes: []
  });

  /* Inline "new attribute" panel inside the product form, so attribute
     management is reachable without leaving the add/edit flow. */
  const [quickCreate, setQuickCreate] = useState(false);
  const [quickForm, setQuickForm] = useState({ fa: '', en: '', color: '' });
  const [quickError, setQuickError] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  /* Localized, fall-back-aware label for an attribute document */
  const attributeLabel = (attribute) =>
    (attribute.name && (attribute.name[lang] || attribute.name[lang === 'fa' ? 'en' : 'fa'])) || '';

  /* Image upload state */
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [saveError, setSaveError] = useState('');

  /* Dedicated fetch for the category selector — its own loading / error
     handling and a safe fallback if the response shape ever changes. */
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError('');
    try {
      const { data } = await api.get('/menu/categories');
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
      setCategoriesError(t('menuManagement.categoriesLoadFailed'));
    } finally {
      setCategoriesLoading(false);
    }
  };

  /* allSettled instead of all: one rejected request no longer discards
     the successful responses of the others (previously a single failed
     call silently left the category selector empty). */
  const fetchData = async () => {
    const [menuRes, attrRes] = await Promise.allSettled([
      api.get('/menu/items'),
      api.get('/attributes')
    ]);
    if (menuRes.status === 'fulfilled') {
      setMenuItems(Array.isArray(menuRes.value.data.menuItems)
        ? menuRes.value.data.menuItems
        : []);
    } else {
      console.error('Failed to fetch menu items:', menuRes.reason);
    }
    if (attrRes.status === 'fulfilled') {
      setAttributes(Array.isArray(attrRes.value.data.attributes)
        ? attrRes.value.data.attributes
        : []);
    } else {
      console.error('Failed to fetch attributes:', attrRes.reason);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    try {
      /* 1) Save the item fields — image upload happens afterwards so the
            item exists even if the upload step fails */
      let savedItem;
      if (editingItem) {
        const res = await api.put(`/menu/items/${editingItem._id}`, formData);
        savedItem = res.data.menuItem;
      } else {
        const res = await api.post('/menu/items', formData);
        savedItem = res.data.menuItem;
      }

      /* 2) Upload the newly selected image or apply the pending removal */
      if (savedItem?._id) {
        if (imageFile) {
          const imageForm = new FormData();
          imageForm.append('image', imageFile);
          await api.post(`/menu/items/${savedItem._id}/image`, imageForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else if (editingItem && removeImage) {
          await api.delete(`/menu/items/${savedItem._id}/image`);
        }
      }

      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
      setSaveError(t('menuManagement.saveFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('menuManagement.deleteConfirm'))) return;
    try {
      await api.delete(`/menu/items/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/menu/items/${id}/toggle`);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const clearSelectedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) {
      window.alert(t('menuManagement.imageInvalid'));
      return;
    }

    clearSelectedImage();
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const openEdit = (item) => {
    clearSelectedImage();
    setRemoveImage(false);
    setSaveError('');
    setQuickCreate(false);
    setQuickError('');
    fetchCategories(); /* newly added categories become available */
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      /* the linked category may have been deleted — keep the form usable */
      category: item.category?._id || '',
      isPopular: item.isPopular,
      preparationTime: item.preparationTime || '',
      attributes: (item.attributes || [])
        .filter((a) => a && a._id)
        .map((a) => a._id)
    });
    setShowModal(true);
  };

  const toggleAttribute = (id) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.includes(id)
        ? prev.attributes.filter((a) => a !== id)
        : [...prev.attributes, id]
    }));
  };

  /* NOTE: the quick-create panel deliberately does NOT use a nested
     <form>. HTML parsers drop <form> inside <form>, so its onSubmit
     never bound and the "Create & assign" button fell through to the
     OUTER product form — saving the item and closing the whole modal.
     The panel uses type="button" + explicit handlers instead. */
  const handleQuickCreate = async () => {
    if (quickSaving) return;
    setQuickError('');

    const payload = {
      name: { fa: quickForm.fa.trim(), en: quickForm.en.trim() },
      color: quickForm.color || ''
    };
    if (!payload.name.fa && !payload.name.en) {
      setQuickError(t('attributes.nameRequired'));
      return;
    }

    setQuickSaving(true);
    try {
      const { data } = await api.post('/attributes', payload);
      const created = data.attribute;
      /* Stay inside the Add/Edit form: only extend the lists, never reset
         the product fields, and never assign the same id twice. */
      setAttributes((prev) =>
        prev.some((a) => a._id === created._id) ? prev : [created, ...prev]
      );
      setFormData((prev) => ({
        ...prev,
        attributes: prev.attributes.includes(created._id)
          ? prev.attributes
          : [...prev.attributes, created._id]
      }));
      setQuickForm({ fa: '', en: '', color: '' });
      setQuickCreate(false);
    } catch (error) {
      console.error('Failed to create attribute:', error);
      setQuickError(error.response?.data?.message || t('attributes.saveFailed'));
    } finally {
      setQuickSaving(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isPopular: false,
      preparationTime: '',
      attributes: []
    });
    clearSelectedImage();
    setRemoveImage(false);
    setSaveError('');
    setQuickCreate(false);
    setQuickForm({ fa: '', en: '', color: '' });
    setQuickError('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Navbar>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('menuManagement.title')}</h1>
        <button
          onClick={() => { resetForm(); fetchCategories(); setShowModal(true); }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
        >
          {t('menuManagement.addItem')}
        </button>
      </div>

      {/* The row must FIT the available width at every breakpoint
          (no sideways scrolling to reach price/actions on phones):
          - min-w removed — it forced the table wider than the screen.
          - Lower-priority columns drop out below lg/xl; Item, Price and
            Actions are always visible, Available from sm up.
          - px-2 lg:px-4 + text-xs lg:text-sm keep the compact widths
            readable on phones.
          overflow-x-auto stays purely as a safety net. */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('menuManagement.item')}</th>
              <th className="hidden lg:table-cell px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('common.category')}</th>
              <th className="px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('common.price')}</th>
              <th className="hidden sm:table-cell px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('common.available')}</th>
              <th className="hidden xl:table-cell px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('common.popular')}</th>
              <th className="hidden xl:table-cell px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('attributes.assign')}</th>
              <th className="px-2 lg:px-4 py-3 text-start text-xs lg:text-sm font-medium text-gray-500 whitespace-nowrap">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {menuItems.map(item => (
              <tr key={item._id}>
                <td className="px-2 lg:px-4 py-3 max-w-[150px] sm:max-w-[300px]">
                  <div className="flex items-center gap-2 xl:gap-3 min-w-0">
                    {item.image && (
                      <img
                        src={resolveImageUrl(item.image)}
                        alt={item.name}
                        className="w-10 xl:w-12 h-10 xl:h-12 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    {/* min-w-0 + clamp/truncate: long names and descriptions
                        shrink gracefully instead of breaking the row */}
                    <div className="min-w-0">
                      <p className="font-medium truncate" title={item.name}>{item.name}</p>
                      <p className="text-xs xl:text-sm text-gray-500 clamp-2" title={item.description}>{item.description}</p>
                    </div>
                  </div>
                </td>
                <td
                  className="hidden lg:table-cell px-2 lg:px-4 py-3 text-gray-600 max-w-[140px] truncate"
                  title={item.category?.name || ''}
                >
                  {item.category?.name || '—'}
                </td>
                <td className="px-2 lg:px-4 py-3 text-xs lg:text-sm font-medium whitespace-nowrap">{formatPrice(item.price)}</td>
                <td className="hidden sm:table-cell px-2 lg:px-4 py-3">
                  <button
                    onClick={() => handleToggle(item._id)}
                    className={`w-12 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${item.isAvailable ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="hidden xl:table-cell px-2 lg:px-4 py-3">
                  {item.isPopular && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{t('common.popular')}</span>
                  )}
                </td>
                <td className="hidden xl:table-cell px-2 lg:px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-[220px]">
                    {(item.attributes || []).map((attribute) => (
                      <span
                        key={attribute._id}
                        title={attributeLabel(attribute)}
                        className="text-xs px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                        style={{ background: attribute.color || 'var(--color-primary)' }}
                      >
                        {attributeLabel(attribute) || '—'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-xs lg:text-sm">
                  <button onClick={() => openEdit(item)} className="text-primary me-2">{t('common.edit')}</button>
                  <button onClick={() => handleDelete(item._id)} className="text-red-500">{t('common.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? t('menuManagement.editItem') : t('menuManagement.addItem')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('menuManagement.priceToman')}</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="1"
                  inputMode="numeric"
                  className="w-full border rounded-lg p-2"
                />
                <p className="text-xs text-gray-500 mt-1">{t('menuManagement.priceHint')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.category')}</label>

                {categoriesLoading ? (
                  /* Loading state */
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-2" role="status">
                    <span className="spinner spinner-sm" aria-hidden="true" />
                    <span>{t('common.loading')}</span>
                  </div>
                ) : categoriesError ? (
                  /* Error state — retry without reopening the form */
                  <div className="text-sm py-1" role="alert">
                    <p className="text-red-500 mb-1">{categoriesError}</p>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      className="text-xs text-primary underline"
                    >
                      {t('common.tryAgain')}
                    </button>
                  </div>
                ) : categories.length === 0 ? (
                  /* Empty state — point the admin at the Categories page */
                  <p className="text-xs text-gray-500 py-1">
                    {t('menuManagement.noCategories')}{' '}
                    <Link to="/admin/categories" className="text-primary underline">
                      {t('menuManagement.createCategory')}
                    </Link>
                  </p>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full border rounded-lg p-2"
                  >
                    <option value="">{t('menuManagement.selectCategory')}</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('menuManagement.prepTime')}</label>
                <input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              {/* Assign admin-defined attributes (badges) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">
                    {t('attributes.assign')}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setQuickCreate((v) => !v); setQuickError(''); }}
                    className="text-xs text-primary font-medium"
                  >
                    {quickCreate ? t('common.cancel') : t('attributes.quickAdd')}
                  </button>
                </div>

                {attributes.length === 0 ? (
                  <p className="text-xs text-gray-500 mb-2">{t('attributes.none')}</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attributes.map((attribute) => {
                      const selected = formData.attributes.includes(attribute._id);
                      return (
                        <button
                          type="button"
                          key={attribute._id}
                          onClick={() => toggleAttribute(attribute._id)}
                          aria-pressed={selected}
                          className="text-xs px-2.5 py-1 rounded-full transition"
                          style={
                            selected
                              ? {
                                  background: attribute.color || 'var(--color-primary)',
                                  color: '#fff',
                                  border: '1px solid transparent'
                                }
                              : {
                                  background: '#fff',
                                  color: 'var(--color-charcoal)',
                                  border: '1px solid var(--color-divider)'
                                }
                          }
                        >
                          {attributeLabel(attribute) || '—'}
                        </button>
                      );
                    })}
                  </div>
                )}

                <Link to="/admin/attributes" className="text-xs text-primary underline">
                  {t('attributes.manage')}
                </Link>

                {quickCreate && (
                  <div
                    className="border rounded-lg p-3 mt-2 space-y-2"
                    /* Enter inside the panel creates the attribute instead
                       of submitting (and closing) the product form */
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickCreate();
                      }
                    }}
                  >
                    <p className="text-xs text-gray-500">{t('attributes.quickAddHint')}</p>
                    <input
                      type="text"
                      dir="rtl"
                      lang="fa"
                      maxLength={40}
                      value={quickForm.fa}
                      onChange={(e) => setQuickForm({ ...quickForm, fa: e.target.value })}
                      placeholder={t('attributes.nameFaPlaceholder')}
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      lang="en"
                      maxLength={40}
                      value={quickForm.en}
                      onChange={(e) => setQuickForm({ ...quickForm, en: e.target.value })}
                      placeholder={t('attributes.nameEnPlaceholder')}
                      className="w-full border rounded-lg p-2 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={quickForm.color || '#6b855e'}
                        onChange={(e) => setQuickForm({ ...quickForm, color: e.target.value })}
                        className="w-8 h-8 rounded border p-0.5"
                        aria-label={t('attributes.color')}
                      />
                      <span className="text-xs text-gray-500">{t('attributes.colorHint')}</span>
                    </div>
                    {quickError && (
                      <p className="text-xs text-red-500" role="alert">{quickError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={quickSaving}
                        onClick={(e) => {
                          /* never let the click reach the outer product
                             form's submit handler / parent handlers */
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickCreate();
                        }}
                        className="flex-1 bg-primary text-white text-sm py-1.5 rounded-lg"
                      >
                        {quickSaving ? t('common.loading') : t('attributes.createAndAssign')}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setQuickCreate(false); setQuickError(''); }}
                        className="text-sm px-3 py-1.5 border rounded-lg bg-white"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('menuManagement.image')}</label>

                {/* Current stored image */}
                {editingItem?.image && !removeImage && !imagePreview && (
                  <img
                    src={resolveImageUrl(editingItem.image)}
                    alt={editingItem.name}
                    className="w-24 h-24 rounded-lg object-cover border mb-2"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}

                {/* Preview of the newly selected file */}
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt={t('menuManagement.imagePreviewAlt')}
                    className="w-24 h-24 rounded-lg object-cover border mb-2"
                  />
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer px-3 py-2 rounded-lg border text-sm bg-white">
                    {editingItem?.image && !removeImage && !imagePreview
                      ? t('menuManagement.replaceImage')
                      : t('menuManagement.uploadImage')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>

                  {editingItem?.image && !removeImage && !imagePreview && (
                    <button
                      type="button"
                      onClick={() => setRemoveImage(true)}
                      className="px-3 py-2 rounded-lg border text-sm text-red-500 bg-white"
                    >
                      {t('menuManagement.removeImage')}
                    </button>
                  )}

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={clearSelectedImage}
                      className="px-3 py-2 rounded-lg border text-sm bg-white"
                    >
                      {t('common.cancel')}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">{t('menuManagement.imageHint')}</p>
                {removeImage && !imagePreview && (
                  <p className="text-xs text-red-500 mt-1">{t('menuManagement.imageWillBeRemoved')}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                />
                <label htmlFor="isPopular">{t('menuManagement.markPopular')}</label>
              </div>
              {saveError && (
                <p className="text-sm text-red-500">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-primary text-white py-2 rounded-lg">
                  {t('common.save')}
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
    </Navbar>
  );
}

export default MenuManagementPage;
