'use client';

import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--sp-xl) 0' }}>
        <h1 style={{ marginBottom: 'var(--sp-md)' }}>
          {t('marketing.footer.terms')}
        </h1>
        <p className="text-muted">
          Our Terms of Service are currently being finalized. Please check back soon.
        </p>
      </div>
    </Layout>
  );
}
