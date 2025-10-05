'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import fetchApi from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const data = await fetchApi('/users/me');
      setUser(data);
    } catch (error: any) {
      if (error.message === 'Session expired. Please login again.') {
        router.push('/login');
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isInitialMount = true;
    
    // Function to check cookies and refresh if needed
    const checkAndRefreshAuth = async () => {
      if (document.cookie.includes('refreshToken')) {
        try {
          await fetchApi('/users/refresh-token', { method: 'POST' });
          await fetchUser();
        } catch (error) {
          setUser(null);
          if (!isInitialMount) {
            router.push('/login');
          }
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };

    // Initial auth check
    checkAndRefreshAuth();

    // Set up interval to refresh token periodically (every 14 minutes)
    const refreshInterval = setInterval(checkAndRefreshAuth, 14 * 60 * 1000);

    return () => {
      isInitialMount = false;
      clearInterval(refreshInterval);
    };
  }, [router]);

  const logout = async () => {
    try {
      await fetchApi('/users/logout', { method: 'POST' });
      setUser(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, logout, refetchUser: fetchUser }}>
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
