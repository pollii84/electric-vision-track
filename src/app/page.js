'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

const STAT_CARDS = [
  {
    icon: '🏗️',
    value: '12',
    labelKey: 'dashboard.stats.activeSites',
    change: '+2 this month',
    theme: 'primary',
  },
  {
    icon: '👷',
    value: '48',
    labelKey: 'dashboard.stats.totalWorkers',
    change: '+5',
    theme: 'accent',
  },
  {
    icon: '⏱️',
    value: '1,240',
    labelKey: 'dashboard.stats.hoursThisWeek',
    change: '+8%',
    theme: 'success',
  },
  {
    icon: '💰',
    value: '248,500 RON',
    labelKey: 'dashboard.stats.monthlyRevenue',
    change: '+12%',
    theme: 'primary',
  },
];

const DEMO_SITES = [
  {
    name: 'Vila Popescu - Cluj',
    client: 'Popescu Ion',
    status: 'in_progress',
    badgeClass: 'badge-warning',
    progress: 65,
    workers: 4,
  },
  {
    name: 'Bloc Florești Et.3',
    client: 'SC Residential SRL',
    status: 'in_progress',
    badgeClass: 'badge-warning',
    progress: 40,
    workers: 6,
  },
  {
    name: 'Birouri Sigma Center',
    client: 'Sigma Development',
    status: 'planned',
    badgeClass: 'badge-primary',
    progress: 0,
    workers: 0,
  },
  {
    name: 'Casa Marin - Borșa',
    client: 'Marin Alexandru',
    status: 'completed',
    badgeClass: 'badge-success',
    progress: 100,
    workers: 0,
  },
  {
    name: 'Hotel Panoramic',
    client: 'SC Turism SA',
    status: 'in_progress',
    badgeClass: 'badge-warning',
    progress: 25,
    workers: 8,
  },
];

const QUICK_ACTIONS = [
  {
    icon: '➕',
    titleKey: 'dashboard.newSite',
    descKey: 'dashboard.newSiteDesc',
    href: '/sites',
  },
  {
    icon: '👷',
    titleKey: 'dashboard.addWorker',
    descKey: 'dashboard.addWorkerDesc',
    href: '/workers',
  },
  {
    icon: '⏱️',
    titleKey: 'dashboard.logTime',
    descKey: 'dashboard.logTimeDesc',
    href: '/timesheets',
  },
  {
    icon: '📝',
    titleKey: 'dashboard.createQuote',
    descKey: 'dashboard.createQuoteDesc',
    href: '/quotes',
  },
  {
    icon: '📦',
    titleKey: 'dashboard.newPurchase',
    descKey: 'dashboard.newPurchaseDesc',
    href: '/purchases',
  },
  {
    icon: '📊',
    titleKey: 'dashboard.viewReports',
    descKey: 'dashboard.viewReportsDesc',
    href: '/',
  },
];

const RECENT_ACTIVITIES = [
  {
    color: 'var(--clr-success)',
    text: 'Andrei Popescu logged 8h at Vila Popescu',
    time: '2h ago',
  },
  {
    color: 'var(--clr-warning)',
    text: 'New material purchase: 500m cable NYM 3x2.5',
    time: '3h ago',
  },
  {
    color: 'var(--clr-accent)',
    text: 'Task completed: Panel installation at Bloc Florești',
    time: '5h ago',
  },
  {
    color: 'var(--clr-success)',
    text: 'Invoice #INV-2026-0042 sent to Sigma Development',
    time: 'Yesterday',
  },
  {
    color: 'var(--clr-warning)',
    text: 'Maria Ionescu assigned to Hotel Panoramic',
    time: 'Yesterday',
  },
  {
    color: 'var(--clr-danger)',
    text: 'Site Depozit Turda status changed to On Hold',
    time: '2 days ago',
  },
];

export default function DashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>{t('dashboard.welcome', { name: user?.displayName || 'User' })}</h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {todayFormatted}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="content-grid grid-cols-4" style={{ marginBottom: 'var(--sp-lg)' }}>
        {STAT_CARDS.map((stat) => (
          <div key={stat.labelKey} className={`glass-card stat-card ${stat.theme}`}>
            <div className="stat-icon" aria-hidden="true">
              {stat.icon}
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{t(stat.labelKey)}</div>
            <div className="stat-change positive">
              <span>↑</span> {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column layout: Overview + Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          marginBottom: 'var(--sp-lg)',
        }}
        className="dashboard-columns"
      >
        {/* Left Column — Active Sites Overview */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.activeSitesOverview')}</h3>
            <Link href="/sites" className="btn btn-ghost btn-sm">
              {t('common.buttons.viewAll')}
            </Link>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table" role="table">
              <thead>
                <tr>
                  <th>{t('sites.fields.name')}</th>
                  <th>{t('sites.fields.client')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('sites.fields.progress')}</th>
                  <th>{t('nav.workers')}</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_SITES.map((site) => (
                  <tr key={site.name}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{site.name}</span>
                    </td>
                    <td className="text-secondary">{site.client}</td>
                    <td>
                      <span className={`badge ${site.badgeClass}`}>
                        <span className="badge-dot" />
                        {t(`sites.statuses.${site.status}`)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            background: 'var(--clr-bg-elevated)',
                            overflow: 'hidden',
                          }}
                          role="progressbar"
                          aria-valuenow={site.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${site.progress}% progress`}
                        >
                          <div
                            style={{
                              width: `${site.progress}%`,
                              height: '100%',
                              borderRadius: 3,
                              background:
                                site.progress === 100
                                  ? 'var(--clr-success)'
                                  : 'var(--clr-primary)',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted" style={{ minWidth: 32 }}>
                          {site.progress}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{site.workers}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column — Quick Actions */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">{t('dashboard.quickActions')}</h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.titleKey}
                href={action.href}
                className="quick-action-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: 'var(--sp-md) var(--sp-sm)',
                  background: 'var(--clr-bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--clr-border)',
                  textDecoration: 'none',
                  color: 'var(--clr-text)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--clr-border-hover)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--clr-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: 'var(--fs-2xl)', marginBottom: 6 }} aria-hidden="true">
                  {action.icon}
                </span>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 2 }}>
                  {t(action.titleKey)}
                </span>
                <span
                  className="text-muted"
                  style={{ fontSize: 'var(--fs-xs)', lineHeight: 'var(--lh-normal)' }}
                >
                  {t(action.descKey)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity — Full Width */}
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">{t('dashboard.recentActivity')}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {RECENT_ACTIVITIES.map((activity, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-md)',
                padding: '12px 0',
                borderBottom:
                  index < RECENT_ACTIVITIES.length - 1
                    ? '1px solid var(--clr-border)'
                    : 'none',
              }}
            >
              {/* Colored dot */}
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: activity.color,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />

              {/* Activity text */}
              <span style={{ flex: 1, fontSize: 'var(--fs-base)' }}>
                {activity.text}
              </span>

              {/* Time ago */}
              <span
                className="text-muted"
                style={{
                  fontSize: 'var(--fs-sm)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive styles for the two-column layout */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .dashboard-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
