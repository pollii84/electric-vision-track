'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { getGlobalCollection, setGlobalDoc } from '@/lib/firestore';
import { useToast } from '@/contexts/ToastContext';

export default function TenantManagement() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const [editPlan, setEditPlan] = useState('small');
  const [editStatus, setEditStatus] = useState('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/');
    }
  }, [isSuperAdmin, authLoading, router]);

  const fetchTenants = async () => {
    try {
      const data = await getGlobalCollection('tenants');
      setTenants(data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const handleOpenEdit = (tenant) => {
    setSelectedTenant(tenant);
    setEditPlan(tenant.plan || 'small');
    setEditStatus(tenant.status || 'active');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedTenant) return;
    setIsSubmitting(true);

    try {
      await setGlobalDoc('tenants', selectedTenant.id, {
        plan: editPlan,
        status: editStatus,
      }, true);
      
      addToast(`Tenant "${selectedTenant.name}" updated successfully.`, 'success');
      setShowModal(false);
      fetchTenants();
    } catch (error) {
      console.error('Error updating tenant:', error);
      addToast('Failed to update tenant. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
            🏢 Tenant Workspaces Manager
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--clr-text-muted)', margin: '4px 0 0' }}>
            List, update, and manage all customer workspaces
          </p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workspace Name</th>
                <th>CUI / EUID</th>
                <th>Plan Tier</th>
                <th>Status</th>
                <th>Owner UID</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold">{t.name}</td>
                  <td>
                    <div style={{ fontSize: 'var(--fs-sm)' }}>CUI: {t.cui || '—'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>EUID: {t.euid || '—'}</div>
                  </td>
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
                  <td className="text-muted text-xs font-mono">{t.ownerId}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary btn-xs" onClick={() => handleOpenEdit(t)}>
                        ✏️ Edit Config
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--clr-text-muted)' }}>
                    No tenants found in the system.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Tenant Modal */}
      {showModal && selectedTenant && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--clr-bg-deep)', border: '1px solid var(--glass-border)', padding: 28 }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0, fontWeight: 800 }}>
                🏢 Edit Workspace Config
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)} style={{ fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
                  Workspace: <strong style={{ color: 'var(--clr-text)' }}>{selectedTenant.name}</strong>
                </div>

                {/* Plan select */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-tenant-plan">Billing Plan Tier</label>
                  <select
                    id="edit-tenant-plan"
                    className="form-select"
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                  >
                    <option value="small">Small (1-10 users)</option>
                    <option value="medium">Medium (11-50 users)</option>
                    <option value="large">Large (51-500 users)</option>
                    <option value="enterprise">Enterprise (500+ users)</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-tenant-status">Account Status</label>
                  <select
                    id="edit-tenant-status"
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="active">Active (Access Allowed)</option>
                    <option value="suspended">Suspended (Access Blocked)</option>
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
