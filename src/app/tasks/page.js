'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, addTenantDoc, updateTenantDoc } from '@/lib/firestore';

const COLUMNS = ['todo', 'in_progress', 'quality_review', 'completed'];

const COLUMN_COLORS = {
  todo: 'var(--clr-border)',
  in_progress: 'var(--clr-primary)',
  quality_review: 'var(--clr-accent)',
  completed: 'var(--clr-success)',
};

const PRIORITY_BADGES = {
  low: 'badge-neutral',
  medium: 'badge-warning',
  high: 'badge-danger',
};

export default function TasksPage() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const { tenantId } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Clicked task for details modal
  
  // Camera simulation
  const [showCameraSim, setShowCameraSim] = useState(false);
  const [simulatedPhotoUrl, setSimulatedPhotoUrl] = useState('');

  // Change Order Form State
  const [showCOForm, setShowCOForm] = useState(false);
  const [coHours, setCoHours] = useState('');
  const [coMaterials, setCoMaterials] = useState('');
  const [coMaterialQty, setCoMaterialQty] = useState('1');
  const [coReason, setCoReason] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    siteIndex: '0',
    workerIndex: '0',
    priority: 'medium',
    dueDate: '2026-06-05',
  });

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubTasks = onTenantCollectionSnapshot(tenantId, 'tasks', (data) => {
      setTasks(data || []);
      setLoading(false);
    });
    const unsubWorkers = onTenantCollectionSnapshot(tenantId, 'workers', (data) => {
      setWorkers(data || []);
    });
    const unsubSites = onTenantCollectionSnapshot(tenantId, 'sites', (data) => {
      setSites(data || []);
    });
    return () => { unsubTasks(); unsubWorkers(); unsubSites(); };
  }, [tenantId]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim() || !tenantId) return;

    const selectedSite = sites[Number(formData.siteIndex)];
    const selectedWorker = workers[Number(formData.workerIndex)];
    if (!selectedSite || !selectedWorker) return;

    const newTask = {
      title: formData.title,
      desc: formData.desc,
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      workerId: selectedWorker.id,
      workerName: selectedWorker.name || `${selectedWorker.firstName || ''} ${selectedWorker.lastName || ''}`.trim(),
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: 'todo',
      drawingId: selectedSite.drawingId || null,
      drawingName: selectedSite.drawingName || null,
      photos: [],
      changeOrders: [],
    };

    try {
      await addTenantDoc(tenantId, 'tasks', newTask);
      setShowCreateModal(false);
      setFormData({
        title: '',
        desc: '',
        siteIndex: '0',
        workerIndex: '0',
        priority: 'medium',
        dueDate: '2026-06-05',
      });
      addToast('Task created successfully!', 'success');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const moveTask = async (id, direction, e) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const currentIndex = COLUMNS.indexOf(task.status);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    const newStatus = COLUMNS[nextIndex];

    setTasks((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: newStatus } : t)
    );

    try {
      await updateTenantDoc(tenantId, 'tasks', id, { status: newStatus });
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowCOForm(false);
  };

  const handleSimulatePhoto = () => {
    setShowCameraSim(true);
    setSimulatedPhotoUrl('');
  };

  const handleCapturePhoto = () => {
    const demoPhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80'
    ];
    setSimulatedPhotoUrl(demoPhotos[Math.floor(Math.random() * demoPhotos.length)]);
  };

  const handleSavePhoto = async () => {
    if (!simulatedPhotoUrl || !selectedTask || !tenantId) return;

    const newPhoto = { url: simulatedPhotoUrl, date: new Date().toLocaleDateString() };
    const updatedPhotos = [...(selectedTask.photos || []), newPhoto];

    try {
      await updateTenantDoc(tenantId, 'tasks', selectedTask.id, { photos: updatedPhotos });
      setSelectedTask((prev) => ({ ...prev, photos: updatedPhotos }));
      addToast(t('tasksAdditions.photoCaptured'), 'success');
      setShowCameraSim(false);
    } catch (err) {
      console.error('Failed to save photo:', err);
    }
  };

  const handleSaveChangeOrder = async () => {
    if (!coHours && !coMaterials || !selectedTask || !tenantId) return;

    const newCO = {
      id: `co-${Date.now()}`,
      hours: Number(coHours) || 0,
      material: coMaterials || 'N/A',
      materialQty: Number(coMaterialQty) || 0,
      reason: coReason || 'Scope change requested',
      date: new Date().toLocaleDateString(),
    };

    const updatedCOs = [...(selectedTask.changeOrders || []), newCO];

    // Local warehouse stock sync helper
    if (coMaterials) {
      try {
        const stored = localStorage.getItem('ev-warehouse-stocks');
        if (stored) {
          const warehouse = JSON.parse(stored);
          const matchedItem = warehouse.find(
            (w) => w.name.toLowerCase().includes(coMaterials.toLowerCase()) || coMaterials.toLowerCase().includes(w.name.toLowerCase())
          );
          if (matchedItem) {
            matchedItem.qty = Math.max(0, matchedItem.qty - (Number(coMaterialQty) || 1));
            localStorage.setItem('ev-warehouse-stocks', JSON.stringify(warehouse));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    try {
      await updateTenantDoc(tenantId, 'tasks', selectedTask.id, { changeOrders: updatedCOs });
      setSelectedTask((prev) => ({ ...prev, changeOrders: updatedCOs }));
      addToast('Task Change Order recorded successfully!', 'success');
      setShowCOForm(false);
      setCoHours('');
      setCoMaterials('');
      setCoMaterialQty('1');
      setCoReason('');
    } catch (err) {
      console.error('Failed to save change order:', err);
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

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📋 {t('tasks.title')}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span>+</span> {t('tasks.createTask')}
          </button>
        </div>
      </div>

      {/* Kanban Board Columns Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--sp-md)', alignItems: 'flex-start' }} className="kanban-grid">
        
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div
              key={col}
              style={{
                background: 'rgba(30, 32, 44, 0.5)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-sm)',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-sm)',
                borderTop: `4px solid ${COLUMN_COLORS[col]}`
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid var(--clr-border)' }}>
                <span className="font-bold text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t(`tasks.columns.${col}`)}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '11px', padding: '1px 6px' }}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="glass-card clickable"
                    onClick={() => handleTaskClick(task)}
                    style={{
                      padding: 'var(--sp-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      background: 'var(--clr-bg)'
                    }}
                  >
                    {/* Priority + Site */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${PRIORITY_BADGES[task.priority]}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {t(`tasks.priorities.${task.priority}`)}
                      </span>
                      <span className="text-muted text-xs">🏗️ {task.siteName}</span>
                    </div>

                    {/* Title */}
                    <h4 className="font-semibold" style={{ fontSize: 'var(--fs-sm)', margin: 0 }}>
                      {task.title}
                    </h4>

                    {/* Meta info tags */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {task.drawingId && (
                        <span style={{ fontSize: '9px', padding: '1px 4px', background: 'rgba(0, 255, 202, 0.08)', border: '1px solid rgba(0, 255, 202, 0.2)', color: '#00FFCC', borderRadius: 4 }}>
                          📐 {task.drawingName}
                        </span>
                      )}
                      {(task.photos?.length || 0) > 0 && (
                        <span style={{ fontSize: '9px', padding: '1px 4px', background: 'rgba(255,255,255,0.05)', borderRadius: 4, color: 'var(--clr-text-secondary)' }}>
                          📸 {task.photos.length}
                        </span>
                      )}
                      {(task.changeOrders?.length || 0) > 0 && (
                        <span style={{ fontSize: '9px', padding: '1px 4px', background: 'rgba(255, 202, 0, 0.08)', border: '1px solid rgba(255, 202, 0, 0.2)', color: 'var(--clr-primary)', borderRadius: 4 }}>
                          🛠️ {task.changeOrders.length}
                        </span>
                      )}
                    </div>

                    {/* Assigned + Due Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid var(--clr-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: '9px', background: 'var(--clr-primary-subtle)', color: 'var(--clr-primary)' }}>
                          {getInitials(task.workerName)}
                        </div>
                        <span className="text-muted" style={{ fontSize: '10px' }}>{task.workerName}</span>
                      </div>
                      <span className="text-muted text-xs">📅 {task.dueDate}</span>
                    </div>

                    {/* Shift Columns Actions */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
                      {col !== 'todo' && (
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={(e) => moveTask(task.id, -1, e)}
                          style={{ padding: '2px 6px', fontSize: '9px' }}
                          title="Move Back"
                        >
                          ←
                        </button>
                      )}
                      {col !== 'completed' && (
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => moveTask(task.id, 1, e)}
                          style={{ padding: '2px 6px', fontSize: '9px' }}
                          title="Move Forward"
                        >
                          →
                        </button>
                      )}
                    </div>

                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--clr-text-muted)', fontSize: 'var(--fs-xs)' }}>
                    Empty Column
                  </div>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* Reusable Create Task Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} role="dialog" aria-modal="true" aria-labelledby="create-task-title">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="create-task-title">{t('tasks.createTask')}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">{t('tasks.fields.taskName')} *</label>
                <input
                  id="task-title"
                  className="form-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="e.g. Wire main panel breaker mounts"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">{t('tasks.fields.description')}</label>
                <textarea
                  id="task-desc"
                  className="form-input"
                  rows="3"
                  value={formData.desc}
                  onChange={(e) => handleFormChange('desc', e.target.value)}
                  placeholder="Details about task execution scope..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="site-select">{t('tasks.fields.site')}</label>
                <select
                  id="site-select"
                  className="form-select"
                  value={formData.siteIndex}
                  onChange={(e) => handleFormChange('siteIndex', e.target.value)}
                >
                  {sites.length === 0 && <option value="" disabled>No sites available</option>}
                  {sites.map((site, index) => (
                    <option key={site.id} value={index}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="worker-select">{t('tasks.fields.assignedTo')}</label>
                <select
                  id="worker-select"
                  className="form-select"
                  value={formData.workerIndex}
                  onChange={(e) => handleFormChange('workerIndex', e.target.value)}
                >
                  {workers.length === 0 && <option value="" disabled>No workers available</option>}
                  {workers.map((worker, index) => (
                    <option key={worker.id} value={index}>{worker.name || `${worker.firstName || ''} ${worker.lastName || ''}`.trim()}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priority-select">{t('tasks.fields.priority')}</label>
                <select
                  id="priority-select"
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => handleFormChange('priority', e.target.value)}
                >
                  <option value="low">{t('tasks.priorities.low')}</option>
                  <option value="medium">{t('tasks.priorities.medium')}</option>
                  <option value="high">{t('tasks.priorities.high')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="due-date">{t('tasks.fields.dueDate')}</label>
                <input
                  id="due-date"
                  className="form-input"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>{t('common.buttons.cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateTask} disabled={!formData.title.trim()}>{t('common.buttons.save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Side/Modal Panel */}
      {selectedTask && (
        <div className="modal-backdrop" onClick={() => setSelectedTask(null)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Task Inspection Details</h3>
              <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className={`badge ${PRIORITY_BADGES[selectedTask.priority]}`}>
                    {selectedTask.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--clr-text-muted)' }}>Site: 🏗️ {selectedTask.siteName}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-md)', fontWeight: 700 }}>{selectedTask.title}</h4>
              </div>

              <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', margin: 0 }}>
                {selectedTask.desc}
              </p>

              {/* Drawing link details */}
              {selectedTask.drawingId && (
                <div style={{ background: 'rgba(0, 255, 202, 0.03)', border: '1px solid rgba(0, 255, 202, 0.15)', padding: 12, borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: '#00FFCC', fontWeight: 600 }}>ATTACHED DRAWING</div>
                    <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>{selectedTask.drawingName}</div>
                  </div>
                  <Link href={`/plan-viewer`} className="btn btn-primary btn-sm">
                    {t('tasksAdditions.viewPlan')}
                  </Link>
                </div>
              )}

              {/* Progress Photos row */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>📸 Progress Photos ({selectedTask.photos?.length || 0})</h5>
                  <button className="btn btn-secondary btn-xs" onClick={handleSimulatePhoto}>
                    {t('tasksAdditions.addPhoto')}
                  </button>
                </div>

                {selectedTask.photos && selectedTask.photos.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {selectedTask.photos.map((ph, index) => (
                      <div key={index} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--clr-border)' }}>
                        <img src={ph.url} alt="Progress snap" style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: 0, width: '100%', padding: '1px 4px', background: 'rgba(0,0,0,0.6)', fontSize: '8px', color: '#FFF' }}>
                          {ph.date}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No progress photos uploaded.</p>
                )}
              </div>

              {/* Change Orders row */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h5 style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>🛠️ Task Change Orders ({selectedTask.changeOrders?.length || 0})</h5>
                  <button className="btn btn-secondary btn-xs" onClick={() => setShowCOForm(true)}>
                    + Log Change
                  </button>
                </div>

                {showCOForm && (
                  <div style={{ border: '1px dashed var(--clr-border)', padding: 12, borderRadius: 'var(--radius-sm)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.01)' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-co-hours">{t('tasksAdditions.changeOrderManHours')}</label>
                      <input
                        id="task-co-hours"
                        type="number"
                        className="form-input"
                        value={coHours}
                        onChange={(e) => setCoHours(e.target.value)}
                        placeholder="e.g. 4"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="task-co-material">{t('tasksAdditions.changeOrderMaterials')}</label>
                        <input
                          id="task-co-material"
                          type="text"
                          className="form-input"
                          value={coMaterials}
                          onChange={(e) => setCoMaterials(e.target.value)}
                          placeholder="e.g. Breakers 16A"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="task-co-qty">Qty</label>
                        <input
                          id="task-co-qty"
                          type="number"
                          className="form-input"
                          value={coMaterialQty}
                          onChange={(e) => setCoMaterialQty(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="task-co-reason">{t('tasksAdditions.changeOrderReason')}</label>
                      <input
                        id="task-co-reason"
                        type="text"
                        className="form-input"
                        value={coReason}
                        onChange={(e) => setCoReason(e.target.value)}
                        placeholder="e.g. Additional line wiring required"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setShowCOForm(false)}>Cancel</button>
                      <button className="btn btn-primary btn-xs" onClick={handleSaveChangeOrder}>Record Change</button>
                    </div>
                  </div>
                )}

                {selectedTask.changeOrders && selectedTask.changeOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedTask.changeOrders.map((co) => (
                      <div key={co.id} style={{ padding: 8, background: 'rgba(255, 202, 0, 0.03)', border: '1px solid rgba(255, 202, 0, 0.15)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <span style={{ color: 'var(--clr-primary)' }}>+{co.hours}h Man-Hours</span>
                          <span>{co.date}</span>
                        </div>
                        <div style={{ color: 'var(--clr-text-secondary)' }}>Material: {co.material} (Qty: {co.materialQty})</div>
                        <div style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>Reason: "{co.reason}"</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No change orders logged for this task.</p>
                )}
              </div>

            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Viewfinder Sim Overlay */}
      {showCameraSim && (
        <div className="modal-backdrop" onClick={() => setShowCameraSim(false)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📸 Camera Simulation Capture</h3>
              <button className="modal-close" onClick={() => setShowCameraSim(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '220px',
                background: '#000',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {simulatedPhotoUrl ? (
                  <img src={simulatedPhotoUrl} alt="Snapped preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-xs)' }}>
                    <span>[CAMERA VIEWFINDER ACTIVE]</span>
                  </div>
                )}
              </div>

              {!simulatedPhotoUrl ? (
                <button className="btn btn-primary" onClick={handleCapturePhoto}>
                  Snap Simulated Photo
                </button>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setSimulatedPhotoUrl('')}>
                    Retake
                  </button>
                  <button className="btn btn-primary" onClick={handleSavePhoto}>
                    Keep & Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          .kanban-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
