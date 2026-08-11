import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Wave } from '@wavely/shared';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Star, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useLikeWave, useSaveWave, useIncrementView } from '../hooks/useWaves';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface WaveCardProps {
  wave: Wave;
  onCommentsClick?: (waveId: string) => void;
  onWaveClick?: (wave: Wave) => void;
}

export const WaveCard = ({ wave, onCommentsClick, onWaveClick }: WaveCardProps) => {
  const { user } = useAuthStore();
  const likeMutation = useLikeWave();
  const saveMutation = useSaveWave();
  const incrementViewMutation = useIncrementView();

  const [showFullContent, setShowFullContent] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
    rootMargin: '0px 0px -50px 0px',
  });

  useEffect(() => {
    if (!videoRef.current || wave.mediaType !== 'VIDEO') return;

    if (inView) {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
        .then(() => setIsVideoPlaying(true))
        .catch(() => {
          videoRef.current!.muted = true;
          setIsVideoMuted(true);
          videoRef.current!.play().then(() => setIsVideoPlaying(true));
        });
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [inView, wave.mediaType]);

  useEffect(() => {
    if (inView) {
      incrementViewMutation.mutate(wave.id);
    }
  }, [inView, wave.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    likeMutation.mutate(wave.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    saveMutation.mutate(wave.id);
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !isVideoMuted;
    videoRef.current.muted = newMuted;
    setIsVideoMuted(newMuted);
  };

  const formatTimestamp = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const isOwner = user?.id === wave.userId;

  const handleCardClick = () => {
    if (onWaveClick) {
      onWaveClick(wave);
    }
  };

  const userInitials = wave.user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      ref={inViewRef}
      onClick={handleCardClick}
      className="w-full overflow-hidden border border-border transition-colors hover:border-primary/20 cursor-pointer shadow-none"
    >
      {/* Media Content */}
      {wave.mediaUrls.length > 0 && (
        <div className="relative w-full h-[650px]">
          {/* Blurred background */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={wave.mediaUrls[0]}
              alt=""
              className="w-full h-full object-cover blur-2xl scale-110 opacity-80"
            />
          </div>

          {/* Main media */}
          <div className="absolute inset-0 flex items-center justify-center">
            {wave.mediaType === 'IMAGE' && (
              <img
                src={wave.mediaUrls[0]}
                alt={wave.title || 'Wave image'}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {wave.mediaType === 'VIDEO' && (
              <video
                ref={videoRef}
                src={wave.mediaUrls[0]}
                loop
                muted={isVideoMuted}
                playsInline
                onClick={toggleVideo}
                className="max-h-full max-w-full object-contain cursor-pointer"
              />
            )}
          </div>

          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <Link
                to="/profile/$username"
                params={{ username: wave.user.username }}
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage
                    src={wave.user.profileImage || '/default-avatar.png'}
                    alt={wave.user.displayName}
                  />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {wave.user.displayName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <span>@{wave.user.username}</span>
                    <span>·</span>
                    <span>{formatTimestamp(wave.createdAt)}</span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {wave.location && (
                  <Badge variant="secondary" className="bg-black/30 text-white border-none text-xs">
                    <MapPin className="mr-1 h-3 w-3" />
                    {wave.location}
                  </Badge>
                )}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 h-9 w-9"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Rating badge */}
          {(wave.personalRating || wave.averageRating) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-purple-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2">
                <Star className="h-4 w-4" fill="currentColor" />
                <span className="font-semibold">
                  {wave.waveType === 'PERSONAL'
                    ? `${wave.personalRating?.toFixed(1)}/10`
                    : `${wave.averageRating?.toFixed(1)}/${wave.communityRatingScale}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Video controls */}
          {wave.mediaType === 'VIDEO' && (
            <div className="absolute bottom-4 left-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="bg-black/60 text-white hover:bg-black/80 h-9 w-9 rounded-full"
              >
                {isVideoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <CardContent className="p-4">
        {wave.title && (
          <h3 className="font-semibold text-lg text-foreground mb-2">{wave.title}</h3>
        )}

        {wave.content && (
          <div className="relative">
            <p className={cn(
              'text-muted-foreground',
              !showFullContent && 'line-clamp-2'
            )}>
              {wave.content}
            </p>
            {wave.content.length > 100 && (
              <Button
                variant="link"
                className="h-auto p-0 text-sm font-medium mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullContent(!showFullContent);
                }}
              >
                {showFullContent ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <Separator className="mt-4 mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(
                'h-9 w-9 transition-colors',
                wave.isLiked
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-muted-foreground hover:text-red-500'
              )}
            >
              <Heart
                className="h-5 w-5"
                fill={wave.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={wave.isLiked ? 0 : 2}
              />
            </Button>
            <span className="text-sm text-muted-foreground mr-2">{wave.likesCount}</span>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onCommentsClick?.(wave.id);
              }}
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
            <span className="text-sm text-muted-foreground mr-2">{wave.commentsCount}</span>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className={cn(
              'h-9 w-9 transition-colors',
              wave.isSaved
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <Bookmark
              className="h-5 w-5"
              fill={wave.isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={wave.isSaved ? 0 : 2}
            />
          </Button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{wave.likesCount} likes</span>
          <span>·</span>
          <span>{wave.commentsCount} comments</span>
          {wave.category && (
            <>
              <span>·</span>
              <Badge variant="secondary" className="text-xs">
                #{wave.category}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
