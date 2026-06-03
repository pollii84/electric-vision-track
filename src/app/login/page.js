'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  
  // Fields
  const [companyName, setCompanyName] = useState('');
  const [rememberCompany, setRememberCompany] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(60);

  // Redirect if already logged in
  useEffect(() => {
    if (user && step === 'credentials') {
      router.push('/');
    }
  }, [user, router, step]);

  // Load remembered company name
  useEffect(() => {
    const saved = localStorage.getItem('ev-login-company');
    if (saved) {
      setCompanyName(saved);
      setRememberCompany(true);
    }
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    if (step !== 'otp' || otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, otpCountdown]);

  const clearMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const handleGoogleSignIn = async () => {
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

  const handleResendOtp = () => {
    setOtpCountdown(60);
    setOtpCode('');
    clearMessages();
    setSuccessMessage(t('auth.passwordResetSent') || 'A new verification code has been simulated to your email.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (step === 'credentials') {
      // Validations
      if (mode === 'login' && !companyName.trim()) {
        setError(t('auth2fa.companyNameRequired'));
        return;
      }

      if (!email.trim()) {
        setError(t('auth.emailRequired'));
        return;
      }

      if (mode !== 'reset' && !password) {
        setError(t('auth.passwordRequired'));
        return;
      }

      if (mode !== 'reset' && password.length < 6) {
        setError(t('auth.passwordTooShort'));
        return;
      }

      setIsSubmitting(true);

      try {
        if (mode === 'reset') {
          await resetPassword(email);
          setSuccessMessage(t('auth.passwordResetSent'));
          setIsSubmitting(false);
          return;
        }

        if (mode === 'signup') {
          await signUpWithEmail(email, password, displayName);
          setIsSubmitting(false);
        } else {
          // Verify company config
          if (rememberCompany) {
            localStorage.setItem('ev-login-company', companyName);
          } else {
            localStorage.removeItem('ev-login-company');
          }
          
          // Proceed to mock OTP verification layer
          setStep('otp');
          setOtpCountdown(60);
          setIsSubmitting(false);
        }
      } catch (err) {
        const msg = err?.code === 'auth/invalid-credential'
          ? t('auth.invalidCredentials')
          : err.message || t('statusMessages.error');
        setError(msg);
        setIsSubmitting(false);
      }
    } else {
      // OTP Verification step
      if (!otpCode.trim()) {
        setError(t('auth2fa.otpRequired'));
        return;
      }

      if (otpCode !== '123456') {
        setError(t('auth2fa.invalidOtp'));
        return;
      }

      setIsSubmitting(true);
      try {
        await loginWithEmail(email, password);
        setSuccessMessage(t('register.success'));
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (err) {
        setError(err.message || t('statusMessages.error'));
        setIsSubmitting(false);
      }
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearMessages();
  };

  // Show loading spinner
  if (loading || (user && step === 'credentials')) {
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
          id="lang-en"
          onClick={() => setLocale('en')}
          className={`btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={locale === 'en'}
          style={{ minWidth: 40, padding: '6px 10px' }}
        >
          EN
        </button>
        <button
          id="lang-ro"
          onClick={() => setLocale('ro')}
          className={`btn btn-sm ${locale === 'ro' ? 'btn-primary' : 'btn-ghost'}`}
          aria-pressed={locale === 'ro'}
          style={{ minWidth: 40, padding: '6px 10px' }}
        >
          RO
        </button>
      </div>

      {/* Login card */}
      <div className="login-card glass-card" role="main" style={{ maxWidth: 480 }}>
        {/* Logo & Header */}
        <div className="login-header">
          <div className="login-logo">
            <Link href="/marketing">
              <img
                src="/images/logo_header.png"
                alt="ElectricVision"
                width={125}
                height={125}
                style={{ objectFit: 'contain', cursor: 'pointer' }}
              />
            </Link>
          </div>
          <h1 className="login-title">ElectricVision Track</h1>
          <p className="login-subtitle">
            {step === 'otp' ? t('auth2fa.otpTitle') : t('auth.signInToContinue')}
          </p>
        </div>

        {/* ── STEP 1: CREDENTIALS INPUT ── */}
        {step === 'credentials' && (
          <>
            {/* Google Sign-In (not in reset mode) */}
            {mode !== 'reset' && (
              <>
                <button
                  id="google-sign-in"
                  className="btn-google"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  type="button"
                  aria-label={t('auth.signInWithGoogle')}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 0 0 0 24c0 3.77.9 7.35 2.56 10.52l7.97-5.93z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.93C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{t('auth.signInWithGoogle')}</span>
                </button>

                <div className="login-divider" role="separator">
                  <span>{t('common.or')}</span>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Display name — signup only */}
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="login-displayname">
                    {t('auth.displayName')}
                  </label>
                  <input
                    id="login-displayname"
                    type="text"
                    className="form-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('auth.displayName')}
                    autoComplete="name"
                  />
                </div>
              )}

              {/* Company Name — login only */}
              {mode === 'login' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="login-company">
                    {t('auth2fa.companyName')}
                  </label>
                  <input
                    id="login-company"
                    type="text"
                    className="form-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Cluj Division"
                    autoComplete="organization"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  {t('auth.email')}
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@electricvision.eu"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password — not in reset mode */}
              {mode !== 'reset' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="login-password">
                    {t('auth.password')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      id="toggle-password"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? (
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
                  </div>
                </div>
              )}

              {/* Remember Company Name — login only */}
              {mode === 'login' && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--sp-md)', marginTop: '-8px' }}>
                  <input
                    id="remember-company"
                    type="checkbox"
                    checked={rememberCompany}
                    onChange={(e) => setRememberCompany(e.target.checked)}
                    style={{ cursor: 'pointer', accentColor: 'var(--clr-primary)', width: 16, height: 16 }}
                  />
                  <label htmlFor="remember-company" style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
                    {t('auth2fa.rememberCompany')}
                  </label>
                </div>
              )}

              {/* Forgot password link — login mode only */}
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: 'var(--sp-md)', marginTop: '-8px' }}>
                  <button
                    type="button"
                    id="forgot-password-link"
                    onClick={() => switchMode('reset')}
                    style={{
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--clr-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* Reset mode instructions */}
              {mode === 'reset' && (
                <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', marginBottom: 'var(--sp-md)', textAlign: 'center' }}>
                  {t('auth.resetPasswordInstructions')}
                </p>
              )}

              {/* Notifications */}
              {error && (
                <div className="form-error" role="alert" style={{ padding: '10px 14px', background: 'var(--clr-danger-glow)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div role="status" style={{ padding: '10px 14px', background: 'var(--clr-success-glow)', color: 'var(--clr-success)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-md)', fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
                style={{ width: '100%' }}
              >
                {isSubmitting ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true">
                    <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                ) : null}
                <span>
                  {mode === 'reset' ? t('auth.resetPassword') : mode === 'signup' ? t('auth.createAccount') : t('auth.login')}
                </span>
              </button>
            </form>

            {/* Switch authentication modes */}
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-lg)', fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
              {mode === 'login' && (
                <p>
                  {t('auth.dontHaveAccount')}{' '}
                  <button type="button" id="switch-to-signup" onClick={() => switchMode('signup')} style={{ color: 'var(--clr-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                    {t('auth.signUp')}
                  </button>
                </p>
              )}
              {mode === 'signup' && (
                <p>
                  {t('auth.alreadyHaveAccount')}{' '}
                  <button type="button" id="switch-to-login" onClick={() => switchMode('login')} style={{ color: 'var(--clr-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                    {t('auth.login')}
                  </button>
                </p>
              )}
              {mode === 'reset' && (
                <p>
                  <button type="button" id="back-to-login" onClick={() => switchMode('login')} style={{ color: 'var(--clr-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                    ← {t('auth.login')}
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {/* ── STEP 2: 2FA OTP VERIFICATION ── */}
        {step === 'otp' && (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ fontSize: 'var(--fs-base)', color: 'var(--clr-text-secondary)', lineHeight: 1.6, textAlign: 'center', marginBottom: 24 }}>
              {t('auth2fa.otpSubtitle')}
            </p>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="login-otp" style={{ textAlign: 'center', display: 'block', marginBottom: 12 }}>
                {t('auth2fa.enterOtp')}
              </label>
              <input
                id="login-otp"
                type="text"
                className="form-input"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                autoComplete="one-time-code"
                style={{
                  textAlign: 'center',
                  fontSize: '28px',
                  letterSpacing: '8px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  paddingLeft: '14px',
                  height: 54,
                  maxWidth: 240,
                  margin: '0 auto',
                  display: 'block'
                }}
                required
                maxLength={6}
              />
            </div>

            {/* Countdown / Timeout status */}
            <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 'var(--fs-sm)' }}>
              {otpCountdown > 0 ? (
                <span style={{ color: 'var(--clr-text-muted)' }}>
                  ⏱️ {t('auth2fa.expiresIn').replace('{seconds}', String(otpCountdown))}
                </span>
              ) : (
                <span style={{ color: 'var(--clr-danger)' }}>
                  ⚠️ Code expired
                </span>
              )}
            </div>

            {/* Notifications */}
            {error && (
              <div className="form-error" role="alert" style={{ padding: '10px 14px', background: 'var(--clr-danger-glow)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div role="status" style={{ padding: '10px 14px', background: 'var(--clr-success-glow)', color: 'var(--clr-success)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--sp-md)', fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <button
              id="otp-submit"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {isSubmitting ? (
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              ) : null}
              <span>Verify & Login</span>
            </button>

            {/* 2FA Actions: Resend / Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0}
                style={{ padding: '4px 8px', color: otpCountdown > 0 ? 'var(--clr-text-muted)' : 'var(--clr-primary)', cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer' }}
              >
                🔄 {t('auth2fa.resend')}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setStep('credentials');
                  setOtpCode('');
                  clearMessages();
                }}
                style={{ padding: '4px 8px' }}
              >
                ← Change credentials
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.3); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
