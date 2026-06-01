'use client';

import { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

const DEMO_EVENTS = [
  { id: '1', title: 'Vila Popescu - Project Kickoff', date: '2026-06-01', type: 'milestone', site: 'Vila Popescu', icon: '🏗️', desc: 'Mobilization of wiring materials and site manager safety briefing.' },
  { id: '2', title: 'Andrei Popescu - Vila Allocation', date: '2026-06-02', type: 'allocation', site: 'Vila Popescu', worker: 'Andrei Popescu', icon: '👷', desc: 'Conduit laying and ground floor power routing.' },
  { id: '3', title: 'Fluke Tester Loop Calibration', date: '2026-06-03', type: 'maintenance', tool: 'Fluke MicroScanner', technician: 'Elena Dragomir', icon: '🔧', desc: 'Loop impedance calibration and sensor calibration test.' },
  { id: '4', title: 'Maria Ionescu - Sigma Allocation', date: '2026-06-04', type: 'allocation', site: 'Birouri Sigma Center', worker: 'Maria Ionescu', icon: '👷', desc: 'Switchboard board breaker mounting and routing lines.' },
  { id: '5', title: 'Bloc Florești - Handover Target', date: '2026-06-05', type: 'milestone', site: 'Bloc Florești - Et. 3', icon: '🏗️', desc: 'Formal client walkthrough inspection and quality safety signature.' },
  { id: '6', title: 'Honda Generator Oil Inspection', date: '2026-06-06', type: 'maintenance', tool: 'Honda EU22i Generator', technician: 'Vlad Gheorghiu', icon: '🔧', desc: 'Engine oil calibration change and carbon filter cleaning.' }
];

const WEEK_DAYS = [
  { dateStr: '2026-06-01', dayNum: '1', nameEn: 'Monday', nameRo: 'Luni' },
  { dateStr: '2026-06-02', dayNum: '2', nameEn: 'Tuesday', nameRo: 'Marți' },
  { dateStr: '2026-06-03', dayNum: '3', nameEn: 'Wednesday', nameRo: 'Miercuri' },
  { dateStr: '2026-06-04', dayNum: '4', nameEn: 'Thursday', nameRo: 'Joi' },
  { dateStr: '2026-06-05', dayNum: '5', nameEn: 'Friday', nameRo: 'Vineri' },
  { dateStr: '2026-06-06', dayNum: '6', nameEn: 'Saturday', nameRo: 'Sâmbătă' },
  { dateStr: '2026-06-07', dayNum: '7', nameEn: 'Sunday', nameRo: 'Duminică' }
];

const MONTH_DAYS = [
  // A complete month view array for June 2026
  ...WEEK_DAYS,
  { dateStr: '2026-06-08', dayNum: '8', nameEn: 'Monday', nameRo: 'Luni' },
  { dateStr: '2026-06-09', dayNum: '9', nameEn: 'Tuesday', nameRo: 'Marți' },
  { dateStr: '2026-06-10', dayNum: '10', nameEn: 'Wednesday', nameRo: 'Miercuri' },
  { dateStr: '2026-06-11', dayNum: '11', nameEn: 'Thursday', nameRo: 'Joi' },
  { dateStr: '2026-06-12', dayNum: '12', nameEn: 'Friday', nameRo: 'Vineri' },
  { dateStr: '2026-06-13', dayNum: '13', nameEn: 'Saturday', nameRo: 'Sâmbătă' },
  { dateStr: '2026-06-14', dayNum: '14', nameEn: 'Sunday', nameRo: 'Duminică' },
  { dateStr: '2026-06-15', dayNum: '15', nameEn: 'Monday', nameRo: 'Luni' },
  { dateStr: '2026-06-16', dayNum: '16', nameEn: 'Tuesday', nameRo: 'Marți' },
  { dateStr: '2026-06-17', dayNum: '17', nameEn: 'Wednesday', nameRo: 'Miercuri' },
  { dateStr: '2026-06-18', dayNum: '18', nameEn: 'Thursday', nameRo: 'Joi' },
  { dateStr: '2026-06-19', dayNum: '19', nameEn: 'Friday', nameRo: 'Vineri' },
  { dateStr: '2026-06-20', dayNum: '20', nameEn: 'Saturday', nameRo: 'Sâmbătă' },
  { dateStr: '2026-06-21', dayNum: '21', nameEn: 'Sunday', nameRo: 'Duminică' },
  { dateStr: '2026-06-22', dayNum: '22', nameEn: 'Monday', nameRo: 'Luni' },
  { dateStr: '2026-06-23', dayNum: '23', nameEn: 'Tuesday', nameRo: 'Marți' },
  { dateStr: '2026-06-24', dayNum: '24', nameEn: 'Wednesday', nameRo: 'Miercuri' },
  { dateStr: '2026-06-25', dayNum: '25', nameEn: 'Thursday', nameRo: 'Joi' },
  { dateStr: '2026-06-26', dayNum: '26', nameEn: 'Friday', nameRo: 'Vineri' },
  { dateStr: '2026-06-27', dayNum: '27', nameEn: 'Saturday', nameRo: 'Sâmbătă' },
  { dateStr: '2026-06-28', dayNum: '28', nameEn: 'Sunday', nameRo: 'Duminică' },
  { dateStr: '2026-06-29', dayNum: '29', nameEn: 'Monday', nameRo: 'Luni' },
  { dateStr: '2026-06-30', dayNum: '30', nameEn: 'Tuesday', nameRo: 'Marți' }
];

const EVENT_COLORS = {
  milestone: 'rgba(255, 202, 0, 0.15)', // ElectricVision Gold
  allocation: 'rgba(0, 150, 255, 0.15)', // Blue
  maintenance: 'rgba(0, 255, 102, 0.15)' // Green
};

const EVENT_BORDERS = {
  milestone: 'var(--clr-primary)',
  allocation: '#0096ff',
  maintenance: '#00ff66'
};

export default function CalendarPage() {
  const { t, locale } = useI18n();

  // Active view: 'week' (Approved default!) | 'month'
  const [currentView, setCurrentView] = useState('week');

  // Filters State
  const [filters, setFilters] = useState({
    milestone: true,
    allocation: true,
    maintenance: true
  });

  // Selected event popover state
  const [selectedEvent, setSelectedEvent] = useState(null);

  const toggleFilter = (type) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredEvents = useMemo(() => {
    return DEMO_EVENTS.filter((e) => filters[e.type]);
  }, [filters]);

  const getEventsForDate = (dateStr) => {
    return filteredEvents.filter((e) => e.date === dateStr);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <h1>📅 {t('calendar.title')}</h1>
        
        {/* Fast Switch Calendar Views Selector */}
        <div className="filter-chips" style={{ margin: 0 }} role="group" aria-label="Calendar view selector">
          <button
            className={`filter-chip ${currentView === 'week' ? 'active' : ''}`}
            onClick={() => setCurrentView('week')}
          >
            {t('calendar.views.week')}
          </button>
          <button
            className={`filter-chip ${currentView === 'month' ? 'active' : ''}`}
            onClick={() => setCurrentView('month')}
          >
            {t('calendar.views.month')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3.5fr', gap: 'var(--sp-lg)' }} className="calendar-layout">
        
        {/* LEFT COLUMN: Filters checklist panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <div className="glass-card" style={{ padding: 'var(--sp-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="text-muted text-xs font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--clr-border)', paddingBottom: 6 }}>
              {t('calendar.filterEvents')}
            </span>

            {/* Milestones */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input
                type="checkbox"
                checked={filters.milestone}
                onChange={() => toggleFilter('milestone')}
                style={{ width: 16, height: 16, accentColor: 'var(--clr-primary)' }}
              />
              <span className="font-semibold">{t('calendar.types.milestone')}</span>
            </label>

            {/* Allocations */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input
                type="checkbox"
                checked={filters.allocation}
                onChange={() => toggleFilter('allocation')}
                style={{ width: 16, height: 16, accentColor: '#0096ff' }}
              />
              <span className="font-semibold">{t('calendar.types.allocation')}</span>
            </label>

            {/* Inspections */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 'var(--fs-sm)' }}>
              <input
                type="checkbox"
                checked={filters.maintenance}
                onChange={() => toggleFilter('maintenance')}
                style={{ width: 16, height: 16, accentColor: '#00ff66' }}
              />
              <span className="font-semibold">{t('calendar.types.maintenance')}</span>
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN: Calendar planner viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          
          {/* A. WEEKLY PLANNER VIEWPORT (Approved default!) */}
          {currentView === 'week' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'var(--sp-sm)' }} className="week-grid-view">
              {WEEK_DAYS.map((day) => {
                const dayEvents = getEventsForDate(day.dateStr);
                const isToday = day.dateStr === '2026-06-01'; // Mock today marker
                return (
                  <div
                    key={day.dateStr}
                    style={{
                      background: isToday ? 'rgba(255, 202, 0, 0.05)' : 'rgba(30, 32, 44, 0.4)',
                      border: isToday ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-md)',
                      minHeight: '420px',
                      padding: '10px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8
                    }}
                  >
                    {/* Day Date labels */}
                    <div style={{ textAlign: 'center', borderBottom: '1px solid var(--clr-border)', paddingBottom: 6 }}>
                      <div className="font-bold" style={{ fontSize: 'var(--fs-md)', color: isToday ? 'var(--clr-primary)' : 'white' }}>
                        {day.dayNum}
                      </div>
                      <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                        {locale === 'en' ? day.nameEn.slice(0, 3) : day.nameRo.slice(0, 3)}
                      </div>
                    </div>

                    {/* Day events stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          style={{
                            background: EVENT_COLORS[event.type],
                            borderLeft: `3px solid ${EVENT_BORDERS[event.type]}`,
                            borderRadius: 'var(--radius-xs)',
                            padding: '6px 8px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease',
                          }}
                          className="calendar-event-card"
                          role="button"
                          tabIndex={0}
                        >
                          <span style={{ marginRight: 4 }}>{event.icon}</span>
                          <span className="font-semibold" style={{ color: 'white' }}>{event.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* B. MONTHLY CALENDAR VIEWPORT */}
          {currentView === 'month' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }} className="month-grid-view">
              {/* Calendar weekdays labels */}
              {WEEK_DAYS.map((day) => (
                <div key={day.dateStr} style={{ textAlign: 'center', fontWeight: 600, fontSize: '11px', color: 'var(--clr-text-muted)', paddingBottom: 4 }}>
                  {locale === 'en' ? day.nameEn.slice(0, 3) : day.nameRo.slice(0, 3)}
                </div>
              ))}

              {/* Calendar days */}
              {MONTH_DAYS.map((day) => {
                const dayEvents = getEventsForDate(day.dateStr);
                const isToday = day.dateStr === '2026-06-01';
                return (
                  <div
                    key={day.dateStr}
                    style={{
                      background: isToday ? 'rgba(255, 202, 0, 0.05)' : 'rgba(30, 32, 44, 0.4)',
                      border: isToday ? '2px solid var(--clr-primary)' : '1px solid var(--clr-border)',
                      borderRadius: 'var(--radius-sm)',
                      height: '80px',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default'
                    }}
                    onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                  >
                    <span className="font-bold text-xs" style={{ color: isToday ? 'var(--clr-primary)' : 'var(--clr-text-muted)' }}>
                      {day.dayNum}
                    </span>

                    {/* Emojis list on date */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {dayEvents.map((event) => (
                        <span key={event.id} title={event.title} style={{ fontSize: '12px' }}>
                          {event.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Selected event details popover overlay */}
      {selectedEvent && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-title"
        >
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" id="event-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{selectedEvent.icon}</span> {selectedEvent.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setSelectedEvent(null)}
                aria-label={t('common.buttons.close')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="text-muted text-xs">Date:</span>
                <span className="font-semibold">{selectedEvent.date}</span>
              </div>

              {selectedEvent.site && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="text-muted text-xs">Work Site:</span>
                  <span className="font-semibold">🏗️ {selectedEvent.site}</span>
                </div>
              )}

              {selectedEvent.worker && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="text-muted text-xs">Assigned Worker:</span>
                  <span className="font-semibold">👷 {selectedEvent.worker}</span>
                </div>
              )}

              {selectedEvent.tool && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="text-muted text-xs">Asset details:</span>
                  <span className="font-semibold">🔧 {selectedEvent.tool} (Technician: {selectedEvent.technician})</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--clr-border)', paddingTop: 8 }}>
                <span className="text-muted text-xs">Activity Description:</span>
                <p className="text-muted" style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: 1.4 }}>
                  {selectedEvent.desc}
                </p>
              </div>

            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                {t('common.buttons.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for responsive calendar grids layout */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .calendar-layout {
            grid-template-columns: 1fr !important;
          }
          .week-grid-view {
            grid-template-columns: 1fr !important;
          }
          .week-grid-view > div {
            min-height: auto !important;
            height: 120px !important;
          }
        }
      `}</style>
    </Layout>
  );
}
