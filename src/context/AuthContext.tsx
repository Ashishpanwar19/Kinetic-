import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, syncUserProfile, getUserFirestoreProfile } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firestoreProfile: any | null;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firestoreProfile: null,
  loginWithGoogle: async () => { throw new Error('Not implemented'); },
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firestoreProfile, setFirestoreProfile] = useState<any | null>(null);

  const fetchProfile = async (currentUser: User) => {
    try {
      const prof = await getUserFirestoreProfile(currentUser.uid);
      setFirestoreProfile(prof);
    } catch (err) {
      console.warn('Error fetching firestore profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
        await fetchProfile(currentUser);
      } else {
        setFirestoreProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const u = await loginWithGoogle();
    if (u) {
      await fetchProfile(u);
    }
    return u;
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setFirestoreProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        firestoreProfile,
        loginWithGoogle: handleLogin,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
