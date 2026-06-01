'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const INITIAL_EQUIPMENT = [
  { id: '1', name: 'Core Drill Hilti DD 150-U', serial: 'HLT-8812-99', purchaseDate: '2024-03-15', cost: 8500, scrapValue: 500, status: 'operational', assignedTo: 'Andrei Popescu', usefulLife: 60, maintenanceLogs: [{ id: '1', desc: 'Brush replacement & clutch calibration', cost: 450, date: '2025-06-12' }] },
  { id: '2', name: 'Rotary Hammer Drill Bosch GBH', serial: 'BSH-4421-00', purchaseDate: '2025-01-10', cost: 3200, scrapValue: 200, status: 'operational', assignedTo: 'Ion Munteanu', usefulLife: 60, maintenanceLogs: [{ id: '1', desc: 'Chuck replacement', cost: 180, date: '2025-09-02' }] },
  { id: '3', name: 'Cable Tester Fluke MicroScanner', serial: 'FLK-1092-22', purchaseDate: '2023-05-18', cost: 6500, scrapValue: 500, status: 'maintenance', assignedTo: 'Elena Dragomir', usefulLife: 60, maintenanceLogs: [{ id: '1', desc: 'Sensor replacement & calibration', cost: 600, date: '2026-02-14' }] },
  { id: '4', name: 'Portable Generator Honda EU22i', serial: 'HND-0021-99', purchaseDate: '2022-10-12', cost: 12000, scrapValue: 1000, status: 'operational', assignedTo: 'Vlad Gheorghiu', usefulLife: 60, maintenanceLogs: [{ id: '1', desc: 'Engine oil change & carburetor clean', cost: 350, date: '2024-11-20' }] },
];

const STATUS_BADGES = {
  operational: 'badge-success',
  maintenance: 'badge-warning',
  retired: 'badge-neutral',
};

