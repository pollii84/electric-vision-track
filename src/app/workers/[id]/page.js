'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantDocSnapshot, updateTenantDoc, deleteTenantDoc } from '@/lib/firestore';

const DEMO_ASSIGNED_SITES = [];

const DEMO_TIME_LOGS = [];

const EXPERIENCE_LEVELS = [
  'manager',
  'senior',
  'seniorWithDegree',
  'intermediate',
  'intermediateWithDegree',
  'junior',
  'juniorWithDegree',
  'associated',
];

const BADGE_COLORS = {
  manager: 'badge-primary',
  senior: 'badge-accent',
  seniorWithDegree: 'badge-accent',
  intermediate: 'badge-warning',
  intermediateWithDegree: 'badge-warning',
  junior: 'badge-neutral',
  juniorWithDegree: 'badge-neutral',
  associated: 'badge-neutral',
};

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    experienceLevel: 'junior',
    hourlyRate: '',
    hireDate: '',
    isTeamLeader: false,
    isActive: true,
  });

  useEffect(() => {
    if (!tenantId || !params.id) return;
    setLoading(true);
    const unsubscribe = onTenantDocSnapshot(tenantId, 'workers', params.id, (data) => {
      setWorker(data);
      if (data) {
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          email: data.email || '',
          experienceLevel: data.experienceLevel || 'junior',
          hourlyRate: data.hourlyRate !== undefined ? data.hourlyRate : '',
          hireDate: data.hireDate || '',
          isTeamLeader: data.isTeamLeader || false,
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId, params.id]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !tenantId || !params.id) return;
    try {
      await updateTenantDoc(tenantId, 'workers', params.id, {
        ...formData,
        hourlyRate: Number(formData.hourlyRate) || 0,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update worker:', err);
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !params.id) return;
    if (confirm(t('workers.confirmDelete') || 'Are you sure you want to delete this worker?')) {
      try {
        await deleteTenantDoc(tenantId, 'workers', params.id);
        router.push('/workers');
      } catch (err) {
        console.error('Failed to delete worker:', err);
      }
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

  if (!worker) {
    return (
      <Layout>
        <div className="empty-state">
          <div className="empty-state-icon">👷</div>
          <div className="empty-state-title">{t('workers.detail.notFound')}</div>
          <div className="empty-state-desc">{t('workers.detail.notFoundDescription')}</div>
          <Link href="/workers" className="btn btn-primary">
            {t('common.buttons.back')}
          </Link>
        </div>
      </Layout>
    );
  }

  const initials = `${worker.firstName?.[0] || ''}${worker.lastName?.[0] || ''}`.toUpperCase();
  const demoHours = DEMO_TIME_LOGS.reduce((sum, log) => sum + log.hours, 0);
  const demoSitesCount = DEMO_ASSIGNED_SITES.length;
  const demoEarned = (worker.hourlyRate || 0) * demoHours;

  return (
    <Layout>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }}>
          <Link
            href="/workers"
            className="btn btn-ghost btn-icon"
            aria-label={t('common.buttons.back')}
          >
            ←
          </Link>
          <h1>{worker.firstName} {worker.lastName}</h1>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            aria-label={t('common.buttons.edit')}
            onClick={() => setShowEditModal(true)}
          >
            ✏️ {t('common.buttons.edit')}
          </button>
          <button
            className="btn btn-danger"
            aria-label={t('workers.deleteWorker')}
            onClick={handleDelete}
          >
            🗑️ {t('common.buttons.delete')}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-xl)', flexWrap: 'wrap' }}>
          {/* Left: Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-sm)' }}>
            <div
              className="avatar avatar-xl"
              style={{ background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))' }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--fs-sm)',
                color: worker.isActive ? 'var(--clr-success)' : 'var(--clr-danger)',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: worker.isActive ? 'var(--clr-success)' : 'var(--clr-danger)',
                }}
              />
              {worker.isActive ? t('common.active') : t('common.inactive')}
            </span>
          </div>

          {/* Right: Details */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)', flexWrap: 'wrap', marginBottom: 'var(--sp-md)' }}>
              <span className={`badge ${BADGE_COLORS[worker.experienceLevel]}`}>
                {t(`workers.experienceLevels.${worker.experienceLevel}`)}
              </span>
              {worker.isTeamLeader && (
                <span className="badge badge-accent">⭐ {t('workers.teamLeader')}</span>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--sp-md)',
            }}>
              <div>
                <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {t('workers.fields.phone')}
                </div>
                <div>{worker.phone}</div>
              </div>
              <div>
                <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {t('workers.fields.email')}
                </div>
                <div>{worker.email}</div>
              </div>
              <div>
                <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {t('workers.fields.hourlyRate')}
                </div>
                <div className="font-semibold" style={{ color: 'var(--clr-primary)' }}>
                  {worker.hourlyRate} RON/h
                </div>
              </div>
              <div>
                <div className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {t('workers.fields.hireDate')}
                </div>
                <div>{worker.hireDate || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="content-grid grid-cols-3" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div className="glass-card stat-card primary">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{demoHours}h</div>
          <div className="stat-label">{t('workers.stats.totalHoursMonth')}</div>
        </div>
        <div className="glass-card stat-card accent">
          <div className="stat-icon">🏗️</div>
          <div className="stat-value">{demoSitesCount}</div>
          <div className="stat-label">{t('workers.stats.assignedSites')}</div>
        </div>
        <div className="glass-card stat-card success">
          <div className="stat-icon">💰</div>
          <div className="stat-value currency">{demoEarned.toLocaleString()}</div>
          <div className="stat-label">{t('workers.stats.earnedThisMonth')} (RON)</div>
        </div>
      </div>

      {/* Assigned Sites Table */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">🏗️ {t('workers.detail.assignedSites')}</h3>
        </div>
        <div className="data-table-wrapper desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('workers.detail.site')}</th>
                <th>{t('workers.detail.role')}</th>
                <th>{t('workers.detail.since')}</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ASSIGNED_SITES.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                    No sites assigned yet.
                  </td>
                </tr>
              ) : (
                DEMO_ASSIGNED_SITES.map((site) => (
                  <tr key={site.id}>
                    <td className="font-semibold">{site.name}</td>
                    <td>
                      <span className="badge badge-accent">{site.role}</span>
                    </td>
                    <td className="text-muted">{site.since}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mobile-card-list mobile-only" style={{ padding: '0 var(--sp-md) var(--sp-md)' }}>
          {DEMO_ASSIGNED_SITES.length === 0 ? (
            <div className="text-muted text-sm" style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}>
              No sites assigned yet.
            </div>
          ) : (
            DEMO_ASSIGNED_SITES.map((site) => (
              <div key={site.id} className="mobile-card-item">
                <div className="mobile-card-row" style={{ fontWeight: '600', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ color: 'var(--clr-text)' }}>{site.name}</div>
                  <span className="badge badge-accent">{site.role}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('workers.detail.since')}</span>
                  <span className="mobile-card-value">{site.since}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Time Logs Table */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div className="card-header">
          <h3 className="card-title">📋 {t('workers.detail.recentTimeLogs')}</h3>
        </div>
        <div className="data-table-wrapper desktop-only">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('workers.detail.date')}</th>
                <th>{t('workers.detail.site')}</th>
                <th>{t('workers.detail.hours')}</th>
                <th>{t('workers.detail.description')}</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_TIME_LOGS.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--sp-xl)', color: 'var(--clr-text-muted)' }}>
                    No time logs recorded yet.
                  </td>
                </tr>
              ) : (
                DEMO_TIME_LOGS.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{log.date}</td>
                    <td className="font-semibold">{log.site}</td>
                    <td>
                      <span className="font-semibold" style={{ color: 'var(--clr-primary)' }}>
                        {log.hours}h
                      </span>
                    </td>
                    <td className="text-muted">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mobile-card-list mobile-only" style={{ padding: '0 var(--sp-md) var(--sp-md)' }}>
          {DEMO_TIME_LOGS.length === 0 ? (
            <div className="text-muted text-sm" style={{ padding: 'var(--sp-xl)', textAlign: 'center' }}>
              No time logs recorded yet.
            </div>
          ) : (
            DEMO_TIME_LOGS.map((log) => (
              <div key={log.id} className="mobile-card-item">
                <div className="mobile-card-row" style={{ fontWeight: '600', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ color: 'var(--clr-text)' }}>{log.site}</div>
                  <div style={{ color: 'var(--clr-primary)' }}>{log.hours}h</div>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('workers.detail.date')}</span>
                  <span className="mobile-card-value">{log.date}</span>
                </div>
                {log.description && (
                  <div style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                    {log.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Worker Modal */}
      {showEditModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowEditModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-worker-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="edit-worker-title">
                {t('workers.editWorker') || 'Edit Worker'}
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
              {/* First Name + Last Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-firstName">
                    {t('workers.fields.firstName')} *
                  </label>
                  <input
                    id="edit-worker-firstName"
                    className="form-input"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-lastName">
                    {t('workers.fields.lastName')} *
                  </label>
                  <input
                    id="edit-worker-lastName"
                    className="form-input"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-phone">
                    {t('workers.fields.phone')}
                  </label>
                  <input
                    id="edit-worker-phone"
                    className="form-input"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-email">
                    {t('workers.fields.email')}
                  </label>
                  <input
                    id="edit-worker-email"
                    className="form-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div className="form-group">
                <label className="form-label" htmlFor="edit-worker-experienceLevel">
                  {t('workers.fields.experienceLevel')}
                </label>
                <select
                  id="edit-worker-experienceLevel"
                  className="form-select"
                  value={formData.experienceLevel}
                  onChange={(e) => handleFormChange('experienceLevel', e.target.value)}
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {t(`workers.experienceLevels.${level}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hourly Rate + Hire Date */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-hourlyRate">
                    {t('workers.fields.hourlyRate')} (RON)
                  </label>
                  <input
                    id="edit-worker-hourlyRate"
                    className="form-input"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.hourlyRate}
                    onChange={(e) => handleFormChange('hourlyRate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-worker-hireDate">
                    {t('workers.fields.hireDate')}
                  </label>
                  <input
                    id="edit-worker-hireDate"
                    className="form-input"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleFormChange('hireDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Team Leader + Active checkboxes */}
              <div className="form-row" style={{ marginTop: 'var(--sp-sm)' }}>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isTeamLeader}
                    onChange={(e) => handleFormChange('isTeamLeader', e.target.checked)}
                  />
                  {t('workers.fields.isTeamLeader')}
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                  {t('workers.fields.activeStatus')}
                </label>
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
                disabled={!formData.firstName.trim() || !formData.lastName.trim()}
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
