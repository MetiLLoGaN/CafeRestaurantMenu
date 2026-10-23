import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import AttributeManager from '../../components/AttributeManager';
import { useTranslation } from 'react-i18next';

/* ══════════════════════════════════════════════════════════════════
   CATEGORIES
   One page, two sections (tabs): product Categories and Product
   Attributes. Both are reached from the sidebar's Categories entry;
   `initialTab` lets deep links (e.g. the legacy /admin/attributes
   URL) open the right tab.
══════════════════════════════════════════════════════════════════ */
function CategoryPage({ initialTab = 'categories' }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saveError, setSaveError] = useState('');

  const fetchCategories = async () => {
    setLoadError('');
    try {
      const response = await api.get('/menu/categories');
      setCategories(Array.isArray(response.data.categories)
        ? response.data.categories
        : []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setLoadError(t('categories.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError('');
    try {
      if (editingCategory) {
        await api.put(`/menu/categories/${editingCategory._id}`, formData);
      } else {
        await api.post('/menu/categories', formData);
      }
      fetchCategories();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
      setSaveError(error.response?.data?.message || t('categories.saveFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('categories.deleteConfirm'))) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setSaveError('');
    setFormData({ name: category.name, description: category.description || '' });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setSaveError('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    { id: 'categories', label: t('categories.title') },
    { id: 'attributes', label: t('attributes.title') }
  ];

  return (
    <Navbar>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
        {activeTab === 'categories' && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
          >
            {t('categories.addCategory')}
          </button>
        )}
      </div>

      {/* Sections: Categories | Product Attributes */}
      <div
        className="flex gap-1 mb-6 border-b"
        style={{ borderColor: 'var(--color-divider)' }}
        role="tablist"
        aria-label={t('categories.title')}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'attributes' ? (
        <AttributeManager />
      ) : (
      <>
        {/* Load error — keep the page usable with a retry */}
        {loadError && (
          <div
            role="alert"
            className="bg-white p-6 rounded-xl shadow-sm text-center mb-4"
          >
            <p className="text-sm text-red-500 mb-3">{loadError}</p>
            <button
              onClick={fetchCategories}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loadError && categories.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
            <p className="mb-4">{t('categories.empty')}</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
            >
              {t('categories.addCategory')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(category => (
          <div key={category._id} className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{category.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {category.isActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-4">{category.description || t('common.noDescription')}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(category)} className="text-primary">{t('common.edit')}</button>
              <button onClick={() => handleDelete(category._id)} className="text-red-500">{t('common.delete')}</button>
            </div>
          </div>
        ))}
        </div>
      </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? t('categories.editCategory') : t('categories.addCategory')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  maxLength={60}
                  placeholder={t('categories.namePlaceholder')}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={300}
                  placeholder={t('categories.descriptionPlaceholder')}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-500" role="alert">{saveError}</p>
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

export default CategoryPage;
