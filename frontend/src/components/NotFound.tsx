import { Link } from '@tanstack/react-router';
import { Home, Search } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center px-6 max-w-2xl">
        {/* 404 Text */}
        <h1 className="text-9xl font-black text-blue-500 mb-4">404</h1>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300">
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 border-blue-500 text-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 transition-all duration-300">
              <Search className="w-4 h-4" />
              Browse Experiences
            </button>
          </Link>
        </div>

        {/* Wave Decoration */}
        <div className="mt-12">
          <svg
            className="w-24 h-24 mx-auto text-blue-500 opacity-20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
