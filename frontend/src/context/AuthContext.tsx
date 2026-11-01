'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  User,
  LoginCredentials,
  RegisterData,
  VerifyEmailData,
  ResendVerificationData,
  AuthResponse,
} from '@/types/auth';
import { authApi, tokenStorage } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: Omit<RegisterData, 'confirmPassword'>) => Promise<AuthResponse>;
  verifyEmail: (data: VerifyEmailData) => Promise<AuthResponse>;
  resendVerification: (data: ResendVerificationData) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khởi tạo trạng thái đăng nhập từ storage khi mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = tokenStorage.get();
        if (storedToken) {
          const currentUser = await authApi.getMe();
          if (currentUser) {
            setUser(currentUser);
          } else {
            tokenStorage.remove();
          }
        }
      } catch {
        tokenStorage.remove();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.login(credentials);
        if (res.user) {
          setUser(res.user);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (data: Omit<RegisterData, 'confirmPassword'>): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.register(data);
        if (res.user && !res.requiresEmailVerification) {
          setUser(res.user);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const verifyEmail = useCallback(
    async (data: VerifyEmailData): Promise<AuthResponse> => {
      setIsLoading(true);
      try {
        const res = await authApi.verifyEmail(data);
        if (res.user) {
          setUser(res.user);
        }
        return res;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resendVerification = useCallback(
    async (data: ResendVerificationData) => {
      return await authApi.resendVerification(data);
    },
    []
  );

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
