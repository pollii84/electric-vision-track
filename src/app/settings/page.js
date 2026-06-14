'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { setGlobalDoc } from '@/lib/firestore';
import versionInfo from '../../../version.json';

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const { user, isDemo } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('RON');
  const [saveStatus, setSaveStatus] = useState('');

  // Initial load
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
    if (typeof window !== 'undefined') {
      setCurrency(localStorage.getItem('ev-currency') || 'RON');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaveStatus('loading');
    try {
      await setGlobalDoc('users', user.uid, { displayName }, true);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
      }
      if (typeof window !== 'undefined' && isDemo) {
        const demoUser = JSON.parse(localStorage.getItem('ev-demo-user') || '{}');
        localStorage.setItem('ev-demo-user', JSON.stringify({ ...demoUser, displayName }));
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setSaveStatus('');
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ev-currency', newCurrency);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase();
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>⚙️ {t('settings.title')}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--sp-lg)' }} className="settings-grid">
        {/* Left Column: Profile Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)' }}>
            👤 {t('settings.profile')}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', marginBottom: 'var(--sp-xs)' }}>
            <div
              className="avatar font-bold"
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                fontSize: 'var(--fs-xl)',
                background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark))',
                border: '2px solid var(--clr-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {getInitials(displayName || user?.displayName)}
            </div>
            <div>
              <div className="font-semibold" style={{ fontSize: 'var(--fs-md)' }}>
                {displayName || user?.displayName || 'User'}
              </div>
              <div style={{ marginTop: 4 }}>
                <span className="badge badge-accent" style={{ fontSize: 'var(--fs-xs)' }}>
                  {t(`roles.${user?.role || 'worker'}`)}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="settings-displayName">
                {t('settings.displayName')}
              </label>
              <input
                id="settings-displayName"
                className="form-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="settings-email">
                {t('common.fields.email')} ({t('settings.readOnly')})
              </label>
              <input
                id="settings-email"
                className="form-input"
                type="email"
                value={user?.email || 'admin@dimensionvisiontrack.com'}
                disabled
                style={{ background: 'var(--clr-bg-deep)', cursor: 'not-allowed', opacity: 0.7 }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', marginTop: 'var(--sp-xs)' }}>
              <button className="btn btn-primary" type="submit" disabled={saveStatus === 'loading'}>
                {saveStatus === 'loading' ? 'Saving...' : t('common.buttons.save')}
              </button>
              {saveStatus === 'success' && (
                <span style={{ color: 'var(--clr-success)', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                  ✓ {t('settings.saved')}
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Preferences, Language, Currency & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
          {/* Language Preference Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)' }}>
              🌐 {t('settings.language')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
              <button
                className="btn"
                onClick={() => setLocale('en')}
                style={{
                  padding: '16px',
                  background: locale === 'en' ? 'var(--clr-primary-subtle)' : 'var(--clr-bg-elevated)',
                  border: locale === 'en' ? '2px solid var(--clr-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xl)' }}>🇬🇧</span>
                <span className="font-semibold" style={{ color: locale === 'en' ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  English
                </span>
              </button>

              <button
                className="btn"
                onClick={() => setLocale('ro')}
                style={{
                  padding: '16px',
                  background: locale === 'ro' ? 'var(--clr-primary-subtle)' : 'var(--clr-bg-elevated)',
                  border: locale === 'ro' ? '2px solid var(--clr-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xl)' }}>🇷🇴</span>
                <span className="font-semibold" style={{ color: locale === 'ro' ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  Română
                </span>
              </button>
            </div>
          </div>

          {/* Currency Preference Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
            <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)' }}>
              🪙 {t('settings.currency')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)' }}>
              <button
                className="btn"
                onClick={() => handleCurrencyChange('RON')}
                style={{
                  padding: '16px',
                  background: currency === 'RON' ? 'var(--clr-primary-subtle)' : 'var(--clr-bg-elevated)',
                  border: currency === 'RON' ? '2px solid var(--clr-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xl)' }}>🇷🇴</span>
                <span className="font-semibold" style={{ color: currency === 'RON' ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {t('settings.currencies.RON')}
                </span>
              </button>

              <button
                className="btn"
                onClick={() => handleCurrencyChange('EUR')}
                style={{
                  padding: '16px',
                  background: currency === 'EUR' ? 'var(--clr-primary-subtle)' : 'var(--clr-bg-elevated)',
                  border: currency === 'EUR' ? '2px solid var(--clr-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-xl)' }}>🇪🇺</span>
                <span className="font-semibold" style={{ color: currency === 'EUR' ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                  {t('settings.currencies.EUR')}
                </span>
              </button>
            </div>
          </div>

          {/* App Info Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
            <h2 style={{ fontSize: 'var(--fs-lg)', margin: 0, borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--sp-sm)', marginBottom: 'var(--sp-xs)' }}>
              ℹ️ {t('settings.appInfo')}
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)' }}>
              <span className="text-muted">Application:</span>
              <span className="font-semibold">ElectricVision Track</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)' }}>
              <span className="text-muted">{t('settings.version')}:</span>
              <span className="font-semibold">{versionInfo.version}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--sp-sm)', marginTop: 'var(--sp-xs)' }}>
              <span className="text-muted">Website:</span>
              <a
                href="https://www.dimensionvisiontrack.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--clr-primary)', fontWeight: 600, textDecoration: 'none' }}
              >
                dimensionvisiontrack.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded responsive layout CSS */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
