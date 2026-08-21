import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth.api';

export const useAuth = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    logout,
  };
};

export const useRequireAuth = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth/login' });
    }
  }, [isAuthenticated, navigate]);

  return { isAuthenticated };
};

export const useAuthCheck = () => {
  const { user, accessToken, setUser, logout } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken && !user) {
        try {
          const userData = await authApi.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          logout();
        }
      }
    };

    checkAuth();
  }, [accessToken, user, setUser, logout]);

  return { user, isAuthenticated: !!user && !!accessToken };
};
