'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_WORKERS = [
  { id: '1', firstName: 'Andrei', lastName: 'Popescu', phone: '+40 741 234 567', email: 'andrei@electricvision.eu', experienceLevel: 'manager', isTeamLeader: true, hourlyRate: 85, isActive: true },
  { id: '2', firstName: 'Maria', lastName: 'Ionescu', phone: '+40 742 345 678', email: 'maria@electricvision.eu', experienceLevel: 'seniorWithDegree', isTeamLeader: false, hourlyRate: 70, isActive: true },
  { id: '3', firstName: 'Ion', lastName: 'Munteanu', phone: '+40 743 456 789', email: 'ion@electricvision.eu', experienceLevel: 'senior', isTeamLeader: true, hourlyRate: 65, isActive: true },
  { id: '4', firstName: 'Elena', lastName: 'Dragomir', phone: '+40 744 567 890', email: 'elena@electricvision.eu', experienceLevel: 'intermediateWithDegree', isTeamLeader: false, hourlyRate: 55, isActive: true },
  { id: '5', firstName: 'Vlad', lastName: 'Gheorghiu', phone: '+40 745 678 901', email: 'vlad@electricvision.eu', experienceLevel: 'intermediate', isTeamLeader: false, hourlyRate: 50, isActive: true },
  { id: '6', firstName: 'Ana', lastName: 'Popa', phone: '+40 746 789 012', email: 'ana@electricvision.eu', experienceLevel: 'juniorWithDegree', isTeamLeader: false, hourlyRate: 40, isActive: true },
  { id: '7', firstName: 'Mihai', lastName: 'Stan', phone: '+40 747 890 123', email: 'mihai@electricvision.eu', experienceLevel: 'junior', isTeamLeader: false, hourlyRate: 35, isActive: true },
  { id: '8', firstName: 'Cristian', lastName: 'Barbu', phone: '+40 748 901 234', email: 'cristian@electricvision.eu', experienceLevel: 'associated', isTeamLeader: false, hourlyRate: 25, isActive: false },
];

const EXPERIENCE_LEVELS = [
  'manager',
  'senior',
  'seniorWithDegree',
  'intermediate',
  'intermediateWithDegree',
  'junior',
  'juniorWithDegree',
  'associated',
];

const BADGE_COLORS = {
  manager: 'badge-primary',
  senior: 'badge-accent',
  seniorWithDegree: 'badge-accent',
  intermediate: 'badge-warning',
  intermediateWithDegree: 'badge-warning',
  junior: 'badge-neutral',
  juniorWithDegree: 'badge-neutral',
  associated: 'badge-neutral',
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

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  experienceLevel: 'junior',
  hourlyRate: '',
  hireDate: '',
  isTeamLeader: false,
  isActive: true,
};

