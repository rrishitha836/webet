import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  balance: number;
  status: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: string;
  lastLoginAt?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  login: (redirectUrl?: string) => void;
  logout: () => void;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check user session
      const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        credentials: 'include',
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.data);
        
        // If user is admin, also set admin state
        if (userData.data?.role === 'ADMIN') {
          setAdmin(userData.data);
        }
      } else {
        // User endpoint failed — try admin endpoint (admin tokens have type 'admin'
        // which the user endpoint rejects)
        try {
          const adminRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/me`, {
            credentials: 'include',
          });
          
          if (adminRes.ok) {
            const adminData = await adminRes.json();
            const adminMapped = {
              ...adminData.data,
              name: adminData.data.displayName || adminData.data.name || adminData.data.email,
            };
            setAdmin(adminMapped);
            setUser(adminMapped);
          }
        } catch {
          // No valid session
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (redirectUrl?: string) => {
    const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
    const url = redirectUrl 
      ? `${baseUrl}?redirect=${encodeURIComponent(redirectUrl)}`
      : baseUrl;
    
    window.location.href = url;
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Login failed');
      }

      if (data.success && data.data?.admin) {
        const adminMapped = {
          ...data.data.admin,
          name: data.data.admin.displayName || data.data.admin.name || data.data.admin.email,
        };
        setAdmin(adminMapped);
        setUser(adminMapped);
        router.push('/admin/dashboard');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const adminLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      setAdmin(null);
      setUser(null);
      router.push('/admin/login');
    }
  };

  const refreshUser = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, admin, isLoading, login, logout, adminLogin, adminLogout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
