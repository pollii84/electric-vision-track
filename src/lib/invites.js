'use client';

import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export async function createInvite(tenantId, workerId, workerData, invitedByUid) {
  const displayName = `${workerData.firstName} ${workerData.lastName}`.trim();
  const role = workerData.experienceLevel === 'manager' ? 'manager' : 'worker';

  const res = await fetch('/api/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantId,
      workerId,
      email: workerData.email,
      displayName,
      role,
      experienceLevel: workerData.experienceLevel || 'junior',
      invitedBy: invitedByUid,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create invite');
  }

  const { uid } = await res.json();

  await sendPasswordResetEmail(auth, workerData.email, {
    url: `${window.location.origin}/login?invited=1`,
    handleCodeInApp: false,
  });

  return uid;
}
