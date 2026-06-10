'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_CONTRACTS = [];

const DEMO_ACCEPTED_QUOTES = [];

const STATUS_FILTERS = ['all', 'draft', 'pending_signature', 'signed', 'active', 'completed'];

const STATUS_BADGES = {
  draft: 'badge-neutral',
  pending_signature: 'badge-warning',
  signed: 'badge-accent',
  active: 'badge-success',
  completed: 'badge-primary',
};

const INITIAL_FORM = {
  contractNumber: '',
  quoteIndex: '0',
};

export default function ContractsPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [contracts, setContracts] = useState([]);
  const [acceptedQuotes] = useState(DEMO_ACCEPTED_QUOTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredContracts = useMemo(() => {
    let result = contracts;

    if (selectedFilter !== 'all') {
      result = result.filter((c) => c.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.contractNumber.toLowerCase().includes(query) ||
          c.siteName.toLowerCase().includes(query) ||
          c.clientName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contracts, searchQuery, selectedFilter]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSave = () => {
    const selectedQuote = acceptedQuotes[Number(formData.quoteIndex)];
    if (!selectedQuote || !formData.contractNumber.trim()) return;

    const newId = String(Date.now());
    const newContract = {
      id: newId,
      contractNumber: formData.contractNumber,
      siteName: selectedQuote.siteName,
      clientName: selectedQuote.clientName,
      totalAmount: selectedQuote.totalAmount,
      status: 'draft',
      signedAt: '-',
      ipLog: '-',
    };

    setContracts((prev) => [newContract, ...prev]);
    setShowModal(false);
    setFormData(INITIAL_FORM);

    // Automatically redirect to Contract Detail Editor
    router.push(`/contracts/${newId}`);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📑 {t('contracts.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-contract-btn"
            aria-label={t('contracts.addContract')}
          >
            <span>+</span> {t('contracts.addContract')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('contracts.searchContracts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="contract-search"
            aria-label={t('contracts.searchContracts')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {t(`contracts.statuses.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Grid List */}
      {filteredContracts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📑</div>
          <div className="empty-state-title">
            {searchQuery || selectedFilter !== 'all'
              ? t('common.noResults')
              : t('contracts.noContracts')}
          </div>
          <div className="empty-state-desc">
            {searchQuery || selectedFilter !== 'all'
              ? ''
              : t('contracts.noContractsDescription')}
          </div>
          {!searchQuery && selectedFilter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span>+</span> {t('contracts.addContract')}
            </button>
          )}
        </div>
      ) : (
        <div className="content-grid grid-cols-2">
          {filteredContracts.map((contract) => (
            <div
              key={contract.id}
              className="glass-card clickable"
              onClick={() => router.push(`/contracts/${contract.id}`)}
              role="button"
              tabIndex={0}
              aria-label={contract.contractNumber}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/contracts/${contract.id}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
            >
              {/* Top Row: Code + Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="font-bold" style={{ fontSize: 'var(--fs-lg)', margin: 0, color: 'var(--clr-primary)' }}>
                  {contract.contractNumber}
                </h3>
                <span className={`badge ${STATUS_BADGES[contract.status]}`}>
                  {t(`contracts.statuses.${contract.status}`)}
                </span>
              </div>

              {/* Site + Client info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
                <span className="font-semibold" style={{ fontSize: 'var(--fs-base)' }}>🏗️ {contract.siteName}</span>
                <span className="text-muted text-sm">👤 {contract.clientName}</span>
              </div>

              {/* Approval traceability summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                <span>📅 {t('contracts.fields.signedAt')}: {contract.signedAt}</span>
                <span>🖥️ {t('contracts.fields.ipLog')}: {contract.ipLog}</span>
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
                <span className="text-muted text-sm">{t('contracts.fields.totalAmount')}</span>
                <span className="font-bold currency" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-lg)' }}>
                  {formatCurrency(contract.totalAmount)} RON
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote-to-Contract Auto-import Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-contract-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="create-contract-title">
                {t('contracts.addContract')}
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
              {/* Contract Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="contract-number">
                  {t('contracts.fields.contractNumber')} *
                </label>
                <input
                  id="contract-number"
                  className="form-input"
                  type="text"
                  value={formData.contractNumber}
                  onChange={(e) => handleFormChange('contractNumber', e.target.value)}
                  required
                />
              </div>

              {/* Accepted Quotes Dropdown */}
              <div className="form-group">
                <label className="form-label" htmlFor="quote-select">
                  Select Accepted Quote to Auto-Import
                </label>
                <select
                  id="quote-select"
                  className="form-select"
                  value={formData.quoteIndex}
                  onChange={(e) => handleFormChange('quoteIndex', e.target.value)}
                >
                  {acceptedQuotes.length === 0 && (
                    <option value="" disabled>No accepted quotes available</option>
                  )}
                  {acceptedQuotes.map((quote, idx) => (
                    <option key={quote.id} value={idx}>
                      {quote.quoteNumber} — {quote.siteName} ({formatCurrency(quote.totalAmount)} RON)
                    </option>
                  ))}
                </select>
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
                disabled={!formData.contractNumber.trim() || acceptedQuotes.length === 0}
              >
                Auto-Import & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
