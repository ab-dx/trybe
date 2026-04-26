import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebase';
import { authService, AuthError } from './authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: AuthError | null;
  showAuthModal: boolean;          
  requireAuth: () => void;         
  closeAuthModal: () => void;      
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@trybe_user';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setShowAuthModal(false);
      }
//       if (firebaseUser) {
//         const userData = {
//           uid: firebaseUser.uid,
//           email: firebaseUser.email,
//           displayName: firebaseUser.displayName,
//         };
//         await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
//       } else {
//         await AsyncStorage.removeItem(USER_STORAGE_KEY);
//       }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const requireAuth = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      await authService.login(email, password);
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      setError({
        code: authError.code || 'unknown',
        message: formatAuthError(authError.code || 'unknown'),
      });
      throw err;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      await authService.signup(email, password);
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      setError({
        code: authError.code || 'unknown',
        message: formatAuthError(authError.code || 'unknown'),
      });
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      setError({
        code: authError.code || 'unknown',
        message: formatAuthError(authError.code || 'unknown'),
      });
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      setError({
        code: authError.code || 'unknown',
        message: formatAuthError(authError.code || 'unknown'),
      });
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        showAuthModal,     
        requireAuth,       
        closeAuthModal,    
        login,
        signup,
        logout,
        resetPassword,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

const formatAuthError = (code: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/invalid-credential': 'Invalid email or password',
  };

  return errorMessages[code] || 'An error occurred. Please try again';
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
