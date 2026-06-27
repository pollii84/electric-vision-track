'use client';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function Providers({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <TenantProvider>
              {children}
            </TenantProvider>
          </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
