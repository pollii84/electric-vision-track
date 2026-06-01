'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu', address: 'Str. Eroilor 15, Cluj-Napoca', clientName: 'Popescu Ion', status: 'in_progress', progress: 65, budget: 125000, startDate: '2026-03-15', workers: ['Andrei P.', 'Maria I.', 'Ion M.', 'Vlad G.'] },
  { id: '2', name: 'Bloc Florești - Et. 3', address: 'Str. Avram Iancu 42, Florești', clientName: 'SC Residential SRL', status: 'in_progress', progress: 40, budget: 85000, startDate: '2026-04-01', workers: ['Elena D.', 'Ana P.', 'Mihai S.'] },
  { id: '3', name: 'Birouri Sigma Center', address: 'Bd. 21 Decembrie 77, Cluj-Napoca', clientName: 'Sigma Development', status: 'planned', progress: 0, budget: 210000, startDate: '2026-07-01', workers: [] },
  { id: '4', name: 'Casa Marin - Borșa', address: 'Str. Libertății 8, Borșa', clientName: 'Marin Alexandru', status: 'completed', progress: 100, budget: 45000, startDate: '2026-01-10', workers: [] },
  { id: '5', name: 'Hotel Panoramic Renovare', address: 'Str. Republicii 120, Cluj-Napoca', clientName: 'SC Turism SA', status: 'in_progress', progress: 25, budget: 350000, startDate: '2026-05-01', workers: ['Andrei P.', 'Maria I.', 'Ion M.', 'Elena D.', 'Vlad G.', 'Ana P.', 'Mihai S.', 'Cristian B.'] },
  { id: '6', name: 'Depozit Logistic Turda', address: 'Zona Industrială, Turda', clientName: 'SC Logistica SRL', status: 'on_hold', progress: 15, budget: 180000, startDate: '2026-02-20', workers: ['Ion M.'] },
  { id: '7', name: 'Restaurant Bella Vista', address: 'Str. Napoca 5, Cluj-Napoca', clientName: 'Bella Vista SRL', status: 'planned', progress: 0, budget: 95000, startDate: '2026-08-15', workers: [] },
  { id: '8', name: 'Clădire Rezidențială Dej', address: 'Str. 1 Mai 33, Dej', clientName: 'SC Imobiliare SA', status: 'in_progress', progress: 55, budget: 420000, startDate: '2026-04-10', workers: ['Andrei P.', 'Elena D.', 'Mihai S.', 'Ana P.', 'Vlad G.'] },
];

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

const DEMO_TIME_LOGS = [
  { id: '1', date: '2026-05-28', worker: 'Andrei Popescu', hours: 8, timeRange: '08:00 - 16:00', description: 'Cablare panou principal și conexiuni' },
  { id: '2', date: '2026-05-28', worker: 'Maria Ionescu', hours: 8, timeRange: '08:00 - 16:00', description: 'Verificare circuite prize și împământare' },
  { id: '3', date: '2026-05-27', worker: 'Ion Munteanu', hours: 8, timeRange: '08:00 - 16:00', description: 'Trasare trasee cablu în tub protectie' },
  { id: '4', date: '2026-05-27', worker: 'Vlad Gheorghiu', hours: 8, timeRange: '08:00 - 16:00', description: 'Montaj doze aparat și doze legătură' },
  { id: '5', date: '2026-05-26', worker: 'Andrei Popescu', hours: 6, timeRange: '09:00 - 15:00', description: 'Ședință progres și organizare șantier' },
  { id: '6', date: '2026-05-26', worker: 'Maria Ionescu', hours: 8, timeRange: '08:00 - 16:00', description: 'Cablare circuite iluminat interior' },
];

const DEMO_MATERIALS = [
  { id: '1', name: 'Cablu NYM 3x2.5mm', category: 'Cabluri', qty: 500, unit: 'm', cost: 3.20 },
  { id: '2', name: 'Întrerupător automat 16A', category: 'Protecție', qty: 24, unit: 'buc', cost: 25.00 },
  { id: '3', name: 'Priză simplă Legrand', category: 'Prize', qty: 45, unit: 'buc', cost: 18.00 },
  { id: '4', name: 'Tub PVC 20mm', category: 'Tuburi', qty: 200, unit: 'm', cost: 2.50 },
  { id: '5', name: 'Doză de legătură', category: 'Doze', qty: 60, unit: 'buc', cost: 4.00 },
  { id: '6', name: 'Tablou electric 24 module', category: 'Tablouri', qty: 2, unit: 'buc', cost: 180.00 },
  { id: '7', name: 'Șină DIN', category: 'Accesorii', qty: 8, unit: 'buc', cost: 12.00 },
  { id: '8', name: 'Clemă Wago 3 căi', category: 'Conectică', qty: 100, unit: 'buc', cost: 2.80 },
];

const DEMO_TOOLS = [
  { id: '1', name: 'Multimetru Fluke 87V', serial: 'FLK-87V-102', status: 'available', assignedTo: '-' },
  { id: '2', name: 'Bormaşină Makita DHP482', serial: 'MKT-DHP482', status: 'in_use', assignedTo: 'Andrei Popescu' },
  { id: '3', name: 'Tester cablu NetCat Pro', serial: 'TST-NET-450', status: 'available', assignedTo: '-' },
  { id: '4', name: 'Nivel laser Bosch GLL 3-80', serial: 'BSH-GLL3-80', status: 'in_use', assignedTo: 'Maria Ionescu' },
  { id: '5', name: 'Clește sertizare Knipex', serial: 'CRM-KNIPEX', status: 'available', assignedTo: '-' },
];

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();

  const siteId = params.id;
  const site = useMemo(() => {
    return DEMO_SITES.find((s) => s.id === siteId) || DEMO_SITES[0];
  }, [siteId]);

  const [activeTab, setActiveTab] = useState('overview');

  const totalMaterialCosts = useMemo(() => {
    return DEMO_MATERIALS.reduce((sum, item) => sum + item.qty * item.cost, 0);
  }, []);

  const totalHours = useMemo(() => {
    return DEMO_TIME_LOGS.reduce((sum, log) => sum + log.hours, 0);
  }, []);

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
          <button className="btn btn-secondary">{t('sites.editSite')}</button>
          <button className="btn btn-danger" onClick={() => {
            if (confirm(t('sites.confirmDelete'))) {
              router.push('/sites');
            }
          }}>{t('sites.deleteSite')}</button>
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

              {site.workers.length === 0 ? (
                <div className="text-muted text-sm" style={{ padding: 'var(--sp-md) 0' }}>
                  No workers assigned to this site yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                  {site.workers.map((workerName, i) => (
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
              <button className="btn btn-primary btn-sm">
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
                  {DEMO_TIME_LOGS.map((log) => (
                    <tr key={log.id}>
                      <td className="font-semibold">{log.date}</td>
                      <td>{log.worker}</td>
                      <td className="font-semibold" style={{ color: 'var(--clr-primary)' }}>{log.hours}</td>
                      <td className="text-muted">{log.timeRange}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
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
              <button className="btn btn-primary btn-sm">
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
                  {DEMO_MATERIALS.map((item) => (
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
              <button className="btn btn-primary btn-sm">
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
                  {DEMO_TOOLS.map((tool) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

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
