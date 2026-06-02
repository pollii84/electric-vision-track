'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { useBusiness } from '@/contexts/BusinessContext';
import { useI18n } from '@/lib/i18n';

export default function CompaniesPage() {
  const { t } = useI18n();
  const {
    companies,
    activeCompanyId,
    setActiveCompanyId,
    createCompany,
    updateCompany,
    deleteCompany
  } = useBusiness();

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    manager: ''
  });

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({ name: '', address: '', description: '', manager: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (company) => {
    setEditId(company.id);
    setFormData({
      name: company.name,
      address: company.address,
      description: company.description,
      manager: company.manager
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm(t('companies.confirmDelete'))) {
      deleteCompany(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      updateCompany(editId, formData);
    } else {
      createCompany(formData);
    }
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            🏢 {t('companies.title')}
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--clr-text-muted)', margin: '4px 0 0' }}>
            {t('companies.subtitle')}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          ➕ {t('companies.addCompany')}
        </button>
      </div>

      <div className="content-grid grid-cols-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {companies.map((company) => {
          const isActive = company.id === activeCompanyId;
          return (
            <div
              key={company.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 24,
                position: 'relative',
                border: isActive ? '2px solid var(--clr-primary)' : '1px solid var(--glass-border)',
                boxShadow: isActive ? '0 0 20px var(--clr-primary-glow)' : 'none',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isActive && (
                <span className="badge badge-accent" style={{ position: 'absolute', top: 16, right: 16, fontSize: 'var(--fs-xs)' }}>
                  👑 {t('companies.active')}
                </span>
              )}
              
              <div>
                <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, margin: '0 0 10px', color: 'var(--clr-text)' }}>
                  {company.name}
                </h3>
                {company.address && (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
                    <span>📍</span> {company.address}
                  </p>
                )}
                {company.manager && (
                  <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 16px' }}>
                    <span>👷</span> <strong>{t('companies.form.manager')}:</strong> {company.manager}
                  </p>
                )}
                {company.description && (
                  <p style={{ fontSize: 'var(--fs-base)', color: 'var(--clr-text-secondary)', lineHeight: 1.5, margin: '0 0 24px', minHeight: 48 }}>
                    {company.description}
                  </p>
                )}
              </div>

              <div>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--clr-primary-light)' }}>{company.stats.sites}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t('companies.stats.sites')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--clr-accent)' }}>{company.stats.workers}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t('companies.stats.workers')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--clr-success)' }}>{company.stats.managers}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>{t('companies.stats.managers')}</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {!isActive ? (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setActiveCompanyId(company.id)}>
                      🔄 {t('companies.selectCompany')}
                    </button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'not-allowed', opacity: 0.5 }} disabled>
                      ✓ {t('companies.active')}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => handleOpenEdit(company)} aria-label={t('common.edit')}>
                    ✏️
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px', color: 'var(--clr-danger)' }} onClick={() => handleDelete(company.id)} aria-label={t('common.delete')}>
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal glass-card" style={{ width: '100%', maxWidth: 480, padding: 28, background: 'var(--clr-bg-deep)', border: '1px solid var(--glass-border)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, margin: 0 }}>
                {editId ? t('companies.editCompany') : t('companies.addCompany')}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} style={{ fontSize: 18 }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ marginBottom: 24 }}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="comp-name">{t('companies.form.name')}</label>
                  <input
                    id="comp-name"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Oradea Division"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="comp-address">{t('companies.form.address')}</label>
                  <input
                    id="comp-address"
                    type="text"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Calea Borsului 45, Oradea"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" htmlFor="comp-manager">{t('companies.form.manager')}</label>
                  <input
                    id="comp-manager"
                    type="text"
                    className="form-input"
                    value={formData.manager}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                    placeholder="e.g. Adrian Muresan"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="comp-description">{t('companies.form.description')}</label>
                  <textarea
                    id="comp-description"
                    className="form-input"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of the branch focus..."
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
