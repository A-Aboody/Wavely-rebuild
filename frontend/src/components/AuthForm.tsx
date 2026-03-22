import { useState, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import { LoginDto, RegisterDto } from '@wavely/shared';
import { EmailVerificationModal } from './EmailVerificationModal';

interface AuthFormProps {
  mode?: 'login' | 'register';
  onSuccess?: () => void;
  onToggleMode?: () => void;
}

export const AuthForm = ({ mode: initialMode = 'login', onSuccess, onToggleMode }: AuthFormProps) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const setAuth = useAuthStore((state) => state.setAuth);

  // Login form state
  const [loginData, setLoginData] = useState<LoginDto>({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterDto>({
    email: '',
    password: '',
    username: '',
    displayName: '',
  });

  const handleToggleMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setError(null);
    if (onToggleMode) onToggleMode();
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authApi.login(loginData);
      setAuth(response);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(registerData.username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        ...registerData,
        displayName: registerData.displayName || registerData.username,
      });
      setAuth(response);
      setUserEmail(registerData.email);

      // Show verification modal
      setShowVerificationModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:3001/api/auth/google';
  };

  return (
    <div className="w-full max-w-md animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/Wavely-Logo.png"
            alt="Wavely"
            className="h-12 w-auto"
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Sign up'}
          </h2>
          <p className="text-gray-500 text-sm">
            {mode === 'login'
              ? 'Sign in to continue to your account'
              : 'Create an account to get started'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <input
                  type="text"
                  required
                  value={registerData.username}
                  onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Username"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={registerData.displayName}
                  onChange={(e) => setRegisterData({ ...registerData, displayName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                  placeholder="Full name (optional)"
                />
              </div>
            </>
          )}

          <div>
            <input
              type="email"
              required
              value={mode === 'login' ? loginData.email : registerData.email}
              onChange={(e) => {
                if (mode === 'login') {
                  setLoginData({ ...loginData, email: e.target.value });
                } else {
                  setRegisterData({ ...registerData, email: e.target.value });
                }
              }}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Email"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={mode === 'login' ? loginData.password : registerData.password}
                onChange={(e) => {
                  if (mode === 'login') {
                    setLoginData({ ...loginData, password: e.target.value });
                  } else {
                    setRegisterData({ ...registerData, password: e.target.value });
                  }
                }}
                className="w-full px-3 py-2.5 pr-10 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                placeholder="Password"
                minLength={mode === 'register' ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              <span>{mode === 'login' ? 'Log in' : 'Sign up'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-xs text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm rounded-lg border border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Toggle Mode */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={userEmail}
      />
    </div>
  );
};
