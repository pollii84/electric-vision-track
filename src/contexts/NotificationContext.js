'use client';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeNotifications,
  markNotificationRead,
  markAllRead,
} from '@/lib/notifications';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user, tenantId } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!tenantId || !user?.uid) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeNotifications(tenantId, user.uid, setNotifications);
    return unsub;
  }, [tenantId, user?.uid]);

  const markRead = useCallback(
    (notifId) => markNotificationRead(tenantId, notifId),
    [tenantId]
  );

  const markAll = useCallback(
    () => markAllRead(tenantId, notifications),
    [tenantId, notifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
