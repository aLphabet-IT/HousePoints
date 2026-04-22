import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with long-polling to bypass potential GRPC issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : undefined);

/**
 * Validates connection to Firestore.
 */
async function testConnection() {
  try {
    // Attempt a read to see if we can reach the backend
    await getDocFromServer(doc(db, 'system', 'connection-test'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.log("Firestore connection check: Reachable (Permission Denied as expected).");
      return;
    }
    
    // Check if truly offline or just a timeout
    if (error.message?.includes('offline') || error.message?.includes('timeout') || error.message?.includes('Backend didn\'t respond')) {
      console.error("CRITICAL: Firestore is unreachable. verify your Firebase settings and project state.");
    } else {
      console.error("Firestore connectivity check failed:", error.message || error);
    }
  }
}

// Run connectivity check after a short delay to allow background initialization
setTimeout(testConnection, 1000);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: any[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never {
  const authInfo = auth.currentUser ? {
    userId: auth.currentUser.uid,
    email: auth.currentUser.email,
    emailVerified: auth.currentUser.emailVerified,
    isAnonymous: auth.currentUser.isAnonymous,
    providerInfo: auth.currentUser.providerData,
  } : {
    userId: 'anonymous',
    email: null,
    emailVerified: false,
    isAnonymous: true,
    providerInfo: [],
  };

  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo,
  };

  throw new Error(JSON.stringify(errorInfo));
}
