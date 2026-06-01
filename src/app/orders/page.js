'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_ORDERS = [
  { id: '1', orderNumber: 'ORD-2026-0001', siteName: 'Vila Popescu', supplierName: 'Electro Global', costPrice: 3339, targetMargin: 25, status: 'delivered', phase: 'Phase 1: Cabling' },
  { id: '2', orderNumber: 'ORD-2026-0002', siteName: 'Bloc Florești - Et. 3', supplierName: 'Electro Global', costPrice: 1940, targetMargin: 20, status: 'ordered', phase: 'Phase 1: Cabling' },
  { id: '3', orderNumber: 'ORD-2026-0003', siteName: 'Birouri Sigma Center', supplierName: 'Elmark Romania', costPrice: 4780, targetMargin: 30, status: 'draft', phase: 'Phase 2: Distribution Boards' },
];

const SITES_LIST = ['Vila Popescu', 'Bloc Florești - Et. 3', 'Birouri Sigma Center', 'Hotel Panoramic Renovare'];
const SUPPLIERS_LIST = ['Electro Global', 'Elmark Romania', 'Schneider Direct'];
const PHASES_LIST = ['Phase 1: Cabling', 'Phase 2: Distribution Boards', 'Phase 3: Fixtures & Apparata'];

const STATUS_BADGES = {
  draft: 'badge-neutral',
  ordered: 'badge-accent',
  partial: 'badge-warning',
  delivered: 'badge-success',
  completed: 'badge-primary',
};

const INITIAL_FORM = {
  orderNumber: 'ORD-2026-0004',
  siteName: 'Vila Popescu',
  supplierName: 'Electro Global',
  costPrice: '',
  targetMargin: 25,
  phase: 'Phase 1: Cabling',
};

