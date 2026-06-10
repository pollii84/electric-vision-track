'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/TenantContext';
import { onTenantCollectionSnapshot } from '@/lib/firestore';

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

export default function DashboardPage() {
  const { t } = useI18n();
  const { user, tenantId } = useAuth();
  const { activeCompany } = useBusiness();

  const [workers, setWorkers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    const unsubWorkers = onTenantCollectionSnapshot(tenantId, 'workers', (data) => {
      setWorkers(data || []);
    });

    const unsubSites = onTenantCollectionSnapshot(tenantId, 'sites', (data) => {
      setSites(data || []);
      setLoading(false);
    });

    return () => {
      unsubWorkers();
      unsubSites();
    };
  }, [tenantId]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const stats = useMemo(() => {
    const activeSites = (sites || []).filter(s => s.status === 'in_progress').length;
    const totalWorkers = (workers || []).length;
    return [
      { icon: '🏗️', value: String(activeSites), labelKey: 'dashboard.stats.activeSites', change: '+2 this month', theme: 'primary' },
      { icon: '👷', value: String(totalWorkers), labelKey: 'dashboard.stats.totalWorkers', change: '+5', theme: 'accent' },
      { icon: '⏱️', value: '0', labelKey: 'dashboard.stats.hoursThisWeek', change: '', theme: 'success' },
      { icon: '💰', value: '0 RON', labelKey: 'dashboard.stats.monthlyRevenue', change: '', theme: 'primary' },
    ];
  }, [sites, workers]);

  const sitesList = useMemo(() => {
    return (sites || []).slice(0, 5).map(site => ({
      name: site.name || '',
      client: site.clientName || '',
      status: site.status || 'planned',
      badgeClass: site.status === 'in_progress' ? 'badge-warning' : (site.status === 'completed' ? 'badge-success' : 'badge-primary'),
      progress: site.progress || 0,
      workers: (site.workers || []).length
    }));
  }, [sites]);

  const activities = useMemo(() => {
    return [];
  }, []);

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
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            {t('dashboard.welcome', { name: user?.displayName || 'User' })}{' '}
            <span style={{ fontSize: 'var(--fs-md)', color: 'var(--clr-primary)', fontWeight: 600 }}>
              ({activeCompany?.name})
            </span>
          </h1>
          <p className="text-muted" style={{ marginTop: 4 }}>
            {todayFormatted}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="content-grid grid-cols-4" style={{ marginBottom: 'var(--sp-lg)' }}>
        {stats.map((stat) => (
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
                {sitesList.map((site) => (
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
                {sitesList.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '24px 0' }}>
                      No active sites in this business unit
                    </td>
                  </tr>
                )}
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
          {activities.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)', padding: '24px 0' }}>
              {t('dashboard.noRecentActivity')}
            </div>
          )}
          {activities.map((activity, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-md)',
                padding: '12px 0',
                borderBottom:
                  index < activities.length - 1
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
