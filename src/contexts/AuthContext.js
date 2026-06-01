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

const DEMO_USER = {
  uid: 'demo-admin',
  email: 'admin@electricvision.eu',
  displayName: 'Demo Admin',
  role: 'admin',
};

function isDemoMode() {
  try {
    return auth.app.options.apiKey === 'YOUR_API_KEY';
  } catch {
    return true;
  }
}

async function fetchUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role || 'worker';
    }
    return 'worker';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'worker';
  }
}

async function ensureUserDocument(firebaseUser, role = 'worker') {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return userDoc.exists() ? userDoc.data().role : role;
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return role;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDemo = isDemoMode();

  // Initialize auth state
  useEffect(() => {
    if (isDemo) {
      // Demo mode: auto-login with mock user
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const role = await fetchUserRole(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemo]);

  const loginWithGoogle = useCallback(async () => {
    if (isDemo) {
      setUser(DEMO_USER);
      return DEMO_USER;
    }

    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const role = await ensureUserDocument(result.user);
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role,
      };
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  const loginWithEmail = useCallback(async (email, password) => {
    if (isDemo) {
      setUser(DEMO_USER);
      return DEMO_USER;
    }

    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const role = await fetchUserRole(result.user.uid);
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        role,
      };
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    if (isDemo) {
      const demoNewUser = { ...DEMO_USER, email, displayName: displayName || email };
      setUser(demoNewUser);
      return demoNewUser;
    }

    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      const role = await ensureUserDocument(result.user, 'worker');
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || result.user.displayName,
        photoURL: result.user.photoURL,
        role,
      };
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  const resetPassword = useCallback(async (email) => {
    if (isDemo) {
      return; // No-op in demo mode
    }

    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  const logout = useCallback(async () => {
    if (isDemo) {
      setUser(null);
      return;
    }

    setError(null);
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    isDemo,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
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
