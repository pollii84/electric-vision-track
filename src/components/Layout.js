'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useBusiness } from '@/contexts/BusinessContext';

const NAV_SECTIONS = [
  {
    key: 'general',
    items: [
      { key: 'dashboard', href: '/', icon: '🏠' },
      { key: 'calendar', href: '/calendar', icon: '📅' },
    ],
  },
  {
    key: 'operations',
    items: [
      { key: 'sites', href: '/sites', icon: '🏗️' },
      { key: 'workers', href: '/workers', icon: '👷' },
      { key: 'tasks', href: '/tasks', icon: '📋' },
      { key: 'timesheets', href: '/timesheets', icon: '⏱️' },
    ],
  },
  {
    key: 'financial',
    items: [
      { key: 'quotes', href: '/quotes', icon: '📝' },
      { key: 'offers', href: '/offers', icon: '💰' },
      { key: 'orders', href: '/orders', icon: '📦' },
      { key: 'contracts', href: '/contracts', icon: '📑' },
      { key: 'invoices', href: '/invoices', icon: '🧾' },
      { key: 'purchases', href: '/purchases', icon: '🛒' },
    ],
  },
  {
    key: 'inventory',
    items: [
      { key: 'stocks', href: '/stocks', icon: '📊' },
      { key: 'equipment', href: '/inventory', icon: '🔧' },
    ],
  },
  {
    key: 'other',
    items: [
      { key: 'contacts', href: '/contacts', icon: '👥' },
      { key: 'files', href: '/files', icon: '📁' },
      { key: 'settings', href: '/settings', icon: '⚙️' },
      { key: 'companies', href: '/companies', icon: '🏢' },
    ],
  },
];

const BOTTOM_NAV = [
  { key: 'dashboard', href: '/', icon: '🏠' },
  { key: 'sites', href: '/sites', icon: '🏗️' },
  { key: 'workers', href: '/workers', icon: '👷' },
  { key: 'timesheets', href: '/timesheets', icon: '⏱️' },
];

export default function Layout({ children }) {
  const pathname = usePathname();
  const { user, isDemo, logout } = useAuth();
  const { t } = useI18n();
  const { companies, activeCompanyId, setActiveCompanyId } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login' || pathname === '/marketing' || pathname === '/register') {
    return <>{children}</>;
  }

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <img
            src="/images/logo_header.png"
            alt="ElectricVision"
            style={{ height: 49, width: 'auto' }}
          />
          {/* Company Switcher Dropdown */}
          <div style={{ width: '100%', padding: '0 8px' }}>
            <select
              value={activeCompanyId}
              onChange={(e) => {
                if (e.target.value === 'manage-companies') {
                  window.location.href = '/companies';
                } else {
                  setActiveCompanyId(e.target.value);
                }
              }}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                color: 'var(--clr-text)',
                fontSize: 'var(--fs-sm)',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--clr-bg-deep)' }}>
                  🏢 {c.name}
                </option>
              ))}
              <option value="manage-companies" style={{ background: 'var(--clr-bg-deep)', color: 'var(--clr-primary)' }}>
                ⚙️ {t('companies.title')}
              </option>
            </select>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.key}>
              <div className="sidebar-section-title">
                {t(`nav.sections.${section.key}`)}
              </div>
              {section.items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isDemo && (
            <div style={{
              padding: '8px 12px',
              marginBottom: 8,
              background: 'rgba(255, 202, 0, 0.1)',
              border: '1px solid rgba(255, 202, 0, 0.2)',
              borderRadius: 8,
              fontSize: 'var(--fs-xs)',
              color: 'var(--clr-primary)',
              textAlign: 'center',
              fontWeight: 600,
            }}>
              ⚡ DEMO MODE
            </div>
          )}
          <div className="sidebar-user" onClick={logout} title={t('common.logout')}>
            <div className="sidebar-avatar">
              {getInitials(user?.displayName)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.displayName || 'User'}</div>
              <div className="sidebar-user-role">{user?.role || 'admin'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          {BOTTOM_NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`bottom-nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="bottom-nav-icon">{item.icon}</span>
              <span>{t(`nav.${item.key}`)}</span>
            </Link>
          ))}
          <button
            className={`bottom-nav-item ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="bottom-nav-icon">☰</span>
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Full Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          style={{ alignItems: 'flex-end' }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', borderRadius: '20px 20px 0 0', maxHeight: '80vh' }}
          >
            <div className="modal-header">
              <span className="modal-title">{t('nav.menu')}</span>
              <button className="modal-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '8px' }}>
              {/* Mobile Company Switcher */}
              <div style={{ padding: '8px', marginBottom: 16 }}>
                <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  {t('companies.switcher')}
                </label>
                <select
                  value={activeCompanyId}
                  onChange={(e) => {
                    if (e.target.value === 'manage-companies') {
                      setMobileMenuOpen(false);
                      window.location.href = '/companies';
                    } else {
                      setActiveCompanyId(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--clr-text)',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--clr-bg-deep)' }}>
                      🏢 {c.name}
                    </option>
                  ))}
                  <option value="manage-companies" style={{ background: 'var(--clr-bg-deep)', color: 'var(--clr-primary)' }}>
                    ⚙️ {t('companies.title')}
                  </option>
                </select>
              </div>

              {NAV_SECTIONS.map((section) => (
                <div key={section.key}>
                  <div className="sidebar-section-title">{t(`nav.sections.${section.key}`)}</div>
                  {section.items.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      {t(`nav.${item.key}`)}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content page-enter">
        {children}
      </main>
    </div>
  );
}
