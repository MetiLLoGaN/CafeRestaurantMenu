import { useState } from 'react';
import QRCode from 'react-qr-code';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';

function QRCodeCard({ table, onDelete }) {
  const { t } = useTranslation();
  const [deleting, setDeleting]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(table.qrCodeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=480,height=620');
    const svgHtml = document.querySelector(`[data-qr="${table._id}"] svg`)?.outerHTML || '';
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t('qr.printTitle', { number: table.tableNumber })}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'DM Sans', sans-serif;
              background: #FDF6EC;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 2rem;
            }
            .card {
              background: white;
              border: 2px solid #C9A84C;
              border-radius: 20px;
              padding: 2.5rem 2rem;
              text-align: center;
              max-width: 340px;
              width: 100%;
              box-shadow: 0 8px 40px rgba(44,26,14,0.15);
              position: relative;
            }
            .corner { position: absolute; font-size: 16px; color: #C9A84C; opacity: 0.6; }
            .corner.tl { top: 10px; left: 12px; }
            .corner.tr { top: 10px; right: 12px; }
            .corner.bl { bottom: 10px; left: 12px; }
            .corner.br { bottom: 10px; right: 12px; }
            .restaurant-name {
              font-family: 'Playfair Display', serif;
              font-size: 20px;
              color: #2C1A0E;
              margin-bottom: 6px;
            }
            .divider {
              display: flex; align-items: center; gap: 8px;
              margin: 12px 0;
            }
            .divider::before, .divider::after {
              content: ''; flex: 1; height: 1px;
              background: linear-gradient(to right, transparent, #C9A84C, transparent);
              opacity: 0.6;
            }
            .divider span { color: #C9A84C; font-size: 12px; }
            .qr-wrap {
              background: #FDF6EC;
              border-radius: 12px;
              padding: 16px;
              display: inline-block;
              margin: 16px 0;
              border: 1px solid #E8D5B7;
            }
            .table-num {
              font-family: 'Playfair Display', serif;
              font-size: 26px;
              font-weight: 700;
              color: #8B1A1A;
              margin-top: 8px;
            }
            .table-label {
              font-size: 13px;
              color: #8C7B6B;
              font-style: italic;
              margin-top: 2px;
            }
            .scan-msg {
              font-size: 12px;
              color: #8C7B6B;
              margin-top: 16px;
              letter-spacing: 0.03em;
            }
            svg { width: 220px !important; height: 220px !important; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="corner tl">◈</span>
            <span class="corner tr">◈</span>
            <span class="corner bl">◈</span>
            <span class="corner br">◈</span>
            <p class="restaurant-name">${t('common.digitalMenu')}</p>
            <div class="divider"><span>◆</span></div>
            <div class="qr-wrap">${svgHtml}</div>
            <p class="table-num">${t('common.table', { number: table.tableNumber })}</p>
            ${table.label ? `<p class="table-label">${table.label}</p>` : ''}
            <p class="scan-msg">${t('qr.scanMsg')}</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/tables/${table._id}`);
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Failed to delete table:', err);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div
        className="card-restaurant ornament-corners animate-fade-up p-4 flex flex-col items-center"
        style={{ border: '2px solid var(--color-gold)', borderRadius: '20px' }}
      >
        {/* QR Code */}
        <div
          data-qr={table._id}
          className="rounded-xl p-3 mb-3 w-full flex items-center justify-center"
          style={{
            background: 'var(--color-cream)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <QRCode
            value={table.qrCodeUrl}
            size={160}
            fgColor="var(--color-espresso)"
            bgColor="transparent"
          />
        </div>

        {/* Table info */}
        <h3
          className="font-display text-xl font-bold"
          style={{ color: 'var(--color-espresso)' }}
        >
          {t('common.table', { number: table.tableNumber })}
        </h3>
        {table.label && (
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-accent)', fontSize: '14px' }}
          >
            {table.label}
          </p>
        )}

        {/* Gold divider */}
        <div className="gold-divider w-full mt-3 mb-3">
          <span className="gold-divider-icon">◆</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 text-xs font-semibold rounded-xl transition hover:scale-105 focus-gold"
            style={{
              background: 'var(--color-primary)',
              color: 'var(--color-gold-light)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {t('qr.print')}
          </button>

          <button
            onClick={handleCopyUrl}
            className="flex-1 py-2 text-xs font-semibold rounded-xl transition hover:scale-105 focus-gold"
            style={{
              background: copied ? '#DCFCE7' : 'var(--color-cream-dark)',
              color: copied ? '#166534' : 'var(--color-charcoal)',
              border: '1px solid var(--color-divider)',
            }}
          >
            {copied ? t('qr.copied') : t('qr.copyUrl')}
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
            aria-label={t('qr.deleteTable')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:scale-110 focus-gold"
            style={{ background: '#FEE2E2', color: '#DC2626' }}
          >
            {deleting ? <span className="spinner" style={{ width: '14px', height: '14px', borderColor: '#DC2626', borderTopColor: 'transparent' }} /> : '🗑'}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-panel p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="font-display text-xl mt-2" style={{ color: 'var(--color-espresso)' }}>
                {t('qr.deleteTitle', { number: table.tableNumber })}
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                {t('qr.deleteWarning')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: '#DC2626' }}
              >
                {t('qr.yesDelete')}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                style={{ background: 'var(--color-cream-dark)', color: 'var(--color-charcoal)' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default QRCodeCard;
