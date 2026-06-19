'use client';

import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, addTenantDoc, deleteTenantDoc } from '@/lib/firestore';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const FOLDER_CATEGORIES = ['all', 'plans', 'permits', 'certificates', 'photos'];

const INITIAL_FORM = {
  name: '',
  category: 'plans',
  tags: '',
  shared: true,
};

export default function FilesPage() {
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [activeFolder, setActiveFolder] = useState('all');
  const [files, setFiles] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const filteredFiles = useMemo(() => {
    // Filter by site first
    let result = files.filter((f) => f.siteId === selectedSiteId);

    // Filter by category folder
    if (activeFolder !== 'all') {
      result = result.filter((f) => f.category === activeFolder);
    }

    // Filter by search tags query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [files, selectedSiteId, activeFolder, searchQuery]);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubFiles = onTenantCollectionSnapshot(tenantId, 'files', (data) => {
      setFiles(data || []);
      setLoading(false);
    });
    const unsubSites = onTenantCollectionSnapshot(tenantId, 'sites', (data) => {
      setSites(data || []);
      setSelectedSiteId((cur) => cur || (data && data[0]?.id) || '');
    });
    return () => { unsubFiles(); unsubSites(); };
  }, [tenantId]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !tenantId || !selectedSiteId) return;
    setUploading(true);
    try {
      const safeName = formData.name?.trim() || selectedFile.name;
      const storagePath = `tenants/${tenantId}/files/${selectedSiteId}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);
      await addTenantDoc(tenantId, 'files', {
        siteId: selectedSiteId,
        name: safeName,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()) : [],
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
        contentType: selectedFile.type || 'application/octet-stream',
        storagePath,
        downloadURL,
        shared: formData.shared || false,
      });
      setShowModal(false);
      setFormData(INITIAL_FORM);
      setSelectedFile(null);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file) => {
    if (!confirm('Are you sure you want to delete this file? This cannot be undone.') || !tenantId) return;
    try {
      if (file.storagePath) {
        await deleteObject(ref(storage, file.storagePath)).catch(() => {});
      }
      await deleteTenantDoc(tenantId, 'files', file.id);
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  if (loading || !tenantId) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="spinner" aria-label={t('common.loading')}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--clr-primary)" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📁 {t('files.title')}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>+</span> {t('files.uploadFile')}
          </button>
        </div>
      </div>

      {/* Select Site Dropdown */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div className="form-group" style={{ margin: 0, maxWidth: 360 }}>
          <label className="form-label" htmlFor="site-select">{t('quotes.fields.site')}</label>
          <select
            id="site-select"
            className="form-select"
            value={selectedSiteId}
            onChange={(e) => {
              setSelectedSiteId(e.target.value);
              setActiveFolder('all');
            }}
          >
            {sites.length === 0 && (
              <option value="">No sites available</option>
            )}
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} — {site.clientName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Folders and Search Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--sp-lg)' }} className="files-layout">
        {/* Left Column: Folders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {/* Folders Classification chips */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 'var(--sp-sm)' }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 12px' }}>
              Categories
            </span>
            {FOLDER_CATEGORIES.map((folder) => (
              <button
                key={folder}
                className={`sidebar-link ${activeFolder === folder ? 'active' : ''}`}
                onClick={() => setActiveFolder(folder)}
                style={{
                  border: 'none',
                  textAlign: 'left',
                  background: activeFolder === folder ? 'var(--clr-primary-subtle)' : 'transparent',
                  width: '100%',
                }}
              >
                <span className="sidebar-link-icon">
                  {folder === 'all' ? '📂' : folder === 'plans' ? '📐' : folder === 'permits' ? '📜' : folder === 'certificates' ? '🛡️' : '📸'}
                </span>
                {folder === 'all' ? t('common.all') : t(`files.categories.${folder}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Files table & search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {/* Search bar */}
          <div className="search-bar" style={{ margin: 0 }}>
            <span className="search-bar-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder={t('files.searchFiles')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="file-search"
              aria-label={t('files.searchFiles')}
            />
          </div>

          {/* Files List Table */}
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📁</div>
              <div className="empty-state-title">
                {searchQuery || activeFolder !== 'all'
                  ? t('common.noResults')
                  : t('files.noFiles')}
              </div>
              <div className="empty-state-desc">
                {searchQuery || activeFolder !== 'all'
                  ? ''
                  : t('files.noFilesDescription')}
              </div>
              {!searchQuery && activeFolder === 'all' && (
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <span>+</span> {t('files.uploadFile')}
                </button>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('files.fields.fileName')}</th>
                      <th>Category</th>
                      <th>{t('files.fields.uploadedAt')}</th>
                      <th>{t('files.fields.size')}</th>
                      <th>{t('files.fields.tags')}</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id}>
                        <td className="font-semibold">
                          <span style={{ marginRight: 6 }}>
                            {file.category === 'plans' ? '📐' : file.category === 'permits' ? '📜' : file.category === 'certificates' ? '🛡️' : '📸'}
                          </span>
                          {file.name}
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            {t(`files.categories.${file.category}`)}
                          </span>
                        </td>
                        <td className="text-muted">{file.date}</td>
                        <td className="text-muted">{file.size}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {file.tags.map((tag) => (
                              <span key={tag} className="badge badge-accent" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-xs"
                              onClick={() => file.downloadURL && window.open(file.downloadURL, '_blank')}
                              style={{ padding: '4px 8px' }}
                              disabled={!file.downloadURL}
                            >
                              ↓
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDeleteFile(file)}
                              style={{ padding: '4px 8px' }}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mock Upload file modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-file-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="upload-file-title">
                {t('files.uploadFile')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* File Picker */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-picker">
                  Select File *
                </label>
                <input
                  id="file-picker"
                  className="form-input"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file) handleFormChange('name', file.name);
                  }}
                  required
                />
              </div>

              {/* File Name (editable, defaulted from picker) */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-name">
                  {t('files.fields.fileName')}
                </label>
                <input
                  id="file-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. electrical_layout_ground"
                />
              </div>

              {/* Folder Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-cat">
                  {t('files.fields.category')}
                </label>
                <select
                  id="file-cat"
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  <option value="plans">{t('files.categories.plans')}</option>
                  <option value="permits">{t('files.categories.permits')}</option>
                  <option value="certificates">{t('files.categories.certificates')}</option>
                  <option value="photos">{t('files.categories.photos')}</option>
                </select>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-tags">
                  Tags (separated by commas)
                </label>
                <input
                  id="file-tags"
                  className="form-input"
                  type="text"
                  placeholder="e.g. cabling, floor-1, approved"
                  value={formData.tags}
                  onChange={(e) => handleFormChange('tags', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive directory layout */}
      <style jsx>{`
        @media (max-width: 768px) {
          .files-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
