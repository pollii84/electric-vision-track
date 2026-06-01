'use client';

import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_PURCHASES = [
  { id: '1', invoiceId: 'INV-ELM-9921', supplier: 'Elmark', date: '2026-05-18', totalAmount: 4850, siteName: 'Vila Popescu', status: 'verified' },
  { id: '2', invoiceId: 'INV-ELG-4412', supplier: 'Electro Global', date: '2026-05-22', totalAmount: 8900, siteName: 'Bloc Florești - Et. 3', status: 'pending_verification' },
  { id: '3', invoiceId: 'INV-SCH-1082', supplier: 'Schneider Direct', date: '2026-05-25', totalAmount: 12400, siteName: 'Birouri Sigma Center', status: 'verified' }
];

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu' },
  { id: '2', name: 'Bloc Florești - Et. 3' },
  { id: '3', name: 'Birouri Sigma Center' }
];

const STATUS_FILTERS = ['all', 'pending_verification', 'verified'];

const STATUS_BADGES = {
  pending_verification: 'badge-warning',
  verified: 'badge-success',
  failed: 'badge-danger',
};

const OCR_LOGS_TEMPLATES = [
  '🔧 [System] Initializing neural text alignment weights...',
  '📐 [System] Bounding box detection on rectangular invoice contours...',
  '👁️ [OCR] Reading characters (Tesseract Engine v3.04.1)...',
  '💰 [OCR] Searching for price indicators and total compound sums...',
  '⚡ [OCR] Matching parsed product lines against supplier warehouse inventory...',
  '✓ [System] Entity extraction complete. Outputting editable invoice ledger...'
];

