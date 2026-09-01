import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

export interface AuthTeam {
  id: string;
  teamName: string;
}

interface AuthContextType {
  team: AuthTeam | null;
  isLoading: boolean;
  login: (teamName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [team, setTeam] = useState<AuthTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch<{ authenticated: boolean; team?: AuthTeam }>('/api/auth/me');
      if (res.authenticated && res.team) {
        setTeam(res.team);
      } else {
        setTeam(null);
      }
    } catch (err) {
      console.warn('Session check failed:', err);
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (teamName: string, password: string) => {
    try {
      const res = await apiFetch<{ success: boolean; team: AuthTeam }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ teamName, password }),
      });
      if (res.success && res.team) {
        setTeam(res.team);
        return { success: true };
      }
      return { success: false, error: 'Invalid team name or password.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid team name or password.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setTeam(null);
    }
  };

  return (
    <AuthContext.Provider value={{ team, isLoading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
