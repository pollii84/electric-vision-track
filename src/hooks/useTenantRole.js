'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { onTenantDocSnapshot } from '@/lib/firestore';

// user.role (AuthContext) sources the global users/{uid} doc; the Firestore
// rules (isTenantManager) check the tenant-member doc instead — a different
// document, kept in sync only by the invite flow. UI gating for anything the
// rules actually enforce must read the same source the rules read.
export function useTenantRole() {
  const { tenantId, user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !user?.uid) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onTenantDocSnapshot(tenantId, 'members', user.uid, (data) => {
      setRole(data?.role || null);
      setLoading(false);
    });
    return unsub;
  }, [tenantId, user?.uid]);

  return {
    role,
    loading,
    isManager: role === 'owner' || role === 'manager',
    isOwner: role === 'owner',
  };
}
