'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_WORKERS = [
  { id: '1', name: 'Andrei Popescu', hourlyRate: 85 },
  { id: '2', name: 'Maria Ionescu', hourlyRate: 70 },
  { id: '3', name: 'Ion Munteanu', hourlyRate: 65 },
  { id: '4', name: 'Elena Dragomir', hourlyRate: 55 },
];

const DEMO_SITES = [
  { id: '1', name: 'Vila Popescu' },
  { id: '2', name: 'Bloc Florești - Et. 3' },
  { id: '3', name: 'Birouri Sigma Center' }
];

const INITIAL_LOGS = [
  { id: '1', workerId: '1', siteId: '1', date: '2026-06-01', standardHours: 8, overtimeHours: 2, weekendHours: 0, description: 'Ground floor wiring and conduits installation' },
  { id: '2', workerId: '2', siteId: '1', date: '2026-06-01', standardHours: 8, overtimeHours: 0, weekendHours: 0, description: 'Cable routing and junction boxes setup' },
  { id: '3', workerId: '3', siteId: '2', date: '2026-06-02', standardHours: 8, overtimeHours: 1, weekendHours: 0, description: 'Distribution board breaker mounts' },
  { id: '4', workerId: '4', siteId: '3', date: '2026-05-31', standardHours: 0, overtimeHours: 0, weekendHours: 6, description: 'Sunday emergency site maintenance' }
];

