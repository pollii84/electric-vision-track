'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantDocSnapshot, updateTenantDoc, addTenantDoc } from '@/lib/firestore';

const PRESET_MATERIALS = [
  { name: 'Cablu NYM 3x2.5mm', category: 'Cabluri', unit: 'm', cost: 3.20 },
  { name: 'Cablu NYM 3x1.5mm', category: 'Cabluri', unit: 'm', cost: 2.10 },
  { name: 'Întrerupător automat 16A', category: 'Protecție', unit: 'buc', cost: 25.00 },
  { name: 'Întrerupător automat 10A', category: 'Protecție', unit: 'buc', cost: 22.00 },
  { name: 'Priză simplă Legrand', category: 'Prize', unit: 'buc', cost: 18.00 },
  { name: 'Doză de aparat modulară', category: 'Doze', unit: 'buc', cost: 2.50 },
  { name: 'Tub PVC 20mm', category: 'Tuburi', unit: 'm', cost: 2.50 },
  { name: 'Doză de legătură', category: 'Doze', unit: 'buc', cost: 4.00 },
  { name: 'Tablou electric 24 module', category: 'Tablouri', unit: 'buc', cost: 180.00 },
  { name: 'Clemă Wago 3 căi', category: 'Conectică', unit: 'buc', cost: 2.80 },
];

const INITIAL_MATERIAL_ITEMS = [];

const INITIAL_LABOR_ITEMS = [];

