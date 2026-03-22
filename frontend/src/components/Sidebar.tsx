import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth.api';
import { useState, useRef } from 'react';
import {
  Home,
  PlusSquare,
  User,
  LogOut,
  Menu,
  X,
  Camera,
} from 'lucide-react';
import apiClient from '../lib/apiClient';

export const Sidebar = () => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await authApi.logout();
    window.location.href = '/auth/login';
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    try {
      setIsUploadingImage(true);

      // Upload to S3
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'profile');

      const uploadResponse = await apiClient.post<{
        success: boolean;
        data: { url: string };
      }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = uploadResponse.data.data.url;

      // Update user profile
      const updateResponse = await apiClient.put('/users/me', {
        profileImage: imageUrl,
      });

      // Update local state
      updateUser({ profileImage: imageUrl });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  // Communicate collapse state to parent via CSS variable
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '80px' : '256px'
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* User Profile Section */}
      <div className="border-b border-gray-200 p-4">
        {/* Toggle Button - moved above profile picture */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-blue-500 text-white rounded-full p-1.5 hover:bg-blue-600 transition-colors shadow-lg flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative group flex-shrink-0 w-12 h-12">
            <img
              src={
                user.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.displayName || user.username
                )}&background=3b82f6&color=fff&size=128`
              }
              alt={user.displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100 cursor-pointer flex-shrink-0"
              onClick={handleImageClick}
            />
            <div
              onClick={handleImageClick}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingImage ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {!isCollapsed && (
            <>
              <p className="font-semibold text-gray-900 mt-4 text-center truncate w-full px-2 text-sm">
                {user.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate w-full text-center px-2 mt-1">
                @{user.username}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/home" activeOptions={{ exact: false }}>
          {({ isActive }) => (
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-blue-50' : 'hover:bg-blue-50'
              }`}
            >
              <Home
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              />
              {!isCollapsed && (
                <span
                  className={`font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Home
                </span>
              )}
            </div>
          )}
        </Link>

        <Link to="/create" activeOptions={{ exact: false }}>
          {({ isActive }) => (
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-blue-50' : 'hover:bg-blue-50'
              }`}
            >
              <PlusSquare
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              />
              {!isCollapsed && (
                <span
                  className={`font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Create
                </span>
              )}
            </div>
          )}
        </Link>

        <Link
          to="/profile/$username"
          params={{ username: user.username }}
          activeOptions={{ exact: false }}
        >
          {({ isActive }) => (
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'bg-blue-50' : 'hover:bg-blue-50'
              }`}
            >
              <User
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              />
              {!isCollapsed && (
                <span
                  className={`font-medium ${
                    isActive ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Profile
                </span>
              )}
            </div>
          )}
        </Link>
      </nav>

      {/* Logout Button at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-3'
          } px-4 py-3 rounded-lg hover:bg-red-50 transition-colors group w-full`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-gray-600 group-hover:text-red-600" />
          {!isCollapsed && (
            <span className="font-medium text-gray-700 group-hover:text-red-600">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
