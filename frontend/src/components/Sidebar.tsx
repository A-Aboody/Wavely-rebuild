import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/auth.api';
import { useState, useRef } from 'react';
import { Home, PlusSquare, User, LogOut, PanelLeftClose, PanelLeft, Camera } from 'lucide-react';
import apiClient from '../lib/apiClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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

      await apiClient.put('/users/me', {
        profileImage: imageUrl,
      });

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
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '256px');
  }

  const navItems = [
    { to: '/home' as const, label: 'Home', icon: Home },
    { to: '/create' as const, label: 'Create', icon: PlusSquare },
  ];

  const profileImageUrl =
    user.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.displayName || user.username,
    )}&background=3b82f6&color=fff&size=128`;

  const userInitials = (user.displayName || user.username)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-background border-r border-border transition-all duration-300 z-50 flex flex-col',
          isCollapsed ? 'w-20' : 'w-64',
        )}
      >
        {/* User Profile Section */}
        <div className="border-b border-border p-4">
          {/* Toggle Button */}
          <div className="flex justify-center mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="h-8 w-8 text-muted-foreground"
            >
              {isCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative group flex-shrink-0">
              <Avatar
                className="h-12 w-12 cursor-pointer ring-2 ring-primary/10"
                onClick={handleImageClick}
              >
                <AvatarImage
                  src={profileImageUrl}
                  alt={user.displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div
                onClick={handleImageClick}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                <p className="font-semibold text-foreground mt-4 text-center truncate w-full px-2 text-sm">
                  {user.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate w-full text-center px-2 mt-1">
                  @{user.username}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} activeOptions={{ exact: false }}>
              {({ isActive }) => {
                const linkContent = (
                  <div
                    className={cn(
                      'flex items-center rounded-md px-3 py-2.5 transition-colors cursor-pointer',
                      isCollapsed ? 'justify-center' : 'gap-3',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
                  </div>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              }}
            </Link>
          ))}

          <Link
            to="/profile/$username"
            params={{ username: user.username }}
            activeOptions={{ exact: false }}
          >
            {({ isActive }) => {
              const linkContent = (
                <div
                  className={cn(
                    'flex items-center rounded-md px-3 py-2.5 transition-colors cursor-pointer',
                    isCollapsed ? 'justify-center' : 'gap-3',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <User className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm">Profile</span>}
                </div>
              );

              if (isCollapsed) {
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">Profile</TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            }}
          </Link>
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-3 border-t border-border">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-full h-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Log out</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium text-sm">Log out</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};