const STATUS_BADGES = {
  draft: 'badge-neutral',
  sent: 'badge-accent',
  accepted: 'badge-success',
  rejected: 'badge-danger',
  converted: 'badge-primary',
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();

  const { tenantId } = useAuth();
  const quoteId = params.id;

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState(INITIAL_MATERIAL_ITEMS);
  const [labor, setLabor] = useState(INITIAL_LABOR_ITEMS);
  const [targetMargin, setTargetMargin] = useState(25);
  const [saveStatus, setSaveStatus] = useState('');

  // Add Item States
  const [newMaterial, setNewMaterial] = useState({ name: '', category: 'Cabluri', qty: '', unit: 'buc', cost: '' });
  const [newLabor, setNewLabor] = useState({ description: '', hours: '', rate: 65 });

  useEffect(() => {
    if (!tenantId || !quoteId) return;
    setLoading(true);
    const unsub = onTenantDocSnapshot(tenantId, 'quotes', quoteId, (data) => {
      if (data) {
        setQuote(data);
        setMaterials(data.materials || []);
        setLabor(data.labor || []);
        if (typeof data.targetMargin === 'number') setTargetMargin(data.targetMargin);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tenantId, quoteId]);

  // Handle preset dropdown changes
  const handlePresetSelect = (presetIndex) => {
    if (presetIndex === '') return;
    const selected = PRESET_MATERIALS[Number(presetIndex)];
    setNewMaterial({
      name: selected.name,
      category: selected.category,
      unit: selected.unit,
      qty: '',
      cost: selected.cost,
    });
  };

  // Math Calculations
  const materialsSubtotal = useMemo(() => {
    return materials.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.cost) || 0), 0);
  }, [materials]);

  const laborSubtotal = useMemo(() => {
    return labor.reduce((sum, item) => sum + (Number(item.hours) || 0) * (Number(item.rate) || 0), 0);
  }, [labor]);

  const subtotal = useMemo(() => {
    return materialsSubtotal + laborSubtotal;
  }, [materialsSubtotal, laborSubtotal]);

  const marginAmount = useMemo(() => {
    return subtotal * (targetMargin / 100);
  }, [subtotal, targetMargin]);

  const grandTotal = useMemo(() => {
    return subtotal + marginAmount;
  }, [subtotal, marginAmount]);

  // Handlers
  const handleAddMaterial = (e) => {
    e.preventDefault();
    if (!newMaterial.name.trim() || !newMaterial.qty || !newMaterial.cost) return;

    setMaterials((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: newMaterial.name,
        category: newMaterial.category,
        qty: Number(newMaterial.qty),
        unit: newMaterial.unit,
        cost: Number(newMaterial.cost),
      },
    ]);

    setNewMaterial({ name: '', category: 'Cabluri', qty: '', unit: 'buc', cost: '' });
  };

  const handleAddLabor = (e) => {
    e.preventDefault();
    if (!newLabor.description.trim() || !newLabor.hours || !newLabor.rate) return;

    setLabor((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        description: newLabor.description,
        hours: Number(newLabor.hours),
        rate: Number(newLabor.rate),
      },
    ]);

    setNewLabor({ description: '', hours: '', rate: 65 });
  };

  const handleDeleteMaterial = (id) => {
    setMaterials((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDeleteLabor = (id) => {
    setLabor((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!tenantId || !quoteId) return;
    setSaveStatus('loading');
    try {
      await updateTenantDoc(tenantId, 'quotes', quoteId, {
        materials,
        labor,
        targetMargin,
        totalAmount: grandTotal,
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Failed to save quote:', err);
      setSaveStatus('');
    }
  };

  const handleConvertToContract = async () => {
    if (!tenantId || !quote) return;
    try {
      const contractNumber = (quote.quoteNumber || 'QT').replace(/^QT/, 'CT');
      const newId = await addTenantDoc(tenantId, 'contracts', {
        contractNumber,
        quoteId,
        siteId: quote.siteId || null,
        siteName: quote.siteName || '',
        clientName: quote.clientName || '',
        totalAmount: grandTotal,
        status: 'draft',
      });
      await updateTenantDoc(tenantId, 'quotes', quoteId, { status: 'converted' });
      router.push(`/contracts/${newId}`);
    } catch (err) {
      console.error('Failed to convert quote to contract:', err);
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  if (loading || !quote) {
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
      {/* Back to List */}
      <div style={{ marginBottom: 'var(--sp-md)' }} className="no-print">
        <Link href="/quotes" style={{ textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> {t('common.buttons.back')}
        </Link>
      </div>

      {/* Editor Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }} className="quote-title-text">📝 {quote.quoteNumber}</h1>
            <span className={`badge ${STATUS_BADGES[quote.status]} no-print`}>
              {t(`quotes.statuses.${quote.status}`)}
            </span>
          </div>
          <p className="text-muted" style={{ margin: '6px 0 0 0' }}>
            🏗️ {quote.siteName} — 👤 {quote.clientName}
          </p>
        </div>
        <div className="page-header-actions no-print" style={{ display: 'flex', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={triggerPrint}>
            🖨️ {t('quotes.buttons.printPreview')}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saveStatus === 'loading'}>
            {saveStatus === 'loading' ? 'Saving...' : t('common.buttons.save')}
          </button>
          {quote.status !== 'converted' && (
            <button className="btn btn-accent" onClick={handleConvertToContract}>
              📑 {t('quotes.buttons.convertToContract')}
            </button>
          )}
        </div>
      </div>

      {/* Print-only Invoice/Quote branding layout */}
      <div className="print-only-header" style={{ display: 'none', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#111', fontSize: '2.5rem', fontWeight: 800 }}>ELECTRICVISION</h1>
            <span style={{ fontSize: '0.9rem', color: '#666', letterSpacing: '0.1em' }}>ELECTRICAL CONTRACTING</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#111' }}>{quote.quoteNumber}</h2>
            <span style={{ color: '#666' }}>Date: 2026-06-01</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px', fontSize: '0.95rem' }}>
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#333' }}>ISSUED BY:</h4>
            <strong>ElectricVision SRL</strong><br />
            Str. Bună Ziua 45, Cluj-Napoca<br />
            office@dimensionvisiontrack.com<br />
            +40 264 555 111
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', color: '#333' }}>PREPARED FOR:</h4>
            <strong>{quote.clientName}</strong><br />
            Work Site: {quote.siteName}<br />
            Valid Until: {quote.expiryDate}
          </div>
        </div>
      </div>

      {/* Dual Column Editor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 'var(--sp-lg)' }} className="quote-editor-grid">
        {/* Left Column: Subsheets tabs */}
        <div>
          {/* Tab buttons */}
          <div className="tabs no-print" role="tablist" style={{ marginBottom: 'var(--sp-md)' }}>
            <button
              className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
              onClick={() => setActiveTab('materials')}
              role="tab"
              aria-selected={activeTab === 'materials'}
            >
              📦 {t('sites.tabs.materials')}
            </button>
            <button
              className={`tab ${activeTab === 'labor' ? 'active' : ''}`}
              onClick={() => setActiveTab('labor')}
              role="tab"
              aria-selected={activeTab === 'labor'}
            >
              👷 {t('sites.tabs.laborCosts')}
            </button>
          </div>

          {/* Materials Subsheet */}
          {(activeTab === 'materials' || typeof window === 'undefined') && (
            <div className="glass-card print-card" style={{ display: activeTab === 'materials' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <h3 style={{ margin: 0 }} className="print-heading">📦 {t('sites.tabs.materials')}</h3>

              <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Item</th>
                      <th>Category</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Unit Cost</th>
                      <th>Total</th>
                      <th className="no-print" style={{ width: 50 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold">{item.name}</td>
                        <td>
                          <span className="badge badge-neutral">{item.category}</span>
                        </td>
                        <td>{item.qty}</td>
                        <td className="text-muted">{item.unit}</td>
                        <td>{formatCurrency(item.cost)} RON</td>
                        <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>
                          {formatCurrency(item.qty * item.cost)} RON
                        </td>
                        <td className="no-print">
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDeleteMaterial(item.id)}
                            style={{ padding: '4px 8px' }}
                            aria-label="Delete line"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {materials.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                          No materials added to this quote yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Material Line Form */}
              <form onSubmit={handleAddMaterial} className="no-print" style={{
                background: 'var(--clr-bg-elevated)',
                padding: 'var(--sp-md)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-sm)',
                marginTop: 'var(--sp-sm)',
              }}>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-base)', color: 'var(--clr-primary)' }}>+ Add Materials Line</h4>

                {/* Preset Autocomplete Select */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }}>⚡ Quick-Select from Catalog</label>
                  <select
                    className="form-select"
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    defaultValue=""
                    style={{ padding: '8px 12px' }}
                  >
                    <option value="">-- Choose pre-populated material catalog item --</option>
                    {PRESET_MATERIALS.map((preset, idx) => (
                      <option key={preset.name} value={idx}>
                        {preset.name} ({preset.category}) — {preset.cost} RON
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Material Name</label>
                    <input
                      className="form-input"
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => handleNewMaterialChange('name', e.target.value)}
                      placeholder="e.g. MCB Breaker 16A"
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Category</label>
                    <input
                      className="form-input"
                      type="text"
                      value={newMaterial.category}
                      onChange={(e) => handleNewMaterialChange('category', e.target.value)}
                      placeholder="Category"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Quantity</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0.1"
                      step="any"
                      value={newMaterial.qty}
                      onChange={(e) => handleNewMaterialChange('qty', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Unit</label>
                    <input
                      className="form-input"
                      type="text"
                      value={newMaterial.unit}
                      onChange={(e) => handleNewMaterialChange('unit', e.target.value)}
                      placeholder="m, buc, set"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost (RON)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="any"
                      value={newMaterial.cost}
                      onChange={(e) => handleNewMaterialChange('cost', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                  {t('quotes.buttons.addMaterial')}
                </button>
              </form>
            </div>
          )}

          {/* Labor Subsheet */}
          {(activeTab === 'labor' || typeof window === 'undefined') && (
            <div className="glass-card print-card" style={{ display: activeTab === 'labor' ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <h3 style={{ margin: 0 }} className="print-heading">👷 {t('sites.tabs.laborCosts')}</h3>

              <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Hours</th>
                      <th>Hourly Rate</th>
                      <th>Total</th>
                      <th className="no-print" style={{ width: 50 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labor.map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold">{item.description}</td>
                        <td>{item.hours} hrs</td>
                        <td>{formatCurrency(item.rate)} RON/h</td>
                        <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>
                          {formatCurrency(item.hours * item.rate)} RON
                        </td>
                        <td className="no-print">
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDeleteLabor(item.id)}
                            style={{ padding: '4px 8px' }}
                            aria-label="Delete line"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {labor.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                          No labor entries added to this quote yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Labor Form */}
              <form onSubmit={handleAddLabor} className="no-print" style={{
                background: 'var(--clr-bg-elevated)',
                padding: 'var(--sp-md)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-sm)',
                marginTop: 'var(--sp-sm)',
              }}>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-base)', color: 'var(--clr-primary)' }}>+ Add Labor Line</h4>

                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newLabor.description}
                    onChange={(e) => handleNewLaborChange('description', e.target.value)}
                    placeholder="e.g. Săpat șanțuri sau cablări tablouri"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Hours</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={newLabor.hours}
                      onChange={(e) => handleNewLaborChange('hours', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (RON/h)</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      value={newLabor.rate}
                      onChange={(e) => handleNewLaborChange('rate', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button className="btn btn-primary" type="submit" style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                  {t('quotes.buttons.addLabor')}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Margins summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }} className="pricing-summary-col">
          <div className="glass-card print-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <h3 style={{ margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)' }}>
              💰 {t('quotes.fields.materialsSubtotal')}
            </h3>

            {/* Calculations items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)' }}>
                <span className="text-muted">Materials Subtotal:</span>
                <span className="font-semibold">{formatCurrency(materialsSubtotal)} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)' }}>
                <span className="text-muted">Labor Subtotal:</span>
                <span className="font-semibold">{formatCurrency(laborSubtotal)} RON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)', borderTop: '1px solid var(--clr-border)', paddingTop: '12px', fontWeight: 600 }}>
                <span>Subtotal (Net Cost):</span>
                <span>{formatCurrency(subtotal)} RON</span>
              </div>
            </div>

            {/* Target Margin controls */}
            <div style={{ marginTop: 'var(--sp-sm)' }} className="no-print">
              <label className="form-label" htmlFor="margin-input" style={{ fontWeight: 600 }}>
                📈 {t('quotes.fields.targetMargin')} (%)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', marginTop: 6 }}>
                <input
                  id="margin-input"
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  style={{ width: '80px', textAlign: 'center' }}
                />
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="filter-chips" style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>
                {[10, 15, 20, 25, 30].map((val) => (
                  <button
                    key={val}
                    className={`filter-chip ${targetMargin === val ? 'active' : ''}`}
                    onClick={() => setTargetMargin(val)}
                    style={{ fontSize: 'var(--fs-xs)', padding: '4px 8px' }}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-sm)', marginTop: 'var(--sp-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)' }}>
                <span className="text-muted">{t('quotes.fields.marginAmount')} ({targetMargin}%):</span>
                <span className="font-semibold" style={{ color: 'var(--clr-accent)' }}>
                  +{formatCurrency(marginAmount)} RON
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--fs-lg)',
                fontWeight: 700,
                borderTop: '2px solid var(--clr-primary)',
                paddingTop: 'var(--sp-sm)',
                marginTop: 'var(--sp-xs)',
              }}>
                <span>{t('quotes.fields.totalAmount')}:</span>
                <span style={{ color: 'var(--clr-primary)' }}>{formatCurrency(grandTotal)} RON</span>
              </div>
            </div>

            {/* Save indicator feedback */}
            {saveStatus === 'success' && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: 'var(--clr-success)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                fontSize: 'var(--fs-sm)',
                textAlign: 'center',
                marginTop: 'var(--sp-sm)',
              }}>
                ✓ Saved successfully!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styles governing standard high-fidelity media printing layout */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-only-header {
            display: block !important;
            color: black !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .quote-editor-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .glass-card {
            background: white !important;
            color: black !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            margin-bottom: 20px !important;
          }
          .data-table th {
            background: #f0f0f0 !important;
            color: black !important;
            border-bottom: 2px solid #ccc !important;
            font-weight: 700 !important;
          }
          .data-table td {
            color: black !important;
            border-bottom: 1px solid #eee !important;
          }
          .badge {
            border: 1px solid #333 !important;
            color: black !important;
            background: transparent !important;
          }
          .quote-title-text, .print-heading {
            color: black !important;
            font-weight: 800 !important;
            font-size: 1.5rem !important;
            margin-bottom: 10px !important;
          }
          .currency {
            color: black !important;
          }
          .pricing-summary-col {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </Layout>
  );

  // Form value helpers
  function handleNewMaterialChange(field, val) {
    setNewMaterial((prev) => ({ ...prev, [field]: val }));
  }

  function handleNewLaborChange(field, val) {
    setNewLabor((prev) => ({ ...prev, [field]: val }));
  }
}
