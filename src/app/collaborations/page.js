'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onGlobalCollectionSnapshot } from '@/lib/firestore';

export default function CollaborationsPage() {
  const { t } = useI18n();
  const { tenantId } = useAuth();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const unsub = onGlobalCollectionSnapshot(
      'collaborations',
      (docs) => {
        const sorted = [...docs].sort((a, b) => {
          const aMs = a.createdAt?.toMillis?.() ?? 0;
          const bMs = b.createdAt?.toMillis?.() ?? 0;
          return bMs - aMs;
        });
        setCollabs(sorted);
        setLoading(false);
      },
      { filters: [{ field: 'contractorTenantId', op: '==', value: tenantId }] }
    );
    return unsub;
  }, [tenantId]);

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString();
  };

  if (loading || !tenantId) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--clr-primary)" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
          </svg>
          <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>🤝 {t('nav.collaborations')}</h1>
          <p className="text-muted" style={{ margin: '4px 0 0 0' }}>{t('collab.pageSubtitle')}</p>
        </div>
      </div>

      {collabs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <div className="empty-state-title">{t('collab.emptyTitle')}</div>
          <div className="empty-state-desc">{t('collab.emptyDesc')}</div>
        </div>
      ) : (
        <div className="glass-card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('collab.workingFor')}</th>
                  <th>{t('collab.siteName')}</th>
                  <th>{t('common.status')}</th>
                  <th>{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {collabs.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="font-semibold">{c.ownerCompanyName}</div>
                      <div className="text-muted text-xs">{t('collab.workingFor')}</div>
                    </td>
                    <td className="font-semibold">{c.siteName}</td>
                    <td>
                      <span className="badge badge-success">{t('collab.activeStatus')}</span>
                    </td>
                    <td className="text-muted">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
