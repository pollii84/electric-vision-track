'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getGlobalCollection, setGlobalDoc } from '@/lib/firestore';
import { useToast } from '@/contexts/ToastContext';

export default function UserManagement() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [editRole, setEditRole] = useState('worker');
  const [editTenantId, setEditTenantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  const fetchData = async () => {
    try {
      const usersData = await getGlobalCollection('users');
      const tenantsData = await getGlobalCollection('tenants');
      setUsers(usersData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error fetching global users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setEditRole(u.role || 'worker');
    setEditTenantId(u.tenantId || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      await setGlobalDoc('users', selectedUser.uid, {
        role: editRole,
        tenantId: editTenantId || null,
      }, true);
      
      addToast(`User "${selectedUser.displayName || selectedUser.email}" updated successfully.`, 'success');
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
      addToast('Failed to update user. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTenantName = (tId) => {
    if (!tId) return 'Unassigned';
    const tenant = tenants.find(t => t.id === tId);
    return tenant ? tenant.name : 'Unknown Tenant';
  };

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

  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => router.push('/admin')} className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span>←</span> Back to Admin Dashboard
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, margin: 0 }}>
            👥 Global Users Directory
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--clr-text-muted)', margin: '4px 0 0' }}>
            List, update roles, and manage tenant mappings for all users in the system
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Role</th>
                <th>Tenant (Company)</th>
                <th>User UID</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div className="font-semibold">{u.displayName || 'Unnamed User'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{u.email}</div>
                    {u.phone && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>📞 {u.phone}</div>}
                  </td>
                  <td>
                    <span className="badge badge-accent" style={{ textTransform: 'capitalize' }}>
                      {u.role || 'worker'}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium">{getTenantName(u.tenantId)}</span>
                    {u.tenantId && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>ID: {u.tenantId}</div>}
                  </td>
                  <td className="text-muted text-xs font-mono">{u.uid}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEdit(u)}>
                        ✏️ Edit Config
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--clr-text-muted)' }}>
                    No users found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {showModal && selectedUser && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--clr-bg-deep)', border: '1px solid var(--glass-border)', padding: 28 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0, fontWeight: 800 }}>
                👥 Edit User Config
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
                  User: <strong style={{ color: 'var(--clr-text)' }}>{selectedUser.displayName || selectedUser.email}</strong>
                </div>

                {/* Role select */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-role">Global Role</label>
                  <select
                    id="edit-user-role"
                    className="form-select"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    <option value="owner">Owner (Full tenant access)</option>
                    <option value="manager">Manager</option>
                    <option value="supervisor">Site Supervisor</option>
                    <option value="worker">Worker (Restricted access)</option>
                  </select>
                </div>

                {/* Tenant mapping select */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-tenant">Tenant Mapping</label>
                  <select
                    id="edit-user-tenant"
                    className="form-select"
                    value={editTenantId}
                    onChange={(e) => setEditTenantId(e.target.value)}
                  >
                    <option value="">Unassigned (No tenant context)</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
