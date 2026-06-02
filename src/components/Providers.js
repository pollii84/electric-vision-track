'use client';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { BusinessProvider } from '@/contexts/BusinessContext';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <BusinessProvider>
            {children}
          </BusinessProvider>
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
