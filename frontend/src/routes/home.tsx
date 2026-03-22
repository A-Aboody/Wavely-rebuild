import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { useWavesFeed, useFollowingFeed } from '../hooks/useWaves';
import { WaveCard } from '../components/WaveCard';
import { CommentSection } from '../components/Comments/CommentSection';
import { useState, useEffect, useRef } from 'react';
import { Search, Compass, PlusSquare, TrendingUp, Info, MessageCircle, Star } from 'lucide-react';

export const Route = createFileRoute('/home')({
  beforeLoad: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: HomePage,
});

function HomePage() {
  const { user } = useAuthStore();
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');
  const [sidebarTab, setSidebarTab] = useState<'info' | 'comments'>('info');
  const [selectedWaveId, setSelectedWaveId] = useState<string | null>(null);
  const [visibleWaveIndex, setVisibleWaveIndex] = useState(0);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const waveRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    data: forYouData,
    fetchNextPage: fetchNextForYou,
    hasNextPage: hasNextForYou,
    isFetchingNextPage: isFetchingNextForYou,
    isLoading: isLoadingForYou,
  } = useWavesFeed();

  const {
    data: followingData,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasNextFollowing,
    isFetchingNextPage: isFetchingNextFollowing,
    isLoading: isLoadingFollowing,
  } = useFollowingFeed();

  const waves = feedTab === 'forYou'
    ? forYouData?.pages.flatMap(page => page.data) || []
    : followingData?.pages.flatMap(page => page.data) || [];

  const isLoading = feedTab === 'forYou' ? isLoadingForYou : isLoadingFollowing;
  const isFetchingNext = feedTab === 'forYou' ? isFetchingNextForYou : isFetchingNextFollowing;

  // Set initial selected wave
  useEffect(() => {
    if (waves.length > 0 && !selectedWaveId) {
      setSelectedWaveId(waves[0].id);
    }
  }, [waves, selectedWaveId]);

  // Track visible wave in viewport
  useEffect(() => {
    if (!feedContainerRef.current) return;

    const feedContainer = feedContainerRef.current;

    const handleScroll = () => {
      if (!feedContainer) return;

      const containerRect = feedContainer.getBoundingClientRect();
      const containerMiddle = containerRect.top + containerRect.height / 2;

      let closestWaveIndex = 0;
      let closestDistance = Infinity;

      Object.entries(waveRefs.current).forEach(([id, element]) => {
        if (!element) return;

        const waveRect = element.getBoundingClientRect();
        const waveMiddle = waveRect.top + waveRect.height / 2;
        const distance = Math.abs(containerMiddle - waveMiddle);

        if (distance < closestDistance) {
          closestDistance = distance;
          const waveIndex = waves.findIndex(wave => wave.id === id);
          if (waveIndex !== -1) {
            closestWaveIndex = waveIndex;
          }
        }
      });

      if (visibleWaveIndex !== closestWaveIndex) {
        setVisibleWaveIndex(closestWaveIndex);
        setSelectedWaveId(waves[closestWaveIndex]?.id);
      }

      // Infinite scroll
      const scrollPosition = feedContainer.scrollTop + feedContainer.clientHeight;
      const scrollHeight = feedContainer.scrollHeight;

      if (scrollPosition >= scrollHeight * 0.8) {
        if (feedTab === 'forYou' && hasNextForYou && !isFetchingNextForYou) {
          fetchNextForYou();
        } else if (feedTab === 'following' && hasNextFollowing && !isFetchingNextFollowing) {
          fetchNextFollowing();
        }
      }
    };

    feedContainer.addEventListener('scroll', handleScroll);

    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(feedContainer);

    setTimeout(handleScroll, 100);

    return () => {
      feedContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [waves, visibleWaveIndex, feedTab, hasNextForYou, hasNextFollowing, isFetchingNextForYou, isFetchingNextFollowing, fetchNextForYou, fetchNextFollowing]);

  // Handle comments click from WaveCard
  const handleCommentsClick = (waveId: string) => {
    setSidebarTab('comments');
    setSelectedWaveId(waveId);

    const waveElement = waveRefs.current[waveId];
    if (waveElement && feedContainerRef.current) {
      const containerRect = feedContainerRef.current.getBoundingClientRect();
      const waveRect = waveElement.getBoundingClientRect();

      feedContainerRef.current.scrollTo({
        top: feedContainerRef.current.scrollTop + (waveRect.top - containerRect.top) -
             (containerRect.height - waveRect.height) / 2,
        behavior: 'smooth'
      });
    }
  };

  const selectedWave = waves.find(wave => wave.id === selectedWaveId);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - User Quick Info - Restored proper spacing */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img
                    src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.username || 'User')}&background=3b82f6&color=fff`}
                    alt={user?.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{user?.displayName}</p>
                    <p className="text-sm text-gray-500 truncate">@{user?.username}</p>
                  </div>
                </div>
                <Link
                  to="/profile/$username"
                  params={{ username: user?.username || '' }}
                  className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  View Profile
                </Link>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
                <Link
                  to="/create"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <PlusSquare className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-500">Create Wave</span>
                </Link>
                <a
                  href="/explore"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <Compass className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-500">Explore</span>
                </a>
                <a
                  href="/trending"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <TrendingUp className="w-5 h-5 text-gray-600 group-hover:text-blue-500" />
                  <span className="font-medium text-gray-700 group-hover:text-blue-500">Trending</span>
                </a>
              </div>
            </div>
          </aside>

          {/* Main Feed - Adjusted width */}
          <div className="lg:col-span-5">
            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 sticky top-8 z-10">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setFeedTab('forYou')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                    feedTab === 'forYou'
                      ? 'text-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  For You
                  {feedTab === 'forYou' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
                <button
                  onClick={() => setFeedTab('following')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                    feedTab === 'following'
                      ? 'text-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Following
                  {feedTab === 'following' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Waves Feed with Fixed Height and Scroll - No footer cutoff */}
            <div
              ref={feedContainerRef}
              className="overflow-y-auto hide-scrollbar"
              style={{
                height: 'calc(100vh - 120px)'
              }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : waves.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {feedTab === 'forYou' ? 'No waves yet' : 'No waves from people you follow'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feedTab === 'forYou'
                      ? 'Be the first to create a wave and share your experience!'
                      : 'Start following people to see their waves here'}
                  </p>
                  {feedTab === 'forYou' ? (
                    <Link
                      to="/create"
                      className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      Create Your First Wave
                    </Link>
                  ) : (
                    <a
                      href="/explore"
                      className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                    >
                      Explore Users
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {waves.map((wave) => (
                    <div
                      key={wave.id}
                      ref={el => waveRefs.current[wave.id] = el}
                    >
                      <WaveCard
                        wave={wave}
                        onCommentsClick={handleCommentsClick}
                      />
                    </div>
                  ))}

                  {isFetchingNext && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Tabs: Community Info and Comments - INCREASED WIDTH */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                   style={{ height: 'calc(100vh - 120px)' }}>
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setSidebarTab('info')}
                    className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                      sidebarTab === 'info'
                        ? 'text-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Info size={18} />
                      <span>Community</span>
                    </div>
                    {sidebarTab === 'info' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setSidebarTab('comments')}
                    className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${
                      sidebarTab === 'comments'
                        ? 'text-blue-500'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MessageCircle size={18} />
                      <span>Comments</span>
                    </div>
                    {sidebarTab === 'comments' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="overflow-y-auto hide-scrollbar" style={{ height: 'calc(100% - 57px)' }}>
                  {sidebarTab === 'info' ? (
                    <div className="p-6 space-y-4">
                      <h3 className="font-bold text-gray-900 text-lg mb-4">Top Rated Waves</h3>
                      {waves
                        .filter(wave => wave.averageRating || wave.personalRating)
                        .sort((a, b) => (b.averageRating || b.personalRating || 0) - (a.averageRating || a.personalRating || 0))
                        .slice(0, 5)
                        .map((wave) => (
                          <Link
                            key={wave.id}
                            to="/profile/$username"
                            params={{ username: wave.user.username }}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                          >
                            {wave.mediaUrls[0] && (
                              <img
                                src={wave.mediaUrls[0]}
                                alt={wave.title || 'Wave'}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {wave.title || wave.user.displayName}
                              </p>
                              <div className="flex items-center gap-1 text-sm mt-1">
                                <Star size={14} className="text-yellow-500" fill="currentColor" />
                                <span className="font-medium">{(wave.averageRating || wave.personalRating)?.toFixed(1)}</span>
                              </div>
                              {wave.category && (
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                  #{wave.category}
                                </span>
                              )}
                            </div>
                          </Link>
                        ))}
                      {waves.filter(w => w.averageRating || w.personalRating).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No rated waves yet
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {selectedWave ? (
                        <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
                          {/* Wave Info */}
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                            <img
                              src={selectedWave.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedWave.user.displayName)}&background=3b82f6&color=fff`}
                              alt={selectedWave.user.displayName}
                              className="w-10 h-10 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {selectedWave.user.displayName}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {selectedWave.title || 'Wave'}
                              </p>
                            </div>
                          </div>

                          {/* Comments Section */}
                          <div className="pr-2">
                            <CommentSection wave={selectedWave} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <MessageCircle size={48} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No wave selected</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}