export default function WorkersPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [workers, setWorkers] = useState(DEMO_WORKERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const filteredWorkers = useMemo(() => {
    let result = workers;

    if (selectedFilter !== 'all') {
      result = result.filter((w) => w.experienceLevel === selectedFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (w) =>
          w.firstName.toLowerCase().includes(query) ||
          w.lastName.toLowerCase().includes(query) ||
          w.email.toLowerCase().includes(query) ||
          w.phone.includes(query)
      );
    }

    return result;
  }, [workers, searchQuery, selectedFilter]);

  const getInitials = (first, last) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;

    const newWorker = {
      ...formData,
      id: String(Date.now()),
      hourlyRate: Number(formData.hourlyRate) || 0,
    };

    setWorkers((prev) => [...prev, newWorker]);
    setFormData(INITIAL_FORM);
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setFormData(INITIAL_FORM);
    setShowModal(false);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>👷 {t('workers.title')}</h1>
        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            id="add-worker-btn"
            aria-label={t('workers.addWorker')}
          >
            <span>+</span>
            {t('workers.addWorker')}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)', marginBottom: 'var(--sp-lg)' }}>
        <div className="search-bar">
          <span className="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            placeholder={t('workers.searchWorkers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="worker-search"
            aria-label={t('workers.searchWorkers')}
          />
        </div>

        <div className="filter-chips" role="group" aria-label={t('common.buttons.filter')}>
          <button
            className={`filter-chip ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            {t('common.all')}
          </button>
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level}
              className={`filter-chip ${selectedFilter === level ? 'active' : ''}`}
              onClick={() => setSelectedFilter(level)}
            >
              {t(`workers.experienceLevels.${level}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Grid */}
      {filteredWorkers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👷</div>
          <div className="empty-state-title">
            {searchQuery || selectedFilter !== 'all'
              ? t('common.noResults')
              : t('workers.noWorkers')}
          </div>
          <div className="empty-state-desc">
            {searchQuery || selectedFilter !== 'all'
              ? ''
              : t('workers.noWorkersDescription')}
          </div>
          {!searchQuery && selectedFilter === 'all' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <span>+</span>
              {t('workers.addWorker')}
            </button>
          )}
        </div>
      ) : (
        <div className="content-grid grid-cols-3">
          {filteredWorkers.map((worker, index) => (
            <div
              key={worker.id}
              className="glass-card clickable"
              onClick={() => router.push(`/workers/${worker.id}`)}
              role="button"
              tabIndex={0}
              aria-label={`${worker.firstName} ${worker.lastName}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/workers/${worker.id}`);
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
            >
              {/* Top row: avatar + name + status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)' }}>
                <div
                  className="avatar avatar-lg"
                  style={{ background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length] }}
                  aria-hidden="true"
                >
                  {getInitials(worker.firstName, worker.lastName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                    <span className="font-bold truncate" style={{ fontSize: 'var(--fs-md)' }}>
                      {worker.firstName} {worker.lastName}
                    </span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: worker.isActive ? 'var(--clr-success)' : 'var(--clr-danger)',
                        flexShrink: 0,
                      }}
                      title={worker.isActive ? t('common.active') : t('common.inactive')}
                      aria-label={worker.isActive ? t('common.active') : t('common.inactive')}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-xs)', flexWrap: 'wrap', marginTop: 4 }}>
                    <span className={`badge ${BADGE_COLORS[worker.experienceLevel]}`}>
                      {t(`workers.experienceLevels.${worker.experienceLevel}`)}
                    </span>
                    {worker.isTeamLeader && (
                      <span className="badge badge-accent">⭐ {t('workers.teamLeaderBadge')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-xs)' }}>
                <span className="text-muted text-sm truncate" title={worker.phone}>
                  📞 {worker.phone}
                </span>
                <span className="text-muted text-sm truncate" title={worker.email}>
                  ✉️ {worker.email}
                </span>
              </div>

              {/* Hourly rate */}
              <div style={{
                marginTop: 'auto',
                paddingTop: 'var(--sp-sm)',
                borderTop: '1px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span className="text-muted text-sm">{t('workers.fields.hourlyRate')}</span>
                <span className="font-semibold currency" style={{ color: 'var(--clr-primary)' }}>
                  {worker.hourlyRate} RON/h
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-worker-title"
        >
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="add-worker-title">
                {t('workers.addWorker')}
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
              {/* First Name + Last Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-firstName">
                    {t('workers.fields.firstName')} *
                  </label>
                  <input
                    id="worker-firstName"
                    className="form-input"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-lastName">
                    {t('workers.fields.lastName')} *
                  </label>
                  <input
                    id="worker-lastName"
                    className="form-input"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Phone + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-phone">
                    {t('workers.fields.phone')}
                  </label>
                  <input
                    id="worker-phone"
                    className="form-input"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleFormChange('phone', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-email">
                    {t('workers.fields.email')}
                  </label>
                  <input
                    id="worker-email"
                    className="form-input"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Experience Level (full row) */}
              <div className="form-group">
                <label className="form-label" htmlFor="worker-experienceLevel">
                  {t('workers.fields.experienceLevel')}
                </label>
                <select
                  id="worker-experienceLevel"
                  className="form-select"
                  value={formData.experienceLevel}
                  onChange={(e) => handleFormChange('experienceLevel', e.target.value)}
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {t(`workers.experienceLevels.${level}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hourly Rate + Hire Date */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-hourlyRate">
                    {t('workers.fields.hourlyRate')} (RON)
                  </label>
                  <input
                    id="worker-hourlyRate"
                    className="form-input"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.hourlyRate}
                    onChange={(e) => handleFormChange('hourlyRate', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="worker-hireDate">
                    {t('workers.fields.hireDate')}
                  </label>
                  <input
                    id="worker-hireDate"
                    className="form-input"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => handleFormChange('hireDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Team Leader + Active checkboxes */}
              <div className="form-row" style={{ marginTop: 'var(--sp-sm)' }}>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isTeamLeader}
                    onChange={(e) => handleFormChange('isTeamLeader', e.target.checked)}
                  />
                  {t('workers.fields.isTeamLeader')}
                </label>
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                  {t('workers.fields.activeStatus')}
                </label>
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
                disabled={!formData.firstName.trim() || !formData.lastName.trim()}
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
