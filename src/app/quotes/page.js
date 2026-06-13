'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, addTenantDoc } from '@/lib/firestore';

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'converted'];

const STATUS_BADGES = {
  draft: 'badge-neutral',
  sent: 'badge-accent',
  accepted: 'badge-success',
  rejected: 'badge-danger',
  converted: 'badge-primary',
};

const INITIAL_FORM = {
  quoteNumber: '',
  siteIndex: '0',
  expiryDate: '',
};

export default function QuotesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [quotes, setQuotes] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubQuotes = onTenantCollectionSnapshot(tenantId, 'quotes', (data) => {
      setQuotes(data || []);
      setLoading(false);
    });
    const unsubSites = onTenantCollectionSnapshot(tenantId, 'sites', (data) => {
      setSites(data || []);
    });
    return () => { unsubQuotes(); unsubSites(); };
  }, [tenantId]);

  const filteredQuotes = useMemo(() => {
    let result = quotes;

    if (selectedFilter !== 'all') {
      result = result.filter((q) => q.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          (q.quoteNumber || '').toLowerCase().includes(query) ||
          (q.siteName || '').toLowerCase().includes(query) ||
          (q.clientName || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [quotes, searchQuery, selectedFilter]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const selectedSite = sites[Number(formData.siteIndex)];
    if (!selectedSite || !formData.quoteNumber.trim() || !tenantId) return;
    const newQuote = {
      quoteNumber: formData.quoteNumber,
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      clientName: selectedSite.clientName,
      totalAmount: 0,
      status: 'draft',
      expiryDate: formData.expiryDate || '2026-12-31',
    };
    try {
      const newId = await addTenantDoc(tenantId, 'quotes', newQuote);
      setShowModal(false);
      setFormData(INITIAL_FORM);
      router.push(`/quotes/${newId}`);
    } catch (err) {
      console.error('Failed to save quote:', err);
    }
  };

  const handleCloseModal = () => {
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
        <h1>📝 {t('quotes.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-quote-btn"
            aria-label={t('quotes.addQuote')}
          >
            <span>+</span>
            {t('quotes.addQuote')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('quotes.searchQuotes')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="quote-search"
            aria-label={t('quotes.searchQuotes')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {t(`quotes.statuses.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">
            {searchQuery || selectedFilter !== 'all'
              ? t('common.noResults')
              : t('quotes.noQuotes')}
          </div>
          <div className="empty-state-desc">
            {searchQuery || selectedFilter !== 'all'
              ? ''
              : t('quotes.noQuotesDescription')}
          </div>
          {!searchQuery && selectedFilter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span>+</span>
              {t('quotes.addQuote')}
            </button>
          )}
        </div>
      ) : (
        <div className="content-grid grid-cols-2">
          {filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className="glass-card clickable"
              onClick={() => router.push(`/quotes/${quote.id}`)}
              role="button"
              tabIndex={0}
              aria-label={quote.quoteNumber}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/quotes/${quote.id}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
            >
              {/* Top row: Quote Number + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', margin: 0, color: 'var(--clr-primary)' }}>
                  {quote.quoteNumber}
                </h3>
                <span className={`badge ${STATUS_BADGES[quote.status]}`}>
                  {t(`quotes.statuses.${quote.status}`)}
                </span>
              </div>

              {/* Site and Client details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
                <span className="font-semibold" style={{ fontSize: 'var(--fs-base)' }}>🏗️ {quote.siteName}</span>
                <span className="text-muted text-sm">👤 {quote.clientName}</span>
              </div>

              {/* Validity & Expiry */}
              <div className="text-muted text-xs">
                📅 {t('quotes.fields.expiryDate')}: <span className="font-medium">{quote.expiryDate}</span>
              </div>

              {/* Bottom: Total amount */}
              <div style={{
                marginTop: 'auto',
                paddingTop: 'var(--sp-sm)',
                borderTop: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span className="text-muted text-sm">{t('quotes.fields.totalAmount')}</span>
                <span className="font-bold currency" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-lg)' }}>
                  {formatCurrency(quote.totalAmount)} RON
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Quote Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-quote-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="create-quote-title">
                {t('quotes.addQuote')}
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
              {/* Quote Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="quote-number">
                  {t('quotes.fields.quoteNumber')} *
                </label>
                <input
                  id="quote-number"
                  className="form-input"
                  type="text"
                  value={formData.quoteNumber}
                  onChange={(e) => handleFormChange('quoteNumber', e.target.value)}
                  required
                />
              </div>

              {/* Site Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="quote-site">
                  {t('quotes.fields.site')}
                </label>
                <select
                  id="quote-site"
                  className="form-select"
                  value={formData.siteIndex}
                  onChange={(e) => handleFormChange('siteIndex', e.target.value)}
                >
                  {sites.length === 0 && (
                    <option value="" disabled>No sites available</option>
                  )}
                  {sites.map((site, index) => (
                    <option key={site.id} value={index}>
                      {site.name} — {site.clientName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valid Until */}
              <div className="form-group">
                <label className="form-label" htmlFor="quote-expiry">
                  {t('quotes.fields.expiryDate')}
                </label>
                <input
                  id="quote-expiry"
                  className="form-input"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleFormChange('expiryDate', e.target.value)}
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
                disabled={!formData.quoteNumber.trim()}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