export default function PurchasesPage() {
  const { t } = useI18n();

  const [purchases, setPurchases] = useState(DEMO_PURCHASES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  // Modal Scanner sub-states: 'camera' | 'ocr' | 'verify'
  const [scannerState, setScannerState] = useState('camera');
  
  // OCR simulation progress
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLogs, setOcrLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);

  // OCR Verification Form State
  const [formData, setFormData] = useState({
    invoiceId: '',
    supplier: 'Schneider Direct',
    date: '2026-06-01',
    totalAmount: 3150,
    siteIndex: '0',
    items: [
      { name: 'Copper Cable NYM 3x2.5mm²', qty: 500, unit: 'm', cost: 4.5 },
      { name: 'Circuit Breaker MCB 1P+N 16A', qty: 20, unit: 'pcs', cost: 45 },
    ]
  });

  const filteredPurchases = useMemo(() => {
    let result = purchases;

    if (selectedFilter !== 'all') {
      result = result.filter((p) => p.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.invoiceId.toLowerCase().includes(query) ||
          p.supplier.toLowerCase().includes(query) ||
          p.siteName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [purchases, searchQuery, selectedFilter]);

  // OCR Loading simulation loop
  useEffect(() => {
    let timer;
    if (showModal && scannerState === 'ocr') {
      if (ocrProgress < 100) {
        timer = setTimeout(() => {
          setOcrProgress((prev) => Math.min(100, prev + 10));
          
          // Print logs sequentially based on progress
          const nextLogIndex = Math.floor((ocrProgress / 100) * OCR_LOGS_TEMPLATES.length);
          if (nextLogIndex >= logIndex && nextLogIndex < OCR_LOGS_TEMPLATES.length) {
            setOcrLogs((prev) => [...prev, OCR_LOGS_TEMPLATES[nextLogIndex]]);
            setLogIndex(nextLogIndex + 1);
          }
        }, 300);
      } else {
        // Transition to verification form when complete
        timer = setTimeout(() => {
          setScannerState('verify');
          // Prefill invoice ID randomly
          setFormData((prev) => ({
            ...prev,
            invoiceId: `INV-SCAN-${Math.floor(1000 + Math.random() * 9000)}`
          }));
        }, 600);
      }
    }
    return () => clearTimeout(timer);
  }, [showModal, scannerState, ocrProgress, logIndex]);

  const handleOpenScanner = () => {
    setScannerState('camera');
    setOcrProgress(0);
    setOcrLogs([]);
    setLogIndex(0);
    setShowModal(true);
  };

  const handleTriggerPhoto = () => {
    setScannerState('ocr');
    setOcrLogs([OCR_LOGS_TEMPLATES[0]]);
    setLogIndex(1);
  };

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleItemChange = (idx, field, val) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      nextItems[idx] = { ...nextItems[idx], [field]: val };
      
      // Re-estimate overall sum
      const nextSum = nextItems.reduce((acc, it) => acc + (Number(it.qty) * Number(it.cost) || 0), 0);
      return { ...prev, items: nextItems, totalAmount: nextSum };
    });
  };

  const handleSavePurchase = () => {
    const selectedSite = DEMO_SITES[Number(formData.siteIndex)];
    if (!selectedSite || !formData.invoiceId.trim()) return;

    const newPurchase = {
      id: String(Date.now()),
      invoiceId: formData.invoiceId,
      supplier: formData.supplier,
      date: formData.date,
      totalAmount: formData.totalAmount,
      siteName: selectedSite.name,
      status: 'verified',
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    setShowModal(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>🛒 {t('purchases.title')}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleOpenScanner} id="scan-receipt-btn">
            <span>📷</span> {t('purchases.scanReceipt')}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar" style={{ margin: 0 }}>
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('common.buttons.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="purchases-search"
            aria-label={t('common.buttons.search')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === 'all' ? t('common.all') : t(`purchases.statuses.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Purchases List */}
      {filteredPurchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <div className="empty-state-title">{t('purchases.noPurchases')}</div>
          <div className="empty-state-desc">{t('purchases.noPurchasesDescription')}</div>
          <button className="btn btn-primary" onClick={handleOpenScanner}>
            <span>📷</span> {t('purchases.scanReceipt')}
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('purchases.fields.invoiceId')}</th>
                  <th>{t('purchases.fields.supplier')}</th>
                  <th>{t('purchases.fields.date')}</th>
                  <th>{t('purchases.fields.site')}</th>
                  <th>{t('purchases.fields.status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('purchases.fields.totalAmount')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{purchase.invoiceId}</td>
                    <td className="font-bold">{purchase.supplier}</td>
                    <td className="text-muted">{purchase.date}</td>
                    <td>🏗️ {purchase.siteName}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[purchase.status]}`}>
                        {t(`purchases.statuses.${purchase.status}`)}
                      </span>
                    </td>
                    <td className="font-bold text-right" style={{ color: 'var(--clr-primary)' }}>
                      {formatCurrency(purchase.totalAmount)} RON
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scan Receipt & Camera OCR Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-receipt-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title" id="scan-receipt-title">
                {t('purchases.scanReceipt')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ minHeight: '300px' }}>
              
              {/* 1. MOCK CAMERA VIEWPORT STATE */}
              {scannerState === 'camera' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', alignItems: 'center' }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: '#151720',
                    border: '2px solid var(--clr-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {/* Retro Camera HUD Guidelines */}
                    <div style={{ position: 'absolute', inset: 20, border: '1px dashed rgba(255,202,0,0.3)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 10, left: 10, borderLeft: '3px solid var(--clr-primary)', borderTop: '3px solid var(--clr-primary)', width: 15, height: 15 }} />
                    <div style={{ position: 'absolute', top: 10, right: 10, borderRight: '3px solid var(--clr-primary)', borderTop: '3px solid var(--clr-primary)', width: 15, height: 15 }} />
                    <div style={{ position: 'absolute', bottom: 10, left: 10, borderLeft: '3px solid var(--clr-primary)', borderBottom: '3px solid var(--clr-primary)', width: 15, height: 15 }} />
                    <div style={{ position: 'absolute', bottom: 10, right: 10, borderRight: '3px solid var(--clr-primary)', borderBottom: '3px solid var(--clr-primary)', width: 15, height: 15 }} />
                    
                    {/* Simulated Scanner Laser Bar */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: '2px',
                      background: 'rgba(255,202,0,0.8)',
                      boxShadow: '0 0 10px var(--clr-primary)',
                      animation: 'scanBar 2s infinite ease-in-out'
                    }} />

                    {/* Camera simulation visual cues */}
                    <div style={{ color: 'var(--clr-primary)', fontSize: '2.5rem' }}>📷</div>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 8 }}>
                      Position invoice within scanner bounds
                    </span>
                  </div>

                  <button className="btn btn-primary" onClick={handleTriggerPhoto} style={{ width: '220px' }}>
                    Capture & Scan OCR
                  </button>
                </div>
              )}

              {/* 2. OCR EXTRACTING STATE */}
              {scannerState === 'ocr' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                  <h4 style={{ margin: 0, color: 'var(--clr-primary)' }}>{t('purchases.ocrStatus')}</h4>
                  
                  {/* Progress Bar */}
                  <div style={{ background: 'var(--clr-bg-elevated)', borderRadius: 8, height: 10, width: '100%', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--clr-primary), var(--clr-accent))',
                      width: `${ocrProgress}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                    <span>{t('purchases.buttons.ocrAnalysis')}</span>
                    <span>{ocrProgress}%</span>
                  </div>

                  {/* Processing Terminal logs */}
                  <div style={{
                    background: '#0e0f14',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--sp-sm)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#00ff66',
                    height: '150px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    {ocrLogs.map((log, idx) => (
                      <div key={idx}>{log}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. VERIFICATION & EDIT LEDGER STATE */}
              {scannerState === 'verify' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                  <div style={{
                    background: 'rgba(0, 255, 102, 0.1)',
                    border: '1px solid rgba(0, 255, 102, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 14px',
                    color: '#00ff66',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600
                  }}>
                    ✓ OCR Scan Complete! Confidence Rate: 98.4%. Please validate pricing before logging.
                  </div>

                  {/* Header Form */}
                  <div className="content-grid grid-cols-2" style={{ gap: 'var(--sp-md)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="invoice-id">{t('purchases.fields.invoiceId')} *</label>
                      <input
                        id="invoice-id"
                        className="form-input"
                        type="text"
                        value={formData.invoiceId}
                        onChange={(e) => handleFormChange('invoiceId', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="supplier-select">{t('purchases.fields.supplier')}</label>
                      <select
                        id="supplier-select"
                        className="form-select"
                        value={formData.supplier}
                        onChange={(e) => handleFormChange('supplier', e.target.value)}
                      >
                        <option value="Schneider Direct">Schneider Direct</option>
                        <option value="Elmark">Elmark</option>
                        <option value="Electro Global">Electro Global</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="purchase-date">{t('purchases.fields.date')}</label>
                      <input
                        id="purchase-date"
                        className="form-input"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleFormChange('date', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="site-select">{t('purchases.fields.site')}</label>
                      <select
                        id="site-select"
                        className="form-select"
                        value={formData.siteIndex}
                        onChange={(e) => handleFormChange('siteIndex', e.target.value)}
                      >
                        {DEMO_SITES.map((site, index) => (
                          <option key={site.id} value={index}>{site.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Line Items validation */}
                  <h4 style={{ margin: '10px 0 0 0' }}>Parsed Invoice Items</h4>
                  <div className="data-table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: 'var(--fs-sm)' }}>
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th style={{ width: 80 }}>Qty</th>
                          <th style={{ width: 80 }}>Unit</th>
                          <th style={{ width: 120 }}>Unit Price</th>
                          <th style={{ textAlign: 'right', width: 120 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                className="form-input"
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 'var(--fs-sm)' }}
                              />
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 'var(--fs-sm)' }}
                              />
                            </td>
                            <td>
                              <span className="text-muted">{item.unit}</span>
                            </td>
                            <td>
                              <input
                                className="form-input"
                                type="number"
                                value={item.cost}
                                onChange={(e) => handleItemChange(idx, 'cost', e.target.value)}
                                style={{ padding: '4px 8px', fontSize: 'var(--fs-sm)' }}
                              />
                            </td>
                            <td className="font-bold text-right">
                              {formatCurrency(item.qty * item.cost)} RON
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Grand total summary */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--clr-border)',
                    paddingTop: 'var(--sp-sm)',
                    marginTop: 6
                  }}>
                    <span className="font-semibold text-muted">Total Sum Extracted</span>
                    <span className="font-bold" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-lg)' }}>
                      {formatCurrency(formData.totalAmount)} RON
                    </span>
                  </div>
                </div>
              )}

            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>

              {scannerState === 'verify' && (
                <button
                  className="btn btn-primary"
                  onClick={handleSavePurchase}
                  disabled={!formData.invoiceId.trim()}
                >
                  {t('purchases.buttons.verifyAndLog')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanner Animation styling */}
      <style jsx global>{`
        @keyframes scanBar {
          0% { top: 10px; }
          50% { top: 228px; }
          100% { top: 10px; }
        }
      `}</style>
    </Layout>
  );
}
