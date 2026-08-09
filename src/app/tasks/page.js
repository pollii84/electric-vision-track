'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { doc, collection, writeBatch } from 'firebase/firestore';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantRole } from '@/hooks/useTenantRole';
import {
  onTenantCollectionSnapshot,
  addTenantDoc,
  updateTenantDoc,
  serverTimestamp,
  db,
} from '@/lib/firestore';
import { splitHoursByRule, getExistingWeekdayHoursForDate, getTenantManagerUids } from '@/lib/taskHours';
import { createNotification } from '@/lib/notifications';

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

const HOURS_STATUS_BADGES = {
  estimated: 'badge-neutral',
  submitted: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

export default function TasksPage() {
  const { t } = useI18n();
  const { addToast } = useToast();
  const { tenantId, user } = useAuth();
  const { isManager } = useTenantRole();

  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Clicked task for details modal
  const [activeView, setActiveView] = useState('board'); // 'board' | 'approvals'

  // Log actual hours modal
  const [logHoursTask, setLogHoursTask] = useState(null);
  const [actualHoursInput, setActualHoursInput] = useState('');
  const [workDateInput, setWorkDateInput] = useState(() => new Date().toISOString().split('T')[0]);
  const [submittingHours, setSubmittingHours] = useState(false);

  // Approve/reject
  const [rejectTask, setRejectTask] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [decidingTaskId, setDecidingTaskId] = useState(null);

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
    siteId: '',
    workerId: '',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    estimatedHours: '',
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

  // The current logged-in user's own worker record, if any (resolved via the
  // authUid link set once a worker accepts their invite). Only workers with a
  // linked record can self-create tasks / log hours through this flow.
  const currentWorker = useMemo(
    () => workers.find((w) => w.authUid === user?.uid) || null,
    [workers, user?.uid]
  );

  // A worker (non-manager) may only create tasks on sites they're assigned to.
  // Managers/owners see every site.
  const assignableSites = useMemo(() => {
    if (isManager) return sites;
    if (!currentWorker) return [];
    return sites.filter((s) => (s.workerIds || []).includes(currentWorker.id));
  }, [sites, isManager, currentWorker]);

  const selectedFormSite = useMemo(
    () => sites.find((s) => s.id === formData.siteId) || null,
    [sites, formData.siteId]
  );

  // Manager creating for someone else: any worker in the company can be
  // assigned to any task on any site — a manager isn't limited to whoever
  // happens to already be formally assigned to that specific site (that
  // assignment list only gates a WORKER's own self-service task creation,
  // above). This is unused for non-managers (they hit the currentWorker
  // branch in the JSX instead).
  const assignableWorkersForSite = workers;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim() || !tenantId) return;

    const selectedSite = sites.find((s) => s.id === formData.siteId);
    // Workers self-create for themselves only; managers pick from the site's roster.
    const selectedWorker = isManager
      ? workers.find((w) => w.id === formData.workerId)
      : currentWorker;
    if (!selectedSite || !selectedWorker) return;

    const newTask = {
      title: formData.title,
      desc: formData.desc,
      siteId: selectedSite.id,
      siteName: selectedSite.name,
      workerId: selectedWorker.id,
      workerName: `${selectedWorker.firstName || ''} ${selectedWorker.lastName || ''}`.trim(),
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: 'todo',
      drawingId: selectedSite.drawingId || null,
      drawingName: selectedSite.drawingName || null,
      photos: [],
      changeOrders: [],
      estimatedHours: Number(formData.estimatedHours) || 0,
      actualHours: null,
      workDate: null,
      hoursStatus: 'estimated',
      hoursSubmittedAt: null,
      hoursDecidedAt: null,
      hoursDecidedBy: null,
      rejectionNote: null,
      timesheetId: null,
    };

    try {
      await addTenantDoc(tenantId, 'tasks', newTask);
      setShowCreateModal(false);
      setFormData({
        title: '',
        desc: '',
        siteId: '',
        workerId: '',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        estimatedHours: '',
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

  const openLogHours = (task, e) => {
    e?.stopPropagation();
    setLogHoursTask(task);
    setActualHoursInput(String(task.actualHours ?? task.estimatedHours ?? ''));
    setWorkDateInput(task.workDate || new Date().toISOString().split('T')[0]);
  };

  const handleSubmitHours = async () => {
    if (!logHoursTask || !tenantId || !actualHoursInput || Number(actualHoursInput) <= 0) return;
    setSubmittingHours(true);
    try {
      await updateTenantDoc(tenantId, 'tasks', logHoursTask.id, {
        actualHours: Number(actualHoursInput),
        workDate: workDateInput,
        hoursStatus: 'submitted',
        hoursSubmittedAt: serverTimestamp(),
        rejectionNote: null,
      });

      const managerUids = await getTenantManagerUids(tenantId);
      await Promise.all(
        managerUids
          .filter((uid) => uid !== user?.uid)
          .map((uid) =>
            createNotification(tenantId, {
              recipientUid: uid,
              type: 'hours_submitted',
              title: t('tasksAdditions.notifSubmittedTitle'),
              body: t('tasksAdditions.notifSubmittedBody')
                .replace('{worker}', logHoursTask.workerName)
                .replace('{hours}', actualHoursInput)
                .replace('{task}', logHoursTask.title),
              link: '/tasks',
            })
          )
      );

      addToast(t('tasksAdditions.hoursSubmitted'), 'success');
      setLogHoursTask(null);
    } catch (err) {
      console.error('Failed to submit hours:', err);
      addToast(t('tasksAdditions.hoursSubmitFailed'), 'error');
    } finally {
      setSubmittingHours(false);
    }
  };

  const handleApproveHours = async (task) => {
    if (!tenantId || decidingTaskId) return;
    setDecidingTaskId(task.id);
    try {
      const existingHours = await getExistingWeekdayHoursForDate(tenantId, task.workerId, task.workDate);
      const split = splitHoursByRule(task.workDate, task.actualHours, existingHours);

      // Cross-collection atomic write (tasks + timesheets) — batchWriteTenantDocs
      // only targets one collection at a time, so this needs a raw writeBatch.
      // Both writes land together or not at all; the firestore.rules precondition
      // (old hoursStatus must be 'submitted') is the actual double-approve guard,
      // this just prevents a partial task-approved/no-timesheet or
      // timesheet-created/task-not-updated inconsistency from a mid-write failure.
      const batch = writeBatch(db);
      const timesheetRef = doc(collection(db, 'tenants', tenantId, 'timesheets'));
      batch.set(timesheetRef, {
        workerId: task.workerId,
        siteId: task.siteId,
        date: task.workDate,
        standardHours: split.standardHours,
        overtimeHours: split.overtimeHours,
        weekendHours: split.weekendHours,
        description: task.title,
        sourceTaskId: task.id,
        autoGenerated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const taskRef = doc(db, 'tenants', tenantId, 'tasks', task.id);
      batch.update(taskRef, {
        hoursStatus: 'approved',
        hoursDecidedAt: serverTimestamp(),
        hoursDecidedBy: user?.uid || null,
        timesheetId: timesheetRef.id,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      if (task.workerId && workers.find((w) => w.id === task.workerId)?.authUid) {
        await createNotification(tenantId, {
          recipientUid: workers.find((w) => w.id === task.workerId).authUid,
          type: 'hours_approved',
          title: t('tasksAdditions.notifApprovedTitle'),
          body: t('tasksAdditions.notifApprovedBody')
            .replace('{hours}', String(task.actualHours))
            .replace('{task}', task.title),
          link: '/timesheets',
        });
      }

      addToast(t('tasksAdditions.hoursApproved'), 'success');
    } catch (err) {
      console.error('Failed to approve hours:', err);
      addToast(t('tasksAdditions.approveFailed'), 'error');
    } finally {
      setDecidingTaskId(null);
    }
  };

  const openReject = (task, e) => {
    e?.stopPropagation();
    setRejectTask(task);
    setRejectNote('');
  };

  const handleRejectHours = async () => {
    if (!rejectTask || !tenantId || decidingTaskId) return;
    setDecidingTaskId(rejectTask.id);
    try {
      await updateTenantDoc(tenantId, 'tasks', rejectTask.id, {
        hoursStatus: 'rejected',
        hoursDecidedAt: serverTimestamp(),
        hoursDecidedBy: user?.uid || null,
        rejectionNote: rejectNote.trim() || null,
      });

      const worker = workers.find((w) => w.id === rejectTask.workerId);
      if (worker?.authUid) {
        await createNotification(tenantId, {
          recipientUid: worker.authUid,
          type: 'hours_rejected',
          title: t('tasksAdditions.notifRejectedTitle'),
          body: rejectNote.trim()
            ? t('tasksAdditions.notifRejectedBodyWithNote').replace('{task}', rejectTask.title).replace('{note}', rejectNote.trim())
            : t('tasksAdditions.notifRejectedBody').replace('{task}', rejectTask.title),
          link: '/tasks',
        });
      }

      addToast(t('tasksAdditions.hoursRejected'), 'success');
      setRejectTask(null);
    } catch (err) {
      console.error('Failed to reject hours:', err);
      addToast(t('tasksAdditions.rejectFailed'), 'error');
    } finally {
      setDecidingTaskId(null);
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

  const pendingApprovalTasks = tasks.filter((task) => (task.hoursStatus || 'estimated') === 'submitted');

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

      {/* View tabs — Board / Pending Approval (managers only) */}
      {isManager && (
        <div className="tabs" role="tablist" style={{ marginBottom: 'var(--sp-md)' }}>
          <button
            className={`tab ${activeView === 'board' ? 'active' : ''}`}
            onClick={() => setActiveView('board')}
            role="tab"
            aria-selected={activeView === 'board'}
          >
            {t('tasksAdditions.boardView')}
          </button>
          <button
            className={`tab ${activeView === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveView('approvals')}
            role="tab"
            aria-selected={activeView === 'approvals'}
          >
            {t('tasksAdditions.approvalsView')}
            {pendingApprovalTasks.length > 0 && (
              <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: '10px', padding: '1px 6px' }}>
                {pendingApprovalTasks.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Pending Approval view */}
      {isManager && activeView === 'approvals' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          {pendingApprovalTasks.length === 0 ? (
            <div className="text-muted text-sm" style={{ padding: 'var(--sp-xl) 0', textAlign: 'center' }}>
              {t('tasksAdditions.noApprovals')}
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('tasks.fields.taskName')}</th>
                    <th>{t('tasks.fields.assignedTo')}</th>
                    <th>{t('tasks.fields.site')}</th>
                    <th>{t('tasksAdditions.workDate')}</th>
                    <th>{t('tasksAdditions.estimated')}</th>
                    <th>{t('tasksAdditions.actual')}</th>
                    <th style={{ width: 200 }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovalTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="font-semibold">{task.title}</td>
                      <td>{task.workerName}</td>
                      <td>{task.siteName}</td>
                      <td>{task.workDate}</td>
                      <td className="text-muted">{task.estimatedHours}h</td>
                      <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{task.actualHours}h</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleApproveHours(task)}
                            disabled={decidingTaskId === task.id}
                          >
                            ✓ {t('tasksAdditions.approve')}
                          </button>
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={(e) => openReject(task, e)}
                            disabled={decidingTaskId === task.id}
                          >
                            ✕ {t('tasksAdditions.reject')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board Columns Row */}
      {(!isManager || activeView === 'board') && (
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

                    {/* Hours estimate/approval status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-muted text-xs">
                        ⏱️ {t('tasksAdditions.estimated')}: {task.estimatedHours || 0}h
                        {task.actualHours != null && ` · ${t('tasksAdditions.actual')}: ${task.actualHours}h`}
                      </span>
                      <span className={`badge ${HOURS_STATUS_BADGES[task.hoursStatus || 'estimated']}`} style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {t(`tasksAdditions.hoursStatuses.${task.hoursStatus || 'estimated'}`)}
                      </span>
                    </div>
                    {task.hoursStatus === 'rejected' && task.rejectionNote && (
                      <div className="text-xs" style={{ color: 'var(--clr-danger)' }}>
                        ⚠️ {task.rejectionNote}
                      </div>
                    )}

                    {/* Shift Columns Actions */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {task.workerId === currentWorker?.id && ['estimated', 'rejected'].includes(task.hoursStatus || 'estimated') && (
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={(e) => openLogHours(task, e)}
                          style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                          ⏱️ {t('tasksAdditions.logHours')}
                        </button>
                      )}
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
      )}

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
                  value={formData.siteId}
                  onChange={(e) => handleFormChange('siteId', e.target.value)}
                >
                  <option value="">-- {t('tasksAdditions.selectSite')} --</option>
                  {assignableSites.length === 0 && <option value="" disabled>{t('tasksAdditions.noAssignableSites')}</option>}
                  {assignableSites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              {isManager ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-select">{t('tasks.fields.assignedTo')}</label>
                  <select
                    id="worker-select"
                    className="form-select"
                    value={formData.workerId}
                    onChange={(e) => handleFormChange('workerId', e.target.value)}
                    disabled={!formData.siteId}
                  >
                    <option value="">-- {t('tasksAdditions.selectWorker')} --</option>
                    {assignableWorkersForSite.length === 0 && (
                      <option value="" disabled>{t('tasksAdditions.noWorkersOnSite')}</option>
                    )}
                    {assignableWorkersForSite.map((worker) => (
                      <option key={worker.id} value={worker.id}>{worker.firstName} {worker.lastName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">{t('tasks.fields.assignedTo')}</label>
                  <div className="form-input" style={{ background: 'var(--clr-bg-elevated)', display: 'flex', alignItems: 'center' }}>
                    {currentWorker ? `${currentWorker.firstName} ${currentWorker.lastName}` : t('tasksAdditions.noOwnWorkerRecord')}
                  </div>
                </div>
              )}

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

              <div className="form-row">
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
                <div className="form-group">
                  <label className="form-label" htmlFor="task-estimated-hours">
                    {t('tasksAdditions.estimatedHours')} {!isManager && '*'}
                  </label>
                  <input
                    id="task-estimated-hours"
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimatedHours}
                    onChange={(e) => handleFormChange('estimatedHours', e.target.value)}
                    placeholder="e.g. 4"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>{t('common.buttons.cancel')}</button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTask}
                disabled={
                  !formData.title.trim() ||
                  !formData.siteId ||
                  (isManager ? !formData.workerId : !currentWorker) ||
                  (!isManager && !formData.estimatedHours)
                }
              >
                {t('common.buttons.save')}
              </button>
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

      {/* Log Actual Hours Modal */}
      {logHoursTask && (
        <div className="modal-backdrop" onClick={() => setLogHoursTask(null)} role="dialog" aria-modal="true" aria-labelledby="log-hours-title">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="log-hours-title">⏱️ {t('tasksAdditions.logHours')}: {logHoursTask.title}</h3>
              <button className="modal-close" onClick={() => setLogHoursTask(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div className="text-muted text-sm">
                {t('tasksAdditions.estimated')}: {logHoursTask.estimatedHours || 0}h
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="actual-hours">{t('tasksAdditions.actualHours')} *</label>
                <input
                  id="actual-hours"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.5"
                  value={actualHoursInput}
                  onChange={(e) => setActualHoursInput(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="work-date">{t('tasksAdditions.workDate')} *</label>
                <input
                  id="work-date"
                  className="form-input"
                  type="date"
                  value={workDateInput}
                  onChange={(e) => setWorkDateInput(e.target.value)}
                  required
                />
              </div>
              <p className="text-muted text-xs" style={{ margin: 0 }}>
                {t('tasksAdditions.logHoursHint')}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setLogHoursTask(null)}>{t('common.buttons.cancel')}</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitHours}
                disabled={submittingHours || !actualHoursInput || Number(actualHoursInput) <= 0 || !workDateInput}
              >
                {submittingHours ? t('common.loading') : t('tasksAdditions.submitForApproval')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Hours Modal */}
      {rejectTask && (
        <div className="modal-backdrop" onClick={() => setRejectTask(null)} role="dialog" aria-modal="true" aria-labelledby="reject-hours-title">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="reject-hours-title">✕ {t('tasksAdditions.reject')}: {rejectTask.title}</h3>
              <button className="modal-close" onClick={() => setRejectTask(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
              <div className="text-muted text-sm">
                {rejectTask.workerName} — {t('tasksAdditions.actual')}: {rejectTask.actualHours}h
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reject-note">{t('tasksAdditions.rejectionNote')}</label>
                <textarea
                  id="reject-note"
                  className="form-input"
                  rows="3"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder={t('tasksAdditions.rejectionNotePlaceholder')}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectTask(null)}>{t('common.buttons.cancel')}</button>
              <button
                className="btn btn-danger"
                onClick={handleRejectHours}
                disabled={decidingTaskId === rejectTask.id}
              >
                {t('tasksAdditions.confirmReject')}
              </button>
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
