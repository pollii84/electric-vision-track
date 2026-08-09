'use client';

import { useRef, useState, Fragment } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';
import PdfAnnotateModal from '@/components/PdfAnnotateModal';

const MAX_SIZE_BYTES = 25 * 1024 * 1024;

function isPdf(att) {
  return (att.contentType || '').startsWith('application/pdf') || /\.pdf$/i.test(att.name || '');
}

function isWordDoc(att) {
  const type = att.contentType || '';
  return type.includes('word') || type.includes('msword') || type.includes('officedocument.wordprocessingml') || /\.docx?$/i.test(att.name || '');
}

function validateFile(file) {
  const name = file.name || '';
  const type = file.type || '';
  const extOk = /\.(pdf|doc|docx)$/i.test(name);
  const typeOk =
    !type ||
    type.startsWith('application/pdf') ||
    type.includes('word') ||
    type.includes('msword') ||
    type.includes('officedocument.wordprocessingml');
  return extOk && typeOk;
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function newAttachmentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `att_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Firestore attachment docs are writable by any tenant manager with no schema
// enforcement — a compromised/malicious member could plant an arbitrary
// downloadURL. Only ever render/open URLs that actually point at Firebase
// Storage before trusting them in an iframe or new tab.
export function isSafeStorageUrl(url) {
  return typeof url === 'string' && url.startsWith('https://firebasestorage.googleapis.com/');
}

export default function InvoiceAttachments({ tenantId, docType, docId, attachments, onChange }) {
  const { t } = useI18n();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [annotateAttachment, setAnnotateAttachment] = useState(null);

  const list = attachments || [];

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    // reset input so the same file can be re-selected later
    e.target.value = '';
    if (!file || !tenantId || !docId) return;

    if (!validateFile(file)) {
      addToast(t('invoices.attachments.invalidType'), 'error');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      addToast(t('invoices.attachments.tooLarge'), 'error');
      return;
    }

    setUploading(true);
    try {
      const storagePath = `tenants/${tenantId}/files/${docType}/${docId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const newEntry = {
        id: newAttachmentId(),
        name: file.name,
        storagePath,
        downloadURL,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: Date.now(),
        kind: 'original',
        sourceAttachmentId: null,
      };

      await onChange([...list, newEntry]);
      addToast(t('invoices.attachments.uploaded'), 'success');
    } catch (err) {
      console.error('Failed to upload attachment:', err);
      addToast(t('invoices.attachments.uploadFailed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId((cur) => (cur === id ? null : id));
  };

  const handleRemove = async (att) => {
    if (!confirm(t('invoices.attachments.confirmRemove'))) return;
    if (att.storagePath) {
      try {
        await deleteObject(ref(storage, att.storagePath));
      } catch (err) {
        // Fail closed: if the Storage object didn't actually get deleted, keep the
        // Firestore reference so the file isn't silently orphaned with nothing
        // pointing at it, and tell the user instead of failing silently.
        console.error('Failed to delete attachment from storage:', err);
        addToast(t('invoices.attachments.removeFailed'), 'error');
        return;
      }
    }
    try {
      await onChange(list.filter((a) => a.id !== att.id));
      if (expandedId === att.id) setExpandedId(null);
    } catch (err) {
      console.error('Failed to update attachments list:', err);
      addToast(t('invoices.attachments.removeFailed'), 'error');
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
        <h3 style={{ margin: 0 }}>🗂️ {t('invoices.attachments.title')}</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn btn-primary btn-sm" onClick={handlePickFile} disabled={uploading}>
            {uploading ? t('invoices.attachments.uploading') : `📎 ${t('invoices.attachments.upload')}`}
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ minWidth: 200 }}>{t('common.name')}</th>
              <th style={{ width: 130 }}>{t('files.fields.uploadedAt')}</th>
              <th style={{ width: 100 }}>{t('files.fields.size')}</th>
              <th style={{ width: 260 }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                  {t('invoices.attachments.empty')}
                </td>
              </tr>
            ) : (
              list.map((att) => {
                const pdf = isPdf(att);
                const docLike = isWordDoc(att);
                const expanded = expandedId === att.id;
                const urlSafe = isSafeStorageUrl(att.downloadURL);
                return (
                  <Fragment key={att.id}>
                    <tr>
                      <td className="font-semibold">
                        <span style={{ marginRight: 6 }}>{pdf ? '📄' : '📝'}</span>
                        {att.name}
                        {att.kind === 'edited' && (
                          <span className="badge badge-accent" style={{ marginLeft: 8, fontSize: '10px', padding: '1px 6px' }}>
                            ✏️ {t('invoices.attachments.editedBadge')}
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : ''}</td>
                      <td className="text-muted">{formatSize(att.size)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                          {pdf && urlSafe && (
                            <button className="btn btn-secondary btn-xs" onClick={() => toggleExpanded(att.id)}>
                              👁️ {t('invoices.attachments.view')}
                            </button>
                          )}
                          {pdf && urlSafe && (
                            <button className="btn btn-secondary btn-xs" onClick={() => setAnnotateAttachment(att)}>
                              ✏️ {t('invoices.attachments.annotate')}
                            </button>
                          )}
                          {docLike && !pdf && (
                            <span className="text-muted text-xs">{t('invoices.attachments.docNoPreview')}</span>
                          )}
                          {urlSafe ? (
                            <button className="btn btn-secondary btn-xs" onClick={() => window.open(att.downloadURL, '_blank')}>
                              ⬇️ {t('invoices.attachments.download')}
                            </button>
                          ) : (
                            <span className="text-muted text-xs" style={{ color: 'var(--clr-danger)' }}>⚠️ {t('invoices.attachments.unsafeReference')}</span>
                          )}
                          <button className="btn btn-danger btn-xs" onClick={() => handleRemove(att)}>
                            🗑️ {t('invoices.attachments.remove')}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {pdf && expanded && urlSafe && (
                      <tr>
                        <td colSpan="4">
                          <iframe
                            src={att.downloadURL}
                            title={att.name}
                            style={{ width: '100%', height: 500, border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {annotateAttachment && (
        <PdfAnnotateModal
          open
          attachment={annotateAttachment}
          tenantId={tenantId}
          docId={docId}
          docType={docType}
          attachments={list}
          onClose={() => setAnnotateAttachment(null)}
          onSaved={async (next) => {
            await onChange(next);
            setAnnotateAttachment(null);
          }}
        />
      )}
    </>
  );
}
