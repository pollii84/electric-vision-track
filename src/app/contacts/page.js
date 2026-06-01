'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_CONTACTS = [
  { id: '1', type: 'client', firstName: 'Popescu', lastName: 'Ion', company: '', phone: '+40 741 111 222', email: 'popescu.ion@gmail.com', address: 'Str. Eroilor 15, Cluj-Napoca', workTypes: ['Rezidențial'] },
  { id: '2', type: 'client', firstName: 'Marin', lastName: 'Alexandru', company: '', phone: '+40 742 222 333', email: 'marin.alex@yahoo.com', address: 'Str. Libertății 8, Borșa', workTypes: ['Rezidențial'] },
  { id: '3', type: 'supplier', firstName: '', lastName: '', company: 'Sigma Development', phone: '+40 264 111 222', email: 'office@sigma.ro', address: 'Bd. 21 Decembrie 77, Cluj', workTypes: ['Birouri', 'Comercial'] },
  { id: '4', type: 'supplier', firstName: '', lastName: '', company: 'SC Turism SA', phone: '+40 264 333 444', email: 'achizitii@turism-sa.ro', address: 'Str. Republicii 120, Cluj', workTypes: ['Hospitality'] },
  { id: '5', type: 'supplier', firstName: '', lastName: '', company: 'Elmark Romania', phone: '+40 264 555 666', email: 'comenzi@elmark.ro', address: 'Zona Industriala, Turda', workTypes: ['Furnizor materiale'] },
  { id: '6', type: 'subcontractor', firstName: 'Vasile', lastName: 'Crăciun', company: 'Clima Expert SRL', phone: '+40 743 444 555', email: 'vasile@climaexpert.ro', address: 'Str. Fabricii 12, Cluj', workTypes: ['HVAC', 'Climatizare'] },
];

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

  const [contacts, setContacts] = useState(DEMO_CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (selectedFilter !== 'all') {
      result = result.filter((c) => c.type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.includes(query)
      );
    }

    return result;
  }, [contacts, searchQuery, selectedFilter]);

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const isCompanyOnly = formData.type === 'supplier' && formData.company.trim();
    if (!isCompanyOnly && !formData.firstName.trim() && !formData.lastName.trim()) return;

    const newContact = {
      ...formData,
      id: String(Date.now()),
      workTypes: formData.workTypes ? formData.workTypes.split(',').map(s => s.trim()) : [],
    };

    setContacts((prev) => [...prev, newContact]);
    setFormData(INITIAL_FORM);
    setShowModal(false);
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
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
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
