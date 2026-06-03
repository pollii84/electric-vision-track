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

// ── localStorage account store helpers ──
const ACCOUNTS_KEY = 'ev-accounts';
const SESSION_KEY = 'ev-session';

// Pre-seeded test account
const TEST_ACCOUNT = {
  id: 'account-test-moga',
  company: {
    name: 'MOGA_PAUL_PFA',
    cui: 'RO12345678',
    euid: 'ROONRC.J12/1234/2024',
  },
  user: {
    name: 'Paul Paul',
    email: 'polimoga@gmail.com',
    phone: '+40700000000',
  },
  role: 'owner',
  password: 'test1234',
  createdAt: new Date().toISOString(),
};

function getStoredAccounts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const accounts = raw ? JSON.parse(raw) : [];
    // Ensure test account is always present
    const hasTest = accounts.some((a) => a.id === TEST_ACCOUNT.id);
    if (!hasTest) {
      accounts.push(TEST_ACCOUNT);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    }
    return accounts;
  } catch {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([TEST_ACCOUNT]));
    return [TEST_ACCOUNT];
  }
}

function saveAccounts(accounts) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (typeof window === 'undefined') return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// ── Demo / Firebase mode detection ──
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
      // Demo mode: restore session from localStorage
      const session = getSession();
      if (session) {
        setUser(session);
      }
      // Ensure test account exists in store
      getStoredAccounts();
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

  // ── Create Account (registration) ──
  // Creates a new account with company details and user details.
  // Automatically assigns "owner" role.
  const createAccount = useCallback(async ({ company, user: userDetails, password }) => {
    if (isDemo) {
      const accounts = getStoredAccounts();

      // Check if email already exists
      const existing = accounts.find(
        (a) => a.user.email.toLowerCase() === userDetails.email.toLowerCase()
      );
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const newAccount = {
        id: `account-${Date.now()}`,
        company: {
          name: company.name,
          cui: company.cui,
          euid: company.euid,
        },
        user: {
          name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone || '',
        },
        role: 'owner', // Auto-assign owner
        password: password,
        createdAt: new Date().toISOString(),
      };

      accounts.push(newAccount);
      saveAccounts(accounts);

      // Auto-login after registration
      const sessionUser = {
        uid: newAccount.id,
        email: newAccount.user.email,
        displayName: newAccount.user.name,
        role: 'owner',
        company: newAccount.company,
      };
      setUser(sessionUser);
      saveSession(sessionUser);
      return sessionUser;
    }

    // Firebase mode
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, userDetails.email, password);
      if (userDetails.name) {
        await updateProfile(result.user, { displayName: userDetails.name });
      }
      const role = await ensureUserDocument(result.user, 'owner');
      const userData = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: userDetails.name || result.user.displayName,
        photoURL: result.user.photoURL,
        role,
        company: {
          name: company.name,
          cui: company.cui,
          euid: company.euid,
        },
      };
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [isDemo]);

  // ── Login with Email (no 2FA) ──
  const loginWithEmail = useCallback(async (email, password) => {
    if (isDemo) {
      const accounts = getStoredAccounts();
      const account = accounts.find(
        (a) => a.user.email.toLowerCase() === email.toLowerCase()
      );

      if (!account) {
        throw new Error('No account found with this email. Please create an account first.');
      }

      if (account.password !== password) {
        throw new Error('Invalid password. Please try again.');
      }

      const sessionUser = {
        uid: account.id,
        email: account.user.email,
        displayName: account.user.name,
        role: account.role,
        company: account.company,
      };
      setUser(sessionUser);
      saveSession(sessionUser);
      return sessionUser;
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

  const loginWithGoogle = useCallback(async () => {
    if (isDemo) {
      // In demo mode, create a generic demo owner session
      const sessionUser = {
        uid: 'demo-google',
        email: 'owner@electricvision.eu',
        displayName: 'Demo Owner',
        role: 'owner',
        company: { name: 'Demo Company', cui: '', euid: '' },
      };
      setUser(sessionUser);
      saveSession(sessionUser);
      return sessionUser;
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

  // Legacy signup — redirects to createAccount with minimal company info
  const signUpWithEmail = useCallback(async (email, password, displayName) => {
    return createAccount({
      company: { name: 'My Company', cui: '', euid: '' },
      user: { name: displayName || '', email, phone: '' },
      password,
    });
  }, [createAccount]);

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
      saveSession(null);
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
    createAccount,
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
