'use client';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TenantProvider } from '@/contexts/TenantContext';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <TenantProvider>
            {children}
          </TenantProvider>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
