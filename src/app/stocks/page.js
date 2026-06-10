'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, updateTenantDoc, addTenantDoc } from '@/lib/firestore';

const INITIAL_STOCKS = [
  { name: 'Copper Wire NYM 3x1.5mm²', category: 'cabling', qty: 250, unit: 'm', threshold: 100, preferredSupplier: 'Elmark' },
  { name: 'Copper Wire NYM 3x2.5mm²', category: 'cabling', qty: 40, unit: 'm', threshold: 150, preferredSupplier: 'Electro Global' },
  { name: 'Circuit Breaker MCB 1P 16A', category: 'protection', qty: 15, unit: 'pcs', threshold: 30, preferredSupplier: 'Schneider Direct' },
  { name: 'Junction Box IP55', category: 'fixtures', qty: 85, unit: 'pcs', threshold: 50, preferredSupplier: 'Elmark' },
  { name: 'Insulating Tape (Black)', category: 'consolidated', qty: 8, unit: 'rolls', threshold: 20, preferredSupplier: 'Elmark' },
  { name: 'Main Distribution Cabinet', category: 'protection', qty: 3, unit: 'pcs', threshold: 2, preferredSupplier: 'Schneider Direct' },
];

const CATEGORY_FILTERS = ['all', 'cabling', 'protection', 'fixtures', 'consolidated'];

const SUPPLIERS = ['Elmark', 'Electro Global', 'Schneider Direct'];

export default function StocksPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { addToast } = useToast();
  const { tenantId } = useAuth();

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Replenishment Modal states
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [replenishQty, setReplenishQty] = useState(100);

  const seedingRef = useRef(false);

  // Initialize stocks from Firestore
  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubscribe = onTenantCollectionSnapshot(tenantId, 'stocks', (data) => {
      setStocks(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredStocks = useMemo(() => {
    let result = stocks || [];

    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(query) ||
          (s.preferredSupplier || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [stocks, searchQuery, selectedCategory]);

  const handleSupplierChange = async (id, newSupplier) => {
    if (!tenantId) return;
    try {
      await updateTenantDoc(tenantId, 'stocks', id, { preferredSupplier: newSupplier });
      addToast(`Preferred supplier updated to ${newSupplier}`, 'info');
    } catch (err) {
      console.error('Failed to update supplier:', err);
    }
  };

  const handleOpenReplenish = (material) => {
    setSelectedMaterial(material);
    // Suggest replenishment
    const suggested = material.threshold - material.qty + 50;
    setReplenishQty(suggested > 0 ? suggested : 100);
    setShowReplenishModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedMaterial || !tenantId) return;

    try {
      await updateTenantDoc(tenantId, 'stocks', selectedMaterial.id, {
        qty: selectedMaterial.qty + Number(replenishQty)
      });
      addToast(t('stocksAdditions.restockSuccess') || 'Stocks successfully replenished.', 'success');
      setShowReplenishModal(false);
    } catch (err) {
      console.error('Failed to replenish stock:', err);
    }
  };

  const handleBulkRestock = async () => {
    if (!tenantId) return;
    try {
      const promises = lowStockItems.map((item) =>
        updateTenantDoc(tenantId, 'stocks', item.id, { qty: item.threshold + 50 })
      );
      await Promise.all(promises);
      addToast('All critical supplies replenished to safety level!', 'success');
    } catch (err) {
      console.error('Failed to bulk restock:', err);
    }
  };

  const handleCompareBids = (materialName) => {
    router.push(`/offers?item=${encodeURIComponent(materialName)}`);
  };

  // Restock event driven widget alert check
  const lowStockItems = useMemo(() => {
    return (stocks || []).filter((s) => s.qty < s.threshold);
  }, [stocks]);

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
        <h1>📊 {t('stocks.title')}</h1>
      </div>

      {/* Task Driven Restocking Banner Alert */}
      {lowStockItems.length > 0 && (
        <div style={{
          background: 'rgba(255, 74, 74, 0.08)',
          border: '1px solid rgba(255, 74, 74, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--fs-sm)', color: 'var(--clr-danger)', fontWeight: 600 }}>
              ⚠️ Low Stock Warning Triggers ({lowStockItems.length})
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
              Some materials have fallen below safety threshold limits due to recent task site allocations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleBulkRestock}
              className="btn btn-primary btn-sm"
              style={{ background: 'var(--clr-danger)', borderColor: 'var(--clr-danger)' }}
            >
              Bulk Restock All
            </button>
          </div>
        </div>
      )}

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
                    <tr
                      key={material.id}
                      style={{
                        background: isLowStock ? 'rgba(255, 74, 74, 0.02)' : 'transparent',
                        transition: 'background 0.25s ease'
                      }}
                    >
                      <td className="font-semibold">{material.name}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {t(`stocks.categories.${material.category}`)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }} className={isLowStock ? 'font-bold text-danger' : 'font-bold'}>
                        {material.qty} {material.unit}
                      </td>
                      <td style={{ textAlign: 'center' }} className="text-muted">
                        {material.threshold} {material.unit}
                      </td>
                      <td>
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
                            {t('stocksAdditions.lowStockThreshold') || 'Below Safe Level'}
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            {t('stocks.statuses.safe')}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleCompareBids(material.name)}
                          >
                            🔍 {t('stocks.buttons.compareSupplierBids')}
                          </button>
                          
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleOpenReplenish(material)}
                            style={{ background: isLowStock ? 'var(--clr-accent)' : 'var(--clr-primary)', borderColor: isLowStock ? 'var(--clr-accent)' : 'var(--clr-primary)', color: isLowStock ? 'var(--clr-bg)' : '#FFF' }}
                          >
                            📦 {t('stocksAdditions.restockButton') || 'Restock Supply'}
                          </button>
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
        <div className="modal-backdrop" onClick={() => setShowReplenishModal(false)} role="dialog" aria-modal="true" aria-labelledby="replenish-title">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="replenish-title">
                📦 {t('stocksAdditions.restockTitle') || 'Task-Driven Restocking'}
              </h3>
              <button className="modal-close" onClick={() => setShowReplenishModal(false)}>✕</button>
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
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Supplier Assigned:</div>
                <div className="font-bold" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-base)', marginTop: 2 }}>
                  {selectedMaterial.preferredSupplier}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="replenish-qty">{t('stocksAdditions.quantityToRestock')}</label>
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
              <button className="btn btn-secondary" onClick={() => setShowReplenishModal(false)}>{t('common.buttons.cancel')}</button>
              <button className="btn btn-primary" onClick={handleConfirmOrder}>
                Confirm & Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
