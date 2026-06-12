'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getInvite, acceptInvite } from '@/lib/invites';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router = useRouter();

  const [invite, setInvite] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    getInvite(token).then((data) => {
      if (!data) {
        setLoadError('This invite link is invalid.');
        setLoading(false);
        return;
      }
      if (data.status !== 'pending') {
        setLoadError('This invite link has already been used.');
        setLoading(false);
        return;
      }
      const expiresAt = data.expiresAt?.toDate?.() ?? new Date(data.expiresAt);
      if (new Date() > expiresAt) {
        setLoadError('This invite link has expired. Ask your owner to send a new one.');
        setLoading(false);
        return;
      }
      setInvite(data);
      setDisplayName(data.displayName || '');
      setLoading(false);
    }).catch(() => {
      setLoadError('Could not load invite. Check your connection and try again.');
      setLoading(false);
    });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!displayName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!password) {
      setFormError('Password is required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, invite.email, password);
      await updateProfile(result.user, { displayName: displayName.trim() });

      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: invite.email,
        displayName: displayName.trim(),
        role: invite.role,
        experienceLevel: invite.experienceLevel,
        tenantId: invite.tenantId,
        phone: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'tenants', invite.tenantId, 'members', result.user.uid), {
        uid: result.user.uid,
        email: invite.email,
        displayName: displayName.trim(),
        role: invite.role,
        experienceLevel: invite.experienceLevel,
        invitedBy: invite.invitedBy,
        joinedAt: serverTimestamp(),
      });

      await acceptInvite(token, result.user.uid);

      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists. Go to login instead.'
          : err.message || 'Something went wrong. Try again.';
      setFormError(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div
        className="login-card glass-card"
        role="main"
        style={{ maxWidth: 480, padding: 'var(--sp-xl) var(--sp-2xl)' }}
      >
        {/* Logo */}
        <div className="login-header">
          <div className="login-logo">
            <img
              src="/images/logo_header.png"
              alt="ElectricVision"
              width={96}
              height={96}
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className="login-title">Create Your Account</h1>
          <p className="login-subtitle">You've been invited to join ElectricVision Track</p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--sp-xl)' }}>
            <svg width="36" height="36" viewBox="0 0 40 40" style={{ animation: 'spin 1s linear infinite', color: 'var(--clr-primary)' }}>
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="80" strokeLinecap="round" />
            </svg>
            <style jsx global>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Invalid invite */}
        {!loading && loadError && (
          <div style={{
            padding: '16px',
            background: 'var(--clr-danger-glow)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--clr-danger-light)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Invalid Invite</p>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>{loadError}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            padding: '16px',
            background: 'var(--clr-success-glow)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--clr-success)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <p style={{ fontWeight: 600 }}>Account created! Redirecting…</p>
          </div>
        )}

        {/* Form */}
        {!loading && !loadError && !success && invite && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Email (read-only) */}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={invite.email}
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>

            {/* Role badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 'var(--sp-md)',
              padding: '8px 12px',
              background: 'var(--clr-primary-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,202,0,0.1)',
              fontSize: 'var(--fs-sm)',
            }}>
              <span>⚡</span>
              <span style={{ color: 'var(--clr-primary-light)', fontWeight: 600 }}>
                {invite.role === 'manager' ? 'Manager' : `Worker — ${invite.experienceLevel}`}
              </span>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="invite-name">Full Name</label>
              <input
                id="invite-name"
                className="form-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="invite-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="invite-password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="invite-confirm-password">Confirm Password</label>
              <input
                id="invite-confirm-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingRight: 44 }}
              />
            </div>

            {formError && (
              <div className="form-error" role="alert" style={{
                padding: '10px 14px',
                background: 'var(--clr-danger-glow)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--sp-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
              style={{ width: '100%' }}
            >
              {submitting ? (
                <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              ) : null}
              <span>Create Account</span>
            </button>

            <p style={{ textAlign: 'center', marginTop: 'var(--sp-md)', fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} style={{ color: 'var(--clr-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
