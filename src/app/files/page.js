'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu', clientName: 'Popescu Ion' },
  { id: '2', name: 'Bloc Florești - Et. 3', clientName: 'SC Residential SRL' },
  { id: '3', name: 'Birouri Sigma Center', clientName: 'Sigma Development' },
];

const INITIAL_FILES = [
  { id: '1', siteId: '1', name: 'electrical_scheme_ground_floor.pdf', category: 'plans', date: '2026-03-25', size: '2.4 MB', tags: ['schematics', 'ground-floor'], shared: true },
  { id: '2', siteId: '1', name: 'cable_routing_Vila_Popescu.dwg', category: 'plans', date: '2026-04-02', size: '8.1 MB', tags: ['cabling', 'dwg'], shared: false },
  { id: '3', siteId: '1', name: 'construction_permit_cluj.pdf', category: 'permits', date: '2026-03-12', size: '1.8 MB', tags: ['permit', 'official'], shared: true },
  { id: '4', siteId: '1', name: 'transformer_quality_certificate.pdf', category: 'certificates', date: '2026-05-18', size: '0.95 MB', tags: ['transformer', 'certificate'], shared: true },
  
  { id: '5', siteId: '2', name: 'floor3_breaker_layout.pdf', category: 'plans', date: '2026-04-10', size: '1.5 MB', tags: ['breakers', 'floor-3'], shared: true },
  { id: '6', siteId: '2', name: 'milestone1_cabling_photo.jpg', category: 'photos', date: '2026-05-02', size: '4.2 MB', tags: ['milestone-1', 'cabling'], shared: false },
  
  { id: '7', siteId: '3', name: 'sigma_center_hvac_cabling.dwg', category: 'plans', date: '2026-05-15', size: '12.4 MB', tags: ['hvac', 'dwg'], shared: true },
  { id: '8', siteId: '3', name: 'electrical_work_permit.pdf', category: 'permits', date: '2026-05-20', size: '2.1 MB', tags: ['permit', 'work-authorization'], shared: true },
];

const FOLDER_CATEGORIES = ['all', 'plans', 'permits', 'certificates', 'photos'];

const INITIAL_FORM = {
  name: '',
  category: 'plans',
  tags: '',
  size: '1.5 MB',
  shared: true,
};

export default function FilesPage() {
  const { t } = useI18n();

  const [selectedSiteId, setSelectedSiteId] = useState('1');
  const [activeFolder, setActiveFolder] = useState('all');
  const [files, setFiles] = useState(INITIAL_FILES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

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

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpload = () => {
    if (!formData.name.trim()) return;

    const newFile = {
      id: String(Date.now()),
      siteId: selectedSiteId,
      name: formData.name.includes('.') ? formData.name : `${formData.name}.pdf`,
      category: formData.category,
      date: '2026-06-01',
      size: formData.size || '1.0 MB',
      tags: formData.tags ? formData.tags.split(',').map((s) => s.trim()) : [],
      shared: formData.shared,
    };

    setFiles((prev) => [newFile, ...prev]);
    setShowModal(false);
    setFormData(INITIAL_FORM);
  };

  const handleDeleteFile = (id) => {
    if (confirm('Are you sure you want to delete this file? This cannot be undone.')) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    }
  };

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
            {DEMO_SITES.map((site) => (
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
                              onClick={() => alert(`Initiating mock file download for: ${file.name}`)}
                              style={{ padding: '4px 8px' }}
                            >
                              ↓
                            </button>
                            <button
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDeleteFile(file.id)}
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
              {/* File Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-name">
                  {t('files.fields.fileName')} *
                </label>
                <input
                  id="file-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. electrical_layout_ground"
                  required
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

              {/* Mock Size */}
              <div className="form-group">
                <label className="form-label" htmlFor="file-size">
                  File Size Estimator
                </label>
                <input
                  id="file-size"
                  className="form-input"
                  type="text"
                  value={formData.size}
                  onChange={(e) => handleFormChange('size', e.target.value)}
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
                disabled={!formData.name.trim()}
              >
                Upload File
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
