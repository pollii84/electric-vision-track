import {
  addTenantDoc,
  updateTenantDoc,
  batchWriteTenantDocs,
  onTenantCollectionSnapshot,
} from '@/lib/firestore';

export function createNotification(tenantId, { recipientUid, type, title, body, link = null }) {
  return addTenantDoc(tenantId, 'notifications', {
    recipientUid,
    type,
    title,
    body,
    link,
    read: false,
  });
}

export function markNotificationRead(tenantId, notifId) {
  return updateTenantDoc(tenantId, 'notifications', notifId, { read: true });
}

export function markAllRead(tenantId, notifications) {
  const unread = notifications.filter((n) => !n.read);
  if (!unread.length) return Promise.resolve();
  return batchWriteTenantDocs(
    tenantId,
    'notifications',
    unread.map((n) => ({ type: 'update', id: n.id, data: { read: true } }))
  );
}

export function subscribeNotifications(tenantId, recipientUid, callback) {
  return onTenantCollectionSnapshot(tenantId, 'notifications', callback, {
    filters: [{ field: 'recipientUid', op: '==', value: recipientUid }],
    sort: { field: 'createdAt', direction: 'desc' },
  });
}
