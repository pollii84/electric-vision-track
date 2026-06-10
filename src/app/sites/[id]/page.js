'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantDocSnapshot, updateTenantDoc, deleteTenantDoc, db } from '@/lib/firestore';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const STATUS_BADGES = {
  planned: 'badge-primary',
  in_progress: 'badge-warning',
  on_hold: 'badge-neutral',
  completed: 'badge-success',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #FFCA00, #E0B200)',
  'linear-gradient(135deg, #0693E3, #0570B0)',
  'linear-gradient(135deg, #22C55E, #16A34A)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #EF4444, #DC2626)',
  'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  'linear-gradient(135deg, #EC4899, #DB2777)',
  'linear-gradient(135deg, #06B6D4, #0891B2)',
];

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    clientName: '',
    description: '',
    status: 'planned',
    startDate: '',
    endDate: '',
    budget: '',
  });

  // dynamic data states
  const [timeLogs, setTimeLogs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [tools, setTools] = useState([]);
  const [tenantWorkers, setTenantWorkers] = useState([]);

  // modals visibility flags
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showAddToolModal, setShowAddToolModal] = useState(false);

  // modal form states
  const [logForm, setLogForm] = useState({
    workerName: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    timeRange: '',
    description: '',
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    category: 'Cabluri',
    qty: '',
    unit: 'buc',
    cost: '',
  });

  const [toolForm, setToolForm] = useState({
    name: '',
    serial: '',
    status: 'available',
    assignedTo: '-',
  });

  useEffect(() => {
    if (!tenantId || !params.id) return;
    setLoading(true);
    const unsubscribe = onTenantDocSnapshot(tenantId, 'sites', params.id, (data) => {
      setSite(data);
      if (data) {
        setFormData({
          name: data.name || '',
          address: data.address || '',
          clientName: data.clientName || '',
          description: data.description || '',
          status: data.status || 'planned',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          budget: data.budget !== undefined ? data.budget : '',
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId, params.id]);

  // Load Time Logs from Firestore subcollection
  useEffect(() => {
    if (!tenantId || !params.id) return;
    const q = query(
      collection(db, 'tenants', tenantId, 'sites', params.id, 'timeLogs'),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTimeLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Failed to load time logs:', err);
    });
    return () => unsubscribe();
  }, [tenantId, params.id]);

  // Load Materials from Firestore subcollection
  useEffect(() => {
    if (!tenantId || !params.id) return;
    const q = collection(db, 'tenants', tenantId, 'sites', params.id, 'materials');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMaterials(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Failed to load materials:', err);
    });
    return () => unsubscribe();
  }, [tenantId, params.id]);

  // Load Tools from Firestore subcollection
  useEffect(() => {
    if (!tenantId || !params.id) return;
    const q = collection(db, 'tenants', tenantId, 'sites', params.id, 'tools');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTools(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Failed to load tools:', err);
    });
    return () => unsubscribe();
  }, [tenantId, params.id]);

  // Load Tenant Workers list for selects
  useEffect(() => {
    if (!tenantId) return;
    const q = collection(db, 'tenants', tenantId, 'workers');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTenantWorkers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error('Failed to load workers:', err);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim() || !tenantId || !params.id) return;
    try {
      await updateTenantDoc(tenantId, 'sites', params.id, {
        ...formData,
        budget: Number(formData.budget) || 0,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update site:', err);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !params.id) return;
    if (confirm(t('sites.confirmDelete') || 'Are you sure you want to delete this site?')) {
      try {
        await deleteTenantDoc(tenantId, 'sites', params.id);
        router.push('/sites');
      } catch (err) {
        console.error('Failed to delete site:', err);
      }
    }
  };

  const handleAddLog = async () => {
    if (!tenantId || !params.id || !logForm.workerName || !logForm.hours) return;
    try {
      await addDoc(collection(db, 'tenants', tenantId, 'sites', params.id, 'timeLogs'), {
        worker: logForm.workerName,
        date: logForm.date,
        hours: Number(logForm.hours) || 0,
        timeRange: logForm.timeRange || '',
        description: logForm.description || '',
      });
      setShowAddLogModal(false);
      setLogForm({
        workerName: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        timeRange: '',
        description: '',
      });
    } catch (err) {
      console.error('Failed to add time log:', err);
    }
  };

  const handleAddMaterial = async () => {
    if (!tenantId || !params.id || !materialForm.name || !materialForm.qty || !materialForm.cost) return;
    try {
      await addDoc(collection(db, 'tenants', tenantId, 'sites', params.id, 'materials'), {
        name: materialForm.name,
        category: materialForm.category,
        qty: Number(materialForm.qty) || 0,
        unit: materialForm.unit,
        cost: Number(materialForm.cost) || 0,
      });
      setShowAddMaterialModal(false);
      setMaterialForm({
        name: '',
        category: 'Cabluri',
        qty: '',
        unit: 'buc',
        cost: '',
      });
    } catch (err) {
      console.error('Failed to add material:', err);
    }
  };

  const handleAddTool = async () => {
    if (!tenantId || !params.id || !toolForm.name || !toolForm.serial) return;
    try {
      await addDoc(collection(db, 'tenants', tenantId, 'sites', params.id, 'tools'), {
        name: toolForm.name,
        serial: toolForm.serial,
        status: toolForm.status,
        assignedTo: toolForm.assignedTo,
      });
      setShowAddToolModal(false);
      setToolForm({
        name: '',
        serial: '',
        status: 'available',
        assignedTo: '-',
      });
    } catch (err) {
      console.error('Failed to add tool:', err);
    }
  };

  const [activeTab, setActiveTab] = useState('overview');

  const totalMaterialCosts = useMemo(() => {
    return materials.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.cost || 0), 0);
  }, [materials]);

  const totalHours = useMemo(() => {
    return timeLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
  }, [timeLogs]);

  const totalLaborCosts = useMemo(() => {
    // Estimating an average of 65 RON/h labor cost
    return totalHours * 65;
  }, [totalHours]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  const getInitials = (name) => {
    if (!name) return '';
    const parts = name.split(' ');
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
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

  if (!site) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-state-icon">🏗️</div>
          <div className="empty-state-title">{t('sites.detail.notFound') || 'Site not found'}</div>
          <div className="empty-state-desc">{t('sites.detail.notFoundDescription') || 'The site could not be found or has been deleted.'}</div>
          <Link href="/sites" className="btn btn-primary">
            {t('common.buttons.back')}
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Back to list and Actions Header */}
      <div style={{ marginBottom: 'var(--sp-md)' }}>
        <Link href="/sites" style={{ textDecoration: 'none', color: 'var(--clr-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> {t('common.buttons.back')}
        </Link>
      </div>

      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0 }}>🏗️ {site.name}</h1>
            <span className={`badge ${STATUS_BADGES[site.status]}`}>
              {t(`sites.statuses.${site.status}`)}
            </span>
          </div>
          <p className="text-muted" style={{ margin: '6px 0 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {site.address}
          </p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 'var(--sp-sm)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowEditModal(true)}
          >
            {t('sites.editSite')}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
          >
            {t('sites.deleteSite')}
          </button>
        </div>
      </div>

      {/* Overview Site info card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-xl)' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('sites.fields.client')}
            </div>
            <div className="font-semibold" style={{ fontSize: 'var(--fs-md)' }}>{site.clientName}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('sites.fields.startDate')}
            </div>
            <div className="font-semibold" style={{ fontSize: 'var(--fs-md)' }}>{site.startDate}</div>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <div className="text-muted text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {t('sites.fields.budget')}
            </div>
            <div className="font-semibold" style={{ fontSize: 'var(--fs-md)', color: 'var(--clr-primary)' }}>
              {formatCurrency(site.budget)} RON
            </div>
          </div>
        </div>

        {/* Large progress bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'var(--sp-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span className="text-muted">{t('sites.fields.progress')}</span>
            <span style={{ color: 'var(--clr-primary)' }}>{site.progress}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--clr-bg-elevated)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${site.progress}%`,
                background: 'var(--clr-primary)',
                borderRadius: 5,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="tabs" role="tablist">
        {['overview', 'timeLogs', 'materials', 'tools'].map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {t(`sites.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Tab content area */}
      <div style={{ marginTop: 'var(--sp-md)' }}>
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--sp-lg)' }} className="site-details-overview">
            {/* Left: Assigned Workers */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <h3 style={{ margin: 0 }}>👷 {t('sites.fields.assignedWorkers')}</h3>

              {(site.workers || []).length === 0 ? (
                <div className="text-muted text-sm" style={{ padding: 'var(--sp-md) 0' }}>
                  No workers assigned to this site yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  {(site.workers || []).map((workerName, i) => (
                    <div
                      key={workerName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-md)',
                        padding: '10px 12px',
                        background: 'var(--clr-bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div
                        className="avatar avatar-md font-semibold"
                        style={{
                          background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                          border: '1px solid var(--clr-border)',
                        }}
                      >
                        {getInitials(workerName)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="font-semibold">{workerName}</div>
                        <div className="text-muted text-xs">
                          {i === 0 ? 'Site Leader' : 'Electrician'}
                        </div>
                      </div>
                      <div className="text-muted text-sm font-medium">40 hrs/wk</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Summary Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              {/* Stat card: Hours */}
              <div className="glass-card stat-card success" style={{ padding: 'var(--sp-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="stat-label">{t('sites.tabs.totalHours')}</div>
                    <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{totalHours} hrs</div>
                  </div>
                  <div className="stat-icon" style={{ fontSize: '2rem' }}>⏱️</div>
                </div>
              </div>

              {/* Stat card: Materials cost */}
              <div className="glass-card stat-card primary" style={{ padding: 'var(--sp-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="stat-label">{t('sites.tabs.materialCosts')}</div>
                    <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{formatCurrency(totalMaterialCosts)} RON</div>
                  </div>
                  <div className="stat-icon" style={{ fontSize: '2rem' }}>🔌</div>
                </div>
              </div>

              {/* Stat card: Labor cost */}
              <div className="glass-card stat-card accent" style={{ padding: 'var(--sp-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="stat-label">{t('sites.tabs.laborCosts')}</div>
                    <div className="stat-value" style={{ fontSize: 'var(--fs-2xl)' }}>{formatCurrency(totalLaborCosts)} RON</div>
                  </div>
                  <div className="stat-icon" style={{ fontSize: '2rem' }}>👷</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Time Logs */}
        {activeTab === 'timeLogs' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>⏱️ {t('sites.tabs.timeLogs')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddLogModal(true)}>
                <span>+</span> {t('sites.tabs.addTimeLog')}
              </button>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Worker</th>
                    <th>Hours</th>
                    <th>Time Range</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                        No time logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    timeLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="font-semibold">{log.date}</td>
                        <td>{log.worker}</td>
                        <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{log.hours}</td>
                        <td className="text-muted">{log.timeRange}</td>
                        <td>{log.description}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Materials */}
        {activeTab === 'materials' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>📦 {t('sites.tabs.materials')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMaterialModal(true)}>
                <span>+</span> {t('sites.tabs.addMaterial')}
              </button>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Category</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Cost</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                        No materials added yet.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {materials.map((item) => (
                        <tr key={item.id}>
                          <td className="font-semibold">{item.name}</td>
                          <td>
                            <span className="badge badge-neutral">{item.category}</span>
                          </td>
                          <td className="font-semibold">{item.qty}</td>
                          <td className="text-muted">{item.unit}</td>
                          <td>{formatCurrency(item.cost)} RON</td>
                          <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>
                            {formatCurrency(item.qty * item.cost)} RON
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--clr-bg-elevated)', borderTop: '2px solid var(--clr-primary)' }}>
                        <td colSpan="5" className="font-bold" style={{ textAlign: 'right' }}>Total:</td>
                        <td className="font-bold" style={{ color: 'var(--clr-primary)', fontSize: 'var(--fs-md)' }}>
                          {formatCurrency(totalMaterialCosts)} RON
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Tools */}
        {activeTab === 'tools' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>🔧 {t('sites.tabs.tools')}</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddToolModal(true)}>
                <span>+</span> {t('sites.tabs.addTool')}
              </button>
            </div>

            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>Serial Number</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                        No tools assigned yet.
                      </td>
                    </tr>
                  ) : (
                    tools.map((tool) => (
                      <tr key={tool.id}>
                        <td className="font-semibold">{tool.name}</td>
                        <td className="text-muted">{tool.serial}</td>
                        <td>
                          <span className={`badge ${tool.status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                            {tool.status === 'available' ? 'Available' : 'In Use'}
                          </span>
                        </td>
                        <td className={tool.assignedTo !== '-' ? 'font-semibold' : 'text-muted'}>{tool.assignedTo}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Site Modal */}
      {showEditModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowEditModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-site-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="edit-site-title">
                {t('sites.editSite') || 'Edit Site'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Site Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-name">
                  {t('sites.fields.name')} *
                </label>
                <input
                  id="edit-site-name"
                  className="form-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </div>

              {/* Client Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-client">
                  {t('sites.fields.client')} *
                </label>
                <input
                  id="edit-site-client"
                  className="form-input"
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleFormChange('clientName', e.target.value)}
                  required
                />
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-address">
                  {t('sites.fields.address')} *
                </label>
                <input
                  id="edit-site-address"
                  className="form-input"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-description">
                  {t('sites.fields.description')}
                </label>
                <textarea
                  id="edit-site-description"
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-status">
                  {t('sites.fields.status')}
                </label>
                <select
                  id="edit-site-status"
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => handleFormChange('status', e.target.value)}
                >
                  <option value="planned">{t('sites.statuses.planned')}</option>
                  <option value="in_progress">{t('sites.statuses.in_progress')}</option>
                  <option value="on_hold">{t('sites.statuses.on_hold')}</option>
                  <option value="completed">{t('sites.statuses.completed')}</option>
                </select>
              </div>

              {/* Dates */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-site-startDate">
                    {t('sites.fields.startDate')}
                  </label>
                  <input
                    id="edit-site-startDate"
                    className="form-input"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFormChange('startDate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-site-endDate">
                    {t('sites.fields.endDate')}
                  </label>
                  <input
                    id="edit-site-endDate"
                    className="form-input"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFormChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-site-budget">
                  {t('sites.fields.budget')} (RON)
                </label>
                <input
                  id="edit-site-budget"
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.budget}
                  onChange={(e) => handleFormChange('budget', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEditSave}
                disabled={!formData.name.trim() || !formData.clientName.trim() || !formData.address.trim()}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Time Log Modal */}
      {showAddLogModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddLogModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-log-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-log-title">
                ⏱️ {t('sites.tabs.addTimeLog') || 'Add Time Log'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddLogModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Worker Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="log-worker">
                  Worker *
                </label>
                <select
                  id="log-worker"
                  className="form-select"
                  value={logForm.workerName}
                  onChange={(e) => setLogForm(prev => ({ ...prev, workerName: e.target.value }))}
                  required
                >
                  <option value="">-- Select Worker --</option>
                  {tenantWorkers.map(w => (
                    <option key={w.id} value={`${w.firstName} ${w.lastName}`}>
                      {w.firstName} {w.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Hours */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="log-date">
                    Date *
                  </label>
                  <input
                    id="log-date"
                    className="form-input"
                    type="date"
                    value={logForm.date}
                    onChange={(e) => setLogForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="log-hours">
                    Hours *
                  </label>
                  <input
                    id="log-hours"
                    className="form-input"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={logForm.hours}
                    onChange={(e) => setLogForm(prev => ({ ...prev, hours: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Time Range */}
              <div className="form-group">
                <label className="form-label" htmlFor="log-range">
                  Time Range (e.g. 08:00 - 17:00)
                </label>
                <input
                  id="log-range"
                  className="form-input"
                  type="text"
                  placeholder="08:00 - 17:00"
                  value={logForm.timeRange}
                  onChange={(e) => setLogForm(prev => ({ ...prev, timeRange: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="log-desc">
                  Description
                </label>
                <textarea
                  id="log-desc"
                  className="form-input"
                  rows="3"
                  value={logForm.description}
                  onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddLogModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddLog}
                disabled={!logForm.workerName || !logForm.hours}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterialModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddMaterialModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-material-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-material-title">
                📦 {t('sites.tabs.addMaterial') || 'Add Material'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddMaterialModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Material Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="mat-name">
                  Material Name *
                </label>
                <input
                  id="mat-name"
                  className="form-input"
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label" htmlFor="mat-cat">
                  Category *
                </label>
                <select
                  id="mat-cat"
                  className="form-select"
                  value={materialForm.category}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  {['Cabluri', 'Protecție', 'Prize', 'Tuburi', 'Doze', 'Tablouri', 'Accesorii', 'Conectică'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Qty & Unit */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="mat-qty">
                    Quantity *
                  </label>
                  <input
                    id="mat-qty"
                    className="form-input"
                    type="number"
                    min="1"
                    value={materialForm.qty}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, qty: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="mat-unit">
                    Unit *
                  </label>
                  <input
                    id="mat-unit"
                    className="form-input"
                    type="text"
                    placeholder="e.g. buc, m"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm(prev => ({ ...prev, unit: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Cost */}
              <div className="form-group">
                <label className="form-label" htmlFor="mat-cost">
                  Unit Cost (RON) *
                </label>
                <input
                  id="mat-cost"
                  className="form-input"
                  type="number"
                  min="0.01"
                  step="any"
                  value={materialForm.cost}
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, cost: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddMaterialModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddMaterial}
                disabled={!materialForm.name || !materialForm.qty || !materialForm.cost}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddToolModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAddToolModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-tool-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-tool-title">
                🔧 {t('sites.tabs.addTool') || 'Add Tool'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowAddToolModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Tool Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="tool-name">
                  Tool Name *
                </label>
                <input
                  id="tool-name"
                  className="form-input"
                  type="text"
                  value={toolForm.name}
                  onChange={(e) => setToolForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Serial Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="tool-serial">
                  Serial Number *
                </label>
                <input
                  id="tool-serial"
                  className="form-input"
                  type="text"
                  value={toolForm.serial}
                  onChange={(e) => setToolForm(prev => ({ ...prev, serial: e.target.value }))}
                  required
                />
              </div>

              {/* Status & Assigned To */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="tool-status">
                    Status
                  </label>
                  <select
                    id="tool-status"
                    className="form-select"
                    value={toolForm.status}
                    onChange={(e) => setToolForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="available">Available</option>
                    <option value="in_use">In Use</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tool-worker">
                    Assigned To
                  </label>
                  <select
                    id="tool-worker"
                    className="form-select"
                    value={toolForm.assignedTo}
                    onChange={(e) => setToolForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  >
                    <option value="-">-</option>
                    {tenantWorkers.map(w => (
                      <option key={w.id} value={`${w.firstName} ${w.lastName}`}>
                        {w.firstName} {w.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddToolModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddTool}
                disabled={!toolForm.name || !toolForm.serial}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for detail view grid adjustment */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .site-details-overview {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
