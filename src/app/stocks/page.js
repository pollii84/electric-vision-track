'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const INITIAL_STOCKS = [
  { id: '1', name: 'Copper Wire NYM 3x1.5mm²', category: 'cabling', qty: 250, unit: 'm', threshold: 100, preferredSupplier: 'Elmark' },
  { id: '2', name: 'Copper Wire NYM 3x2.5mm²', category: 'cabling', qty: 40, unit: 'm', threshold: 150, preferredSupplier: 'Electro Global' },
  { id: '3', name: 'Circuit Breaker MCB 1P 16A', category: 'protection', qty: 15, unit: 'pcs', threshold: 30, preferredSupplier: 'Schneider Direct' },
  { id: '4', name: 'Junction Box IP55', category: 'fixtures', qty: 85, unit: 'pcs', threshold: 50, preferredSupplier: 'Elmark' },
  { id: '5', name: 'Insulating Tape (Black)', category: 'consolidated', qty: 8, unit: 'rolls', threshold: 20, preferredSupplier: 'Elmark' },
  { id: '6', name: 'Main Distribution Cabinet', category: 'protection', qty: 3, unit: 'pcs', threshold: 2, preferredSupplier: 'Schneider Direct' },
];

const CATEGORY_FILTERS = ['all', 'cabling', 'protection', 'fixtures', 'consolidated'];

const SUPPLIERS = ['Elmark', 'Electro Global', 'Schneider Direct'];

export default function StocksPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [stocks, setStocks] = useState(INITIAL_STOCKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Replenishment Modal states
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [replenishQty, setReplenishQty] = useState(100);

  const filteredStocks = useMemo(() => {
    let result = stocks;

    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.preferredSupplier.toLowerCase().includes(query)
      );
    }

    return result;
  }, [stocks, searchQuery, selectedCategory]);

  const handleSupplierChange = (id, newSupplier) => {
    setStocks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, preferredSupplier: newSupplier } : s))
    );
    // Success simulation feedback
    alert(`Preferential supplier updated successfully for material! Assigned: ${newSupplier}`);
  };

  const handleOpenReplenish = (material) => {
    setSelectedMaterial(material);
    // Suggest replenishment = Threshold - Qty + 50 units buffer
    const suggested = material.threshold - material.qty + 50;
    setReplenishQty(suggested);
    setShowReplenishModal(true);
  };

  const handleConfirmOrder = () => {
    if (!selectedMaterial) return;

    // Simulate spawning a purchase order
    alert(
      `Purchase Order Generated! Spawning order for ${replenishQty} ${selectedMaterial.unit} of "${selectedMaterial.name}" from ${selectedMaterial.preferredSupplier}.`
    );

    // Increment in-stock qty instantly for mock simulation
    setStocks((prev) =>
      prev.map((s) =>
        s.id === selectedMaterial.id ? { ...s, qty: s.qty + Number(replenishQty) } : s
      )
    );

    setShowReplenishModal(false);
  };

  const handleCompareBids = (materialName) => {
    // Redirect to Offers bid comparison page with parameters
    router.push(`/offers?item=${encodeURIComponent(materialName)}`);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📊 {t('stocks.title')}</h1>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar" style={{ margin: 0 }}>
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('stocks.searchStocks')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="stocks-search"
            aria-label={t('stocks.searchStocks')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? t('common.all') : t(`stocks.categories.${cat}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Stock Directory */}
      {filteredStocks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">{t('stocks.noStocks')}</div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('stocks.fields.materialName')}</th>
                  <th>{t('stocks.fields.category')}</th>
                  <th style={{ textAlign: 'center' }}>{t('stocks.fields.qtyInStock')}</th>
                  <th style={{ textAlign: 'center' }}>{t('stocks.fields.safetyThreshold')}</th>
                  <th>{t('stocks.fields.preferredSupplier')}</th>
                  <th>{t('stocks.fields.status')}</th>
                  <th style={{ width: 300, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((material) => {
                  const isLowStock = material.qty < material.threshold;
                  return (
                    <tr key={material.id}>
                      <td className="font-semibold">{material.name}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {t(`stocks.categories.${material.category}`)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} className="font-bold">
                        {material.qty} {material.unit}
                      </td>
                      <td style={{ textAlign: 'center' }} className="text-muted">
                        {material.threshold} {material.unit}
                      </td>
                      <td>
                        {/* Interactive Manager Preferred Supplier Selector Dropdown */}
                        <select
                          className="form-select"
                          value={material.preferredSupplier}
                          onChange={(e) => handleSupplierChange(material.id, e.target.value)}
                          style={{ padding: '4px 8px', width: '160px', fontSize: 'var(--fs-sm)' }}
                          aria-label={t('stocks.fields.preferredSupplier')}
                        >
                          {SUPPLIERS.map((sup) => (
                            <option key={sup} value={sup}>{sup}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isLowStock ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
                            {t('stocks.statuses.low')}
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            {t('stocks.statuses.safe')}
                          </span>
                        )}
                      </td>
                      <td>
                        {/* Dual Resolution Actions */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleCompareBids(material.name)}
                          >
                            🔍 {t('stocks.buttons.compareSupplierBids')}
                          </button>
                          
                          {isLowStock && (
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOpenReplenish(material)}
                              style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)', color: 'var(--clr-bg)' }}
                            >
                              📦 {t('stocks.buttons.orderFromPreferred')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order from Preferred Replenishment Confirmation Modal */}
      {showReplenishModal && selectedMaterial && (
        <div
          className="modal-backdrop"
          onClick={() => setShowReplenishModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="replenish-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="replenish-title">
                {t('stocks.buttons.orderFromPreferred')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowReplenishModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="text-muted text-xs">Material Name:</span>
                <span className="font-bold" style={{ fontSize: 'var(--fs-md)' }}>{selectedMaterial.name}</span>
              </div>

              <div className="content-grid grid-cols-2" style={{ gap: 'var(--sp-md)' }}>
                <div>
                  <span className="text-muted text-xs">Current Stock:</span>
                  <div className="font-semibold">{selectedMaterial.qty} {selectedMaterial.unit}</div>
                </div>
                <div>
                  <span className="text-muted text-xs">Safety Threshold:</span>
                  <div className="font-semibold" style={{ color: 'var(--clr-danger)' }}>{selectedMaterial.threshold} {selectedMaterial.unit}</div>
                </div>
              </div>

              <div style={{
                background: 'var(--clr-bg-elevated)',
                padding: 'var(--sp-sm)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '4px solid var(--clr-primary)'
              }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Preferential Supplier Assigned:</div>
                <div className="font-bold" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-base)', marginTop: 2 }}>
                  {selectedMaterial.preferredSupplier}
                </div>
              </div>

              {/* Replenish quantity input field */}
              <div className="form-group">
                <label className="form-label" htmlFor="replenish-qty">Replenishment Order Quantity *</label>
                <input
                  id="replenish-qty"
                  className="form-input"
                  type="number"
                  min="1"
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(Math.max(1, Number(e.target.value) || 0))}
                  required
                />
              </div>

            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReplenishModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmOrder}
              >
                Confirm & Generate Purchase Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
