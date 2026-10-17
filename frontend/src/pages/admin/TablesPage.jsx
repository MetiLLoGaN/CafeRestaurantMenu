import { useEffect, useState } from 'react';
import api from '../../api/axios';
import Navbar from '../../components/Navbar';
import QRCodeCard from '../../components/QRCodeCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

/* Gold divider */
function GoldDivider() {
  return (
    <div className="gold-divider my-4">
      <span className="gold-divider-icon">◆</span>
    </div>
  );
}

function TablesPage() {
  const { t } = useTranslation();
  const [tables, setTables]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState({ tableNumber: '', label: '' });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.tables || []);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.post('/tables', {
        tableNumber: Number(formData.tableNumber),
        label: formData.label,
      });
      await fetchTables();
      setShowModal(false);
      setFormData({ tableNumber: '', label: '' });
    } catch (err) {
      setFormError(err.response?.data?.message || t('tables.error'));
    } finally {
      setSaving(false);
    }
  };

  /* Print all QR codes */
  const handlePrintAll = () => {
    const win = window.open('', '_blank');
    const qrItems = tables.map((tbl) => {
      const svgEl = document.querySelector(`[data-qr="${tbl._id}"] svg`);
      return { table: tbl, svg: svgEl ? svgEl.outerHTML : '' };
    });

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('tables.printAllTitle')}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans&display=swap" rel="stylesheet">
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family:'DM Sans',sans-serif; background:#fff; padding:24px; }
            .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
            .card {
              border:2px solid #C9A84C; border-radius:16px;
              padding:20px; text-align:center; page-break-inside:avoid;
              position:relative;
            }
            .corner { position:absolute; font-size:14px; color:#C9A84C; opacity:0.5; }
            .corner.tl{top:8px;left:10px} .corner.tr{top:8px;right:10px}
            .corner.bl{bottom:8px;left:10px} .corner.br{bottom:8px;right:10px}
            .qr-wrap { background:#FDF6EC; border-radius:10px; padding:12px; margin-bottom:12px; }
            .qr-wrap svg { width:180px!important; height:180px!important; }
            h3 { font-family:'Playfair Display',serif; font-size:22px; color:#8B1A1A; }
            p  { font-size:12px; color:#8C7B6B; margin-top:3px; font-style:italic; }
            .scan { font-size:10px; color:#8C7B6B; margin-top:10px; }
            @media print { body{padding:8px} }
          </style>
        </head>
        <body>
          <div class="grid">
            ${qrItems.map(({ table: tbl, svg }) => `
              <div class="card">
                <span class="corner tl">◈</span><span class="corner tr">◈</span>
                <span class="corner bl">◈</span><span class="corner br">◈</span>
                <div class="qr-wrap">${svg}</div>
                <h3>${t('common.table', { number: tbl.tableNumber })}</h3>
                ${tbl.label ? `<p>${tbl.label}</p>` : ''}
                <p class="scan">${t('tables.printScan')}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 600);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Navbar title={t('tables.title')}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 animate-fade-up">
        <div>
          <h1
            className="font-display text-2xl"
            style={{ color: 'var(--color-espresso)' }}
          >
            {t('tables.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {t('tables.count', { count: tables.length })}
          </p>
        </div>

        <div className="flex gap-2">
          {tables.length > 0 && (
            <button
              onClick={handlePrintAll}
              className="btn-outline-gold text-sm px-4 py-2.5"
            >
              {t('tables.printAll')}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-sm px-5 py-2.5"
          >
            {t('tables.addTable')}
          </button>
        </div>
      </div>

      <GoldDivider />

      {/* ── Empty state ──────────────────────────────────────── */}
      {tables.length === 0 && (
        <div className="text-center py-20 animate-fade-up">
          <div className="text-6xl mb-4 animate-float">🪑</div>
          <h2
            className="font-display text-2xl mb-2"
            style={{ color: 'var(--color-espresso)' }}
          >
            {t('tables.emptyTitle')}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
            {t('tables.emptySub')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary px-7 py-3"
          >
            {t('tables.addFirstTable')}
          </button>
        </div>
      )}

      {/* ── QR card grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table, i) => (
          <div
            key={table._id}
            className="animate-fade-up"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <QRCodeCard table={table} onDelete={fetchTables} />
          </div>
        ))}
      </div>

      {/* ── Add table modal ──────────────────────────────────── */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            {/* Modal header */}
            <div
              className="px-6 py-5"
              style={{
                borderBottom: '1px solid var(--color-divider)',
                borderTop: '4px solid var(--color-primary)',
                borderRadius: '20px 20px 0 0',
              }}
            >
              <h2
                className="font-display text-xl"
                style={{ color: 'var(--color-espresso)' }}
              >
                {t('tables.modalTitle')}
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                {t('tables.modalSub')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {/* Error */}
              {formError && (
                <div
                  className="px-4 py-3 rounded-xl text-sm animate-fade-down"
                  style={{ background: '#FEE2E2', color: '#991B1B' }}
                >
                  {formError}
                </div>
              )}

              {/* Table number */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {t('tables.tableNumber')}
                </label>
                <input
                  type="number"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                  required
                  min="1"
                  max="999"
                  placeholder={t('tables.tableNumberPlaceholder')}
                  className="input-bordered"
                />
              </div>

              {/* Label */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {t('tables.tableLabel')}
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  maxLength={40}
                  placeholder={t('tables.tableLabelPlaceholder')}
                  className="input-bordered"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  style={{ borderRadius: '12px' }}
                >
                  {saving ? (
                    <>
                      <span className="spinner" style={{ width: '16px', height: '16px', borderColor: 'var(--color-gold-light)', borderTopColor: 'transparent' }} />
                      <span>{t('tables.creating')}</span>
                    </>
                  ) : (
                    <>
                      <span>🪑</span>
                      <span>{t('tables.createTable')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(''); }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition hover:opacity-80"
                  style={{
                    background: 'var(--color-cream-dark)',
                    color: 'var(--color-charcoal)',
                    border: '1px solid var(--color-divider)',
                  }}
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

export default TablesPage;
