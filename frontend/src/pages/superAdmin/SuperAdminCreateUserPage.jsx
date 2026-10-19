import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

/* ══════════════════════════════════════════════════════════════════
   Super admin — create account form.
   Fields mirror the existing User model. Validation runs here AND on
   the backend (the backend is authoritative). The initial password is
   set here, hashed server-side by the User model's pre('save') hook,
   and is never echoed back by the API.
══════════════════════════════════════════════════════════════════ */

const inputStyle = {
  border: '1.5px solid var(--divider, #d6c9b8)',
  background: 'var(--white, #fff)',
  borderRadius: '12px',
  padding: '13px 16px',
  fontSize: '0.9rem',
  color: 'var(--espresso, #2f2a24)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--espresso, #2f2a24)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '8px',
};

function SuperAdminCreateUserPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'restaurant_admin',
    restaurantName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (me?.role !== 'super_admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [me, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) return setError(t('superAdmin.create.errors.name'));
    if (!form.email.trim()) return setError(t('superAdmin.create.errors.email'));
    if (form.password.length < 6) return setError(t('superAdmin.create.errors.passwordMin'));
    if (form.password !== form.confirmPassword) return setError(t('superAdmin.create.errors.passwordMismatch'));
    if (form.role === 'restaurant_admin' && !form.restaurantName.trim()) {
      return setError(t('superAdmin.create.errors.restaurantName'));
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/super-admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        restaurantName: form.role === 'restaurant_admin' ? form.restaurantName.trim() : '',
      });
      navigate('/super-admin/users', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('superAdmin.create.errors.failed'));
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px' }} className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--espresso)' }}>
        {t('superAdmin.create.title')}
      </h1>
      <p className="text-sm mb-7" style={{ color: 'var(--muted)' }}>
        {t('superAdmin.create.subtitle')}
      </p>

      <div className="card-restaurant" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div
              style={{
                background: 'var(--danger-pale, #FEE2E2)',
                color: 'var(--danger, #991B1B)',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '0.84rem',
                display: 'flex',
                gap: '8px',
              }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Full name */}
          <div>
            <label htmlFor="sa-name" style={labelStyle}>
              {t('register.fullName')}
            </label>
            <input
              id="sa-name"
              style={inputStyle}
              value={form.name}
              onChange={set('name')}
              placeholder={t('register.fullNamePlaceholder')}
              required
              autoComplete="name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="sa-email" style={labelStyle}>
              {t('superAdmin.users.email')}
            </label>
            <input
              id="sa-email"
              type="email"
              dir="ltr"
              style={inputStyle}
              value={form.email}
              onChange={set('email')}
              placeholder={t('register.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="sa-role" style={labelStyle}>
              {t('superAdmin.users.role')}
            </label>
            <select id="sa-role" style={inputStyle} value={form.role} onChange={set('role')}>
              <option value="restaurant_admin">{t('superAdmin.roles.restaurant_admin')}</option>
              <option value="super_admin">{t('superAdmin.roles.super_admin')}</option>
            </select>
          </div>

          {/* Restaurant association — only for restaurant admins */}
          {form.role === 'restaurant_admin' && (
            <div>
              <label htmlFor="sa-restaurant" style={labelStyle}>
                {t('superAdmin.users.restaurant')}
              </label>
              <input
                id="sa-restaurant"
                style={inputStyle}
                value={form.restaurantName}
                onChange={set('restaurantName')}
                placeholder={t('register.restaurantPlaceholder')}
                required
              />
            </div>
          )}

          {/* Initial password */}
          <div>
            <label htmlFor="sa-password" style={labelStyle}>
              {t('superAdmin.create.initialPassword')}
            </label>
            <input
              id="sa-password"
              type="password"
              dir="ltr"
              style={inputStyle}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '6px 0 0' }}>
              {t('register.passwordHint')}
            </p>
          </div>

          {/* Confirm password */}
          <div>
            <label htmlFor="sa-confirm" style={labelStyle}>
              {t('register.confirmPassword')}
            </label>
            <input
              id="sa-confirm"
              type="password"
              dir="ltr"
              style={inputStyle}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-wrap gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--color-primary-hover, #5b6f4f)' : 'var(--color-primary, #6b855e)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 32px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: 'var(--shadow-sm)',
              }}>
              {loading ? t('superAdmin.create.creating') : t('superAdmin.create.submit')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/super-admin/users')}
              style={{
                background: 'transparent',
                color: 'var(--gold-dark, #8f6a43)',
                border: '1.5px solid var(--gold-light, #d6b895)',
                borderRadius: '12px',
                padding: '12px 26px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuperAdminCreateUserPage;
