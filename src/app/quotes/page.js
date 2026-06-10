'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_QUOTES = [];

const DEMO_SITES = [];

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

  const [quotes, setQuotes] = useState(DEMO_QUOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredQuotes = useMemo(() => {
    let result = quotes;

    if (selectedFilter !== 'all') {
      result = result.filter((q) => q.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(query) ||
          q.siteName.toLowerCase().includes(query) ||
          q.clientName.toLowerCase().includes(query)
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

  const handleSave = () => {
    const selectedSite = DEMO_SITES[Number(formData.siteIndex)];
    if (!selectedSite || !formData.quoteNumber.trim()) return;

    const newId = String(Date.now());
    const newQuote = {
      id: newId,
      quoteNumber: formData.quoteNumber,
      siteName: selectedSite.name,
      clientName: selectedSite.clientName,
      totalAmount: 0,
      status: 'draft',
      expiryDate: formData.expiryDate || '2026-12-31',
    };

    // Note: in a real app this would write to Firestore. Here we direct the user to the editor.
    setQuotes((prev) => [newQuote, ...prev]);
    setShowModal(false);
    setFormData({
      quoteNumber: `QT-2026-000${quotes.length + 2}`,
      siteIndex: '0',
      expiryDate: '',
    });

    // Navigate to quote editor for this new quote
    router.push(`/quotes/${newId}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

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
                  {DEMO_SITES.length === 0 && (
                    <option value="" disabled>No sites available</option>
                  )}
                  {DEMO_SITES.map((site, index) => (
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
