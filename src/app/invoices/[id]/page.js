'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import ClientAutocomplete, { getContactDisplayName } from '@/components/ClientAutocomplete';
import InvoiceAttachments from '@/components/InvoiceAttachments';
import {
  onTenantDocSnapshot,
  onTenantCollectionSnapshot,
  updateTenantDoc,
  addTenantDoc,
  db,
} from '@/lib/firestore';

const VAT_RATE = 0.19;

const STATUS_BADGES = {
  draft: 'badge-neutral',
  sent: 'badge-accent',
  partial: 'badge-warning',
  paid: 'badge-success',
  overdue: 'badge-danger',
};

let lineIdCounter = 0;
const newLineId = () => `line_${Date.now()}_${++lineIdCounter}`;

export default function InvoiceDetailPage() {
  const params = useParams();
  const { t } = useI18n();
  const { tenantId } = useAuth();
  const { addToast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // editable fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [workStage, setWorkStage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [siteId, setSiteId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // reference data
  const [contacts, setContacts] = useState([]);
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [siteMaterials, setSiteMaterials] = useState([]);

  useEffect(() => {
    if (!tenantId || !params.id) return;
    setLoading(true);
    const unsub = onTenantDocSnapshot(tenantId, 'invoices', params.id, (data) => {
      setInvoice(data);
      if (data) {
        setInvoiceNumber(data.invoiceNumber || '');
        setWorkStage(data.workStage || '');
        setDueDate(data.dueDate || '');
        setSiteId(data.siteId || '');
        setClientId(data.clientId || '');
        setClientName(data.clientName || '');
        setClientEmail(data.clientEmail || '');
        setClientAddress(data.clientAddress || '');
        setLineItems((data.lineItems || []).map((li) => ({ id: newLineId(), ...li })));
        setAttachments(data.attachments || []);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tenantId, params.id]);

  useEffect(() => {
    if (!tenantId) return;
    const unsubContacts = onTenantCollectionSnapshot(tenantId, 'contacts', setContacts);
    const unsubSites = onTenantCollectionSnapshot(tenantId, 'sites', setSites);
    const unsubWorkers = onTenantCollectionSnapshot(tenantId, 'workers', setWorkers);
    return () => { unsubContacts(); unsubSites(); unsubWorkers(); };
  }, [tenantId]);

  // site-dependent data for importing line items
  useEffect(() => {
    if (!tenantId || !siteId) {
      setTimesheets([]);
      setSiteMaterials([]);
      return;
    }
    const unsubTs = onTenantCollectionSnapshot(tenantId, 'timesheets', setTimesheets, {
      filters: [{ field: 'siteId', op: '==', value: siteId }],
    });
    const unsubMat = onSnapshot(
      collection(db, 'tenants', tenantId, 'sites', siteId, 'materials'),
      (snapshot) => setSiteMaterials(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Failed to load site materials:', err)
    );
    return () => { unsubTs(); unsubMat(); };
  }, [tenantId, siteId]);

  const subtotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.unitPrice) || 0), 0),
    [lineItems]
  );
  const vat = subtotal * VAT_RATE;
  const grandTotal = subtotal + vat;

  const formatCurrency = (value) => new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 }).format(value);

  const updateLine = (id, field, value) => {
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, [field]: value } : li)));
  };

  const addLine = () => {
    setLineItems((prev) => [...prev, { id: newLineId(), description: '', qty: 1, unit: 'buc', unitPrice: 0 }]);
  };

  const removeLine = (id) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const handleImportLabor = () => {
    if (!timesheets.length) {
      addToast(t('invoices.detail.noLaborData'), 'info');
      return;
    }
    const byWorker = {};
    timesheets.forEach((ts) => {
      if (!ts.workerId) return;
      const hours = (Number(ts.standardHours) || 0) + (Number(ts.overtimeHours) || 0) + (Number(ts.weekendHours) || 0);
      byWorker[ts.workerId] = (byWorker[ts.workerId] || 0) + hours;
    });
    const laborLines = Object.entries(byWorker)
      .filter(([, hours]) => hours > 0)
      .map(([workerId, hours]) => {
        const w = workers.find((x) => x.id === workerId);
        const name = w ? `${w.firstName || ''} ${w.lastName || ''}`.trim() : t('invoices.detail.unknownWorker');
        return {
          id: newLineId(),
          description: `${t('invoices.detail.laborPrefix')} — ${name}`,
          qty: hours,
          unit: 'h',
          unitPrice: w?.hourlyRate || 0,
        };
      });
    if (!laborLines.length) {
      addToast(t('invoices.detail.noLaborData'), 'info');
      return;
    }
    setLineItems((prev) => [...prev, ...laborLines]);
  };

  const handleImportMaterials = () => {
    if (!siteMaterials.length) {
      addToast(t('invoices.detail.noMaterialsData'), 'info');
      return;
    }
    const matLines = siteMaterials.map((m) => ({
      id: newLineId(),
      description: m.name || '',
      qty: Number(m.qty) || 0,
      unit: m.unit || 'buc',
      unitPrice: Number(m.cost) || 0,
    }));
    setLineItems((prev) => [...prev, ...matLines]);
  };

  const handleSelectClient = (contact) => {
    setClientId(contact.id);
    setClientName(getContactDisplayName(contact));
    setClientEmail(contact.email || '');
    setClientAddress(contact.address || '');
  };

  const handleCreateClient = async (name) => {
    if (!name || !tenantId) return;
    try {
      const id = await addTenantDoc(tenantId, 'contacts', {
        type: 'client',
        company: name,
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
      });
      setClientId(id);
      setClientName(name);
      setClientEmail('');
      setClientAddress('');
      addToast(t('invoices.clientSearch.created'), 'success');
    } catch (err) {
      console.error('Failed to create client contact:', err);
    }
  };

  const handleSave = async () => {
    if (!tenantId || !params.id || !invoiceNumber.trim()) return;
    setSaving(true);
    try {
      const site = sites.find((s) => s.id === siteId);
      await updateTenantDoc(tenantId, 'invoices', params.id, {
        invoiceNumber: invoiceNumber.trim(),
        workStage,
        dueDate,
        siteId: siteId || null,
        siteName: site?.name || invoice.siteName || '',
        clientId: clientId || null,
        clientName,
        clientEmail,
        clientAddress,
        lineItems: lineItems.map(({ id, ...rest }) => ({
          description: rest.description,
          qty: Number(rest.qty) || 0,
          unit: rest.unit || '',
          unitPrice: Number(rest.unitPrice) || 0,
        })),
        amount: lineItems.length > 0 ? Math.round(grandTotal * 100) / 100 : invoice.amount,
      });
      addToast(t('invoices.detail.saved'), 'success');
    } catch (err) {
      console.error('Failed to save invoice:', err);
      addToast(t('invoices.detail.saveFailed'), 'error');
    } finally {
      setSaving(false);
    }
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

  if (!invoice) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <div className="empty-state-title">{t('invoices.detail.notFound')}</div>
          <Link href="/invoices" className="btn btn-primary">
            {t('common.buttons.back')}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: 'var(--sp-md)' }}>
        <Link href="/invoices" style={{ textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> {t('common.buttons.back')}
        </Link>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>🧾 {invoice.invoiceNumber}</h1>
          <span className={`badge ${STATUS_BADGES[invoice.status] || 'badge-neutral'}`}>
            {t(`invoices.statuses.${invoice.status}`)}
          </span>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !invoiceNumber.trim()}>
            {saving ? t('common.loading') : t('common.buttons.save')}
          </button>
        </div>
      </div>

      {/* Invoice details */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <h3 style={{ marginTop: 0 }}>{t('invoices.detail.details')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-number">{t('invoices.fields.invoiceNumber')} *</label>
            <input
              id="inv-number"
              className="form-input"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-site">{t('quotes.fields.site')}</label>
            <select
              id="inv-site"
              className="form-select"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">—</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-stage">{t('invoices.fields.workStage')}</label>
            <input
              id="inv-stage"
              className="form-input"
              type="text"
              value={workStage}
              onChange={(e) => setWorkStage(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-due">{t('invoices.fields.dueDate')}</label>
            <input
              id="inv-due"
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Client */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <h3 style={{ marginTop: 0 }}>👤 {t('invoices.fields.client')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-client">{t('invoices.clientSearch.label')}</label>
            <ClientAutocomplete
              inputId="inv-client"
              contacts={contacts}
              value={clientName}
              onChange={(text) => {
                setClientName(text);
                setClientId('');
              }}
              onSelect={handleSelectClient}
              onCreateNew={handleCreateClient}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-client-email">{t('common.email')}</label>
            <input
              id="inv-client-email"
              className="form-input"
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="inv-client-address">{t('common.address')}</label>
            <input
              id="inv-client-address"
              className="form-input"
              type="text"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
        </div>
        {clientId && (
          <div className="text-muted text-xs" style={{ marginTop: 'var(--sp-sm)' }}>
            ✓ {t('invoices.clientSearch.linked')}
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
          <h3 style={{ margin: 0 }}>📋 {t('invoices.detail.lineItems')}</h3>
          <div style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleImportLabor} disabled={!siteId}>
              👷 {t('invoices.detail.importLabor')}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleImportMaterials} disabled={!siteId}>
              📦 {t('invoices.detail.importMaterials')}
            </button>
            <button className="btn btn-primary btn-sm" onClick={addLine}>
              <span>+</span> {t('invoices.detail.addLine')}
            </button>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>{t('common.description')}</th>
                <th style={{ width: 90 }}>{t('invoices.detail.qty')}</th>
                <th style={{ width: 90 }}>{t('invoices.detail.unit')}</th>
                <th style={{ width: 130 }}>{t('invoices.detail.unitPrice')}</th>
                <th style={{ width: 130, textAlign: 'right' }}>{t('common.total')}</th>
                <th style={{ width: 50 }} />
              </tr>
            </thead>
            <tbody>
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                    {t('invoices.detail.noLines')}
                  </td>
                </tr>
              ) : (
                lineItems.map((li) => (
                  <tr key={li.id}>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        value={li.description}
                        onChange={(e) => updateLine(li.id, 'description', e.target.value)}
                        aria-label={t('common.description')}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="any"
                        value={li.qty}
                        onChange={(e) => updateLine(li.id, 'qty', e.target.value)}
                        aria-label={t('invoices.detail.qty')}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="text"
                        value={li.unit}
                        onChange={(e) => updateLine(li.id, 'unit', e.target.value)}
                        aria-label={t('invoices.detail.unit')}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        step="any"
                        value={li.unitPrice}
                        onChange={(e) => updateLine(li.id, 'unitPrice', e.target.value)}
                        aria-label={t('invoices.detail.unitPrice')}
                      />
                    </td>
                    <td className="font-semibold" style={{ textAlign: 'right', color: 'var(--clr-primary)', whiteSpace: 'nowrap' }}>
                      {formatCurrency((Number(li.qty) || 0) * (Number(li.unitPrice) || 0))} RON
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeLine(li.id)}
                        aria-label={t('common.buttons.delete')}
                        style={{ color: 'var(--clr-danger)', padding: 6 }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--sp-md)' }}>
          <div style={{ minWidth: 260, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">{t('invoices.detail.subtotal')}</span>
              <span className="font-semibold">{formatCurrency(subtotal)} RON</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">{t('invoices.detail.vat')} (19%)</span>
              <span className="font-semibold">{formatCurrency(vat)} RON</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--clr-primary)', paddingTop: 6, fontSize: 'var(--fs-md)' }}>
              <span className="font-bold">{t('invoices.detail.grandTotal')}</span>
              <span className="font-bold" style={{ color: 'var(--clr-primary)' }}>{formatCurrency(grandTotal)} RON</span>
            </div>
            {lineItems.length === 0 && (
              <div className="text-muted text-xs" style={{ textAlign: 'right' }}>
                {t('invoices.detail.manualAmountNote').replace('{amount}', formatCurrency(invoice.amount || 0))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <InvoiceAttachments
          tenantId={tenantId}
          docType="invoices"
          docId={params.id}
          attachments={attachments}
          onChange={async (next) => {
            // Write first, update local state only on success — the child component
            // (InvoiceAttachments) owns action-specific error toasts and re-throws
            // to its own catch block, so we just avoid diverging from Firestore truth here.
            await updateTenantDoc(tenantId, 'invoices', params.id, { attachments: next });
            setAttachments(next);
          }}
        />
      </div>

      {/* Payment summary (read-only, managed from list page) */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <h3 style={{ marginTop: 0 }}>💰 {t('invoices.detail.paymentSummary')}</h3>
        <div style={{ display: 'flex', gap: 'var(--sp-xl)', flexWrap: 'wrap' }}>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('invoices.fields.amount')}
            </div>
            <div className="font-semibold">{formatCurrency(invoice.amount || 0)} RON</div>
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('invoices.detail.paid')}
            </div>
            <div className="font-semibold" style={{ color: 'var(--clr-success)' }}>{formatCurrency(invoice.paidAmount || 0)} RON</div>
          </div>
          <div>
            <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('invoices.detail.outstanding')}
            </div>
            <div className="font-bold" style={{ color: (invoice.amount || 0) - (invoice.paidAmount || 0) > 0 ? 'var(--clr-accent)' : 'inherit' }}>
              {formatCurrency((invoice.amount || 0) - (invoice.paidAmount || 0))} RON
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
