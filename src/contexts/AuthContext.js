'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

const AuthContext = createContext();

// ── Firestore helpers ──
async function fetchUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function checkSuperAdmin(uid) {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'superadmins'));
    if (configDoc.exists()) {
      const { admins = [] } = configDoc.data();
      return admins.includes(uid);
    }
    return false;
  } catch (error) {
    console.error('Error checking superadmin:', error);
    return false;
  }
}

async function ensureUserDocument(firebaseUser, { role = 'owner', tenantId = null, company = null, phone = '' } = {}) {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        role,
        tenantId,
        phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { role, tenantId };
    }
    
    return {
      role: userDoc.data().role || 'worker',
      tenantId: userDoc.data().tenantId,
    };
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return { role, tenantId };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const profile = await fetchUserProfile(firebaseUser.uid);
        const isAdmin = await checkSuperAdmin(firebaseUser.uid);

        if (profile) {
          fetch('/api/invite/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: firebaseUser.uid }),
          }).catch((e) => console.error('Invite accept call failed:', e));
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || profile?.displayName || '',
          photoURL: firebaseUser.photoURL,
          role: profile?.role || 'worker',
          tenantId: profile?.tenantId || null,
          phone: profile?.phone || '',
        });
        setTenantId(profile?.tenantId || null);
        setIsSuperAdmin(isAdmin);
      } else {
        setUser(null);
        setTenantId(null);
        setIsSuperAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Create Account (Registration) ──
  const createAccount = useCallback(async ({ company, user: userDetails, password }) => {
    setError(null);
    try {
      // 1. Create Firebase Auth user
      const result = await createUserWithEmailAndPassword(auth, userDetails.email, password);
      
      // 2. Set display name
      if (userDetails.name) {
        await updateProfile(result.user, { displayName: userDetails.name });
      }

      // 3. Create tenant document
      const tenantRef = doc(db, 'tenants', result.user.uid); // Use uid as tenant ID for owner
      await setDoc(tenantRef, {
        name: company.name,
        cui: company.cui || '',
        euid: company.euid || '',
        address: company.address || '',
        caen: company.caen || '',
        registrationDate: company.registrationDate || '',
        legalForm: company.legalForm || '',
        ownerId: result.user.uid,
        plan: 'small',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. Create user document (maps user to tenant)
      const newTenantId = result.user.uid;
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: userDetails.email,
        displayName: userDetails.name || '',
        role: 'owner',
        tenantId: newTenantId,
        phone: userDetails.phone || '',
        companyAddress: company.address || '',
        companyCaen: company.caen || '',
        companyRegistrationDate: company.registrationDate || '',
        companyLegalForm: company.legalForm || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 5. Create member document within tenant
      await setDoc(doc(db, 'tenants', newTenantId, 'members', result.user.uid), {
        uid: result.user.uid,
        email: userDetails.email,
        displayName: userDetails.name || '',
        role: 'owner',
        phone: userDetails.phone || '',
        invitedBy: null,
        joinedAt: serverTimestamp(),
      });

      // 6. Seed default company data (divisions, workers, sites, contacts, stocks) - Disabled for clean slate start

      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: userDetails.name || result.user.displayName,
        photoURL: result.user.photoURL,
        role: 'owner',
        tenantId: newTenantId,
        phone: userDetails.phone || '',
      };

      setUser(userData);
      setTenantId(newTenantId);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── Login with Email ──
  const loginWithEmail = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Profile loading is handled by onAuthStateChanged
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── Login with Google ──
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user already has a profile
      const profile = await fetchUserProfile(result.user.uid);
      
      if (!profile) {
        // First-time Google sign-in: create minimal user doc
        // They'll need to complete registration or be invited to a tenant
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || '',
          role: 'worker',
          tenantId: null,
          phone: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      
      return result.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── Password Reset ──
  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    setError(null);
    try {
      await signOut(auth);
      setUser(null);
      setTenantId(null);
      setIsSuperAdmin(false);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    tenantId,
    isSuperAdmin,
    createAccount,
    loginWithGoogle,
    loginWithEmail,
    resetPassword,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { AuthContext };
