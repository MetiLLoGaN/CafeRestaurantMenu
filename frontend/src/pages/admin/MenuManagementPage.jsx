import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

function MenuManagementPage() {
  const { t } = useTranslation();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isPopular: false,
    preparationTime: ''
  });

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get('/menu/items'),
        api.get('/menu/categories')
      ]);
      setMenuItems(menuRes.data.menuItems);
      setCategories(catRes.data.categories);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/menu/items/${editingItem._id}`, formData);
      } else {
        await api.post('/menu/items', formData);
      }
      fetchData();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
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

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category._id,
      isPopular: item.isPopular,
      preparationTime: item.preparationTime || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      isPopular: false,
      preparationTime: ''
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Navbar>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('menuManagement.title')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-primary text-white px-4 py-2 rounded-lg font-medium"
        >
          {t('menuManagement.addItem')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('menuManagement.item')}</th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('common.category')}</th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('common.price')}</th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('common.available')}</th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('common.popular')}</th>
              <th className="px-4 py-3 text-start text-sm font-medium text-gray-500">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {menuItems.map(item => (
              <tr key={item._id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.category?.name}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(item.price)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(item._id)}
                    className={`w-12 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${item.isAvailable ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-0.5 rtl:-translate-x-0.5'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  {item.isPopular && (
                    <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{t('common.popular')}</span>
                  )}
                </td>
                <td className="px-4 py-3">
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
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
                <label className="block text-sm font-medium mb-1">{t('menuManagement.priceUgx')}</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.category')}</label>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPopular"
                  checked={formData.isPopular}
                  onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                />
                <label htmlFor="isPopular">{t('menuManagement.markPopular')}</label>
              </div>
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
