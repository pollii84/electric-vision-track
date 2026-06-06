'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getGlobalCollection } from '@/lib/firestore';

export default function AdminDashboard() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not superadmin
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchData = async () => {
      try {
        const tenantsData = await getGlobalCollection('tenants');
        const usersData = await getGlobalCollection('users');
        setTenants(tenantsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching global admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isSuperAdmin]);

  if (authLoading || loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="spinner">
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--clr-primary)" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Layout>
    );
  }

  // Calculate stats
  const totalTenants = tenants.length;
  const totalUsers = users.length;
  
  const planDistribution = tenants.reduce((acc, t) => {
    const plan = t.plan || 'small';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const recentTenants = [...tenants]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  return (
    <Layout>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, margin: 0 }}>
            🔑 Superadmin Control Panel
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--clr-text-muted)', margin: '4px 0 0' }}>
            System-wide administration, tenant configuration, and analytics
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="content-grid grid-cols-4" style={{ marginBottom: 24 }}>
        <div className="glass-card stat-card primary">
          <div className="stat-icon">🏢</div>
          <div className="stat-value">{totalTenants}</div>
          <div className="stat-label">Total Tenants (Clients)</div>
        </div>
        
        <div className="glass-card stat-card accent">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalUsers}</div>
          <div className="stat-label">Total Registered Users</div>
        </div>

        <div className="glass-card stat-card success">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            {planDistribution.medium || 0} / {planDistribution.large || 0}
          </div>
          <div className="stat-label">Medium / Large Plans</div>
        </div>

        <div className="glass-card stat-card primary">
          <div className="stat-icon">⚡</div>
          <div className="stat-value">{planDistribution.small || 0}</div>
          <div className="stat-label">Small Plans</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }} className="admin-columns">
        {/* Recent Tenants */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            🏢 Recent Tenant Registrations
          </h3>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Owner ID</th>
                </tr>
              </thead>
              <tbody>
                {recentTenants.map((t) => (
                  <tr key={t.id}>
                    <td className="font-semibold">{t.name}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {t.plan || 'small'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status || 'active'}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{t.ownerId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Settings & Actions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            🛠️ Quick Admin Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button 
              className="btn btn-primary" 
              onClick={() => router.push('/admin/tenants')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Manage Tenant Workspaces
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => router.push('/admin/users')}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Manage Global Users
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .admin-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
