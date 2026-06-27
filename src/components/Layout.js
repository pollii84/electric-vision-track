'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useBusiness } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { useNotifications } from '@/contexts/NotificationContext';
import VersionBadge from '@/components/VersionBadge';

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
      { key: 'planViewer', href: '/plan-viewer', icon: '📐' },
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
  {
    key: 'admin',
    items: [
      { key: 'adminDashboard', href: '/admin', icon: '🔑' },
      { key: 'tenants', href: '/admin/tenants', icon: '🏢' },
      { key: 'globalUsers', href: '/admin/users', icon: '👥' },
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
  const router = useRouter();
  const { user, loading, isSuperAdmin, isDemo, logout } = useAuth();
  const { t } = useI18n();
  const { addToast } = useToast();
  const { companies, activeCompanyId, setActiveCompanyId } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAll } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen]);

  // Role-based route guard
  useEffect(() => {
    if (loading) return;

    const isPublicRoute = pathname === '/login' || pathname === '/marketing' || pathname === '/register';

    if (!user) {
      if (!isPublicRoute) {
        router.push('/login');
      }
      return;
    }

    const role = user.role || 'worker';
    
    const isOwnerOnly = pathname.startsWith('/companies');
    const isFinancial = pathname.startsWith('/quotes') || pathname.startsWith('/offers') || pathname.startsWith('/orders') || pathname.startsWith('/contracts') || pathname.startsWith('/invoices') || pathname.startsWith('/purchases');
    const isAdminOnly = pathname.startsWith('/admin');
    
    let denied = false;
    if (isAdminOnly && !isSuperAdmin) {
      denied = true;
    } else if (isOwnerOnly && role !== 'owner' && !isSuperAdmin) {
      denied = true;
    } else if (isFinancial && role !== 'owner' && role !== 'manager' && !isSuperAdmin) {
      denied = true;
    }
    
    if (denied) {
      addToast(t('auth2fa.unauthorized') || 'Access Denied. You do not have permission to view this resource.', 'error');
      router.push('/');
    }
  }, [user, pathname, loading, isSuperAdmin, router, addToast, t]);

  const filteredNavSections = useMemo(() => {
    const role = user?.role || 'worker';
    
    return NAV_SECTIONS.map((section) => {
      if (section.key === 'admin' && !isSuperAdmin) {
        return null;
      }
      
      const items = section.items.filter((item) => {
        if (isSuperAdmin) return true;
        if (role === 'owner') return true;
        
        // Manager can see everything except companies
        if (role === 'manager') {
          return item.key !== 'companies';
        }
        
        // Supervisor cannot see companies and financial pipeline
        if (role === 'supervisor') {
          const isFinancial = ['quotes', 'offers', 'orders', 'contracts', 'invoices', 'purchases'].includes(item.key);
          return item.key !== 'companies' && !isFinancial;
        }
        
        // Worker can only see general, sites, tasks, timesheets, files, settings
        if (role === 'worker') {
          const allowed = ['dashboard', 'calendar', 'sites', 'workers', 'tasks', 'planViewer', 'timesheets', 'files', 'settings'];
          return allowed.includes(item.key);
        }
        
        return false;
      });
      
      return { ...section, items };
    }).filter(Boolean).filter((section) => section.items.length > 0);
  }, [user, isSuperAdmin]);

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
          <Link href="/" style={{ display: 'inline-block' }}>
            <img
              src="/images/logo_header.png"
              alt="ElectricVision"
              style={{ height: 49, width: 'auto', cursor: 'pointer' }}
            />
          </Link>
          {/* Bell — notification button */}
          <div ref={notifRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('notifications.title')}
            </span>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              aria-label={t('notifications.title')}
              style={{
                position: 'relative',
                background: notifOpen ? 'rgba(255,255,255,0.08)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: unreadCount > 0 ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'var(--clr-danger)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 15,
                  height: 15,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown panel */}
            {notifOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                  onClick={() => setNotifOpen(false)}
                />
                <div style={{
                  position: 'fixed',
                  left: 252,
                  top: 16,
                  width: 320,
                  maxHeight: 'calc(100vh - 32px)',
                  background: 'var(--clr-bg-elevated)',
                  border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--radius-md)',
                  zIndex: 999,
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}>
                  {/* Panel header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--clr-border)',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)' }}>
                      {t('notifications.title')}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAll}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--fs-xs)', color: 'var(--clr-primary)', fontWeight: 600, padding: '2px 0' }}
                      >
                        {t('notifications.markAllRead')}
                      </button>
                    )}
                  </div>

                  {/* Panel list */}
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)' }}>
                        {t('notifications.empty')}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                            if (n.link) { setNotifOpen(false); window.location.href = n.link; }
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--clr-border)',
                            background: n.read ? 'transparent' : 'rgba(var(--clr-primary-rgb, 59,130,246),0.06)',
                            cursor: n.link ? 'pointer' : 'default',
                            transition: 'background 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            {!n.read && (
                              <span style={{
                                flexShrink: 0,
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: 'var(--clr-primary)',
                                marginTop: 5,
                              }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: n.read ? 400 : 600, fontSize: 'var(--fs-sm)', color: 'var(--clr-text)', lineHeight: 1.4, marginBottom: 2 }}>
                                {n.title}
                              </div>
                              {n.body && (
                                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}>
                                  {n.body}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Company Switcher Dropdown — Owner only */}
          {user?.role === 'owner' && (
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
          )}
        </div>

        <nav className="sidebar-nav">
          {filteredNavSections.map((section) => (
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

        <VersionBadge />
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
          <div className="sidebar-user" style={{ cursor: 'default' }}>
            <div className="sidebar-avatar">
              {getInitials(user?.displayName)}
            </div>
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" title={user?.displayName || 'User'}>
                {user?.displayName || 'User'}
              </div>
              <div className="sidebar-user-role">{user?.role || 'admin'}</div>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost"
              title={t('common.logout')}
              aria-label={t('common.logout')}
              style={{
                padding: 6,
                minWidth: 'auto',
                marginLeft: 'auto',
                color: 'var(--clr-danger-light)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
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
              {/* Mobile Company Switcher — Owner only */}
              {user?.role === 'owner' && (
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
              )}

              {filteredNavSections.map((section) => (
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

              {/* Mobile Logout Option */}
              <div style={{
                marginTop: 'var(--sp-md)',
                paddingTop: 'var(--sp-md)',
                borderTop: '1px solid var(--clr-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
                  <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 'var(--fs-xs)' }}>
                    {getInitials(user?.displayName)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{user?.displayName || 'User'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', textTransform: 'capitalize' }}>
                      {user?.role || 'admin'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: 8,
                    color: 'var(--clr-danger-light)',
                    borderColor: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>{t('common.logout') || 'Logout'}</span>
                </button>
              </div>
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
