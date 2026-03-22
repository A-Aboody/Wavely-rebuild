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
  X,
  Camera,
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
});

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

  // Fetch user profile
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => usersApi.getProfile(username),
  });

  // Determine if viewing own profile by comparing with current user
  const profile = profileData ? { ...profileData, isOwnProfile: profileData.id === currentUser?.id } : undefined;

  // Fetch user stats
  const {
    data: stats,
  } = useQuery({
    queryKey: ['stats', username],
    queryFn: () => usersApi.getStats(),
    enabled: profile?.isOwnProfile || false,
  });

  // Fetch user waves
  const {
    data: wavesData,
    fetchNextPage: fetchNextWaves,
    hasNextPage: hasNextWaves,
    isFetchingNextPage: isFetchingNextWaves,
    isLoading: isLoadingWaves,
  } = useUserWaves(username);

  // Fetch saved waves
  const {
    data: savedData,
    fetchNextPage: fetchNextSaved,
    hasNextPage: hasNextSaved,
    isFetchingNextPage: isFetchingNextSaved,
    isLoading: isLoadingSaved,
  } = useSavedWaves(username);

  // Fetch liked waves - only available for own profile
  const {
    data: likedData,
    fetchNextPage: fetchNextLiked,
    hasNextPage: hasNextLiked,
    isFetchingNextPage: isFetchingNextLiked,
    isLoading: isLoadingLiked,
  } = useLikedWaves(currentUser?.id === profileData?.id ? username : '');

  // Follow/Unfollow state with production-grade validation
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Sync local state with profile data when it changes
  useEffect(() => {
    if (profile) {
      setIsFollowing(!!profile.isFollowing);
      setFollowersCount(Math.max(0, profile.followersCount || 0));
    }
  }, [profile]);

  const handleFollow = async () => {
    if (!profile || !currentUser || isFollowLoading) return;

    // Store previous state for rollback on error
    const previousFollowing = isFollowing;
    const previousCount = followersCount;

    try {
      setIsFollowLoading(true);

      // Optimistic update with bounds checking
      setIsFollowing(!previousFollowing);
      setFollowersCount((prev) => {
        const newCount = previousFollowing ? prev - 1 : prev + 1;
        return Math.max(0, newCount); // Ensure never negative
      });

      // Make API call
      const result = await usersApi.follow(profile.id);

      // Update with server response (source of truth)
      setIsFollowing(result.following);

      // Refetch profile to ensure accurate count from server
      await refetchProfile();

      // Invalidate related queries to keep data consistent
      queryClient.invalidateQueries({ queryKey: ['profile', username] });

    } catch (error) {
      console.error('Error toggling follow:', error);

      // Rollback optimistic update on error
      setIsFollowing(previousFollowing);
      setFollowersCount(previousCount);

      // Show user-friendly error
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

  const handleImageUpload = async (
    file: File,
    type: 'profile' | 'banner'
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Map 'banner' to 'profile' for backend compatibility
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

      // Update local state
      if (currentUser) {
        updateUser(editForm);
      }

      setShowEditModal(false);
      window.location.reload(); // Reload to fetch updated profile
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

  const waves = activeTab === 'waves'
    ? wavesData?.pages.flatMap(page => page.data) || []
    : activeTab === 'saved'
    ? savedData?.pages.flatMap(page => page.data) || []
    : likedData?.pages.flatMap(page => page.data) || [];

  const isLoading = activeTab === 'waves' ? isLoadingWaves : activeTab === 'saved' ? isLoadingSaved : isLoadingLiked;
  const hasNextPage = activeTab === 'waves' ? hasNextWaves : activeTab === 'saved' ? hasNextSaved : hasNextLiked;
  const fetchNextPage = activeTab === 'waves' ? fetchNextWaves : activeTab === 'saved' ? fetchNextSaved : fetchNextLiked;
  const isFetchingNext = activeTab === 'waves' ? isFetchingNextWaves : activeTab === 'saved' ? isFetchingNextSaved : isFetchingNextLiked;

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600">
        {profile.bannerImage && (
          <img
            src={profile.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-20 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || profile.username)}&background=3b82f6&color=fff&size=200`}
                  alt={profile.displayName}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {profile.displayName}
                </h1>
                <p className="text-gray-500 mb-3">@{profile.username}</p>

                {profile.bio && (
                  <p className="text-gray-700 mb-4">{profile.bio}</p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div>
                    <span className="font-bold text-gray-900">{profile.wavesCount}</span>
                    <span className="text-gray-600 ml-1">Waves</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{followersCount}</span>
                    <span className="text-gray-600 ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{profile.followingCount}</span>
                    <span className="text-gray-600 ml-1">Following</span>
                  </div>
                  {stats && (
                    <>
                      <div>
                        <Eye className="w-4 h-4 inline mr-1 text-gray-500" />
                        <span className="font-bold text-gray-900">{stats.totalViews.toLocaleString()}</span>
                        <span className="text-gray-600 ml-1">Views</span>
                      </div>
                      {stats.averageRating && (
                        <div>
                          <Star className="w-4 h-4 inline mr-1 text-yellow-500" />
                          <span className="font-bold text-gray-900">{stats.averageRating.toFixed(1)}</span>
                          <span className="text-gray-600 ml-1">Avg Rating</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {profile.isOwnProfile ? (
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <Settings className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isFollowLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {isFollowing ? 'Unfollowing...' : 'Following...'}
                      </>
                    ) : isFollowing ? (
                      <>
                        <UserMinus className="w-5 h-5" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sticky top-8 z-10">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('waves')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === 'waves'
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-5 h-5 inline mr-2" />
              Waves
              {activeTab === 'waves' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                activeTab === 'saved'
                  ? 'text-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bookmark className="w-5 h-5 inline mr-2" />
              Saved
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
            {profile.isOwnProfile && (
              <button
                onClick={() => setActiveTab('liked')}
                className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                  activeTab === 'liked'
                    ? 'text-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Heart className="w-5 h-5 inline mr-2" />
                Liked
                {activeTab === 'liked' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="px-6 py-3 flex justify-end border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Waves Grid/List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : waves.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'waves' ? (
                <Grid className="w-12 h-12 text-gray-400" />
              ) : (
                <Bookmark className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {activeTab === 'waves' ? 'waves' : activeTab === 'saved' ? 'saved waves' : 'liked waves'} yet
            </h3>
            <p className="text-gray-600">
              {profile.isOwnProfile
                ? activeTab === 'waves'
                  ? 'Create your first wave to get started!'
                  : activeTab === 'saved'
                  ? 'Save waves to view them here'
                  : 'Like waves to view them here'
                : `@${profile.username} hasn't ${activeTab === 'waves' ? 'posted' : activeTab === 'saved' ? 'saved' : 'liked'} anything yet`}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12' : 'space-y-6 pb-12'}>
            {waves.map((wave) => (
              <WaveCard key={wave.id} wave={wave} onWaveClick={handleWaveClick} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasNextPage && (
          <div className="flex justify-center pb-12">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNext}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-medium"
            >
              {isFetchingNext ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banner Image
                </label>
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden group cursor-pointer"
                     onClick={() => bannerImageRef.current?.click()}>
                  {editForm.bannerImage && (
                    <img
                      src={editForm.bannerImage}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div
                  className="relative w-32 h-32 rounded-full overflow-hidden group cursor-pointer"
                  onClick={() => profileImageRef.current?.click()}
                >
                  <img
                    src={
                      editForm.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        editForm.displayName || username
                      )}&background=3b82f6&color=fff&size=200`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUploading ? (
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
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

              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-medium"
                >
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wave Detail Modal */}
      {selectedWave && (
        <WaveDetailModal
          wave={selectedWave}
          isOpen={showWaveModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
