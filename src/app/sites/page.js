'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, addTenantDoc } from '@/lib/firestore';

const STATUS_FILTERS = ['all', 'planned', 'in_progress', 'on_hold', 'completed'];

const STATUS_BADGES = {
  planned: 'badge-primary',
  in_progress: 'badge-warning',
  on_hold: 'badge-neutral',
  completed: 'badge-success',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FFCA00, #E0B200)',
  'linear-gradient(135deg, #0693E3, #0570B0)',
  'linear-gradient(135deg, #22C55E, #16A34A)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #EF4444, #DC2626)',
  'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  'linear-gradient(135deg, #EC4899, #DB2777)',
  'linear-gradient(135deg, #06B6D4, #0891B2)',
];

const INITIAL_FORM = {
  name: '',
  address: '',
  clientName: '',
  description: '',
  status: 'planned',
  startDate: '',
  endDate: '',
  budget: '',
};

export default function SitesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubscribe = onTenantCollectionSnapshot(tenantId, 'sites', (data) => {
      setSites(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredSites = useMemo(() => {
    let result = sites || [];

    if (selectedFilter !== 'all') {
      result = result.filter((s) => s.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(query) ||
          (s.clientName || '').toLowerCase().includes(query) ||
          (s.address || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [sites, searchQuery, selectedFilter]);

  const formatBudget = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim() || !tenantId) return;

    const newSite = {
      ...formData,
      progress: 0,
      budget: Number(formData.budget) || 0,
      workers: [],
    };

    try {
      await addTenantDoc(tenantId, 'sites', newSite);
      setFormData(INITIAL_FORM);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save site:', err);
    }
  };

  const handleCloseModal = () => {
    setFormData(INITIAL_FORM);
    setShowModal(false);
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
        <h1>🏗️ {t('sites.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-site-btn"
            aria-label={t('sites.addSite')}
          >
            <span>+</span>
            {t('sites.addSite')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('sites.searchSites')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="site-search"
            aria-label={t('sites.searchSites')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === 'all' ? t('common.all') : t(`sites.statuses.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Sites Grid */}
      {filteredSites.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏗️</div>
          <div className="empty-state-title">
            {searchQuery || selectedFilter !== 'all'
              ? t('common.noResults')
              : t('sites.noSites')}
          </div>
          <div className="empty-state-desc">
            {searchQuery || selectedFilter !== 'all'
              ? ''
              : t('sites.noSitesDescription')}
          </div>
          {!searchQuery && selectedFilter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span>+</span>
              {t('sites.addSite')}
            </button>
          )}
        </div>
      ) : (
        <div className="content-grid grid-cols-2">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="glass-card clickable"
              onClick={() => router.push(`/sites/${site.id}`)}
              role="button"
              tabIndex={0}
              aria-label={site.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/sites/${site.id}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
            >
              {/* Top row: Name + Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-md)' }}>
                <h3 className="font-bold truncate" style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>
                  {site.name}
                </h3>
                <span className={`badge ${STATUS_BADGES[site.status]}`}>
                  {site.status === 'in_progress' && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'currentColor',
                        marginRight: 6,
                        display: 'inline-block',
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                      aria-hidden="true"
                    />
                  )}
                  {t(`sites.statuses.${site.status}`)}
                </span>
              </div>

              {/* Client and Address details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
                <span className="text-muted text-sm truncate" title={site.clientName}>
                  👤 {site.clientName}
                </span>
                <span className="text-muted text-sm truncate" title={site.address}>
                  📍 {site.address}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'var(--sp-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', fontWeight: 500 }}>
                  <span className="text-muted">{t('sites.fields.progress')}</span>
                  <span style={{ color: 'var(--clr-primary)' }}>{site.progress}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--clr-bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${site.progress}%`,
                      background: 'var(--clr-primary)',
                      borderRadius: 3,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Bottom Row: Workers + Budget */}
              <div style={{
                marginTop: 'auto',
                paddingTop: 'var(--sp-sm)',
                borderTop: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--sp-md)',
              }}>
                {/* Workers Avatar Group */}
                <div className="avatar-group" style={{ display: 'flex', alignItems: 'center' }}>
                  {(site.workers || []).slice(0, 4).map((workerName, i) => (
                    <div
                      key={workerName}
                      className="avatar avatar-sm"
                      style={{
                        background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                        marginLeft: i > 0 ? -8 : 0,
                        border: '2px solid var(--clr-bg-surface)',
                      }}
                      title={workerName}
                    >
                      {getInitials(workerName)}
                    </div>
                  ))}
                  {(site.workers || []).length > 4 && (
                    <div
                      className="avatar avatar-sm font-semibold"
                      style={{
                        background: 'var(--clr-bg-hover)',
                        color: 'var(--clr-text-muted)',
                        marginLeft: -8,
                        border: '2px solid var(--clr-bg-surface)',
                        fontSize: 'var(--fs-xs)',
                      }}
                    >
                      +{(site.workers || []).length - 4}
                    </div>
                  )}
                  {(site.workers || []).length === 0 && (
                    <span className="text-muted text-xs">{t('sites.fields.assignedWorkers')}: 0</span>
                  )}
                </div>

                {/* Budget */}
                <span className="font-semibold currency" style={{ color: 'var(--clr-primary)' }}>
                  {formatBudget(site.budget)} RON
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Site Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-site-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-site-title">
                {t('sites.addSite')}
              </h3>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Site Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-name">
                  {t('sites.fields.name')} *
                </label>
                <input
                  id="site-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Client Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-client">
                  {t('sites.fields.client')} *
                </label>
                <input
                  id="site-client"
                  className="form-input"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleFormChange('clientName', e.target.value)}
                  required
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-address">
                  {t('sites.fields.address')} *
                </label>
                <input
                  id="site-address"
                  className="form-input"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-description">
                  {t('sites.fields.description')}
                </label>
                <textarea
                  id="site-description"
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-status">
                  {t('sites.fields.status')}
                </label>
                <select
                  id="site-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="planned">{t('sites.statuses.planned')}</option>
                  <option value="in_progress">{t('sites.statuses.in_progress')}</option>
                  <option value="on_hold">{t('sites.statuses.on_hold')}</option>
                  <option value="completed">{t('sites.statuses.completed')}</option>
                </select>
              </div>

              {/* Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="site-startDate">
                    {t('sites.fields.startDate')}
                  </label>
                  <input
                    id="site-startDate"
                    className="form-input"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="site-endDate">
                    {t('sites.fields.endDate')}
                  </label>
                  <input
                    id="site-endDate"
                    className="form-input"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-budget">
                  {t('sites.fields.budget')} (RON)
                </label>
                <input
                  id="site-budget"
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.budget}
                  onChange={(e) => handleFormChange('budget', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim()}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded pulsing animation style */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.8);
          }
        }
      `}</style>
    </Layout>
  );
}
