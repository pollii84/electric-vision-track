'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_WORKERS = [
  { id: '1', name: 'Andrei Popescu' },
  { id: '2', name: 'Maria Ionescu' },
  { id: '3', name: 'Ion Munteanu' },
  { id: '4', name: 'Elena Dragomir' },
];

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu' },
  { id: '2', name: 'Bloc Florești - Et. 3' },
  { id: '3', name: 'Birouri Sigma Center' }
];

const INITIAL_TASKS = [
  { id: '1', title: 'Conduit installation ground floor', siteName: 'Vila Popescu', workerName: 'Andrei Popescu', priority: 'high', dueDate: '2026-06-03', status: 'in_progress', desc: 'Lay down conduit lines along ground floor walls as per PermPerm-0021 permit.' },
  { id: '2', title: 'Switchboard wire labeling', siteName: 'Bloc Florești - Et. 3', workerName: 'Ion Munteanu', priority: 'medium', dueDate: '2026-06-05', status: 'todo', desc: 'Perform color coding and labeling for three main phase cables.' },
  { id: '3', title: 'Power outlet safety test', siteName: 'Birouri Sigma Center', workerName: 'Elena Dragomir', priority: 'low', dueDate: '2026-06-08', status: 'quality_review', desc: 'Run insulation and loop impedance diagnostic checks.' },
  { id: '4', title: 'Smart dimmer configuration', siteName: 'Vila Popescu', workerName: 'Maria Ionescu', priority: 'high', dueDate: '2026-06-01', status: 'completed', desc: 'Calibrate wireless modules on Dim-99 models.' }
];

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

  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    siteIndex: '0',
    workerIndex: '0',
    priority: 'medium',
    dueDate: '2026-06-05',
  });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCreateTask = () => {
    if (!formData.title.trim()) return;

    const selectedSite = DEMO_SITES[Number(formData.siteIndex)];
    const selectedWorker = DEMO_WORKERS[Number(formData.workerIndex)];

    const newTask = {
      id: String(Date.now()),
      title: formData.title,
      desc: formData.desc,
      siteName: selectedSite.name,
      workerName: selectedWorker.name,
      priority: formData.priority,
      dueDate: formData.dueDate,
      status: 'todo',
    };

    setTasks((prev) => [...prev, newTask]);
    setShowModal(false);
    setFormData({
      title: '',
      desc: '',
      siteIndex: '0',
      workerIndex: '0',
      priority: 'medium',
      dueDate: '2026-06-05',
    });
  };

  const moveTask = (id, direction) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const currentIndex = COLUMNS.indexOf(task.status);
          const nextIndex = currentIndex + direction;
          if (nextIndex >= 0 && nextIndex < COLUMNS.length) {
            return { ...task, status: COLUMNS[nextIndex] };
          }
        }
        return task;
      })
    );
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📋 {t('tasks.title')}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
                minHeight: '400px',
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
                    className="glass-card"
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

                    {/* Desc */}
                    {task.desc && (
                      <p className="text-muted text-xs" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {task.desc}
                      </p>
                    )}

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
                          onClick={() => moveTask(task.id, -1)}
                          style={{ padding: '2px 6px', fontSize: '9px' }}
                          title="Move Back"
                        >
                          ←
                        </button>
                      )}
                      {col !== 'completed' && (
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => moveTask(task.id, 1)}
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

      {/* Create Task Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-task-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="create-task-title">
                {t('tasks.createTask')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Task Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">
                  {t('tasks.fields.taskName')} *
                </label>
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

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">
                  {t('tasks.fields.description')}
                </label>
                <textarea
                  id="task-desc"
                  className="form-input"
                  rows="3"
                  value={formData.desc}
                  onChange={(e) => handleFormChange('desc', e.target.value)}
                  placeholder="Details about task execution scope..."
                />
              </div>

              {/* Select Site */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-select">
                  {t('tasks.fields.site')}
                </label>
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

              {/* Select Worker */}
              <div className="form-group">
                <label className="form-label" htmlFor="worker-select">
                  {t('tasks.fields.assignedTo')}
                </label>
                <select
                  id="worker-select"
                  className="form-select"
                  value={formData.workerIndex}
                  onChange={(e) => handleFormChange('workerIndex', e.target.value)}
                >
                  {DEMO_WORKERS.map((worker, index) => (
                    <option key={worker.id} value={index}>{worker.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority select */}
              <div className="form-group">
                <label className="form-label" htmlFor="priority-select">
                  {t('tasks.fields.priority')}
                </label>
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

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="due-date">
                  {t('tasks.fields.dueDate')}
                </label>
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTask}
                disabled={!formData.title.trim()}
              >
                {t('common.buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive directory layout */}
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
