import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We wait for Firebase Auth to stabilize before finalizing the user state
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Standard Auth flow (Google or Email)
        const userRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // First user becomes admin
          const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
          const isFirstUser = usersSnap.empty;

          const defaultUser: User = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Unnamed User',
            email: fbUser.email || undefined,
            role: isFirstUser ? 'admin' : 'student',
          };
          await setDoc(userRef, defaultUser);
          setUser(defaultUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Error with email login:", err);
      throw err;
    }
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, loginWithEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
