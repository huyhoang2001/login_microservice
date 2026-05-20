import { useContext } from 'react';
import { AuthContext } from '@/modules/auth/contexts/AuthContext';

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');

  return {
    user: ctx.user,
    isAdmin: ctx.user?.role === 'admin',
    isAuthenticated: ctx.isAuthenticated,
    isLoading: ctx.isLoading,
    login: ctx.login,
    logout: ctx.logout,
  };
};
