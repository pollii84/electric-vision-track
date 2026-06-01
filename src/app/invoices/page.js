'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_INVOICES = [
  { id: '1', invoiceNumber: 'INV-2026-0001', siteName: 'Vila Popescu', workStage: 'Phase 1: Cabling Billing', amount: 14280, paidAmount: 14280, dueDate: '2026-05-15', status: 'paid' },
  { id: '2', invoiceNumber: 'INV-2026-0002', siteName: 'Bloc Florești - Et. 3', workStage: 'Phase 1: Cabling Billing', amount: 8500, paidAmount: 2000, dueDate: '2026-05-25', status: 'partial' },
  { id: '3', invoiceNumber: 'INV-2026-0003', siteName: 'Birouri Sigma Center', workStage: 'Contract Advance Payment', amount: 25000, paidAmount: 0, dueDate: '2026-05-10', status: 'overdue' },
  { id: '4', invoiceNumber: 'INV-2026-0004', siteName: 'Hotel Panoramic Renovare', workStage: 'Phase 2: Panel Installation', amount: 38900, paidAmount: 0, dueDate: '2026-06-15', status: 'sent' },
];

const STATUS_FILTERS = ['all', 'draft', 'sent', 'partial', 'paid', 'overdue'];

const STATUS_BADGES = {
  draft: 'badge-neutral',
  sent: 'badge-accent',
  partial: 'badge-warning',
  paid: 'badge-success',
  overdue: 'badge-danger',
};

const INITIAL_FORM = {
  invoiceNumber: 'INV-2026-0005',
  siteName: 'Vila Popescu',
  workStage: 'Contract Milestone Billing',
  amount: '',
  dueDate: '',
};

