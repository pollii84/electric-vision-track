'use client';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const INVITE_TTL_DAYS = 7;

export async function createInvite(tenantId, workerId, workerData, invitedByUid) {
  const token = crypto.randomUUID();
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)
  );

  await setDoc(doc(db, 'invites', token), {
    token,
    tenantId,
    workerId,
    email: workerData.email || '',
    displayName: `${workerData.firstName} ${workerData.lastName}`.trim(),
    role: workerData.experienceLevel === 'manager' ? 'manager' : 'worker',
    experienceLevel: workerData.experienceLevel || 'junior',
    invitedBy: invitedByUid,
    createdAt: serverTimestamp(),
    expiresAt,
    status: 'pending',
    acceptedBy: null,
    usedAt: null,
  });

  await updateDoc(doc(db, 'tenants', tenantId, 'workers', workerId), {
    inviteToken: token,
    inviteStatus: 'pending',
    updatedAt: serverTimestamp(),
  });

  return token;
}

export async function getInvite(token) {
  const snap = await getDoc(doc(db, 'invites', token));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function acceptInvite(token, uid) {
  const invite = await getInvite(token);
  if (!invite) throw new Error('invite_not_found');
  if (invite.status !== 'pending') throw new Error('invite_already_used');

  const expiresAt = invite.expiresAt?.toDate?.() ?? new Date(invite.expiresAt);
  if (new Date() > expiresAt) throw new Error('invite_expired');

  await updateDoc(doc(db, 'invites', token), {
    status: 'accepted',
    acceptedBy: uid,
    usedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'tenants', invite.tenantId, 'workers', invite.workerId), {
    authUid: uid,
    inviteStatus: 'accepted',
    updatedAt: serverTimestamp(),
  });

  return invite;
}
