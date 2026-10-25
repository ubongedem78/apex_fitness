'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { logout as authLogout } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('apex_access_token')
      : null;

    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => {
        const freshUser = data?.user || data;
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('apex_user', JSON.stringify(freshUser));
        } else {
          authLogout();
        }
      })
      .catch((err) => {

        const status = err?.response?.status;
        if (status === 401) authLogout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('apex_user', JSON.stringify(userData));
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('apex_user', JSON.stringify(updated));
  };

  const isAuthenticated  = !!user;
  const isAdmin          = user?.role === 'admin';
  const isManager        = ['admin', 'manager'].includes(user?.role);
  const isStaff          = ['admin', 'manager', 'staff'].includes(user?.role);
  const isMember         = user?.role === 'member';
  const isReceptionist   = user?.role === 'receptionist';

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser,
      isAuthenticated, isAdmin, isManager, isStaff, isMember, isReceptionist,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
