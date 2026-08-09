'use client';

import { useState } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';
import { isSafeStorageUrl } from '@/components/InvoiceAttachments';

// StandardFonts (Helvetica etc.) are WinAnsi-only and throw on Romanian
// diacritics (ă, ș, ț) — this app is Romanian-localized, so annotation text
// realistically needs to support them. DejaVu Sans has broad Latin Extended-A
// coverage and ships in public/ so it loads same-origin, no CORS/network
// dependency at runtime.
const ANNOTATION_FONT_URL = '/fonts/DejaVuSans.ttf';

function newAttachmentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `att_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

let rowIdCounter = 0;
const newRowId = () => `row_${Date.now()}_${++rowIdCounter}`;

const blankRow = () => ({ id: newRowId(), page: 1, x: 50, y: 50, text: '', fontSize: 12 });

export default function PdfAnnotateModal({ open, attachment, tenantId, docId, docType, attachments, onClose, onSaved }) {
  const { t } = useI18n();
  const { addToast } = useToast();

  // The parent only mounts this component while a modal session is open (see
  // InvoiceAttachments.js), so a lazy initializer here is enough to give every
  // open session a single blank row — no reset-on-open effect needed.
  const [rows, setRows] = useState(() => [blankRow()]);
  const [applying, setApplying] = useState(false);

  if (!open || !attachment) return null;

  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, blankRow()]);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const hasText = rows.some((r) => (r.text || '').trim().length > 0);

  const handleClose = () => {
    if (applying) return;
    onClose();
  };

  const handleApply = async () => {
    if (!hasText || !tenantId || !docId) return;
    if (!isSafeStorageUrl(attachment.downloadURL)) {
      addToast(t('invoices.attachments.unsafeReference'), 'error');
      return;
    }
    setApplying(true);
    try {
      const [bytes, fontBytes] = await Promise.all([
        fetch(attachment.downloadURL).then((r) => r.arrayBuffer()),
        fetch(ANNOTATION_FONT_URL).then((r) => r.arrayBuffer()),
      ]);
      const pdfDoc = await PDFDocument.load(bytes);
      pdfDoc.registerFontkit(fontkit);
      const font = await pdfDoc.embedFont(fontBytes, { subset: true });

      // Rows whose page index falls outside the document are skipped (this is a
      // lightweight text-overlay tool, not a full editor — see
      // invoices.attachments.annotateHint). If NONE apply, bail out instead of
      // silently re-saving an unchanged PDF as a fake "annotated" success.
      let appliedCount = 0;
      rows.forEach((row) => {
        const text = (row.text || '').trim();
        if (!text) return;
        const pageIndex = Number(row.page) - 1;
        const page = pdfDoc.getPages()[pageIndex];
        if (!page) return;
        const parsedSize = Number(row.fontSize);
        page.drawText(text, {
          x: Number(row.x) || 0,
          y: Number(row.y) || 0,
          size: Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : 12,
          font,
          color: rgb(0.85, 0.1, 0.1),
        });
        appliedCount += 1;
      });

      if (appliedCount === 0) {
        addToast(t('invoices.attachments.noValidPages'), 'error');
        setApplying(false);
        return;
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });

      const storagePath = `tenants/${tenantId}/files/${docType}/${docId}/${Date.now()}_annotated_${attachment.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const newEntry = {
        id: newAttachmentId(),
        name: `annotated_${attachment.name}`,
        storagePath,
        downloadURL,
        contentType: 'application/pdf',
        size: outBytes.byteLength,
        uploadedAt: Date.now(),
        kind: 'edited',
        sourceAttachmentId: attachment.id,
      };

      await onSaved([...(attachments || []), newEntry]);
      addToast(t('invoices.attachments.annotated'), 'success');
    } catch (err) {
      console.error('Failed to save annotated PDF:', err);
      addToast(t('invoices.attachments.annotateFailed'), 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="annotate-pdf-title"
    >
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title" id="annotate-pdf-title">
            ✏️ {attachment.name}
          </h3>
          <button className="modal-close" onClick={handleClose} aria-label={t('common.buttons.close')}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isSafeStorageUrl(attachment.downloadURL) ? (
            <iframe
              src={attachment.downloadURL}
              title={attachment.name}
              style={{ width: '100%', height: 400, border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-sm)' }}
            />
          ) : (
            <p className="text-sm" style={{ color: 'var(--clr-danger)', marginBottom: 'var(--sp-sm)' }}>
              ⚠️ {t('invoices.attachments.unsafeReference')}
            </p>
          )}
          <p className="text-muted text-xs" style={{ marginTop: 0, marginBottom: 'var(--sp-md)' }}>
            {t('invoices.attachments.annotateHint')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            {rows.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 90px 90px 1fr 90px 40px',
                  gap: 'var(--sp-sm)',
                  alignItems: 'end',
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('invoices.attachments.page')}</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={row.page}
                    onChange={(e) => updateRow(row.id, 'page', e.target.value)}
                    aria-label={t('invoices.attachments.page')}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">X</label>
                  <input
                    className="form-input"
                    type="number"
                    value={row.x}
                    onChange={(e) => updateRow(row.id, 'x', e.target.value)}
                    aria-label="X"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Y</label>
                  <input
                    className="form-input"
                    type="number"
                    value={row.y}
                    onChange={(e) => updateRow(row.id, 'y', e.target.value)}
                    aria-label="Y"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('common.description')}</label>
                  <input
                    className="form-input"
                    type="text"
                    value={row.text}
                    onChange={(e) => updateRow(row.id, 'text', e.target.value)}
                    aria-label={t('common.description')}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('invoices.attachments.fontSize')}</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={row.fontSize}
                    onChange={(e) => updateRow(row.id, 'fontSize', e.target.value)}
                    aria-label={t('invoices.attachments.fontSize')}
                  />
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  aria-label={t('common.buttons.delete')}
                  style={{ color: 'var(--clr-danger)', padding: 6 }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={addRow} style={{ marginTop: 'var(--sp-md)' }}>
            <span>+</span> {t('invoices.attachments.addText')}
          </button>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={applying}>
            {t('common.buttons.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={!hasText || applying || !isSafeStorageUrl(attachment.downloadURL)}
          >
            {applying ? t('common.loading') : t('invoices.attachments.applyAndSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
