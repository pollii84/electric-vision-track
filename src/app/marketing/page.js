'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

/* ═══════════════════════════════════════════════════════════
   ElectricVision Track — Marketing Landing Page
   Premium dark-industrial design with glassmorphism & gold accents
   ═══════════════════════════════════════════════════════════ */

// ── Animated Counter Hook ──
function useAnimatedCounter(target, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!enabled) { setValue(0); return; }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return value;
}

// ── Intersection Observer Hook for scroll animations ──
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.15, ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

export default function MarketingPage() {
  const { t, locale, setLocale } = useI18n();

  // ── Calculator state ──
  const [workers, setWorkers] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(25);
  const [monthlyHours, setMonthlyHours] = useState(160);

  // ── Scroll state ──
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Savings calculations ──
  const totalLaborCost = workers * hourlyRate * monthlyHours * 12;
  const adminOverhead = totalLaborCost * 0.12;
  const materialWaste = totalLaborCost * 0.08;
  const schedulingLoss = totalLaborCost * 0.05;
  const invoiceDelays = totalLaborCost * 0.04;
  const complianceFines = totalLaborCost * 0.02;
  const totalLosses = adminOverhead + materialWaste + schedulingLoss + invoiceDelays + complianceFines;
  const annualSavings = Math.round(totalLosses * 0.70);
  const hoursSaved = workers * 3 * 12;

  // ── Section visibility for animations ──
  const [featuresRef, featuresInView] = useInView();
  const [savingsRef, savingsInView] = useInView();
  const [pricingRef, pricingInView] = useInView();

  const animatedSavings = useAnimatedCounter(annualSavings, 1400, savingsInView);

  // ── Feature cards data ──
  const features = [
    { key: 'quoting', icon: '📝' },
    { key: 'workforce', icon: '👷' },
    { key: 'inventory', icon: '📊' },
    { key: 'scheduling', icon: '📋' },
    { key: 'contracts', icon: '📑' },
    { key: 'reporting', icon: '📁' },
  ];

  // ── Pricing packages ──
  const packages = ['small', 'medium', 'large', 'enterprise'];

  // ── Particles config ──
  const particles = [
    { left: '8%', dur: '7s', delay: '0s', size: 5 },
    { left: '18%', dur: '9s', delay: '1.5s', size: 3 },
    { left: '32%', dur: '6s', delay: '0.5s', size: 6 },
    { left: '45%', dur: '8s', delay: '2s', size: 4 },
    { left: '58%', dur: '10s', delay: '1s', size: 3 },
    { left: '72%', dur: '7s', delay: '3s', size: 5 },
    { left: '85%', dur: '8s', delay: '0.8s', size: 4 },
    { left: '92%', dur: '11s', delay: '2.5s', size: 3 },
  ];

  const fmt = useCallback((n) => '$' + n.toLocaleString(), []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* ════════════════════ STICKY NAV BAR ════════════════════ */}
      <header
        id="marketing-nav"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: scrolled ? '10px 0' : '16px 0',
          background: scrolled
            ? 'rgba(31, 33, 44, 0.85)'
            : 'rgba(31, 33, 44, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid transparent',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <nav
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Logo */}
          <Link
            href="/marketing"
            id="nav-logo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: 'var(--clr-text)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
              aria-hidden="true"
            >
              ⚡
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 'var(--fs-md)',
                letterSpacing: '-0.01em',
              }}
            >
              ElectricVision <span style={{ color: 'var(--clr-primary)' }}>Track</span>
            </span>
          </Link>

          {/* Center — Anchor links (hidden on small screens) */}
          <div
            style={{
              display: 'flex',
              gap: 28,
              alignItems: 'center',
            }}
            className="desktop-only"
          >
            {['features', 'savings', 'pricing'].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                id={`nav-link-${s}`}
                style={{
                  color: 'var(--clr-text-secondary)',
                  fontSize: 'var(--fs-base)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.target.style.color = 'var(--clr-primary)')}
                onMouseLeave={(e) => (e.target.style.color = 'var(--clr-text-secondary)')}
              >
                {t(`marketing.nav.${s}`)}
              </a>
            ))}
          </div>

          {/* Right — Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Language toggle */}
            <div
              role="group"
              aria-label={t('settings.language')}
              style={{ display: 'flex', gap: 2, marginRight: 8 }}
            >
              <button
                id="mkt-lang-en"
                onClick={() => setLocale('en')}
                className={`btn btn-sm ${locale === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={locale === 'en'}
                style={{ minWidth: 36, padding: '5px 8px', fontSize: 'var(--fs-xs)' }}
              >
                EN
              </button>
              <button
                id="mkt-lang-ro"
                onClick={() => setLocale('ro')}
                className={`btn btn-sm ${locale === 'ro' ? 'btn-primary' : 'btn-ghost'}`}
                aria-pressed={locale === 'ro'}
                style={{ minWidth: 36, padding: '5px 8px', fontSize: 'var(--fs-xs)' }}
              >
                RO
              </button>
            </div>

            <Link href="/login" id="nav-login" className="btn btn-ghost btn-sm">
              {t('marketing.nav.login')}
            </Link>
            <Link href="/register" id="nav-register" className="btn btn-primary btn-sm">
              {t('marketing.nav.authentication') || 'Authentication'}
            </Link>
          </div>
        </nav>
      </header>

      {/* ════════════════════ HERO SECTION ════════════════════ */}
      <section
        id="hero"
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '120px 24px 80px',
        }}
      >
        {/* Animated gradient background */}
        <div className="login-bg" aria-hidden="true" />

        {/* Floating electric particles */}
        <div aria-hidden="true">
          {particles.map((p, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: p.left,
                bottom: '-10px',
                width: `${p.size}px`,
                height: `${p.size}px`,
                borderRadius: '50%',
                background: 'var(--clr-primary)',
                boxShadow: '0 0 8px var(--clr-primary-glow), 0 0 20px var(--clr-primary-glow)',
                opacity: 0.7,
                zIndex: 0,
                animation: `floatUp ${p.dur} ease-in-out ${p.delay} infinite`,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: 800,
          }}
        >
          {/* Small badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--clr-primary-subtle)',
              border: '1px solid rgba(255,202,0,0.15)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 600,
              color: 'var(--clr-primary-light)',
              marginBottom: 28,
              animation: 'heroFadeIn 0.8s ease-out',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-primary)', display: 'inline-block' }} />
            Construction Management Platform
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 20,
              background: 'linear-gradient(135deg, var(--clr-primary) 0%, #FFD740 40%, var(--clr-text) 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'heroFadeIn 0.8s ease-out 0.1s both',
            }}
          >
            {t('marketing.hero.title')}
          </h1>

          {/* Subtitle */}
          <h2
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              fontWeight: 600,
              color: 'var(--clr-text-secondary)',
              marginBottom: 16,
              animation: 'heroFadeIn 0.8s ease-out 0.2s both',
            }}
          >
            {t('marketing.hero.subtitle')}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: 'var(--fs-lg)',
              color: 'var(--clr-text-muted)',
              lineHeight: 1.7,
              maxWidth: 620,
              margin: '0 auto 36px',
              animation: 'heroFadeIn 0.8s ease-out 0.3s both',
            }}
          >
            {t('marketing.hero.description')}
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              flexWrap: 'wrap',
              animation: 'heroFadeIn 0.8s ease-out 0.4s both',
            }}
          >
            <Link href="/register" id="hero-cta-register" className="btn btn-primary btn-lg">
              {t('marketing.nav.authentication') || 'Authentication'}
              <span aria-hidden="true" style={{ fontSize: 18 }}>→</span>
            </Link>
            <button id="hero-cta-demo" className="btn btn-secondary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              {t('marketing.hero.watchDemo')}
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          id="scroll-indicator"
          aria-label="Scroll to features"
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            animation: 'bounceDown 2s ease-in-out infinite',
            color: 'var(--clr-text-muted)',
            textDecoration: 'none',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>
      </section>

      {/* ════════════════════ FEATURES SECTION ════════════════════ */}
      <section
        id="features"
        ref={featuresRef}
        style={{
          position: 'relative',
          padding: '100px 24px',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              marginBottom: 12,
              opacity: featuresInView ? 1 : 0,
              transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {t('marketing.features.title')}
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-lg)',
              color: 'var(--clr-text-muted)',
              maxWidth: 560,
              margin: '0 auto',
              opacity: featuresInView ? 1 : 0,
              transform: featuresInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s',
            }}
          >
            {t('marketing.features.subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
          className="mkt-features-grid"
        >
          {features.map((f, i) => (
            <div
              key={f.key}
              id={`feature-card-${f.key}`}
              className="glass-card"
              style={{
                padding: 32,
                textAlign: 'center',
                cursor: 'default',
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.08}s`,
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--clr-primary-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  margin: '0 auto 20px',
                  border: '1px solid rgba(255,202,0,0.1)',
                }}
              >
                {f.icon}
              </div>

              <h3
                style={{
                  fontSize: 'var(--fs-xl)',
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                {t(`marketing.features.${f.key}.title`)}
              </h3>
              <p
                style={{
                  color: 'var(--clr-text-muted)',
                  fontSize: 'var(--fs-base)',
                  lineHeight: 1.65,
                }}
              >
                {t(`marketing.features.${f.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ SAVINGS ESTIMATOR ════════════════════ */}
      <section
        id="savings"
        ref={savingsRef}
        style={{
          position: 'relative',
          padding: '100px 24px',
          overflow: 'hidden',
        }}
      >
        {/* Accent glow background */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--clr-primary-glow) 0%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2
              style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                fontWeight: 800,
                marginBottom: 12,
                opacity: savingsInView ? 1 : 0,
                transform: savingsInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {t('marketing.savings.title')}
            </h2>
            <p
              style={{
                fontSize: 'var(--fs-lg)',
                color: 'var(--clr-text-muted)',
                maxWidth: 560,
                margin: '0 auto',
                opacity: savingsInView ? 1 : 0,
                transform: savingsInView ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s',
              }}
            >
              {t('marketing.savings.subtitle')}
            </p>
          </div>

          {/* Calculator Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
              alignItems: 'start',
            }}
            className="mkt-savings-grid"
          >
            {/* Left: Inputs */}
            <div
              className="glass-card"
              style={{
                padding: 32,
                opacity: savingsInView ? 1 : 0,
                transform: savingsInView ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--fs-xl)',
                  fontWeight: 700,
                  marginBottom: 28,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span aria-hidden="true">🧮</span> {t('marketing.savings.subtitle')}
              </h3>

              {/* Workers slider */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" htmlFor="calc-workers">
                  {t('marketing.savings.workersLabel')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input
                    id="calc-workers"
                    type="range"
                    min={1}
                    max={200}
                    value={workers}
                    onChange={(e) => setWorkers(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--clr-primary)',
                      height: 6,
                    }}
                  />
                  <input
                    id="calc-workers-num"
                    type="number"
                    className="form-input"
                    value={workers}
                    min={1}
                    max={200}
                    onChange={(e) => setWorkers(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                    style={{ width: 72, textAlign: 'center', padding: '8px 6px' }}
                  />
                </div>
              </div>

              {/* Hourly rate slider */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" htmlFor="calc-rate">
                  {t('marketing.savings.avgHourlyRate')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input
                    id="calc-rate"
                    type="range"
                    min={10}
                    max={100}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--clr-primary)',
                      height: 6,
                    }}
                  />
                  <input
                    id="calc-rate-num"
                    type="number"
                    className="form-input"
                    value={hourlyRate}
                    min={10}
                    max={100}
                    onChange={(e) => setHourlyRate(Math.max(10, Math.min(100, Number(e.target.value) || 10)))}
                    style={{ width: 72, textAlign: 'center', padding: '8px 6px' }}
                  />
                </div>
              </div>

              {/* Monthly hours slider */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="calc-hours">
                  {t('marketing.savings.monthlyHours')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input
                    id="calc-hours"
                    type="range"
                    min={40}
                    max={240}
                    value={monthlyHours}
                    onChange={(e) => setMonthlyHours(Number(e.target.value))}
                    style={{
                      flex: 1,
                      accentColor: 'var(--clr-primary)',
                      height: 6,
                    }}
                  />
                  <input
                    id="calc-hours-num"
                    type="number"
                    className="form-input"
                    value={monthlyHours}
                    min={40}
                    max={240}
                    onChange={(e) => setMonthlyHours(Math.max(40, Math.min(240, Number(e.target.value) || 40)))}
                    style={{ width: 72, textAlign: 'center', padding: '8px 6px' }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                opacity: savingsInView ? 1 : 0,
                transform: savingsInView ? 'translateX(0)' : 'translateX(30px)',
                transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s',
              }}
            >
              {/* Without EVT breakdown */}
              <div
                className="glass-card"
                style={{ padding: 24 }}
              >
                <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 16, color: 'var(--clr-danger-light)' }}>
                  ⚠️ {t('marketing.savings.withoutEVT')}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: t('marketing.savings.adminOverhead'), value: adminOverhead, pct: '12%' },
                    { label: t('marketing.savings.materialWaste'), value: materialWaste, pct: '8%' },
                    { label: t('marketing.savings.schedulingLoss'), value: schedulingLoss, pct: '5%' },
                    { label: t('marketing.savings.invoiceDelays'), value: invoiceDelays, pct: '4%' },
                    { label: t('marketing.savings.complianceFines'), value: complianceFines, pct: '2%' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'rgba(239, 68, 68, 0.06)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <span style={{ fontSize: 'var(--fs-base)', color: 'var(--clr-text-secondary)' }}>
                        {item.label}
                        <span style={{ color: 'var(--clr-text-muted)', fontSize: 'var(--fs-sm)', marginLeft: 6 }}>({item.pct})</span>
                      </span>
                      <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--clr-danger-light)' }}>
                        {fmt(Math.round(item.value))}
                      </span>
                    </div>
                  ))}

                  {/* Total losses divider */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 12px',
                      borderTop: '1px solid var(--clr-border)',
                      marginTop: 4,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 'var(--fs-md)' }}>
                      {t('marketing.savings.totalLosses')}
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 'var(--fs-xl)',
                        color: 'var(--clr-danger)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {fmt(Math.round(totalLosses))}
                    </span>
                  </div>
                </div>
              </div>

              {/* With EVT savings — big highlight */}
              <div
                className="glass-card"
                style={{
                  padding: 28,
                  border: '1px solid rgba(255,202,0,0.2)',
                  background: 'rgba(42, 44, 56, 0.8)',
                }}
              >
                <h4 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 16, color: 'var(--clr-success-light)' }}>
                  ✅ {t('marketing.savings.withEVT')}
                </h4>

                {/* Big savings number */}
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px 0',
                  }}
                >
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
                    {t('marketing.savings.annualSavings')}
                  </div>
                  <div
                    id="savings-total"
                    style={{
                      fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                      fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-success))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1.1,
                    }}
                  >
                    ${animatedSavings.toLocaleString()}
                  </div>
                </div>

                {/* Hours saved + Efficiency badge */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginTop: 8,
                  }}
                >
                  <div
                    id="hours-saved-badge"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(6, 147, 227, 0.1)',
                      border: '1px solid rgba(6, 147, 227, 0.15)',
                      color: 'var(--clr-accent)',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                    }}
                  >
                    ⏱️ {t('marketing.savings.timeSaved')}: {hoursSaved.toLocaleString()} hrs
                  </div>
                  <div
                    id="efficiency-badge"
                    style={{
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.15)',
                      color: 'var(--clr-success)',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 600,
                    }}
                  >
                    📈 ~20% {t('marketing.savings.efficiencyGain')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ PRICING SECTION ════════════════════ */}
      <section
        id="pricing"
        ref={pricingRef}
        style={{
          position: 'relative',
          padding: '100px 24px',
          maxWidth: 1320,
          margin: '0 auto',
        }}
      >
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 800,
              marginBottom: 12,
              opacity: pricingInView ? 1 : 0,
              transform: pricingInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            {t('marketing.pricing.title')}
          </h2>
          <p
            style={{
              fontSize: 'var(--fs-lg)',
              color: 'var(--clr-text-muted)',
              maxWidth: 560,
              margin: '0 auto',
              opacity: pricingInView ? 1 : 0,
              transform: pricingInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s',
            }}
          >
            {t('marketing.pricing.subtitle')}
          </p>
        </div>

        {/* Pricing grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            alignItems: 'start',
          }}
          className="mkt-pricing-grid"
        >
          {packages.map((pkg, i) => {
            const isPopular = pkg === 'medium';
            return (
              <div
                key={pkg}
                id={`pricing-card-${pkg}`}
                className="glass-card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isPopular
                    ? '2px solid var(--clr-primary)'
                    : '1px solid var(--glass-border)',
                  boxShadow: isPopular
                    ? '0 0 40px var(--clr-primary-glow), 0 8px 32px rgba(0,0,0,0.3)'
                    : 'none',
                  transform: isPopular ? 'scale(1.03)' : 'none',
                  position: 'relative',
                  opacity: pricingInView ? 1 : 0,
                  transition: `opacity 0.5s ease ${0.15 + i * 0.08}s, transform 0.5s ease ${0.15 + i * 0.08}s`,
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark))',
                      color: '#1F212C',
                      textAlign: 'center',
                      padding: '6px 0',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    ⭐ {t('marketing.pricing.popular')}
                  </div>
                )}

                <div style={{ padding: '28px 24px' }}>
                  {/* Package name */}
                  <h3
                    style={{
                      fontSize: 'var(--fs-2xl)',
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    {t(`marketing.pricing.packages.${pkg}.name`)}
                  </h3>
                  <div
                    style={{
                      fontSize: 'var(--fs-sm)',
                      color: 'var(--clr-text-muted)',
                      marginBottom: 12,
                    }}
                  >
                    {t(`marketing.pricing.packages.${pkg}.users`)}
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--fs-base)',
                      color: 'var(--clr-text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: 24,
                      minHeight: 44,
                    }}
                  >
                    {t(`marketing.pricing.packages.${pkg}.description`)}
                  </p>

                  {/* Price breakdown by role */}
                  <div
                    style={{
                      borderTop: '1px solid var(--clr-border)',
                      paddingTop: 20,
                      marginBottom: 24,
                    }}
                  >
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      {t('marketing.pricing.perUser')} {t('marketing.pricing.perMonth')}
                    </div>
                    {[
                      { role: 'owner', priceKey: 'priceOwner' },
                      { role: 'manager', priceKey: 'priceManager' },
                      { role: 'supervisor', priceKey: 'priceSupervisor' },
                      { role: 'worker', priceKey: 'priceWorker' },
                    ].map((r) => (
                      <div
                        key={r.role}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '7px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}
                      >
                        <span style={{ fontSize: 'var(--fs-base)', color: 'var(--clr-text-secondary)' }}>
                          {t(`marketing.pricing.roleLabels.${r.role}`)}
                        </span>
                        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--clr-text)' }}>
                          {t(`marketing.pricing.packages.${pkg}.${r.priceKey}`)}
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', fontWeight: 400 }}>
                            {t('marketing.pricing.perMonth')}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {pkg === 'enterprise' ? (
                    <Link
                      href={`/register?package=${pkg}`}
                      id={`pricing-cta-${pkg}`}
                      className="btn btn-secondary btn-lg"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {t('marketing.pricing.contactSales')}
                    </Link>
                  ) : (
                    <Link
                      href={`/register?package=${pkg}`}
                      id={`pricing-cta-${pkg}`}
                      className={`btn ${isPopular ? 'btn-primary' : 'btn-secondary'} btn-lg`}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {t('marketing.pricing.getStarted')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* All features badge */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 48,
          }}
        >
          <div
            className="glass-card"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 24,
              padding: '20px 36px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 'var(--fs-lg)',
                color: 'var(--clr-primary)',
              }}
            >
              ✅ {t('marketing.pricing.allFeatures')}
            </span>
            {['Quotes', 'Contracts', 'Timesheets', 'Inventory', 'Kanban', 'Calendar', 'Files', 'OCR'].map((feat) => (
              <span
                key={feat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 'var(--fs-sm)',
                  color: 'var(--clr-text-secondary)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer
        id="marketing-footer"
        style={{
          borderTop: '1px solid var(--clr-border)',
          padding: '40px 24px',
          background: 'var(--clr-bg-deep)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Left: Logo + copyright */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
              aria-hidden="true"
            >
              ⚡
            </span>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)' }}>
              {t('marketing.footer.copyright')}
            </span>
          </div>

          {/* Right: Links */}
          <div style={{ display: 'flex', gap: 24 }}>
            <a
              href="#"
              id="footer-privacy"
              style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--clr-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--clr-text-muted)')}
            >
              {t('marketing.footer.privacy')}
            </a>
            <a
              href="#"
              id="footer-terms"
              style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--clr-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--clr-text-muted)')}
            >
              {t('marketing.footer.terms')}
            </a>
            <a
              href="#"
              id="footer-contact"
              style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--clr-primary)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--clr-text-muted)')}
            >
              {t('marketing.footer.contact')}
            </a>
          </div>
        </div>
      </footer>

      {/* ════════════════════ GLOBAL STYLES ════════════════════ */}
      <style jsx global>{`
        /* Floating particles animation (from login page) */
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

        /* Hero content fade-in */
        @keyframes heroFadeIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Scroll indicator bounce */
        @keyframes bounceDown {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(12px);
          }
          60% {
            transform: translateX(-50%) translateY(6px);
          }
        }

        /* ── Responsive grids ── */
        @media (max-width: 1024px) {
          .mkt-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mkt-pricing-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .mkt-savings-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .mkt-features-grid {
            grid-template-columns: 1fr !important;
          }
          .mkt-pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Hover effects for feature cards */
        #feature-card-quoting:hover,
        #feature-card-workforce:hover,
        #feature-card-inventory:hover,
        #feature-card-scheduling:hover,
        #feature-card-contracts:hover,
        #feature-card-reporting:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px var(--clr-primary-glow);
          border-color: rgba(255, 202, 0, 0.15) !important;
        }

        /* Pricing card hover */
        .mkt-pricing-grid .glass-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        /* Range input styling */
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: var(--clr-bg-elevated);
          border-radius: var(--radius-full);
          outline: none;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
          cursor: pointer;
          box-shadow: 0 0 8px var(--clr-primary-glow);
          border: 2px solid var(--clr-bg-deep);
          transition: box-shadow 0.15s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px var(--clr-primary-glow), 0 0 4px var(--clr-primary);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--clr-primary), var(--clr-primary-dark));
          cursor: pointer;
          box-shadow: 0 0 8px var(--clr-primary-glow);
          border: 2px solid var(--clr-bg-deep);
        }

        /* Smooth scroll for the whole page */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
