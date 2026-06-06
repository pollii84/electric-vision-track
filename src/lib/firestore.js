'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Tenant-scoped collection reference ──
export function tenantCollection(tenantId, collectionName) {
  return collection(db, 'tenants', tenantId, collectionName);
}

// ── Tenant-scoped document reference ──
export function tenantDoc(tenantId, collectionName, docId) {
  return doc(db, 'tenants', tenantId, collectionName, docId);
}

// ── CRUD Operations ──

// Get a single document
export async function getTenantDoc(tenantId, collectionName, docId) {
  const docRef = tenantDoc(tenantId, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

// Get all documents in a collection (with optional filters)
// filters: array of { field, op, value } objects
// sort: { field, direction } object
// limitCount: number
export async function getTenantCollection(tenantId, collectionName, { filters = [], sort = null, limitCount = null } = {}) {
  let q = tenantCollection(tenantId, collectionName);
  
  const constraints = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (sort) {
    constraints.push(orderBy(sort.field, sort.direction || 'asc'));
  }
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Add a new document (auto-generated ID)
export async function addTenantDoc(tenantId, collectionName, data) {
  const colRef = tenantCollection(tenantId, collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// Set a document with a specific ID
export async function setTenantDoc(tenantId, collectionName, docId, data, merge = true) {
  const docRef = tenantDoc(tenantId, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
  return docId;
}

// Update a document (partial update)
export async function updateTenantDoc(tenantId, collectionName, docId, data) {
  const docRef = tenantDoc(tenantId, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return docId;
}

// Delete a document
export async function deleteTenantDoc(tenantId, collectionName, docId) {
  const docRef = tenantDoc(tenantId, collectionName, docId);
  await deleteDoc(docRef);
  return docId;
}

// Real-time listener for a collection
export function onTenantCollectionSnapshot(tenantId, collectionName, callback, { filters = [], sort = null } = {}) {
  let q = tenantCollection(tenantId, collectionName);
  
  const constraints = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (sort) {
    constraints.push(orderBy(sort.field, sort.direction || 'asc'));
  }
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

// Real-time listener for a single document
export function onTenantDocSnapshot(tenantId, collectionName, docId, callback) {
  const docRef = tenantDoc(tenantId, collectionName, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
}

// Batch write helper
export async function batchWriteTenantDocs(tenantId, collectionName, operations) {
  const batch = writeBatch(db);
  
  for (const op of operations) {
    const docRef = op.id
      ? tenantDoc(tenantId, collectionName, op.id)
      : doc(tenantCollection(tenantId, collectionName));
    
    if (op.type === 'set') {
      batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() }, { merge: op.merge ?? true });
    } else if (op.type === 'update') {
      batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() });
    } else if (op.type === 'delete') {
      batch.delete(docRef);
    }
  }
  
  await batch.commit();
}

// ── Global (non-tenant-scoped) helpers ──

export async function getGlobalDoc(collectionName, docId) {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function setGlobalDoc(collectionName, docId, data, merge = true) {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge });
  return docId;
}

export async function getGlobalCollection(collectionName, { filters = [], sort = null, limitCount = null } = {}) {
  let q = collection(db, collectionName);
  
  const constraints = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (sort) {
    constraints.push(orderBy(sort.field, sort.direction || 'asc'));
  }
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function onGlobalCollectionSnapshot(collectionName, callback, { filters = [], sort = null } = {}) {
  let q = collection(db, collectionName);
  
  const constraints = [];
  for (const f of filters) {
    constraints.push(where(f.field, f.op, f.value));
  }
  if (sort) {
    constraints.push(orderBy(sort.field, sort.direction || 'asc'));
  }
  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(docs);
  });
}

// ── Utility exports ──
export { serverTimestamp, writeBatch, db };
