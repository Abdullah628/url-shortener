'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/utils/constants';
import { getErrorMessage } from '@/utils/helpers';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<void>;
  register: (data:  Omit<RegisterFormData, 'confirmPassword'>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token:  null,
  isAuthenticated:  false,
  isLoading:  true,
};

export function AuthProvider({ children }: { children:  ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid or expired
          setState({
            ... initialState,
            isLoading: false,
          });
        }
      } else {
        setState({
          ...initialState,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (data: LoginFormData) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await authService.login(data);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [router]);

  const register = useCallback(async (data:  Omit<RegisterFormData, 'confirmPassword'>) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const { user, token } = await authService.register(data);
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setState({
        ... initialState,
        isLoading: false,
      });
      router.push(ROUTES. LOGIN);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const user = await authService.getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}