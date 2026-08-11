import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect, FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../api/auth.api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Route = createFileRoute('/auth/complete-profile')({
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const params = new URLSearchParams(window.location.search);
  const setupToken = params.get('setupToken') || '';
  const email = params.get('email') || '';
  const googleDisplayName = params.get('displayName') || '';

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(googleDisplayName);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!setupToken) {
      navigate({ to: '/auth/login' });
    }
  }, [setupToken, navigate]);

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.completeGoogleSignup({
        setupToken,
        username,
        displayName: displayName.trim() || username,
      });
      setAuth(response);
      navigate({ to: '/home' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try signing in again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <img
              src="/Wavely-Logo.png"
              alt="Wavely Logo"
              className="h-9 w-auto"
            />
            <span className="text-2xl font-black text-primary tracking-tight">Wavely</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-1">
                  Complete your profile
                </h1>
                <p className="text-sm text-muted-foreground">
                  Choose a username to finish setting up your account
                </p>
              </div>

              {/* Google account badge */}
              {email && (
                <div className="flex items-center justify-center mb-6">
                  <Badge variant="secondary" className="gap-2 px-3 py-1.5 text-sm font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Signed in as {email}
                  </Badge>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name as others will see it"
                    maxLength={50}
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="your_username"
                      className="pl-8"
                      required
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    3 to 20 characters. Letters, numbers, and underscores only.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-md bg-destructive/10 px-4 py-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading || username.length < 3}
                  className="w-full"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Setting up your account...
                    </span>
                  ) : (
                    'Complete setup'
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Wrong account?{' '}
                <Link to="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                  Sign in with a different account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
