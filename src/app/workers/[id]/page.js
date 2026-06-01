'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_WORKERS = [
  { id: '1', firstName: 'Andrei', lastName: 'Popescu', phone: '+40 741 234 567', email: 'andrei@electricvision.eu', experienceLevel: 'manager', isTeamLeader: true, hourlyRate: 85, isActive: true, hireDate: '2021-03-15' },
  { id: '2', firstName: 'Maria', lastName: 'Ionescu', phone: '+40 742 345 678', email: 'maria@electricvision.eu', experienceLevel: 'seniorWithDegree', isTeamLeader: false, hourlyRate: 70, isActive: true, hireDate: '2021-06-01' },
  { id: '3', firstName: 'Ion', lastName: 'Munteanu', phone: '+40 743 456 789', email: 'ion@electricvision.eu', experienceLevel: 'senior', isTeamLeader: true, hourlyRate: 65, isActive: true, hireDate: '2022-01-10' },
  { id: '4', firstName: 'Elena', lastName: 'Dragomir', phone: '+40 744 567 890', email: 'elena@electricvision.eu', experienceLevel: 'intermediateWithDegree', isTeamLeader: false, hourlyRate: 55, isActive: true, hireDate: '2022-09-01' },
  { id: '5', firstName: 'Vlad', lastName: 'Gheorghiu', phone: '+40 745 678 901', email: 'vlad@electricvision.eu', experienceLevel: 'intermediate', isTeamLeader: false, hourlyRate: 50, isActive: true, hireDate: '2023-02-20' },
  { id: '6', firstName: 'Ana', lastName: 'Popa', phone: '+40 746 789 012', email: 'ana@electricvision.eu', experienceLevel: 'juniorWithDegree', isTeamLeader: false, hourlyRate: 40, isActive: true, hireDate: '2023-08-15' },
  { id: '7', firstName: 'Mihai', lastName: 'Stan', phone: '+40 747 890 123', email: 'mihai@electricvision.eu', experienceLevel: 'junior', isTeamLeader: false, hourlyRate: 35, isActive: true, hireDate: '2024-01-05' },
  { id: '8', firstName: 'Cristian', lastName: 'Barbu', phone: '+40 748 901 234', email: 'cristian@electricvision.eu', experienceLevel: 'associated', isTeamLeader: false, hourlyRate: 25, isActive: false, hireDate: '2024-06-01' },
];

const DEMO_ASSIGNED_SITES = [
  { id: 's1', name: 'Bloc A7 — Residential Complex', role: 'Electrician', since: '2026-01-15' },
  { id: 's2', name: 'Mall Promenada — Commercial Fit-out', role: 'Team Lead', since: '2026-03-01' },
  { id: 's3', name: 'Office Tower B3 — Wiring', role: 'Electrician', since: '2026-04-10' },
];

const DEMO_TIME_LOGS = [
  { id: 't1', date: '2026-05-30', site: 'Bloc A7 — Residential Complex', hours: 8, description: 'Panel installation — Floor 4' },
  { id: 't2', date: '2026-05-29', site: 'Mall Promenada — Commercial Fit-out', hours: 7.5, description: 'Cable tray routing — Zone C' },
  { id: 't3', date: '2026-05-28', site: 'Office Tower B3 — Wiring', hours: 8, description: 'Conduit bending and installation' },
  { id: 't4', date: '2026-05-27', site: 'Bloc A7 — Residential Complex', hours: 6, description: 'Switchboard wiring — Floor 3' },
  { id: 't5', date: '2026-05-26', site: 'Mall Promenada — Commercial Fit-out', hours: 8.5, description: 'Emergency lighting test run' },
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

  const worker = useMemo(
    () => DEMO_WORKERS.find((w) => w.id === params.id),
    [params.id]
  );

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

  const initials = `${worker.firstName[0]}${worker.lastName[0]}`.toUpperCase();
  const demoHours = 168;
  const demoSitesCount = 3;
  const demoEarned = worker.hourlyRate * demoHours;

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
          <button className="btn btn-secondary" aria-label={t('common.buttons.edit')}>
            ✏️ {t('common.buttons.edit')}
          </button>
          <button className="btn btn-danger" aria-label={t('workers.deleteWorker')}>
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
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('workers.detail.site')}</th>
                <th>{t('workers.detail.role')}</th>
                <th>{t('workers.detail.since')}</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ASSIGNED_SITES.map((site) => (
                <tr key={site.id}>
                  <td className="font-semibold">{site.name}</td>
                  <td>
                    <span className="badge badge-accent">{site.role}</span>
                  </td>
                  <td className="text-muted">{site.since}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Time Logs Table */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">📋 {t('workers.detail.recentTimeLogs')}</h3>
        </div>
        <div className="data-table-wrapper">
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
              {DEMO_TIME_LOGS.map((log) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