export default function InventoryPage() {
  const { t } = useI18n();

  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Asset Detailed Worksheet State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // New Maintenance Event Form State
  const [maintenanceForm, setMaintenanceForm] = useState({ desc: '', cost: '', date: '2026-06-01' });

  // Custom scrap value override state inside modal
  const [scrapValueOverride, setScrapValueOverride] = useState('');

  const filteredEquipment = useMemo(() => {
    if (!searchQuery.trim()) return equipment;
    const query = searchQuery.toLowerCase();
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(query) ||
        e.serial.toLowerCase().includes(query) ||
        e.assignedTo.toLowerCase().includes(query)
    );
  }, [equipment, searchQuery]);

  // Real-time straight-line depreciation mathematics
  const calculateDepreciation = (asset, customScrap) => {
    const purchase = new Date(asset.purchaseDate);
    const current = new Date('2026-06-01'); // Project Current Mock Date
    
    // Total months difference
    const diffMonths = (current.getFullYear() - purchase.getFullYear()) * 12 + (current.getMonth() - purchase.getMonth());
    const ageMonths = Math.max(0, diffMonths);

    const scrap = customScrap !== undefined ? Number(customScrap) : asset.scrapValue;
    const depreciableBase = asset.cost - scrap;
    
    const usefulLifeMonths = asset.usefulLife || 60; // 5 years standard
    
    // straight-line depreciation formula
    const depreciationToDate = (depreciableBase * Math.min(usefulLifeMonths, ageMonths)) / usefulLifeMonths;
    const currentBookValue = asset.cost - depreciationToDate;

    return {
      ageMonths,
      depreciationToDate,
      currentBookValue
    };
  };

  const handleOpenAssetWorksheet = (asset) => {
    setSelectedAsset(asset);
    setScrapValueOverride(String(asset.scrapValue));
    setMaintenanceForm({ desc: '', cost: '', date: '2026-06-01' });
    setShowModal(true);
  };

  const handleSaveScrapOverride = () => {
    if (!selectedAsset || scrapValueOverride === '') return;

    setEquipment((prev) =>
      prev.map((e) =>
        e.id === selectedAsset.id ? { ...e, scrapValue: Number(scrapValueOverride) } : e
      )
    );

    // Update locally selected state to re-render formulas in modal
    setSelectedAsset((prev) => ({ ...prev, scrapValue: Number(scrapValueOverride) }));
  };

  const handleAddMaintenanceEvent = () => {
    if (!selectedAsset || !maintenanceForm.desc.trim() || !maintenanceForm.cost) return;

    const newLog = {
      id: String(Date.now()),
      desc: maintenanceForm.desc,
      cost: Number(maintenanceForm.cost),
      date: maintenanceForm.date,
    };

    const updatedAsset = {
      ...selectedAsset,
      maintenanceLogs: [...selectedAsset.maintenanceLogs, newLog]
    };

    setEquipment((prev) =>
      prev.map((e) => (e.id === selectedAsset.id ? updatedAsset : e))
    );

    setSelectedAsset(updatedAsset);
    setMaintenanceForm({ desc: '', cost: '', date: '2026-06-01' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ro-RO').format(value);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>🔧 {t('inventory.title')}</h1>
      </div>

      {/* Search Directory */}
      <div className="search-bar" style={{ marginBottom: 'var(--sp-lg)' }}>
        <span className="search-bar-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          placeholder={t('inventory.searchEquipment')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="equipment-search"
          aria-label={t('inventory.searchEquipment')}
        />
      </div>

      {/* Equipment Asset List */}
      {filteredEquipment.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔧</div>
          <div className="empty-state-title">{t('inventory.noEquipment')}</div>
        </div>
      ) : (
        <div className="content-grid grid-cols-2">
          {filteredEquipment.map((asset) => {
            const calculations = calculateDepreciation(asset);
            const overallMaintenanceCost = asset.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
            return (
              <div
                key={asset.id}
                className="glass-card clickable"
                onClick={() => handleOpenAssetWorksheet(asset)}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenAssetWorksheet(asset);
                  }
                }}
              >
                {/* Header: Name + Operational Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }} className="font-bold">
                      {asset.name}
                    </h3>
                    <span className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>
                      SN: {asset.serial}
                    </span>
                  </div>
                  <span className={`badge ${STATUS_BADGES[asset.status]}`}>
                    {t(`inventory.statuses.${asset.status}`)}
                  </span>
                </div>

                {/* Worker assignment */}
                <div style={{ fontSize: 'var(--fs-sm)', background: 'var(--clr-bg-elevated)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  👤 Assigned: <span className="font-semibold">{asset.assignedTo}</span>
                </div>

                {/* Financial Book Value Metrics */}
                <div className="content-grid grid-cols-3" style={{ gap: 'var(--sp-sm)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-sm)' }}>
                  <div>
                    <span className="text-muted text-xs">{t('inventory.fields.cost')}</span>
                    <div className="font-bold text-sm">{formatCurrency(asset.cost)} RON</div>
                  </div>
                  <div>
                    <span className="text-muted text-xs">{t('inventory.fields.depreciation')}</span>
                    <div className="font-semibold text-sm" style={{ color: 'var(--clr-danger)' }}>
                      -{formatCurrency(calculations.depreciationToDate)} RON
                    </div>
                  </div>
                  <div>
                    <span className="text-muted text-xs">{t('inventory.fields.bookValue')}</span>
                    <div className="font-bold text-sm" style={{ color: 'var(--clr-primary)' }}>
                      {formatCurrency(calculations.currentBookValue)} RON
                    </div>
                  </div>
                </div>

                {/* Bottom line: Repairs log indicator */}
                <div style={{
                  marginTop: 'auto',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--clr-text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--clr-border)',
                  paddingTop: 'var(--sp-xs)'
                }}>
                  <span>📅 Purchased: {asset.purchaseDate}</span>
                  <span>🔧 Maintenance: {asset.maintenanceLogs.length} events ({formatCurrency(overallMaintenanceCost)} RON)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Worksheet Modal (Depreciation + Maintenance Logs) */}
      {showModal && selectedAsset && (() => {
        const calculations = calculateDepreciation(selectedAsset, scrapValueOverride);
        const overallMaintenanceCost = selectedAsset.maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
        return (
          <div
            className="modal-backdrop"
            onClick={() => setShowModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="worksheet-title"
          >
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="modal-header">
                <h3 className="modal-title" id="worksheet-title">
                  {selectedAsset.name} — Asset Worksheet
                </h3>
                <button
                  className="modal-close"
                  onClick={() => setShowModal(false)}
                  aria-label={t('common.buttons.close')}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--sp-lg)' }} className="inventory-worksheet-layout">
                
                {/* LEFT COLUMN: Depreciation Compounder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', background: 'var(--clr-bg)' }}>
                    <h4 style={{ margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 6 }}>
                      📈 Straight-Line Depreciation
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                        <span className="text-muted">Asset Original Cost:</span>
                        <span className="font-bold">{formatCurrency(selectedAsset.cost)} RON</span>
                      </div>

                      {/* Useful lifetime */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                        <span className="text-muted">Useful Lifetime Period:</span>
                        <span className="font-semibold">{selectedAsset.usefulLife} months (5 Years)</span>
                      </div>

                      {/* Age of asset */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                        <span className="text-muted">Asset Running Age:</span>
                        <span className="font-semibold">{calculations.ageMonths} months</span>
                      </div>

                      {/* Custom Scrap values override inputs */}
                      <div className="form-group" style={{ margin: '6px 0' }}>
                        <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }} htmlFor="scrap-override">
                          Residual Scrap Value (RON)
                        </label>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <input
                            id="scrap-override"
                            className="form-input"
                            type="number"
                            value={scrapValueOverride}
                            onChange={(e) => setScrapValueOverride(e.target.value)}
                            style={{ padding: '4px 8px', fontSize: 'var(--fs-sm)' }}
                          />
                          <button className="btn btn-secondary btn-sm" onClick={handleSaveScrapOverride}>
                            Save Scrap
                          </button>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--clr-border)', margin: '4px 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                        <span className="text-muted">Depreciated Value (to-date):</span>
                        <span className="font-semibold" style={{ color: 'var(--clr-danger)' }}>
                          -{formatCurrency(calculations.depreciationToDate)} RON
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                        <span style={{ color: 'var(--clr-primary)' }}>Current Book Value:</span>
                        <span style={{ color: 'var(--clr-primary)' }}>
                          {formatCurrency(calculations.currentBookValue)} RON
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary card details */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--clr-bg)' }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>Assigned Worker:</div>
                    <div className="font-semibold">{selectedAsset.assignedTo}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 6 }}>Serial Number:</div>
                    <div className="font-semibold" style={{ fontFamily: 'monospace' }}>{selectedAsset.serial}</div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Maintenance Log & Event Adder */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                  
                  {/* Event log listing */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', background: 'var(--clr-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0 }}>🛠️ {t('inventory.maintenance.history')}</h4>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        Total: {formatCurrency(overallMaintenanceCost)} RON
                      </span>
                    </div>

                    {selectedAsset.maintenanceLogs.length === 0 ? (
                      <div className="text-muted text-xs" style={{ padding: '10px 0' }}>
                        {t('inventory.maintenance.noLogs')}
                      </div>
                    ) : (
                      <div className="data-table-wrapper" style={{ maxHeight: 180, overflowY: 'auto' }}>
                        <table className="data-table" style={{ fontSize: 'var(--fs-sm)' }}>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Description</th>
                              <th style={{ textAlign: 'right' }}>Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedAsset.maintenanceLogs.map((log) => (
                              <tr key={log.id}>
                                <td className="text-muted">{log.date}</td>
                                <td>{log.desc}</td>
                                <td className="font-semibold text-right">{formatCurrency(log.cost)} RON</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Add Maintenance Event Form */}
                  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)', background: 'var(--clr-bg)' }}>
                    <h4 style={{ margin: 0 }}>➕ Log Maintenance Event</h4>
                    
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }} htmlFor="maint-desc">
                        {t('inventory.maintenance.description')} *
                      </label>
                      <input
                        id="maint-desc"
                        className="form-input"
                        type="text"
                        value={maintenanceForm.desc}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, desc: e.target.value }))}
                        placeholder="e.g. Laser diode calibration"
                        required
                      />
                    </div>

                    <div className="content-grid grid-cols-2" style={{ gap: 'var(--sp-sm)' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }} htmlFor="maint-cost">
                          {t('inventory.maintenance.cost')} *
                        </label>
                        <input
                          id="maint-cost"
                          className="form-input"
                          type="number"
                          value={maintenanceForm.cost}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
                          placeholder="RON"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: 'var(--fs-xs)' }} htmlFor="maint-date">
                          {t('inventory.maintenance.date')}
                        </label>
                        <input
                          id="maint-date"
                          className="form-input"
                          type="date"
                          value={maintenanceForm.date}
                          onChange={(e) => setMaintenanceForm(prev => ({ ...prev, date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAddMaintenanceEvent}
                      disabled={!maintenanceForm.desc.trim() || !maintenanceForm.cost}
                      style={{ marginTop: 6 }}
                    >
                      {t('inventory.buttons.addEvent')}
                    </button>
                  </div>

                </div>

              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t('common.buttons.close')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Embedded CSS for responsive directory layout */}
      <style jsx>{`
        @media (max-width: 768px) {
          .inventory-worksheet-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
