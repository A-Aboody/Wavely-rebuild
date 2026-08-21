import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../stores/authStore';
import { useUserWaves, useSavedWaves, useLikedWaves } from '../../hooks/useWaves';
import { WaveCard } from '../../components/WaveCard';
import { WaveDetailModal } from '../../components/WaveDetailModal';
import { Wave } from '@wavely/shared';
import { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Bookmark,
  UserPlus,
  UserMinus,
  Settings,
  Star,
  Eye,
  Grid,
  List,
  Camera,
  Loader2,
} from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';

export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
});

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function ProfilePage() {
  const { username } = Route.useParams();
  const { user: currentUser, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'waves' | 'saved' | 'liked'>('waves');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showEditModal, setShowEditModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const [showWaveModal, setShowWaveModal] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const bannerImageRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    profileImage: '',
    bannerImage: '',
  });

  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersApi.getProfile(username),
  });

  const profile = profileData
    ? { ...profileData, isOwnProfile: profileData.id === currentUser?.id }
    : undefined;

  const { data: stats } = useQuery({
    queryKey: ['stats', username],
    queryFn: () => usersApi.getStats(),
    enabled: profile?.isOwnProfile || false,
  });

  const {
    data: wavesData,
    fetchNextPage: fetchNextWaves,
    hasNextPage: hasNextWaves,
    isFetchingNextPage: isFetchingNextWaves,
    isLoading: isLoadingWaves,
  } = useUserWaves(username);

  const {
    data: savedData,
    fetchNextPage: fetchNextSaved,
    hasNextPage: hasNextSaved,
    isFetchingNextPage: isFetchingNextSaved,
    isLoading: isLoadingSaved,
  } = useSavedWaves(username);

  const {
    data: likedData,
    fetchNextPage: fetchNextLiked,
    hasNextPage: hasNextLiked,
    isFetchingNextPage: isFetchingNextLiked,
    isLoading: isLoadingLiked,
  } = useLikedWaves(currentUser?.id === profileData?.id ? username : '');

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setIsFollowing(!!profile.isFollowing);
      setFollowersCount(Math.max(0, profile.followersCount || 0));
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!profile || !currentUser || isFollowLoading) return;

    const previousFollowing = isFollowing;
    const previousCount = followersCount;

    try {
      setIsFollowLoading(true);

      setIsFollowing(!previousFollowing);
      setFollowersCount((prev) => {
        const newCount = previousFollowing ? prev - 1 : prev + 1;
        return Math.max(0, newCount);
      });

      const result = await usersApi.follow(profile.id);

      setIsFollowing(result.following);

      await refetchProfile();

      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    } catch (error) {
      console.error('Error toggling follow:', error);

      setIsFollowing(previousFollowing);
      setFollowersCount(previousCount);

      alert('Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const openEditModal = () => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio || '',
        profileImage: profile.profileImage || '',
        bannerImage: profile.bannerImage || '',
      });
      setShowEditModal(true);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'banner'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const uploadType = type === 'banner' ? 'profile' : type;
    formData.append('type', uploadType);

    const response = await apiClient.post<{
      success: boolean;
      data: { url: string };
    }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.data.url;
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      setIsUploading(true);
      const url = await handleImageUpload(file, 'profile');
      setEditForm((prev) => ({ ...prev, profileImage: url }));
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      setIsUploading(true);
      const url = await handleImageUpload(file, 'banner');
      setEditForm((prev) => ({ ...prev, bannerImage: url }));
    } catch (error) {
      console.error('Error uploading banner image:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsUploading(true);
      await apiClient.put('/users/me', editForm);

      if (currentUser) {
        updateUser(editForm);
      }

      setShowEditModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setIsUploading(false);
    }
  };

  const handleWaveClick = (wave: Wave) => {
    setSelectedWave(wave);
    setShowWaveModal(true);
  };

  const handleCloseModal = () => {
    setShowWaveModal(false);
    setSelectedWave(null);
  };

  const waves =
    activeTab === 'waves'
      ? wavesData?.pages.flatMap((page) => page.data) || []
      : activeTab === 'saved'
        ? savedData?.pages.flatMap((page) => page.data) || []
        : likedData?.pages.flatMap((page) => page.data) || [];

  const isLoading =
    activeTab === 'waves'
      ? isLoadingWaves
      : activeTab === 'saved'
        ? isLoadingSaved
        : isLoadingLiked;
  const hasNextPage =
    activeTab === 'waves' ? hasNextWaves : activeTab === 'saved' ? hasNextSaved : hasNextLiked;
  const fetchNextPage =
    activeTab === 'waves'
      ? fetchNextWaves
      : activeTab === 'saved'
        ? fetchNextSaved
        : fetchNextLiked;
  const isFetchingNext =
    activeTab === 'waves'
      ? isFetchingNextWaves
      : activeTab === 'saved'
        ? isFetchingNextSaved
        : isFetchingNextLiked;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">User not found</h2>
          <p className="text-muted-foreground">The user you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-primary to-blue-400">
        {profile.bannerImage && (
          <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-20 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                {/* Profile Avatar */}
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage
                    src={
                      profile.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile.displayName || profile.username,
                      )}&background=3b82f6&color=fff&size=200`
                    }
                    alt={profile.displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.displayName || profile.username)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl font-semibold text-foreground mb-1">
                    {profile.displayName}
                  </h1>
                  <p className="text-muted-foreground mb-3">@{profile.username}</p>

                  {profile.bio && <p className="text-foreground/80 mb-4">{profile.bio}</p>}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-foreground">{profile.wavesCount}</span>
                      <span className="text-muted-foreground ml-1">Waves</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{followersCount}</span>
                      <span className="text-muted-foreground ml-1">Followers</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">
                        {profile.followingCount}
                      </span>
                      <span className="text-muted-foreground ml-1">Following</span>
                    </div>
                    {stats && (
                      <>
                        <div>
                          <Eye className="w-4 h-4 inline mr-1 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {stats.totalViews.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground ml-1">Views</span>
                        </div>
                        {stats.averageRating && (
                          <div>
                            <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
                            <span className="font-semibold text-foreground">
                              {stats.averageRating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground ml-1">Avg Rating</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  {profile.isOwnProfile ? (
                    <Button variant="outline" onClick={openEditModal}>
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <Button
                      variant={isFollowing ? 'secondary' : 'default'}
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                    >
                      {isFollowLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isFollowing ? 'Unfollowing...' : 'Following...'}
                        </>
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and View Mode */}
        <Card className="mb-6 sticky top-8 z-10">
          <div className="px-4 pt-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'waves' | 'saved' | 'liked')}
            >
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="waves">
                    <Grid className="w-4 h-4 mr-1.5" />
                    Waves
                  </TabsTrigger>
                  <TabsTrigger value="saved">
                    <Bookmark className="w-4 h-4 mr-1.5" />
                    Saved
                  </TabsTrigger>
                  {profile.isOwnProfile && (
                    <TabsTrigger value="liked">
                      <Heart className="w-4 h-4 mr-1.5" />
                      Liked
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={cn(viewMode === 'grid' && 'bg-accent text-accent-foreground')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={cn(viewMode === 'list' && 'bg-accent text-accent-foreground')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>
          <Separator className="mt-4" />
        </Card>

        {/* Waves Grid/List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : waves.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              {activeTab === 'waves' ? (
                <Grid className="w-12 h-12 text-muted-foreground" />
              ) : activeTab === 'saved' ? (
                <Bookmark className="w-12 h-12 text-muted-foreground" />
              ) : (
                <Heart className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No{' '}
              {activeTab === 'waves'
                ? 'waves'
                : activeTab === 'saved'
                  ? 'saved waves'
                  : 'liked waves'}{' '}
              yet
            </h3>
            <p className="text-muted-foreground">
              {profile.isOwnProfile
                ? activeTab === 'waves'
                  ? 'Create your first wave to get started!'
                  : activeTab === 'saved'
                    ? 'Save waves to view them here.'
                    : 'Like waves to view them here.'
                : `@${profile.username} has no ${activeTab === 'waves' ? 'posts' : activeTab === 'saved' ? 'saved waves' : 'liked waves'} yet.`}
            </p>
          </Card>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12'
                : 'space-y-6 pb-12'
            }
          >
            {waves.map((wave) => (
              <WaveCard key={wave.id} wave={wave} onWaveClick={handleWaveClick} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center pb-12">
            <Button variant="default" onClick={() => fetchNextPage()} disabled={isFetchingNext}>
              {isFetchingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Banner Image */}
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div
                className="relative h-48 bg-gradient-to-r from-primary to-blue-400 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => bannerImageRef.current?.click()}
              >
                {editForm.bannerImage && (
                  <img
                    src={editForm.bannerImage}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-12 h-12 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={bannerImageRef}
                type="file"
                accept="image/*"
                onChange={handleBannerImageChange}
                className="hidden"
              />
            </div>

            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div
                className="relative w-32 h-32 cursor-pointer group"
                onClick={() => profileImageRef.current?.click()}
              >
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={
                      editForm.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        editForm.displayName || username,
                      )}&background=3b82f6&color=fff&size=200`
                    }
                    alt="Profile"
                    className="object-cover"
                  />
                  <AvatarFallback className="text-2xl">
                    {getInitials(editForm.displayName || username)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <input
                ref={profileImageRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </div>

            <Separator />

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={4}
                placeholder="Tell us about yourself..."
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSaveProfile} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Wave Detail Modal */}
      {selectedWave && (
        <WaveDetailModal wave={selectedWave} isOpen={showWaveModal} onClose={handleCloseModal} />
      )}
    </div>
  );
}
