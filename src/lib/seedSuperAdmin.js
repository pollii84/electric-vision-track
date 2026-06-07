/**
 * Superadmin Seeder Script
 * 
 * Run this ONCE after registering polimoga@gmail.com to grant superadmin access.
 * 
 * Usage:
 *   1. Sign in as polimoga@gmail.com through the app UI first.
 *   2. Open the browser DevTools console on any app page.
 *   3. Paste and run this script — OR use the Firebase Console to manually
 *      create the document described below.
 * 
 * Manual alternative (Firebase Console):
 *   Collection: config
 *   Document ID: superadmins
 *   Field: admins (array) → add the UID of polimoga@gmail.com
 * 
 * The UID can be found in:
 *   Firebase Console → Authentication → Users → find polimoga@gmail.com → copy UID
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Seeds the superadmin document.
 * Call this with the UID of polimoga@gmail.com after their first login.
 * 
 * @param {string} uid - The Firebase Auth UID of polimoga@gmail.com
 */
export async function seedSuperAdmin(uid) {
  if (!uid) throw new Error('UID is required');

  await setDoc(
    doc(db, 'config', 'superadmins'),
    { admins: [uid] },
    { merge: true }  // merge: true so we can add more admins later without overwriting
  );

  console.log(`✅ Superadmin seeded: UID ${uid} added to config/superadmins`);
}
