import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

/* ══════════════════════════════════════════════════════════════════
   Super admin — user management.
   Server-side search / filter / pagination via GET /api/super-admin/users.
   Edit, status toggle and password reset go through the protected
   endpoints; password hashes are never returned by the API and the
   password reset modal never displays a current password.
══════════════════════════════════════════════════════════════════ */

const inputStyle = {
  border: '1.5px solid var(--divider, #d6c9b8)',
  background: 'var(--white, #fff)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '0.88rem',
  color: 'var(--espresso, #2f2a24)',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
};

const btnPrimary = {
  background: 'var(--color-primary, #6b855e)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '9px 18px',
  fontSize: '0.82rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost = {
  background: 'transparent',
  color: 'var(--gold-dark, #8f6a43)',
  border: '1.5px solid var(--gold-light, #d6b895)',
  borderRadius: '10px',
  padding: '8px 14px',
  fontSize: '0.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function Modal({ title, onClose, children }) {
  const { t } = useTranslation();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31, 30, 29, 0.55)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-restaurant animate-fade-up"
        style={{ width: '100%', maxWidth: '440px', padding: '26px' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold" style={{ color: 'var(--espresso)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              color: 'var(--muted)',
            }}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SuperAdminUsersPage() {
  const { t } = useTranslation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // user being edited
  const [editForm, setEditForm] = useState({ name: '', email: '', restaurantName: '', role: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const { data: res } = await api.get('/super-admin/users', { params });
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || t('superAdmin.users.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, t]);

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers();
    }, search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 2500);
  };

  const openEdit = (user) => {
    setEditing(user);
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      restaurantName: user.restaurantName || '',
      role: user.role || 'restaurant_admin',
    });
    setEditError('');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      await api.put(`/super-admin/users/${editing.id}`, {
        name: editForm.name,
        email: editForm.email,
        restaurantName: editForm.restaurantName,
        role: editForm.role,
      });
      setEditing(null);
      flash(t('superAdmin.users.updated'));
      loadUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || t('superAdmin.users.updateError'));
    } finally {
      setEditSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    setError('');
    try {
      await api.put(`/super-admin/users/${user.id}`, { isActive: user.isActive === false });
      flash(t('superAdmin.users.statusUpdated'));
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || t('superAdmin.users.updateError'));
    }
  };

  const openReset = (user) => {
    setResetTarget(user);
    setNewPassword('');
    setResetError('');
  };

  const saveReset = async (e) => {
    e.preventDefault();
    setResetSaving(true);
    setResetError('');
    try {
      await api.put(`/super-admin/users/${resetTarget.id}/password`, { password: newPassword });
      setResetTarget(null);
      flash(t('superAdmin.users.passwordUpdated'));
    } catch (err) {
      setResetError(err.response?.data?.message || t('superAdmin.users.resetError'));
    } finally {
      setResetSaving(false);
    }
  };

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const statusBadge = (user) =>
    user.isActive === false ? (
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'var(--danger-pale, #FEE2E2)', color: 'var(--danger, #991B1B)' }}>
        {t('common.inactive')}
      </span>
    ) : (
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'var(--success-pale, #DCFCE7)', color: 'var(--success, #166534)' }}>
        {t('common.active')}
      </span>
    );

  const roleBadge = (user) => (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={
        user.role === 'super_admin'
          ? { background: 'var(--gold-pale, #f5ede3)', color: 'var(--gold-dark, #8f6a43)' }
          : { background: 'var(--info-pale, #e7edf2)', color: 'var(--info, #4f6d8a)' }
      }>
      {user.role === 'super_admin'
        ? t('superAdmin.roles.super_admin')
        : t('superAdmin.roles.restaurant_admin')}
    </span>
  );

  return (
    <div style={{ padding: '32px 24px' }} className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold" style={{ color: 'var(--espresso)' }}>
            {t('superAdmin.users.title')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {t('superAdmin.users.subtitle')}
          </p>
        </div>
        <Link
          to="/super-admin/users/create"
          style={{
            background: 'var(--color-primary)',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '0.9rem',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
          }}>
          {t('superAdmin.nav.createUser')}
        </Link>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('superAdmin.users.searchPlaceholder')}
          style={inputStyle}
          aria-label={t('superAdmin.users.searchPlaceholder')}
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
          aria-label={t('superAdmin.users.roleFilter')}>
          <option value="">{t('superAdmin.users.allRoles')}</option>
          <option value="restaurant_admin">{t('superAdmin.roles.restaurant_admin')}</option>
          <option value="super_admin">{t('superAdmin.roles.super_admin')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={inputStyle}
          aria-label={t('superAdmin.users.statusFilter')}>
          <option value="">{t('superAdmin.users.allStatuses')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="disabled">{t('common.inactive')}</option>
        </select>
        <div className="text-sm flex items-center" style={{ color: 'var(--muted)' }}>
          {t('superAdmin.users.totalCount', { count: pagination.total })}
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div
          style={{
            background: 'var(--danger-pale, #FEE2E2)',
            color: 'var(--danger, #991B1B)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.88rem',
          }}>
          ⚠️ {error}
        </div>
      )}
      {notice && (
        <div
          style={{
            background: 'var(--success-pale, #DCFCE7)',
            color: 'var(--success, #166534)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            fontSize: '0.88rem',
          }}>
          ✓ {notice}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <div className="card-restaurant p-8 text-center" style={{ color: 'var(--muted)' }}>
          {t('superAdmin.users.empty')}
        </div>
      ) : (
        <div className="card-restaurant overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--divider, #d6c9b8)', color: 'var(--muted)' }}>
                <th className="p-3 text-start font-semibold">{t('common.name')}</th>
                <th className="p-3 text-start font-semibold">{t('superAdmin.users.email')}</th>
                <th className="p-3 text-start font-semibold">{t('superAdmin.users.restaurant')}</th>
                <th className="p-3 text-start font-semibold">{t('superAdmin.users.role')}</th>
                <th className="p-3 text-start font-semibold">{t('superAdmin.users.status')}</th>
                <th className="p-3 text-start font-semibold">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: '1px solid var(--cream-deep, #e2d7c8)' }}>
                  <td className="p-3 font-semibold" style={{ color: 'var(--espresso)' }}>
                    {u.name}
                  </td>
                  <td className="p-3" dir="ltr" style={{ color: 'var(--charcoal)' }}>
                    {u.email}
                  </td>
                  <td className="p-3" style={{ color: 'var(--charcoal)' }}>
                    {u.restaurantName || '—'}
                  </td>
                  <td className="p-3">{roleBadge(u)}</td>
                  <td className="p-3">{statusBadge(u)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button style={btnGhost} onClick={() => openEdit(u)}>
                        {t('common.edit')}
                      </button>
                      <button
                        style={btnGhost}
                        onClick={() => toggleStatus(u)}
                        disabled={u.role === 'super_admin' && u.isActive !== false}>
                        {u.isActive === false ? t('superAdmin.users.activate') : t('superAdmin.users.deactivate')}
                      </button>
                      <button style={btnGhost} onClick={() => openReset(u)}>
                        {t('superAdmin.users.resetPassword')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            style={{ ...btnGhost, opacity: pagination.page <= 1 ? 0.5 : 1 }}
            disabled={pagination.page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            ‹ {t('superAdmin.users.previous')}
          </button>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {pagination.page} / {pagination.pages}
          </span>
          <button
            style={{ ...btnGhost, opacity: pagination.page >= pagination.pages ? 0.5 : 1 }}
            disabled={pagination.page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}>
            {t('superAdmin.users.next')} ›
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <Modal title={t('superAdmin.users.editTitle')} onClose={() => setEditing(null)}>
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {editError && (
              <div
                style={{
                  background: 'var(--danger-pale, #FEE2E2)',
                  color: 'var(--danger, #991B1B)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                }}>
                ⚠️ {editError}
              </div>
            )}
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--espresso)' }}>
              {t('common.name')}
              <input
                style={{ ...inputStyle, marginTop: '6px' }}
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--espresso)' }}>
              {t('superAdmin.users.email')}
              <input
                type="email"
                dir="ltr"
                style={{ ...inputStyle, marginTop: '6px' }}
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </label>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--espresso)' }}>
              {t('superAdmin.users.role')}
              <select
                style={{ ...inputStyle, marginTop: '6px' }}
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="restaurant_admin">{t('superAdmin.roles.restaurant_admin')}</option>
                <option value="super_admin">{t('superAdmin.roles.super_admin')}</option>
              </select>
            </label>
            {editForm.role === 'restaurant_admin' && (
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--espresso)' }}>
                {t('superAdmin.users.restaurant')}
                <input
                  style={{ ...inputStyle, marginTop: '6px' }}
                  value={editForm.restaurantName}
                  onChange={(e) => setEditForm((f) => ({ ...f, restaurantName: e.target.value }))}
                  required
                />
              </label>
            )}
            <button type="submit" disabled={editSaving} style={{ ...btnPrimary, marginTop: '4px' }}>
              {editSaving ? t('superAdmin.users.saving') : t('common.save')}
            </button>
          </form>
        </Modal>
      )}

      {/* Password reset modal */}
      {resetTarget && (
        <Modal title={t('superAdmin.users.resetTitle')} onClose={() => setResetTarget(null)}>
          <form onSubmit={saveReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p className="text-sm" style={{ color: 'var(--charcoal)' }}>
              {t('superAdmin.users.resetHint', { name: resetTarget.name })}
            </p>
            {resetError && (
              <div
                style={{
                  background: 'var(--danger-pale, #FEE2E2)',
                  color: 'var(--danger, #991B1B)',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                }}>
                ⚠️ {resetError}
              </div>
            )}
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--espresso)' }}>
              {t('superAdmin.create.newPassword')}
              <input
                type="password"
                autoComplete="new-password"
                dir="ltr"
                style={{ ...inputStyle, marginTop: '6px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
            <button type="submit" disabled={resetSaving} style={{ ...btnPrimary, marginTop: '4px' }}>
              {resetSaving ? t('superAdmin.users.saving') : t('superAdmin.users.resetConfirm')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default SuperAdminUsersPage;
