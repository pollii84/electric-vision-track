import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const { tenantId, workerId, email, displayName, role, experienceLevel, invitedBy } =
    await request.json();

  if (!tenantId || !email || !invitedBy) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let uid;
  try {
    const userRecord = await adminAuth.createUser({ email, displayName });
    uid = userRecord.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    } else {
      console.error('Firebase Auth createUser error:', err);
      return Response.json({ error: err.message, code: err.code }, { status: 500 });
    }
  }

  try {
    const batch = adminDb.batch();

    batch.set(
      adminDb.doc(`users/${uid}`),
      { uid, email, displayName, role, experienceLevel, tenantId, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    batch.set(
      adminDb.doc(`tenants/${tenantId}/members/${uid}`),
      { uid, email, displayName, role, experienceLevel, invitedBy, joinedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    if (workerId) {
      batch.update(adminDb.doc(`tenants/${tenantId}/workers/${workerId}`), {
        authUid: uid,
        inviteStatus: 'pending',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (err) {
    console.error('Firestore batch error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }

  return Response.json({ uid, success: true });
}
