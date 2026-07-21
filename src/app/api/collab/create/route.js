import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request) {
  const { ownerTenantId, siteId, contractorTenantId, createdBy } = await request.json();

  if (!ownerTenantId || !siteId || !contractorTenantId || !createdBy) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (ownerTenantId === contractorTenantId) {
    return Response.json({ error: 'Cannot link a company to itself' }, { status: 400 });
  }

  try {
    const siteSnap = await adminDb.doc(`tenants/${ownerTenantId}/sites/${siteId}`).get();
    if (!siteSnap.exists) return Response.json({ error: 'Site not found' }, { status: 404 });
    const site = siteSnap.data();

    // Idempotency: return early if active link already exists
    const existingSnap = await adminDb
      .collection('collaborations')
      .where('ownerTenantId', '==', ownerTenantId)
      .where('siteId', '==', siteId)
      .where('contractorTenantId', '==', contractorTenantId)
      .where('status', '==', 'active')
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      return Response.json({ success: true, alreadyExists: true });
    }

    const [ownerSnap, contractorSnap] = await Promise.all([
      adminDb.doc(`tenants/${ownerTenantId}`).get(),
      adminDb.doc(`tenants/${contractorTenantId}`).get(),
    ]);
    const ownerCompanyName = ownerSnap.data()?.company?.name || 'Unknown company';
    const contractorName = contractorSnap.data()?.company?.name || 'Unknown company';

    const collabRef = await adminDb.collection('collaborations').add({
      ownerTenantId,
      ownerCompanyName,
      siteId,
      siteName: site.name,
      contractorTenantId,
      contractorName,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
      createdBy,
    });

    await adminDb.doc(`tenants/${ownerTenantId}/sites/${siteId}`).update({
      contractorTenantIds: FieldValue.arrayUnion(contractorTenantId),
    });

    await adminDb.collection(`tenants/${contractorTenantId}/notifications`).add({
      recipientUid: contractorTenantId,
      type: 'collaboration_added',
      title: 'New collaboration',
      body: `${ownerCompanyName} added you as a contractor on site "${site.name}".`,
      link: '/collaborations',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    return Response.json({ success: true, collabId: collabRef.id });
  } catch (err) {
    console.error('Collab create error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
