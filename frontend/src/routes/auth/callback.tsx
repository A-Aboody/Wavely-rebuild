import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

export const Route = createFileRoute('/auth/callback')({
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Get tokens from URL query parameters
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      // Store tokens in auth store
      setAuth({
        accessToken,
        refreshToken,
        user: null as any, // User data will be fetched by the app
      });

      // Redirect to dashboard
      navigate({ to: '/dashboard' });
    } else {
      // If no tokens, redirect to login with error
      navigate({ to: '/auth/login' });
    }
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
      </div>
    </div>
  );
}
