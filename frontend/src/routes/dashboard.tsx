import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User, Settings } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-16">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            Welcome back, {user?.displayName || user?.username}!
          </h1>
          <p className="text-lg text-gray-600">
            Ready to capture life's moments on your wavelength
          </p>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-6 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</h3>
            <p className="text-xl font-bold text-gray-900">@{user?.username}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-6 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</h3>
            <p className="text-xl font-bold text-gray-900 truncate">{user?.email}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-6 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Member Since</h3>
            <p className="text-xl font-bold text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl shadow-blue-500/20 p-10 text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">Your Dashboard</h2>
          <p className="text-blue-50 mb-6 leading-relaxed">
            This is your personal space on Wavely. Soon you'll be able to track your favorite moments,
            discover people on your wavelength, and build your unique profile.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-200">✓</span>
              <span>Secure JWT authentication</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-200">✓</span>
              <span>Protected routes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-200">✓</span>
              <span>Automatic token refresh</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-200">✓</span>
              <span>Persistent sessions</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
