import { adminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  const { email } = await request.json();
  if (!email) return Response.json({ error: 'Missing email' }, { status: 400 });

  try {
    const usersSnap = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnap.empty) return Response.json({ error: 'No company found' }, { status: 404 });

    const userData = usersSnap.docs[0].data();
    const { tenantId } = userData;
    if (!tenantId) return Response.json({ error: 'No company found' }, { status: 404 });

    const tenantSnap = await adminDb.doc(`tenants/${tenantId}`).get();
    if (!tenantSnap.exists) return Response.json({ error: 'No company found' }, { status: 404 });

    const tenant = tenantSnap.data();
    return Response.json({
      tenantId,
      companyName: tenant.company?.name || 'Unknown company',
    });
  } catch (err) {
    console.error('Collab resolve error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