export default function InvoicesPage() {
  const { t } = useI18n();

  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Form States
  const [addForm, setAddForm] = useState(INITIAL_FORM);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('2026-06-01');

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (selectedFilter !== 'all') {
      result = result.filter((inv) => inv.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          inv.siteName.toLowerCase().includes(query) ||
          inv.workStage.toLowerCase().includes(query)
      );
    }

    return result;
  }, [invoices, searchQuery, selectedFilter]);

  // Arrears Delay Calculator
  const calculateDaysOverdue = (dueDateStr) => {
    const due = new Date(dueDateStr);
    const today = new Date('2026-06-01'); // Mock today's date based on specifications
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleAddChange = (field, value) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateInvoice = () => {
    if (!addForm.invoiceNumber.trim() || !addForm.amount) return;

    const newInvoice = {
      id: String(Date.now()),
      invoiceNumber: addForm.invoiceNumber,
      siteName: addForm.siteName,
      workStage: addForm.workStage,
      amount: Number(addForm.amount),
      paidAmount: 0,
      dueDate: addForm.dueDate || '2026-06-30',
      status: 'draft',
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    setShowAddModal(false);
    setAddForm({
      invoiceNumber: `INV-2026-000${invoices.length + 2}`,
      siteName: 'Vila Popescu',
      workStage: 'Contract Milestone Billing',
      amount: '',
      dueDate: '',
    });
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.amount - invoice.paidAmount);
    setShowPaymentModal(true);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;

    const amt = Number(paymentAmount);
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === selectedInvoice.id) {
          const newPaid = inv.paidAmount + amt;
          let newStatus = inv.status;
          if (newPaid >= inv.amount) newStatus = 'paid';
          else if (newPaid > 0) newStatus = 'partial';

          return {
            ...inv,
            paidAmount: newPaid,
            status: newStatus,
          };
        }
        return inv;
      })
    );

    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  const triggerPrintInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setTimeout(() => {
      window.print();
      setSelectedInvoice(null);
    }, 100);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header no-print">
        <h1>🧾 {t('invoices.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setAddForm({
                ...INITIAL_FORM,
                invoiceNumber: `INV-2026-000${invoices.length + 1}`,
              });
              setShowAddModal(true);
            }}
          >
            <span>+</span> {t('invoices.createInvoice')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="invoice-search"
            aria-label="Search Invoices"
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {t(`invoices.statuses.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Directory Grid Table */}
      {filteredInvoices.length === 0 ? (
        <div className="empty-state no-print">
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-title">{t('common.noResults')}</div>
        </div>
      ) : (
        <div className="glass-card no-print" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice Code</th>
                  <th>Work Site</th>
                  <th>Billing Stage</th>
                  <th>Due Date</th>
                  <th>Invoice Value</th>
                  <th>Paid Amount</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const outstanding = inv.amount - inv.paidAmount;
                  const isOverdue = inv.status === 'overdue' || (inv.status !== 'paid' && calculateDaysOverdue(inv.dueDate) > 0);
                  const delayDays = calculateDaysOverdue(inv.dueDate);

                  return (
                    <tr key={inv.id}>
                      <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{inv.invoiceNumber}</td>
                      <td className="font-semibold">🏗️ {inv.siteName}</td>
                      <td>{inv.workStage}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>{inv.dueDate}</span>
                          {isOverdue && delayDays > 0 && (
                            <span className="badge badge-danger" style={{ fontSize: '10px', alignSelf: 'flex-start', padding: '1px 5px' }}>
                              ⚠️ {delayDays} days late
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="font-semibold">{formatCurrency(inv.amount)} RON</td>
                      <td className="font-semibold" style={{ color: 'var(--clr-success)' }}>{formatCurrency(inv.paidAmount)} RON</td>
                      <td className="font-bold" style={{ color: outstanding > 0 ? 'var(--clr-accent)' : 'inherit' }}>
                        {formatCurrency(outstanding)} RON
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGES[isOverdue ? 'overdue' : inv.status]}`}>
                          {t(`invoices.statuses.${isOverdue ? 'overdue' : inv.status}`)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {outstanding > 0 && (
                            <button
                              className="btn btn-primary btn-xs"
                              onClick={() => handleOpenPayment(inv)}
                              style={{ padding: '6px 10px', fontSize: 'var(--fs-xs)' }}
                            >
                              $ Pay
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => triggerPrintInvoice(inv)}
                            style={{ padding: '6px 10px', fontSize: 'var(--fs-xs)' }}
                          >
                            🖨️ Print
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

      {/* Add Invoice Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-invoice-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-invoice-title">
                {t('invoices.createInvoice')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Invoice Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="invoice-number">
                  {t('invoices.fields.invoiceNumber')} *
                </label>
                <input
                  id="invoice-number"
                  className="form-input"
                  type="text"
                  value={addForm.invoiceNumber}
                  onChange={(e) => handleAddChange('invoiceNumber', e.target.value)}
                  required
                />
              </div>

              {/* Site Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="invoice-site">
                  {t('quotes.fields.site')}
                </label>
                <select
                  id="invoice-site"
                  className="form-select"
                  value={addForm.siteName}
                  onChange={(e) => handleAddChange('siteName', e.target.value)}
                >
                  {DEMO_INVOICES.map((inv) => (
                    <option key={inv.id} value={inv.siteName}>{inv.siteName}</option>
                  ))}
                </select>
              </div>

              {/* Billing Stage / Phase */}
              <div className="form-group">
                <label className="form-label" htmlFor="invoice-stage">
                  {t('invoices.fields.workStage')}
                </label>
                <input
                  id="invoice-stage"
                  className="form-input"
                  type="text"
                  value={addForm.workStage}
                  onChange={(e) => handleAddChange('workStage', e.target.value)}
                  placeholder="e.g. Phase 1: Cabling Billing"
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="invoice-amount">
                  {t('invoices.fields.amount')} (RON) *
                </label>
                <input
                  id="invoice-amount"
                  className="form-input"
                  type="number"
                  min="1"
                  step="any"
                  value={addForm.amount}
                  onChange={(e) => handleAddChange('amount', e.target.value)}
                  required
                />
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="invoice-due">
                  {t('invoices.fields.dueDate')}
                </label>
                <input
                  id="invoice-due"
                  className="form-input"
                  type="date"
                  value={addForm.dueDate}
                  onChange={(e) => handleAddChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateInvoice}
                disabled={!addForm.invoiceNumber.trim() || !addForm.amount}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Ledger Modal */}
      {showPaymentModal && selectedInvoice && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="payment-modal-title">
                💰 {t('invoices.fields.recordPayment')}: {selectedInvoice.invoiceNumber}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div>
                <strong>Work Site:</strong> 🏗️ {selectedInvoice.siteName}<br />
                <strong>Billing Stage:</strong> {selectedInvoice.workStage}<br />
                <strong>Invoice Total:</strong> {formatCurrency(selectedInvoice.amount)} RON<br />
                <strong>Outstanding Balance:</strong> {formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount)} RON
              </div>

              {/* Payment Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="pay-amount">
                  Payment Amount (RON) *
                </label>
                <input
                  id="pay-amount"
                  className="form-input"
                  type="number"
                  min="0.01"
                  max={selectedInvoice.amount - selectedInvoice.paidAmount}
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              {/* Payment Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="pay-date">
                  Payment Ledger Date
                </label>
                <input
                  id="pay-date"
                  className="form-input"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleRecordPayment}
                disabled={!paymentAmount || Number(paymentAmount) <= 0}
              >
                Post Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-only Invoice rendering template (Fills whole viewport on window.print()) */}
      {selectedInvoice && (
        <div className="print-only-container" style={{ display: 'none', color: 'black', background: 'white', padding: '40px', fontFamily: 'sans-serif' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>ELECTRICVISION SRL</h1>
              <span style={{ fontSize: '0.85rem', color: '#666', letterSpacing: '0.08em' }}>CONTRACT MANAGEMENT ERP</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: 0 }}>FACTURE / INVOICE</h2>
              <strong style={{ fontSize: '1.2rem', color: '#111' }}>{selectedInvoice.invoiceNumber}</strong><br />
              <span style={{ color: '#555' }}>Due: {selectedInvoice.dueDate}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px', fontSize: '0.95rem' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>SUPPLIER / PROVIDER:</h4>
              <strong>ElectricVision SRL</strong><br />
              Str. Bună Ziua 45, Cluj-Napoca<br />
              VAT ID: RO 48593849<br />
              IBAN: RO84BTRL01201201201201XX
            </div>
            <div>
              <h4 style={{ margin: '0 0 6px 0', borderBottom: '1px solid #ddd', paddingBottom: 4 }}>BILL TO / CLIENT:</h4>
              <strong>SC Client SRL</strong><br />
              Work Site: {selectedInvoice.siteName}<br />
              Stage: {selectedInvoice.workStage}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Description / Billing Stage</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Taxable Base</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>VAT (19%)</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Grand Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{selectedInvoice.workStage}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(selectedInvoice.amount / 1.19)} RON</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{formatCurrency(selectedInvoice.amount - (selectedInvoice.amount / 1.19))} RON</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(selectedInvoice.amount)} RON</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '1.1rem' }}>
            <div style={{ width: '300px', background: '#fcfcfc', border: '1px solid #ddd', padding: '16px', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedInvoice.amount / 1.19)} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Taxes (VAT 19%):</span>
                <span>{formatCurrency(selectedInvoice.amount - (selectedInvoice.amount / 1.19))} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #333', paddingTop: 8, fontWeight: 'bold' }}>
                <span>Total Due:</span>
                <span>{formatCurrency(selectedInvoice.amount)} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.9rem', color: '#22c55e', fontWeight: 600 }}>
                <span>Paid Amount:</span>
                <span>{formatCurrency(selectedInvoice.paidAmount)} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.95rem', fontWeight: 'bold', color: selectedInvoice.amount - selectedInvoice.paidAmount > 0 ? '#f59e0b' : 'inherit' }}>
                <span>Outstanding:</span>
                <span>{formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount)} RON</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', textAlign: 'center', fontSize: '0.9rem' }}>
            <div>
              <div style={{ borderBottom: '1px dashed #999', height: '40px' }} />
              <p style={{ marginTop: 8 }}>Supplier Signature & Stamp</p>
            </div>
            <div>
              <div style={{ borderBottom: '1px dashed #999', height: '40px' }} />
              <p style={{ marginTop: 8 }}>Client Signature & Confirmation</p>
            </div>
          </div>
        </div>
      )}

      {/* Printing viewport injection stylesheet rules */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-only-container, .print-only-container * {
            visibility: visible !important;
          }
          .print-only-container {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            color: black !important;
            z-index: 9999999 !important;
          }
          table {
            border: 1px solid #ddd !important;
          }
          th {
            background: #eee !important;
            color: black !important;
          }
        }
      `}</style>
    </Layout>
  );
}
