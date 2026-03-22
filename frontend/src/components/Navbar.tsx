import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useState, useEffect } from 'react';

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent && !scrolled
          ? 'bg-transparent py-5'
          : 'bg-white/95 backdrop-blur-md py-3 shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/Wavely-Logo.png"
            alt="Wavely Logo"
            className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-3xl font-black text-blue-500 tracking-tight">
            Wavely
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/home"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors"
              >
                <span className="hidden sm:inline font-medium">Home</span>
              </Link>
              <Link
                to="/create"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors"
              >
                <span className="hidden sm:inline font-medium">Create</span>
              </Link>
              <Link
                to="/profile/$username"
                params={{ username: user?.username || '' }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-500 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{user?.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login">
                <button className="px-6 py-2.5 rounded-full font-semibold text-sm bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300">
                  Log in
                </button>
              </Link>
              <Link to="/auth/register">
                <button className="px-6 py-2.5 rounded-full font-semibold text-sm border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-300">
                  Sign up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
