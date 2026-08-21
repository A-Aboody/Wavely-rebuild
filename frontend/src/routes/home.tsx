import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useAuthStore } from '../stores/authStore';
import { useWavesFeed, useFollowingFeed } from '../hooks/useWaves';
import { WaveCard } from '../components/WaveCard';
import { CommentSection } from '../components/Comments/CommentSection';
import { useState, useEffect, useRef } from 'react';
import { Search, Compass, PlusSquare, TrendingUp, Info, MessageCircle, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

  const waves =
    feedTab === 'forYou'
      ? forYouData?.pages.flatMap((page) => page.data) || []
      : followingData?.pages.flatMap((page) => page.data) || [];

  const isLoading = feedTab === 'forYou' ? isLoadingForYou : isLoadingFollowing;
  const isFetchingNext = feedTab === 'forYou' ? isFetchingNextForYou : isFetchingNextFollowing;

  useEffect(() => {
    if (waves.length > 0 && !selectedWaveId) {
      setSelectedWaveId(waves[0].id);
    }
  }, [waves, selectedWaveId]);

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
          const waveIndex = waves.findIndex((wave) => wave.id === id);
          if (waveIndex !== -1) {
            closestWaveIndex = waveIndex;
          }
        }
      });
      if (visibleWaveIndex !== closestWaveIndex) {
        setVisibleWaveIndex(closestWaveIndex);
        setSelectedWaveId(waves[closestWaveIndex]?.id);
      }
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
  }, [
    waves,
    visibleWaveIndex,
    feedTab,
    hasNextForYou,
    hasNextFollowing,
    isFetchingNextForYou,
    isFetchingNextFollowing,
    fetchNextForYou,
    fetchNextFollowing,
  ]);

  const handleCommentsClick = (waveId: string) => {
    setSidebarTab('comments');
    setSelectedWaveId(waveId);
    const waveElement = waveRefs.current[waveId];
    if (waveElement && feedContainerRef.current) {
      const containerRect = feedContainerRef.current.getBoundingClientRect();
      const waveRect = waveElement.getBoundingClientRect();
      feedContainerRef.current.scrollTo({
        top:
          feedContainerRef.current.scrollTop +
          (waveRect.top - containerRect.top) -
          (containerRect.height - waveRect.height) / 2,
        behavior: 'smooth',
      });
    }
  };

  const selectedWave = waves.find((wave) => wave.id === selectedWaveId);

  const userInitials = (user?.displayName || user?.username || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getAvatarUrl = (name: string, profileImage?: string | null) =>
    profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;

  return (
    <div className="min-h-screen bg-muted">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-8 space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={getAvatarUrl(
                          user?.displayName || user?.username || 'User',
                          user?.profileImage,
                        )}
                        alt={user?.displayName}
                        className="object-cover"
                      />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{user?.displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">@{user?.username}</p>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link to="/profile/$username" params={{ username: user?.username || '' }}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-2 space-y-1">
                  <Button variant="ghost" asChild className="w-full justify-start gap-3 px-4">
                    <Link to="/create">
                      <PlusSquare className="h-5 w-5" />
                      <span>Create Wave</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start gap-3 px-4">
                    <a href="/explore">
                      <Compass className="h-5 w-5" />
                      <span>Explore</span>
                    </a>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start gap-3 px-4">
                    <a href="/trending">
                      <TrendingUp className="h-5 w-5" />
                      <span>Trending</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Feed */}
          <div className="lg:col-span-5">
            <div className="mb-6 sticky top-8 z-10">
              <Tabs
                value={feedTab}
                onValueChange={(value) => setFeedTab(value as 'forYou' | 'following')}
              >
                <Card>
                  <TabsList className="w-full rounded-lg h-auto p-0 bg-background">
                    <TabsTrigger
                      value="forYou"
                      className="flex-1 rounded-none rounded-tl-lg py-3 font-semibold data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      For You
                    </TabsTrigger>
                    <TabsTrigger
                      value="following"
                      className="flex-1 rounded-none rounded-tr-lg py-3 font-semibold data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Following
                    </TabsTrigger>
                  </TabsList>
                </Card>
              </Tabs>
            </div>

            <div
              ref={feedContainerRef}
              className="overflow-y-auto scrollbar-hide"
              style={{ height: 'calc(100vh - 120px)' }}
            >
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : waves.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Search className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feedTab === 'forYou' ? 'No waves yet' : 'No waves from people you follow'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {feedTab === 'forYou'
                      ? 'Be the first to create a wave and share your experience!'
                      : 'Start following people to see their waves here'}
                  </p>
                  {feedTab === 'forYou' ? (
                    <Button asChild>
                      <Link to="/create">Create Your First Wave</Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/explore">Explore Users</a>
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-6">
                  {waves.map((wave) => (
                    <div key={wave.id} ref={(el) => (waveRefs.current[wave.id] = el)}>
                      <WaveCard wave={wave} onCommentsClick={handleCommentsClick} />
                    </div>
                  ))}
                  {isFetchingNext && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-8">
              <Card className="overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
                <Tabs
                  value={sidebarTab}
                  onValueChange={(value) => setSidebarTab(value as 'info' | 'comments')}
                >
                  <TabsList className="w-full rounded-none h-auto p-0 bg-background">
                    <TabsTrigger
                      value="info"
                      className="flex-1 rounded-none py-3 font-semibold data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      <div className="flex items-center gap-2">
                        <Info size={18} />
                        <span>Community</span>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="flex-1 rounded-none py-3 font-semibold data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle size={18} />
                        <span>Comments</span>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                  <Separator />

                  <div
                    className="overflow-y-auto scrollbar-hide"
                    style={{ height: 'calc(100% - 57px)' }}
                  >
                    <TabsContent value="info" className="mt-0">
                      <div className="p-6 space-y-4">
                        <h3 className="font-semibold text-foreground text-lg mb-4">
                          Top Rated Waves
                        </h3>
                        {waves
                          .filter((wave) => wave.averageRating || wave.personalRating)
                          .sort(
                            (a, b) =>
                              (b.averageRating || b.personalRating || 0) -
                              (a.averageRating || a.personalRating || 0),
                          )
                          .slice(0, 5)
                          .map((wave) => (
                            <Link
                              key={wave.id}
                              to="/profile/$username"
                              params={{ username: wave.user.username }}
                              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors border border-border"
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
                                  <span className="font-medium">
                                    {(wave.averageRating || wave.personalRating)?.toFixed(1)}
                                  </span>
                                </div>
                                {wave.category && (
                                  <Badge variant="secondary" className="mt-2">
                                    #{wave.category}
                                  </Badge>
                                )}
                              </div>
                            </Link>
                          ))}
                        {waves.filter((w) => w.averageRating || w.personalRating).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No rated waves yet
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="comments" className="mt-0 h-full">
                      <div className="flex flex-col h-full">
                        {selectedWave ? (
                          <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
                            <div className="flex items-center gap-3 mb-4 pb-4">
                              <Avatar className="h-10 w-10 flex-shrink-0">
                                <AvatarImage
                                  src={getAvatarUrl(
                                    selectedWave.user.displayName,
                                    selectedWave.user.profileImage,
                                  )}
                                  alt={selectedWave.user.displayName}
                                  className="object-cover"
                                />
                                <AvatarFallback>
                                  {selectedWave.user.displayName
                                    .split(' ')
                                    .map((part) => part[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">
                                  {selectedWave.user.displayName}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {selectedWave.title || 'Wave'}
                                </p>
                              </div>
                            </div>
                            <Separator className="mb-4" />
                            <div className="pr-2">
                              <CommentSection wave={selectedWave} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <div className="text-center">
                              <MessageCircle
                                size={48}
                                className="mx-auto mb-2 text-muted-foreground/40"
                              />
                              <p className="text-sm">No wave selected</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
