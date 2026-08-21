import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth.api';

export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');

      if (accessToken && refreshToken) {
        useAuthStore.setState({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });

        try {
          const user = await authApi.getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }

        navigate({ to: '/home' });
      } else {
        navigate({ to: '/auth/login' });
      }
    };

    handleCallback();
  }, [navigate, setAuth, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
