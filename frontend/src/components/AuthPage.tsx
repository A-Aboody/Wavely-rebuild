import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from '@tanstack/react-router';
import { AuthForm } from './AuthForm';
import { useAuthStore } from '../stores/authStore';

export const AuthPage = () => {
  const location = useLocation();
  const initialMode = location.pathname === '/auth/register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Update mode when route changes
  useEffect(() => {
    const newMode = location.pathname === '/auth/register' ? 'register' : 'login';
    setMode(newMode);
  }, [location.pathname]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    navigate({ to: '/home' });
  };

  const handleToggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    const newPath = newMode === 'register' ? '/auth/register' : '/auth/login';
    navigate({ to: newPath });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fixed top bar */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img
              src="/Wavely-Logo.png"
              alt="Wavely Logo"
              className="h-9 w-auto"
            />
            <span className="text-2xl font-black text-primary tracking-tight">
              Wavely
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <AuthForm
            mode={mode}
            onSuccess={handleAuthSuccess}
            onToggleMode={handleToggleMode}
          />
        </div>
      </div>
    </div>
  );
};
