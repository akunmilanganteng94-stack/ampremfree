import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyAnpQI0yjGZyMMaIwEE5dmCXY4KOlYpZcg",
  authDomain: "ampremfree-566f5.firebaseapp.com",
  projectId: "ampremfree-566f5",
  storageBucket: "ampremfree-566f5.firebasestorage.app",
  messagingSenderId: "689150866648",
  appId: "1:689150866648:web:ada1d2f1fafd65f0bc53ad",
  measurementId: "G-XQ3Y688Y65"
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Whitelisted Super Admin Emails
export const PRIMARY_ADMIN_EMAIL = 'apriliazril67@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'azryl123';
export const SUPER_ADMIN_EMAILS = [
  'apriliazril67@gmail.com',
  'apriliansyahazril10@gmail.com'
];

// Connection test helper
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Offline or network check required.');
    }
    return false;
  }
}

// Error handling helper required by Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Save or sync admin document to Firestore
export async function syncAdminToFirestore(email: string, uid: string) {
  try {
    const adminRef = doc(db, 'admins', uid);
    await setDoc(adminRef, {
      email: email.toLowerCase(),
      role: 'super_admin',
      authorized: true,
      lastLogin: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore sync admin record info:', err);
  }
}

// Robust Email/Password Admin Login & Registration
export async function loginOrRegisterAdmin(email: string, pass: string): Promise<{ success: boolean; user?: any; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // Validate admin authorization eligibility
  const isWhitelisted = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === cleanEmail);
  if (!isWhitelisted) {
    return {
      success: false,
      error: `Akses ditolak. Email [${cleanEmail}] bukan administrator resmi AZRYLPREM.`
    };
  }

  // 1. Attempt standard Firebase Auth sign-in
  try {
    const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    await syncAdminToFirestore(cleanEmail, result.user.uid);
    sessionStorage.setItem('azryl_admin_email', cleanEmail);
    sessionStorage.setItem('azryl_admin_uid', result.user.uid);
    return { success: true, user: result.user };
  } catch (signErr: any) {
    console.warn('[Firebase Auth] Sign in notice:', signErr.code, signErr.message);

    // If user does not exist in Firebase Auth yet, automatically register the admin account!
    if (signErr.code === 'auth/user-not-found' || signErr.code === 'auth/invalid-credential' || signErr.code === 'auth/invalid-login-credentials') {
      try {
        const createResult = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        await syncAdminToFirestore(cleanEmail, createResult.user.uid);
        sessionStorage.setItem('azryl_admin_email', cleanEmail);
        sessionStorage.setItem('azryl_admin_uid', createResult.user.uid);
        return { success: true, user: createResult.user };
      } catch (createErr: any) {
        console.warn('[Firebase Auth] Create account notice:', createErr.code, createErr.message);
      }
    }

    // 2. If Firebase Auth reports CONFIGURATION_NOT_FOUND or provider not enabled on console,
    // verify against the authorized credentials directly so admin is never locked out
    if (
      pass === DEFAULT_ADMIN_PASSWORD || 
      pass === 'azryl123' ||
      signErr.code === 'auth/configuration-not-found' ||
      signErr.message?.includes('CONFIGURATION_NOT_FOUND')
    ) {
      if (pass !== 'azryl123' && pass !== DEFAULT_ADMIN_PASSWORD) {
        return {
          success: false,
          error: 'Password admin salah. Silakan masukkan password yang benar.'
        };
      }

      const syntheticUid = `admin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const mockAdminUser = {
        uid: syntheticUid,
        email: cleanEmail,
        displayName: 'AZRYLPREM Super Admin',
        emailVerified: true
      };

      sessionStorage.setItem('azryl_admin_email', cleanEmail);
      sessionStorage.setItem('azryl_admin_uid', syntheticUid);
      sessionStorage.setItem('azryl_admin_auth', 'true');

      // Attempt to save to Firestore
      await syncAdminToFirestore(cleanEmail, syntheticUid);

      return { success: true, user: mockAdminUser };
    }

    return {
      success: false,
      error: signErr.code === 'auth/wrong-password' 
        ? 'Password admin tidak valid.' 
        : `Gagal autentikasi: ${signErr.message || signErr.code}`
    };
  }
}

export async function logoutAdmin() {
  sessionStorage.removeItem('azryl_admin_email');
  sessionStorage.removeItem('azryl_admin_uid');
  sessionStorage.removeItem('azryl_admin_auth');
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Signout notice:', err);
  }
}

// Check if current user or session is an authorized admin
export async function verifyAdminStatus(user: User | null): Promise<boolean> {
  const localAuth = sessionStorage.getItem('azryl_admin_auth');
  const localEmail = sessionStorage.getItem('azryl_admin_email');

  if (localAuth === 'true' && localEmail && SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === localEmail.toLowerCase())) {
    return true;
  }

  if (!user) return false;
  
  // 1. Direct super-admin email check
  if (user.email && SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase())) {
    return true;
  }

  // 2. Check admin document in Firestore
  try {
    const adminRef = doc(db, 'admins', user.uid);
    const snap = await getDoc(adminRef);
    if (snap.exists()) {
      return true;
    }
  } catch (err) {
    console.warn('Admin check fallback error:', err);
  }

  return false;
}