export default function TimesheetsPage() {
  const { t } = useI18n();

  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    workerIndex: '0',
    siteIndex: '0',
    date: '2026-06-01',
    standardHours: 8,
    overtimeHours: 0,
    weekendHours: 0,
    description: '',
  });

  const getWorker = (id) => DEMO_WORKERS.find((w) => w.id === id) || DEMO_WORKERS[0];
  const getSite = (id) => DEMO_SITES.find((s) => s.id === id) || DEMO_SITES[0];

  const logsWithCalculations = useMemo(() => {
    return logs.map((log) => {
      const worker = getWorker(log.workerId);
      const site = getSite(log.siteId);

      // Payroll Mathematics:
      // Standard Hours = 1x base rate
      // Overtime Hours = 1x base rate
      // Weekend Hours = 1.5x base rate
      const cost =
        log.standardHours * worker.hourlyRate +
        log.overtimeHours * worker.hourlyRate +
        log.weekendHours * worker.hourlyRate * 1.5;

      return {
        ...log,
        workerName: worker.name,
        siteName: site.name,
        hourlyRate: worker.hourlyRate,
        computedCost: cost,
      };
    });
  }, [logs]);

  const weeklySummary = useMemo(() => {
    return logsWithCalculations.reduce(
      (sum, item) => {
        sum.standard += item.standardHours;
        sum.overtime += item.overtimeHours;
        sum.weekend += item.weekendHours;
        sum.totalHours += item.standardHours + item.overtimeHours + item.weekendHours;
        sum.totalCost += item.computedCost;
        return sum;
      },
      { standard: 0, overtime: 0, weekend: 0, totalHours: 0, totalCost: 0 }
    );
  }, [logsWithCalculations]);

  const handleFormChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveTimeLog = () => {
    const selectedWorker = DEMO_WORKERS[Number(formData.workerIndex)];
    const selectedSite = DEMO_SITES[Number(formData.siteIndex)];
    if (!selectedWorker || !selectedSite) return;

    const newLog = {
      id: String(Date.now()),
      workerId: selectedWorker.id,
      siteId: selectedSite.id,
      date: formData.date,
      standardHours: Number(formData.standardHours) || 0,
      overtimeHours: Number(formData.overtimeHours) || 0,
      weekendHours: Number(formData.weekendHours) || 0,
      description: formData.description,
    };

    setLogs((prev) => [newLog, ...prev]);
    setShowModal(false);
    setFormData({
      workerIndex: '0',
      siteIndex: '0',
      date: '2026-06-01',
      standardHours: 8,
      overtimeHours: 0,
      weekendHours: 0,
      description: '',
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>⏱️ {t('timesheets.title')}</h1>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <span>+</span> {t('timesheets.buttons.logTime')}
          </button>
        </div>
      </div>

      {/* Weekly Payroll & Hours Summary Grid */}
      <div className="glass-card" style={{ marginBottom: 'var(--sp-lg)' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: 'var(--fs-md)' }}>
          📊 {t('timesheets.weeklySummary')}
        </h3>

        <div className="content-grid grid-cols-4" style={{ gap: 'var(--sp-md)' }}>
          <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted text-xs">{t('timesheets.fields.standardHours')}</span>
            <div className="font-bold" style={{ fontSize: 'var(--fs-lg)', marginTop: 4 }}>
              {weeklySummary.standard} hrs
            </div>
            <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>Logged at 1.0x Rate</span>
          </div>

          <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted text-xs">{t('timesheets.fields.overtimeHours')}</span>
            <div className="font-bold" style={{ fontSize: 'var(--fs-lg)', marginTop: 4 }}>
              {weeklySummary.overtime} hrs
            </div>
            <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>Logged at 1.0x Rate</span>
          </div>

          <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)' }}>
            <span className="text-muted text-xs">{t('timesheets.fields.weekendHours')}</span>
            <div className="font-bold" style={{ fontSize: 'var(--fs-lg)', marginTop: 4, color: 'var(--clr-accent)' }}>
              {weeklySummary.weekend} hrs
            </div>
            <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>Logged at 1.5x Rate</span>
          </div>

          <div style={{ background: 'var(--clr-bg-elevated)', padding: 'var(--sp-sm)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--clr-primary)' }}>
            <span className="text-muted text-xs">{t('timesheets.fields.computedCost')}</span>
            <div className="font-bold" style={{ fontSize: 'var(--fs-lg)', marginTop: 4, color: 'var(--clr-primary)' }}>
              {formatCurrency(weeklySummary.totalCost)} RON
            </div>
            <span className="text-xs text-muted" style={{ display: 'block', marginTop: 2 }}>Standard + OT + Weekend</span>
          </div>
        </div>
      </div>

      {/* Time Logs Table */}
      {logsWithCalculations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏱️</div>
          <div className="empty-state-title">{t('timesheets.noLogs')}</div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="glass-card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('timesheets.fields.worker')}</th>
                    <th>{t('timesheets.fields.site')}</th>
                    <th>{t('timesheets.fields.date')}</th>
                    <th style={{ textAlign: 'center' }}>Std (1x)</th>
                    <th style={{ textAlign: 'center' }}>OT (1x)</th>
                    <th style={{ textAlign: 'center' }}>Wknd (1.5x)</th>
                    <th style={{ textAlign: 'right' }}>{t('timesheets.fields.computedCost')}</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logsWithCalculations.map((log) => (
                    <tr key={log.id}>
                      <td className="font-semibold">{log.workerName}</td>
                      <td>🏗️ {log.siteName}</td>
                      <td className="text-muted">{log.date}</td>
                      <td style={{ textAlign: 'center' }}>{log.standardHours}h</td>
                      <td style={{ textAlign: 'center' }}>{log.overtimeHours}h</td>
                      <td style={{ textAlign: 'center' }} className={log.weekendHours > 0 ? 'font-bold' : ''}>
                        {log.weekendHours > 0 ? `${log.weekendHours}h 🌟` : '0h'}
                      </td>
                      <td className="font-bold text-right" style={{ color: 'var(--clr-primary)' }}>
                        {formatCurrency(log.computedCost)} RON
                      </td>
                      <td className="text-muted text-sm">{log.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="mobile-card-list mobile-only">
            {logsWithCalculations.map((log) => (
              <div key={log.id} className="mobile-card-item">
                <div className="mobile-card-row" style={{ fontWeight: '600', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ color: 'var(--clr-text)' }}>{log.workerName}</div>
                  <div style={{ color: 'var(--clr-primary)' }}>{formatCurrency(log.computedCost)} RON</div>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('timesheets.fields.site')}</span>
                  <span className="mobile-card-value">🏗️ {log.siteName}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">{t('timesheets.fields.date')}</span>
                  <span className="mobile-card-value">{log.date}</span>
                </div>
                <div className="mobile-card-row">
                  <span className="mobile-card-label">Standard / OT / Weekend</span>
                  <span className="mobile-card-value">{log.standardHours}h / {log.overtimeHours}h / {log.weekendHours}h</span>
                </div>
                {log.description && (
                  <div style={{ marginTop: '8px', fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', background: 'rgba(255, 255, 255, 0.02)', padding: '6px 8px', borderRadius: '4px' }}>
                    <strong>Notes:</strong> {log.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Log Hours Modal */}
      {showModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="log-hours-title"
        >
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="log-hours-title">
                {t('timesheets.logHours')}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Select Worker */}
              <div className="form-group">
                <label className="form-label" htmlFor="worker-select">
                  {t('timesheets.fields.worker')}
                </label>
                <select
                  id="worker-select"
                  className="form-select"
                  value={formData.workerIndex}
                  onChange={(e) => handleFormChange('workerIndex', e.target.value)}
                >
                  {DEMO_WORKERS.map((w, index) => (
                    <option key={w.id} value={index}>
                      {w.name} ({w.hourlyRate} RON/h)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Site */}
              <div className="form-group">
                <label className="form-label" htmlFor="site-select">
                  {t('timesheets.fields.site')}
                </label>
                <select
                  id="site-select"
                  className="form-select"
                  value={formData.siteIndex}
                  onChange={(e) => handleFormChange('siteIndex', e.target.value)}
                >
                  {DEMO_SITES.map((s, index) => (
                    <option key={s.id} value={index}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logging Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="log-date">
                  {t('timesheets.fields.date')}
                </label>
                <input
                  id="log-date"
                  className="form-input"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                />
              </div>

              {/* Hours logging: Standard, Overtime, Weekend */}
              <div className="content-grid grid-cols-3" style={{ gap: 'var(--sp-sm)', margin: '14px 0' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }} htmlFor="std-hrs">
                    Standard (1.0x)
                  </label>
                  <input
                    id="std-hrs"
                    className="form-input"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.standardHours}
                    onChange={(e) => handleFormChange('standardHours', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px' }} htmlFor="ot-hrs">
                    Overtime (1.0x)
                  </label>
                  <input
                    id="ot-hrs"
                    className="form-input"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.overtimeHours}
                    onChange={(e) => handleFormChange('overtimeHours', e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--clr-primary)' }} htmlFor="wk-hrs">
                    Weekend (1.5x)
                  </label>
                  <input
                    id="wk-hrs"
                    className="form-input"
                    type="number"
                    min="0"
                    max="24"
                    value={formData.weekendHours}
                    onChange={(e) => handleFormChange('weekendHours', e.target.value)}
                  />
                </div>
              </div>

              {/* Activity description */}
              <div className="form-group">
                <label className="form-label" htmlFor="log-desc">
                  {t('timesheets.fields.description')}
                </label>
                <textarea
                  id="log-desc"
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="e.g. Finished ground floor panel board mounts"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                {t('common.buttons.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveTimeLog}
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