function OrdersContent() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // If redirected from Offers page with parameters, trigger adding a new prefilled order
  useEffect(() => {
    const isNew = searchParams.get('new');
    const siteParam = searchParams.get('site');
    const supplierParam = searchParams.get('supplier');

    if (isNew === '1') {
      let prefilledSite = 'Vila Popescu';
      if (siteParam === '2') prefilledSite = 'Bloc Florești - Et. 3';
      else if (siteParam === '3') prefilledSite = 'Birouri Sigma Center';

      let prefilledSupplier = 'Electro Global';
      if (supplierParam === 'elmark') prefilledSupplier = 'Elmark Romania';
      else if (supplierParam === 'schneider') prefilledSupplier = 'Schneider Direct';

      let prefilledCost = 3339;
      if (siteParam === '2') prefilledCost = 1940;
      else if (siteParam === '3') prefilledCost = 4780;

      setFormData({
        orderNumber: `ORD-2026-000${orders.length + 1}`,
        siteName: prefilledSite,
        supplierName: prefilledSupplier,
        costPrice: prefilledCost,
        targetMargin: 25,
        phase: 'Phase 1: Cabling',
      });
      setShowModal(true);
    }
  }, [searchParams]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.orderNumber.trim() || !formData.costPrice) return;

    const newOrder = {
      id: String(Date.now()),
      orderNumber: formData.orderNumber,
      siteName: formData.siteName,
      supplierName: formData.supplierName,
      costPrice: Number(formData.costPrice),
      targetMargin: Number(formData.targetMargin),
      status: 'ordered',
      phase: formData.phase,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setShowModal(false);
    setFormData(INITIAL_FORM);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const calculateSaleValue = (cost, margin) => {
    const costNum = Number(cost) || 0;
    const marginNum = Number(margin) || 0;
    return costNum * (1 + marginNum / 100);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📦 {t('orders.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData({
                ...INITIAL_FORM,
                orderNumber: `ORD-2026-000${orders.length + 1}`,
              });
              setShowModal(true);
            }}
          >
            <span>+</span> {t('orders.addOrder')}
          </button>
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order Code</th>
                <th>Work Site</th>
                <th>Phase</th>
                <th>Supplier</th>
                <th>Supplier Cost</th>
                <th>Markup Margin</th>
                <th>Client Sale Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const saleVal = calculateSaleValue(order.costPrice, order.targetMargin);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{ cursor: 'pointer' }}
                    title="Click to recalculate margins / inspect phase items"
                  >
                    <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{order.orderNumber}</td>
                    <td className="font-semibold">🏗️ {order.siteName}</td>
                    <td><span className="badge badge-neutral">{order.phase}</span></td>
                    <td className="text-muted">{order.supplierName}</td>
                    <td className="font-medium">{formatCurrency(order.costPrice)} RON</td>
                    <td className="font-medium" style={{ color: 'var(--clr-accent)' }}>{order.targetMargin}%</td>
                    <td className="font-bold" style={{ color: 'var(--clr-primary)' }}>
                      {formatCurrency(saleVal)} RON
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGES[order.status]}`}>
                        {t(`orders.statuses.${order.status}`)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect / Edit Order Margins Modal */}
      {selectedOrder && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-order-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="inspect-order-title">
                ⚙️ Recalculate Markup: {selectedOrder.orderNumber}
              </h3>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div>
                <strong>Work Site:</strong> 🏗️ {selectedOrder.siteName}<br />
                <strong>Execution Phase:</strong> {selectedOrder.phase}<br />
                <strong>Supplier Bid:</strong> {selectedOrder.supplierName}
              </div>

              {/* Slider selector for Margin Markup */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  📈 markup target margin
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginTop: 6 }}>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={selectedOrder.targetMargin}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setOrders((prev) => prev.map(o => o.id === selectedOrder.id ? { ...o, targetMargin: val } : o));
                      setSelectedOrder(prev => ({ ...prev, targetMargin: val }));
                    }}
                    style={{ width: '80px', textAlign: 'center' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={selectedOrder.targetMargin}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setOrders((prev) => prev.map(o => o.id === selectedOrder.id ? { ...o, targetMargin: val } : o));
                      setSelectedOrder(prev => ({ ...prev, targetMargin: val }));
                    }}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              {/* Totals calculations result */}
              <div style={{
                background: 'var(--clr-bg-elevated)',
                padding: 'var(--sp-md)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Supplier Cost:</span>
                  <span className="font-semibold">{formatCurrency(selectedOrder.costPrice)} RON</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Markup Profit ({selectedOrder.targetMargin}%):</span>
                  <span className="font-semibold" style={{ color: 'var(--clr-accent)' }}>
                    +{formatCurrency(selectedOrder.costPrice * (selectedOrder.targetMargin / 100))} RON
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  borderTop: '1px solid var(--clr-border)',
                  paddingTop: 8,
                  marginTop: 4,
                  fontSize: 'var(--fs-md)',
                }}>
                  <span>Final Client Sale:</span>
                  <span style={{ color: 'var(--clr-primary)' }}>
                    {formatCurrency(calculateSaleValue(selectedOrder.costPrice, selectedOrder.targetMargin))} RON
                  </span>
                </div>
              </div>

              {/* Status Update Button Toggles */}
              <div className="form-group">
                <label className="form-label">Update Order Status</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {['draft', 'ordered', 'delivered', 'completed'].map((status) => (
                    <button
                      key={status}
                      className={`badge ${selectedOrder.status === status ? STATUS_BADGES[status] : 'badge-neutral'}`}
                      onClick={() => {
                        setOrders((prev) => prev.map(o => o.id === selectedOrder.id ? { ...o, status } : o));
                        setSelectedOrder(prev => ({ ...prev, status }));
                      }}
                      style={{ cursor: 'pointer', border: selectedOrder.status === status ? '1px solid var(--clr-primary)' : '1px solid transparent' }}
                    >
                      {t(`orders.statuses.${status}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setSelectedOrder(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Site Order Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-order-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-order-title">
                {t('orders.addOrder')}
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
              {/* Order Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="order-number">
                  {t('orders.fields.orderNumber')} *
                </label>
                <input
                  id="order-number"
                  className="form-input"
                  type="text"
                  value={formData.orderNumber}
                  onChange={(e) => handleFormChange('orderNumber', e.target.value)}
                  required
                />
              </div>

              {/* Site Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="order-site">
                  {t('quotes.fields.site')}
                </label>
                <select
                  id="order-site"
                  className="form-select"
                  value={formData.siteName}
                  onChange={(e) => handleFormChange('siteName', e.target.value)}
                >
                  {SITES_LIST.map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              {/* Execution Phase Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="order-phase">
                  {t('orders.fields.executionPhase')}
                </label>
                <select
                  id="order-phase"
                  className="form-select"
                  value={formData.phase}
                  onChange={(e) => handleFormChange('phase', e.target.value)}
                >
                  {PHASES_LIST.map((phase) => (
                    <option key={phase} value={phase}>{phase}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="order-supplier">
                  Supplier Company
                </label>
                <select
                  id="order-supplier"
                  className="form-select"
                  value={formData.supplierName}
                  onChange={(e) => handleFormChange('supplierName', e.target.value)}
                >
                  {SUPPLIERS_LIST.map((sup) => (
                    <option key={sup} value={sup}>{sup}</option>
                  ))}
                </select>
              </div>

              {/* Cost Price */}
              <div className="form-group">
                <label className="form-label" htmlFor="order-cost">
                  {t('orders.fields.supplierCost')} (RON) *
                </label>
                <input
                  id="order-cost"
                  className="form-input"
                  type="number"
                  min="0.01"
                  step="any"
                  value={formData.costPrice}
                  onChange={(e) => handleFormChange('costPrice', e.target.value)}
                  required
                />
              </div>

              {/* Target Margin Selector */}
              <div className="form-group">
                <label className="form-label">Target Margin Markup (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginTop: 6 }}>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.targetMargin}
                    onChange={(e) => handleFormChange('targetMargin', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    style={{ width: '80px', textAlign: 'center' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={formData.targetMargin}
                    onChange={(e) => handleFormChange('targetMargin', Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
                </div>
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
                disabled={!formData.orderNumber.trim() || !formData.costPrice}
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

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          Loading site order details...
        </div>
      </Layout>
    }>
      <OrdersContent />
    </Suspense>
  );
}
