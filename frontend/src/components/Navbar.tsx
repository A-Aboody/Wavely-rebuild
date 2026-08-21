import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavbarProps {
  transparent?: boolean;
}

export const Navbar = ({ transparent = false }: NavbarProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!transparent) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent]);

  const handleLogout = async () => {
    await authApi.logout();
    window.location.href = '/auth/login';
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-colors duration-200',
        transparent && !scrolled ? 'bg-transparent' : 'bg-white border-b border-border',
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/Wavely-Logo.png" alt="Wavely" className="h-8 w-auto" />
          <span className="text-xl font-black text-primary tracking-tight">Wavely</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/home">Home</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/create">Create</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile/$username" params={{ username: user?.username || '' }}>
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
