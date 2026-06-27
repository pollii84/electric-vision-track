import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const { uid } = await request.json();
  if (!uid) return Response.json({ error: 'Missing uid' }, { status: 400 });

  try {
    const userSnap = await adminDb.doc(`users/${uid}`).get();
    if (!userSnap.exists) return Response.json({ error: 'No profile' }, { status: 404 });

    const { tenantId } = userSnap.data();
    if (!tenantId) return Response.json({ error: 'No profile' }, { status: 404 });

    const workersSnap = await adminDb
      .collection(`tenants/${tenantId}/workers`)
      .where('authUid', '==', uid)
      .limit(1)
      .get();

    if (workersSnap.empty) {
      return Response.json({ success: true, alreadyActive: false });
    }

    const workerDoc = workersSnap.docs[0];
    const workerData = workerDoc.data();

    if (workerData.inviteStatus !== 'pending') {
      return Response.json({ success: true, alreadyActive: true });
    }

    await workerDoc.ref.update({
      inviteStatus: 'active',
      acceptedAt: FieldValue.serverTimestamp(),
    });

    if (workerData.invitedBy) {
      const workerName = [workerData.firstName, workerData.lastName].filter(Boolean).join(' ') || 'A worker';
      await adminDb.collection(`tenants/${tenantId}/notifications`).add({
        recipientUid: workerData.invitedBy,
        type: 'invite_accepted',
        title: 'Invite accepted',
        body: `${workerName} has joined your team.`,
        link: '/workers',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return Response.json({ success: true, alreadyActive: false });
  } catch (err) {
    console.error('Invite accept error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
