'use client';

import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantCollectionSnapshot, addTenantDoc } from '@/lib/firestore';

const CONTACT_TYPES = ['all', 'client', 'supplier', 'employee', 'subcontractor'];

const BADGE_COLORS = {
  client: 'badge-primary',
  supplier: 'badge-accent',
  employee: 'badge-success',
  subcontractor: 'badge-warning',
};

const INITIAL_FORM = {
  type: 'client',
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  workTypes: '',
  notes: '',
};

export default function ContactsPage() {
  const { t } = useI18n();
  const { tenantId } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const unsubscribe = onTenantCollectionSnapshot(tenantId, 'contacts', (data) => {
      setContacts(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredContacts = useMemo(() => {
    let result = contacts || [];

    if (selectedFilter !== 'all') {
      result = result.filter((c) => c.type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.firstName || '').toLowerCase().includes(query) ||
          (c.lastName || '').toLowerCase().includes(query) ||
          (c.company || '').toLowerCase().includes(query) ||
          (c.email || '').toLowerCase().includes(query) ||
          (c.phone || '').includes(query)
      );
    }

    return result;
  }, [contacts, searchQuery, selectedFilter]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const isCompanyOnly = formData.type === 'supplier' && formData.company.trim();
    if (!isCompanyOnly && !formData.firstName.trim() && !formData.lastName.trim()) return;
    if (!tenantId) return;

    const newContact = {
      ...formData,
      workTypes: formData.workTypes ? formData.workTypes.split(',').map(s => s.trim()) : [],
    };

    try {
      await addTenantDoc(tenantId, 'contacts', newContact);
      setFormData(INITIAL_FORM);
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save contact:', err);
    }
  };

  const handleCloseModal = () => {
    setFormData(INITIAL_FORM);
    setShowModal(false);
  };

  const formatDisplayName = (contact) => {
    if (contact.company && !contact.firstName && !contact.lastName) {
      return contact.company;
    }
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    return contact.company ? `${name} (${contact.company})` : name;
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

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>👥 {t('contacts.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-contact-btn"
            aria-label={t('contacts.addContact')}
          >
            <span>+</span>
            {t('contacts.addContact')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('contacts.searchContacts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="contact-search"
            aria-label={t('contacts.searchContacts')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          {CONTACT_TYPES.map((filter) => (
            <button
              key={filter}
              className={`filter-chip ${selectedFilter === filter ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === 'all' ? t('common.all') : t(`contacts.types.${filter}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List Table */}
      {filteredContacts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">
            {searchQuery || selectedFilter !== 'all'
              ? t('common.noResults')
              : t('contacts.noContacts')}
          </div>
          <div className="empty-state-desc">
            {searchQuery || selectedFilter !== 'all'
              ? ''
              : t('contacts.noContactsDescription')}
          </div>
          {!searchQuery && selectedFilter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span>+</span>
              {t('contacts.addContact')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop view */}
          <div className="glass-card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('contacts.fields.name')} / {t('contacts.fields.company')}</th>
                    <th>{t('contacts.fields.type')}</th>
                    <th>{t('contacts.fields.phone')}</th>
                    <th>{t('contacts.fields.email')}</th>
                    <th>{t('contacts.fields.workTypes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="font-semibold">{formatDisplayName(contact)}</td>
                      <td>
                        <span className={`badge ${BADGE_COLORS[contact.type]}`}>
                          {t(`contacts.types.${contact.type}`)}
                        </span>
                      </td>
                      <td>{contact.phone || '-'}</td>
                      <td>{contact.email || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {contact.workTypes && contact.workTypes.length > 0 ? (
                            contact.workTypes.map((wt) => (
                              <span key={wt} className="badge badge-neutral" style={{ fontSize: 'var(--fs-xs)' }}>
                                {wt}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted" style={{ fontSize: 'var(--fs-xs)' }}>-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-card-list mobile-only">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="mobile-card-item">
                <div className="mobile-card-row" style={{ fontWeight: '600', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: 'var(--clr-text)' }}>{formatDisplayName(contact)}</div>
                  <span className={`badge ${BADGE_COLORS[contact.type]}`}>
                    {t(`contacts.types.${contact.type}`)}
                  </span>
                </div>
                {contact.phone && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{t('contacts.fields.phone')}</span>
                    <span className="mobile-card-value">
                      <a href={`tel:${contact.phone}`} style={{ color: 'var(--clr-primary)', textDecoration: 'none', fontWeight: '500' }}>
                        📞 {contact.phone}
                      </a>
                    </span>
                  </div>
                )}
                {contact.email && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{t('contacts.fields.email')}</span>
                    <span className="mobile-card-value" style={{ wordBreak: 'break-all' }}>
                      <a href={`mailto:${contact.email}`} style={{ color: 'var(--clr-text-secondary)', textDecoration: 'none' }}>
                        ✉️ {contact.email}
                      </a>
                    </span>
                  </div>
                )}
                {contact.address && (
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">{t('contacts.fields.address')}</span>
                    <span className="mobile-card-value" style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>
                      📍 {contact.address}
                    </span>
                  </div>
                )}
                {contact.workTypes && contact.workTypes.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {contact.workTypes.map((wt) => (
                      <span key={wt} className="badge badge-neutral" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {wt}
                      </span>
                    ))}
                  </div>
                )}
                {contact.notes && (
                  <div style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                    <strong>Notes:</strong> {contact.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Contact Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-contact-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-contact-title">
                {t('contacts.addContact')}
              </h3>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Type Select */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-type">
                  {t('contacts.fields.type')}
                </label>
                <select
                  id="contact-type"
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}
                >
                  <option value="client">{t('contacts.types.client')}</option>
                  <option value="supplier">{t('contacts.types.supplier')}</option>
                  <option value="employee">{t('contacts.types.employee')}</option>
                  <option value="subcontractor">{t('contacts.types.subcontractor')}</option>
                </select>
              </div>

              {/* First Name + Last Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-firstName">
                    {t('contacts.fields.firstName')} {formData.type !== 'supplier' ? '*' : ''}
                  </label>
                  <input
                    id="contact-firstName"
                    className="form-input"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-lastName">
                    {t('contacts.fields.lastName')} {formData.type !== 'supplier' ? '*' : ''}
                  </label>
                  <input
                    id="contact-lastName"
                    className="form-input"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              {/* Company */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-company">
                  {t('contacts.fields.company')} {formData.type === 'supplier' ? '*' : ''}
                </label>
                <input
                  id="contact-company"
                  className="form-input"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleFormChange('company', e.target.value)}
                />
              </div>

              {/* Phone + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-phone">
                    {t('contacts.fields.phone')}
                  </label>
                  <input
                    id="contact-phone"
                    className="form-input"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="contact-email">
                    {t('contacts.fields.email')}
                  </label>
                  <input
                    id="contact-email"
                    className="form-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-address">
                  {t('contacts.fields.address')}
                </label>
                <input
                  id="contact-address"
                  className="form-input"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                />
              </div>

              {/* Work Types (Tags) */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-workTypes">
                  {t('contacts.fields.workTypes')} (separated by commas)
                </label>
                <input
                  id="contact-workTypes"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Rezidențial, Comercial, HVAC"
                  value={formData.workTypes}
                  onChange={(e) => handleFormChange('workTypes', e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="contact-notes">
                  {t('contacts.fields.notes')}
                </label>
                <textarea
                  id="contact-notes"
                  className="form-input"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={
                  formData.type === 'supplier'
                    ? !formData.company.trim() && (!formData.firstName.trim() || !formData.lastName.trim())
                    : !formData.firstName.trim() || !formData.lastName.trim()
                }
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
