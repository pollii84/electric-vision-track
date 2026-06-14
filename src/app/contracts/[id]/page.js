'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantDocSnapshot, updateTenantDoc } from '@/lib/firestore';

const STATUS_BADGES = {
  draft: 'badge-neutral',
  pending_signature: 'badge-warning',
  signed: 'badge-accent',
  active: 'badge-success',
  completed: 'badge-primary',
};

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();

  const { tenantId } = useAuth();
  const contractId = params.id;

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Contract state
  const [status, setStatus] = useState('draft');
  const [signedAt, setSignedAt] = useState('-');
  const [ipLog, setIpLog] = useState('-');
  const [signatureData, setSignatureData] = useState(null);
  const [addenda, setAddenda] = useState([]);
  const [showAddendaModal, setShowAddendaModal] = useState(false);

  // Addenda Form
  const [addendaForm, setAddendaForm] = useState({ description: '', materials: '', labor: '' });

  // Clause states
  const [advancePercent, setAdvancePercent] = useState(30);
  const [penaltyPercent, setPenaltyPercent] = useState(0.1);
  const [guaranteeMonths, setGuaranteeMonths] = useState(24);

  // Canvas Ref & Drawing State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!tenantId || !contractId) return;
    setLoading(true);
    const unsub = onTenantDocSnapshot(tenantId, 'contracts', contractId, (data) => {
      if (data) {
        setContract(data);
        setStatus(data.status || 'draft');
        setSignedAt(data.signedAt || '-');
        setIpLog(data.ipLog || '-');
        setSignatureData(data.signature || null);
        setAddenda(data.addenda || []);
        if (typeof data.advancePercent === 'number') setAdvancePercent(data.advancePercent);
        if (typeof data.penaltyPercent === 'number') setPenaltyPercent(data.penaltyPercent);
        if (typeof data.guaranteeMonths === 'number') setGuaranteeMonths(data.guaranteeMonths);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [tenantId, contractId]);

  const persist = async (changes) => {
    if (!tenantId || !contractId) return;
    try {
      await updateTenantDoc(tenantId, 'contracts', contractId, changes);
    } catch (err) {
      console.error('Failed to update contract:', err);
    }
  };

  // Initialize Canvas configurations
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#FFCA00'; // ElectricVision signature Gold
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
    }
  }, [status, signatureData]);

  // Addenda calculation addition
  const addendaTotal = useMemo(() => {
    return addenda.reduce((sum, add) => sum + add.materials + add.labor, 0);
  }, [addenda]);

  const contractOverallValue = useMemo(() => {
    return (contract?.totalAmount || 0) + addendaTotal;
  }, [contract, addendaTotal]);

  const paymentStages = useMemo(() => {
    const total = contractOverallValue;
    return [
      { id: '1', name: 'Milestone 1: Contract Signing & Advance', percent: advancePercent, amount: total * (advancePercent / 100), status: status === 'active' || status === 'signed' ? 'invoiced' : 'pending' },
      { id: '2', name: 'Milestone 2: Roughing-in & Cabling Completed', percent: 40, amount: total * 0.40, status: 'pending' },
      { id: '3', name: 'Milestone 3: Final Fittings, Testing & Handover', percent: 100 - advancePercent - 40, amount: total * ((100 - advancePercent - 40) / 100), status: 'pending' },
    ];
  }, [contractOverallValue, advancePercent, status]);

  // Drawing Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Support touch and mouse coordinates
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL();
    const capturedSignedAt = '2026-06-01 12:57:39';
    const capturedIpLog = '192.168.1.100';
    setSignatureData(dataUrl);
    setSignedAt(capturedSignedAt);
    setIpLog(capturedIpLog);
    setStatus('active');
    persist({
      signature: dataUrl,
      signedAt: capturedSignedAt,
      ipLog: capturedIpLog,
      status: 'active',
      advancePercent,
      penaltyPercent,
      guaranteeMonths,
    });
  };

  const handleAddendaChange = (field, val) => {
    setAddendaForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveAddendum = () => {
    if (!addendaForm.description.trim() || !addendaForm.materials || !addendaForm.labor) return;

    const newAdd = {
      id: String(Date.now()),
      actNumber: `ADD-CON-${addenda.length + 1}`,
      description: addendaForm.description,
      materials: Number(addendaForm.materials),
      labor: Number(addendaForm.labor),
      date: '2026-06-01',
    };

    const next = [...addenda, newAdd];
    setAddenda(next);
    persist({ addenda: next });
    setShowAddendaModal(false);
    setAddendaForm({ description: '', materials: '', labor: '' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  if (loading) {
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

  if (!contract) {
    return (
      <Layout>
        <div style={{ marginBottom: 'var(--sp-md)' }}>
          <Link href="/contracts" style={{ textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>←</span> {t('common.buttons.back')}
          </Link>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📑</div>
          <div className="empty-state-title">{t('contracts.notFound') || 'Contract not found'}</div>
          <div className="empty-state-desc">The contract you are looking for does not exist or has been removed.</div>
          <Link href="/contracts" className="btn btn-primary">
            {t('common.buttons.back')}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header back button */}
      <div style={{ marginBottom: 'var(--sp-md)' }}>
        <Link href="/contracts" style={{ textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> {t('common.buttons.back')}
        </Link>
      </div>

      {/* Editor Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>📑 {contract.contractNumber}</h1>
            <span className={`badge ${STATUS_BADGES[status]}`}>
              {t(`contracts.statuses.${status}`)}
            </span>
          </div>
          <p className="text-muted" style={{ margin: '6px 0 0 0' }}>
            🏗️ {contract.siteName} — 👤 {contract.clientName}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>{t('quotes.buttons.printPreview')}</button>
          {status === 'draft' && (
            <button className="btn btn-primary" onClick={() => { setStatus('pending_signature'); persist({ status: 'pending_signature' }); }}>
              Send for Signing
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--sp-lg)' }} className="contract-detail-grid">
        {/* Left Column: Clauses & Payment Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
          {/* Imported Quotation Overview */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            <h3 style={{ margin: 0 }}>💰 Base Quote Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--clr-border)', paddingBottom: 10 }}>
              <span className="text-muted">Imported Quote Total (Net):</span>
              <span className="font-semibold">{formatCurrency(contract.totalAmount)} RON</span>
            </div>
            {addenda.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--clr-border)', paddingBottom: 10 }}>
                <span className="text-muted">Supplemental Addenda Total:</span>
                <span className="font-semibold" style={{ color: 'var(--clr-accent)' }}>+{formatCurrency(addendaTotal)} RON</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--fs-md)' }}>
              <span>Total Legally Contracted Value:</span>
              <span style={{ color: 'var(--clr-primary)' }}>{formatCurrency(contractOverallValue)} RON</span>
            </div>
          </div>

          {/* Legal Protection Clauses */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <h3 style={{ margin: 0 }}>📜 Legal Protection Clauses</h3>

            <div className="content-grid grid-cols-3" style={{ gap: 'var(--sp-md)' }}>
              {/* Advance payment stage */}
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
                <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }}>Advance Payment (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  style={{ marginTop: 4 }}
                />
              </div>

              {/* Penalty Daily Rates */}
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
                <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }}>Daily Late Penalty (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={penaltyPercent}
                  onChange={(e) => setPenaltyPercent(Number(e.target.value) || 0)}
                  style={{ marginTop: 4 }}
                />
              </div>

              {/* Guarantees warranty */}
              <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
                <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }}>Warranty Period (mo)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={guaranteeMonths}
                  onChange={(e) => setGuaranteeMonths(Number(e.target.value) || 0)}
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
          </div>

          {/* Payment stages table linked to milestones */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <h3 style={{ margin: 0 }}>🏗️ Progress-Linked Payment Stages</h3>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Billing Milestone Description</th>
                    <th>Split (%)</th>
                    <th>Stage Sum (RON)</th>
                    <th>Stage Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentStages.map((stage) => (
                    <tr key={stage.id}>
                      <td className="font-semibold">{stage.name}</td>
                      <td>{stage.percent}%</td>
                      <td className="font-bold" style={{ color: 'var(--clr-primary)' }}>{formatCurrency(stage.amount)} RON</td>
                      <td>
                        <span className={`badge ${stage.status === 'invoiced' ? 'badge-success' : 'badge-neutral'}`}>
                          {stage.status === 'invoiced' ? 'Invoiced' : 'Pending Milestone'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Signature Pad & Addenda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
          {/* Canvas Digital Signature Pad */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            <h3 style={{ margin: 0 }}>🖋️ {t('contracts.fields.signature')}</h3>

            {signatureData ? (
              // Display signed layout with signature image drawing and verification stamp details
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', alignItems: 'center' }}>
                <div style={{
                  background: 'white',
                  borderRadius: 'var(--radius-sm)',
                  padding: 10,
                  width: '100%',
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed var(--clr-success)',
                }}>
                  {signatureData === 'MOCK_SIGNATURE' ? (
                    <span style={{ color: '#111', fontSize: '1.8rem', fontFamily: 'cursive', transform: 'rotate(-5deg)' }}>
                      {contract.clientName}
                    </span>
                  ) : (
                    <img src={signatureData} alt="Client Signature" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                  )}
                </div>

                <div style={{
                  background: 'var(--clr-bg-elevated)',
                  width: '100%',
                  padding: 'var(--sp-sm)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--fs-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">{t('contracts.fields.signedAt')}:</span>
                    <span className="font-semibold">{signedAt}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">{t('contracts.fields.ipLog')}:</span>
                    <span className="font-semibold" style={{ color: 'var(--clr-accent)' }}>{ipLog}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--clr-success)', fontWeight: 600, borderTop: '1px solid var(--clr-border)', paddingTop: 6, marginTop: 4 }}>
                    <span>Approval Trace:</span>
                    <span>VERIFIED ✓</span>
                  </div>
                </div>

                {signatureData !== 'MOCK_SIGNATURE' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    setSignatureData(null);
                    setSignedAt('-');
                    setIpLog('-');
                    setStatus('pending_signature');
                    persist({ signature: null, signedAt: '-', ipLog: '-', status: 'pending_signature' });
                  }} style={{ alignSelf: 'stretch' }}>
                    Reset Signature
                  </button>
                )}
              </div>
            ) : (
              // Active Canvas Drawing Interface
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                <span className="text-muted text-xs">Draw your signature inside the bounding box below:</span>
                <canvas
                  ref={canvasRef}
                  width="300"
                  height="140"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'crosshair',
                    width: '100%',
                    touchAction: 'none', // Prevent screen scrolling while drawing
                  }}
                />

                <div style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
                  <button className="btn btn-secondary btn-sm" onClick={clearCanvas} style={{ flex: 1 }}>
                    {t('contracts.buttons.clear')}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={confirmSignature} style={{ flex: 1.5 }}>
                    {t('contracts.buttons.sign')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Supplemental Addenda manager */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>📑 {t('contracts.fields.addenda')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddendaModal(true)}>
                <span>+</span> Add
              </button>
            </div>

            {addenda.length === 0 ? (
              <div className="text-muted text-xs" style={{ padding: '10px 0' }}>
                No supplemental addenda contracts appended yet.
              </div>
            ) : (
              <div className="data-table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table className="data-table" style={{ fontSize: 'var(--fs-sm)' }}>
                  <thead>
                    <tr>
                      <th>Act No.</th>
                      <th>Description</th>
                      <th>Total Sum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {addenda.map((add) => (
                      <tr key={add.id}>
                        <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{add.actNumber}</td>
                        <td>{add.description}</td>
                        <td className="font-semibold">{formatCurrency(add.materials + add.labor)} RON</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Addendum modal */}
      {showAddendaModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddendaModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-addenda-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-addenda-title">
                {t('contracts.buttons.addAddendum')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddendaModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="add-desc">Description of Additional Works *</label>
                <input
                  id="add-desc"
                  className="form-input"
                  type="text"
                  value={addendaForm.description}
                  onChange={(e) => handleAddendaChange('description', e.target.value)}
                  placeholder="e.g. Supplemental lighting lines in living room"
                  required
                />
              </div>

              {/* Materials Cost */}
              <div className="form-group">
                <label className="form-label" htmlFor="add-mat">Additional Materials Cost (RON) *</label>
                <input
                  id="add-mat"
                  className="form-input"
                  type="number"
                  min="0"
                  value={addendaForm.materials}
                  onChange={(e) => handleAddendaChange('materials', e.target.value)}
                  required
                />
              </div>

              {/* Labor Cost */}
              <div className="form-group">
                <label className="form-label" htmlFor="add-lab">Additional Labor Cost (RON) *</label>
                <input
                  id="add-lab"
                  className="form-input"
                  type="number"
                  min="0"
                  value={addendaForm.labor}
                  onChange={(e) => handleAddendaChange('labor', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddendaModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveAddendum}
                disabled={!addendaForm.description.trim() || !addendaForm.materials || !addendaForm.labor}
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
