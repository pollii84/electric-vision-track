'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

const PACKAGES = ['small', 'medium', 'large', 'enterprise'];

// Password toggle button component (declared outside render to avoid recreation)
const PasswordToggle = ({ show, onToggle, id, hideLabel, showLabel }) => (
  <button
    type="button"
    id={id}
    onClick={onToggle}
    aria-label={show ? hideLabel : showLabel}
    style={{
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      padding: 6,
      color: 'var(--clr-text-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
    }}
  >
    {show ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

function RegisterForm() {
  const { user, loading, createAccount, loginWithGoogle } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [companyCui, setCompanyCui] = useState('');
  const [companyEuid, setCompanyEuid] = useState('');
  const [isLookingUpCui, setIsLookingUpCui] = useState(false);

  // User fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Auth fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('small');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1 = Company, 2 = User

  // Pre-select package from URL
  useEffect(() => {
    const pkg = searchParams.get('package');
    if (pkg && PACKAGES.includes(pkg.toLowerCase())) {
      setSelectedPackage(pkg.toLowerCase());
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleGoogleSignUp = async () => {
    clearMessages();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || t('statusMessages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCuiLookup = async (cuiValue) => {
    if (!cuiValue) return;
    const cleaned = cuiValue.toUpperCase().replace(/^RO/, '').trim();
    setCompanyCui(cleaned);
    if (!cleaned || cleaned.length < 2 || !/^\d+$/.test(cleaned)) {
      return;
    }

    setIsLookingUpCui(true);
    setError('');

    try {
      const res = await fetch(`/api/lookup-cui?cui=${cleaned}`);
      if (res.ok) {
        const data = await res.json();
        if (data.name) setCompanyName(data.name);
        if (data.euid) setCompanyEuid(data.euid);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.warn('CUI lookup failed:', errData.error || res.statusText);
      }
    } catch (err) {
      console.error('CUI lookup error:', err);
    } finally {
      setIsLookingUpCui(false);
    }
  };

  const handleNextStep = () => {
    clearMessages();

    if (!companyName.trim()) {
      setError(t('register.companyNameRequired'));
      return;
    }
    if (!companyCui.trim()) {
      setError(t('register.cuiRequired') || 'Company CUI is required');
      return;
    }
    if (!companyEuid.trim()) {
      setError(t('register.euidRequired') || 'Company EUID is required');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    // User details validation
    if (!userName.trim()) {
      setError(t('register.ownerNameRequired'));
      return;
    }

    if (!userEmail.trim()) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!validateEmail(userEmail)) {
      setError(t('validation.invalidEmail') || 'Please enter a valid email address');
      return;
    }

    if (!userPhone.trim()) {
      setError(t('register.phoneRequired') || 'Phone number is required');
      return;
    }

    if (!password) {
      setError(t('auth.passwordRequired'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsMustMatch'));
      return;
    }

    setIsSubmitting(true);

    try {
      await createAccount({
        company: {
          name: companyName.trim(),
          cui: companyCui.trim(),
          euid: companyEuid.trim(),
        },
        user: {
          name: userName.trim(),
          email: userEmail.trim(),
          phone: userPhone.trim(),
        },
        password,
      });
      setSuccessMessage(t('register.success'));
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      setError(err.message || t('statusMessages.error'));
    } finally {
      setIsSubmitting(false);
    }
  };



  // Loading state
  if (loading || user) {
    return (
      <div className="login-page">
        <div className="login-bg" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="spinner" aria-label={t('common.loading')}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--clr-primary)" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      {/* Animated gradient background */}
      <div className="login-bg" aria-hidden="true" />

      {/* Floating electric particles */}
      <div aria-hidden="true">
        {[
          { left: '12%', animDuration: '6s', animDelay: '0s', size: 6 },
          { left: '35%', animDuration: '8s', animDelay: '2s', size: 4 },
          { left: '68%', animDuration: '7s', animDelay: '1s', size: 5 },
          { left: '85%', animDuration: '9s', animDelay: '3s', size: 3 },
          { left: '50%', animDuration: '10s', animDelay: '4s', size: 4 },
        ].map((p, i) => (
          <span
            key={i}
            style={{
              position: 'fixed',
              left: p.left,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: 'var(--clr-primary)',
              boxShadow: '0 0 8px var(--clr-primary-glow), 0 0 16px var(--clr-primary-glow)',
              opacity: 0.7,
              zIndex: 0,
              animation: `floatUp ${p.animDuration} ease-in-out ${p.animDelay} infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Language toggle — top right */}
      <div
        role="group"
        aria-label={t('settings.language')}
        style={{
          position: 'absolute',
          top: 'var(--sp-md)',
          right: 'var(--sp-md)',
          display: 'flex',
          gap: '4px',
          zIndex: 2,
        }}
      >
        <button
          id="reg-lang-en"
          onClick={() => setLocale('en')}
          className={`btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={locale === 'en'}
          style={{ minWidth: 40, padding: '6px 10px' }}
        >
          EN
        </button>
        <button
          id="reg-lang-ro"
          onClick={() => setLocale('ro')}
          className={`btn btn-sm ${locale === 'ro' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={locale === 'ro'}
          style={{ minWidth: 40, padding: '6px 10px' }}
        >
          RO
        </button>
      </div>

      {/* Registration card */}
      <div
        className="login-card glass-card"
        role="main"
        style={{ maxWidth: 540, padding: 'var(--sp-xl) var(--sp-2xl)' }}
      >
        {/* Logo & Header */}
        <div className="login-header">
          <div className="login-logo">
            <a href="https://dimensionvisiontrack.com">
              <img
                src="/images/logo_header.png"
                alt="ElectricVision"
                width={100}
                height={100}
                style={{ objectFit: 'contain', cursor: 'pointer' }}
              />
            </a>
          </div>
          <h1 className="login-title">{t('register.title')}</h1>
          <p className="login-subtitle">{t('register.subtitle')}</p>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 'var(--sp-lg)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              background: step >= 1 ? 'var(--clr-primary)' : 'var(--clr-surface-hover)',
              color: step >= 1 ? 'var(--clr-bg)' : 'var(--clr-text-muted)',
              transition: 'all 0.3s ease',
            }}>1</div>
            <span style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: step === 1 ? 600 : 400,
              color: step === 1 ? 'var(--clr-text)' : 'var(--clr-text-muted)',
            }}>
              {t('register.steps.company') || 'Company'}
            </span>
          </div>

          <div style={{
            width: 40,
            height: 2,
            background: step >= 2 ? 'var(--clr-primary)' : 'var(--clr-surface-hover)',
            alignSelf: 'center',
            borderRadius: 1,
            transition: 'background 0.3s ease',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--fs-sm)',
              fontWeight: 700,
              background: step >= 2 ? 'var(--clr-primary)' : 'var(--clr-surface-hover)',
              color: step >= 2 ? 'var(--clr-bg)' : 'var(--clr-text-muted)',
              transition: 'all 0.3s ease',
            }}>2</div>
            <span style={{
              fontSize: 'var(--fs-sm)',
              fontWeight: step === 2 ? 600 : 400,
              color: step === 2 ? 'var(--clr-text)' : 'var(--clr-text-muted)',
            }}>
              {t('register.steps.user') || 'User'}
            </span>
          </div>
        </div>

        {/* ── STEP 1: COMPANY DETAILS ── */}
        {step === 1 && (
          <>
            {/* Section header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 'var(--sp-md)',
              padding: '10px 14px',
              background: 'var(--clr-primary-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,202,0,0.1)',
            }}>
              <span style={{ fontSize: 20 }}>🏢</span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--clr-primary-light)' }}>
                {t('register.sections.companyDetails') || 'Company Details'}
              </span>
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-company-name">
                {t('register.fields.companyName')}
              </label>
              <input
                id="reg-company-name"
                type="text"
                className="form-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t('register.fields.companyName')}
                autoComplete="organization"
                required
              />
            </div>

            {/* Company CUI */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-company-cui">
                {t('register.fields.cui') || 'Company CUI'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-company-cui"
                  type="text"
                  className="form-input"
                  value={companyCui}
                  onChange={(e) => setCompanyCui(e.target.value)}
                  onBlur={(e) => handleCuiLookup(e.target.value)}
                  placeholder="e.g. RO12345678"
                  required
                  style={{ paddingRight: isLookingUpCui ? 40 : 12 }}
                />
                {isLookingUpCui && (
                  <div style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 20 20"
                      style={{ animation: 'spin 1s linear infinite', color: 'var(--clr-primary)' }}
                      aria-hidden="true"
                    >
                      <circle
                        cx="10" cy="10" r="7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeDasharray="32"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 4, display: 'block' }}>
                {t('register.hints.cui') || 'Unique tax identification code (preluare automată denumire & EUID la părăsirea câmpului)'}
              </span>
            </div>

            {/* Company EUID */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-company-euid">
                {t('register.fields.euid') || 'Company EUID'}
              </label>
              <input
                id="reg-company-euid"
                type="text"
                className="form-input"
                value={companyEuid}
                onChange={(e) => setCompanyEuid(e.target.value)}
                placeholder="e.g. ROONRC.J12/1234/2024"
                required
              />
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginTop: 4, display: 'block' }}>
                {t('register.hints.euid') || 'European Unique Identifier'}
              </span>
            </div>

            {/* Select Plan */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-package">
                {t('register.fields.package')}
              </label>
              <select
                id="reg-package"
                className="form-select"
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
              >
                <option value="small">
                  {t('marketing.pricing.packages.small.name')} ({t('marketing.pricing.packages.small.users')})
                </option>
                <option value="medium">
                  {t('marketing.pricing.packages.medium.name')} ({t('marketing.pricing.packages.medium.users')})
                </option>
                <option value="large">
                  {t('marketing.pricing.packages.large.name')} ({t('marketing.pricing.packages.large.users')})
                </option>
                <option value="enterprise">
                  {t('marketing.pricing.packages.enterprise.name')} ({t('marketing.pricing.packages.enterprise.users')})
                </option>
              </select>
            </div>

            {/* Error message */}
            {error && (
              <div className="form-error" role="alert" style={{
                padding: '10px 14px',
                background: 'var(--clr-danger-glow)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--sp-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-sm)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Next button */}
            <button
              id="reg-next"
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleNextStep}
              style={{ width: '100%' }}
            >
              <span>{t('register.nextStep') || 'Continue to User Details'}</span>
              <span aria-hidden="true" style={{ fontSize: 18, marginLeft: 8 }}>→</span>
            </button>

            {/* Divider */}
            <div className="login-divider" role="separator" style={{ marginTop: 'var(--sp-lg)' }}>
              <span>{t('common.or')}</span>
            </div>

            {/* Google Sign-Up */}
            <button
              id="google-sign-up"
              className="btn-google"
              onClick={handleGoogleSignUp}
              disabled={isSubmitting}
              type="button"
              aria-label={t('register.signUpWithGoogle')}
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.52l7.97-5.93z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.93C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{t('register.signUpWithGoogle')}</span>
            </button>
          </>
        )}

        {/* ── STEP 2: USER DETAILS & PASSWORD ── */}
        {step === 2 && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Section header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 'var(--sp-md)',
              padding: '10px 14px',
              background: 'var(--clr-primary-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,202,0,0.1)',
            }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--clr-primary-light)' }}>
                {t('register.sections.userDetails') || 'Owner Account Details'}
              </span>
            </div>

            {/* Company summary badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--sp-md)',
              padding: '8px 12px',
              background: 'var(--clr-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--clr-border)',
              fontSize: 'var(--fs-sm)',
            }}>
              <span style={{ fontSize: 16 }}>🏢</span>
              <span style={{ color: 'var(--clr-text-secondary)', fontWeight: 500 }}>{companyName}</span>
              <span style={{ color: 'var(--clr-text-muted)', marginLeft: 'auto' }}>CUI: {companyCui}</span>
            </div>

            {/* User Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-user-name">
                {t('register.fields.userName') || 'Full Name'}
              </label>
              <input
                id="reg-user-name"
                type="text"
                className="form-input"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('register.fields.userName') || 'Full Name'}
                autoComplete="name"
                required
              />
            </div>

            {/* User Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">
                {t('register.fields.email')}
              </label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={t('register.fields.email')}
                autoComplete="email"
                required
              />
            </div>

            {/* User Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-phone">
                {t('register.fields.phone') || 'Phone Number'}
              </label>
              <input
                id="reg-phone"
                type="tel"
                className="form-input"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="+40 7XX XXX XXX"
                autoComplete="tel"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                {t('register.fields.password')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.fields.password')}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  style={{ paddingRight: 44 }}
                />
                <PasswordToggle
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  id="reg-toggle-password"
                  hideLabel={t('auth.hidePassword')}
                  showLabel={t('auth.showPassword')}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm-password">
                {t('register.fields.confirmPassword')}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.fields.confirmPassword')}
                  autoComplete="new-password"
                  required
                  style={{ paddingRight: 44 }}
                />
                <PasswordToggle
                  show={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((v) => !v)}
                  id="reg-toggle-confirm-password"
                  hideLabel={t('auth.hidePassword')}
                  showLabel={t('auth.showPassword')}
                />
              </div>
            </div>

            {/* Role badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--sp-md)',
              padding: '8px 12px',
              background: 'rgba(0, 200, 83, 0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(0, 200, 83, 0.15)',
              fontSize: 'var(--fs-sm)',
            }}>
              <span style={{ fontSize: 16 }}>👑</span>
              <span style={{ color: 'var(--clr-success)', fontWeight: 600 }}>
                {t('register.ownerRoleAssigned') || 'You will be assigned as the Account Owner'}
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="form-error" role="alert" style={{
                padding: '10px 14px',
                background: 'var(--clr-danger-glow)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--sp-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-sm)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div role="status" style={{
                padding: '10px 14px',
                background: 'var(--clr-success-glow)',
                color: 'var(--clr-success)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--sp-md)',
                fontSize: 'var(--fs-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--sp-sm)',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Button row */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                id="reg-back"
                type="button"
                className="btn btn-ghost btn-lg"
                onClick={() => { setStep(1); clearMessages(); }}
                style={{ flex: '0 0 auto', padding: '12px 20px' }}
              >
                ← {t('common.back') || 'Back'}
              </button>

              <button
                id="reg-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
                style={{ flex: 1 }}
              >
                {isSubmitting ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    style={{ animation: 'spin 1s linear infinite' }}
                    aria-hidden="true"
                  >
                    <circle
                      cx="10" cy="10" r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="32"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : null}
                <span>{t('register.createAccount')}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer links */}
        <div style={{
          textAlign: 'center',
          marginTop: 'var(--sp-lg)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--clr-text-muted)',
        }}>
          {/* Already have an account */}
          <p>
            {t('register.alreadyHaveAccount')}{' '}
            <button
              type="button"
              id="reg-switch-to-login"
              onClick={() => router.push('/login')}
              style={{
                color: 'var(--clr-primary)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'inherit',
              }}
            >
              {t('register.login')}
            </button>
          </p>

          {/* Terms agreement */}
          <p style={{
            marginTop: 'var(--sp-md)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--clr-text-muted)',
            lineHeight: 1.5,
          }}>
            {t('register.termsAgreement')}
          </p>

          {/* Back to marketing */}
          <p style={{ marginTop: 'var(--sp-sm)' }}>
            <button
              type="button"
              id="reg-back-to-marketing"
              onClick={() => window.location.href = 'https://dimensionvisiontrack.com'}
              style={{
                color: 'var(--clr-primary)',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 'inherit',
              }}
            >
              ← {t('marketing.nav.features')}
            </button>
          </p>
        </div>
      </div>

      {/* Keyframes for floating particles and spinner */}
      <style jsx global>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(-100vh) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="login-page">
          <div className="login-bg" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--clr-primary)" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
            </svg>
          </div>
          <style jsx global>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
