import { useState, useRef, useEffect } from 'react';
import { Wave } from '@wavely/shared';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Star,
  MapPin,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLikeWave, useSaveWave } from '../hooks/useWaves';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { CommentSection } from './Comments/CommentSection';
import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface WaveDetailModalProps {
  wave: Wave;
  isOpen: boolean;
  onClose: () => void;
}

export const WaveDetailModal = ({ wave, isOpen, onClose }: WaveDetailModalProps) => {
  const { user } = useAuthStore();
  const likeMutation = useLikeWave();
  const saveMutation = useSaveWave();
  const [showFullContent, setShowFullContent] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current && wave.mediaType === 'VIDEO') {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsVideoMuted(true);
            videoRef.current.play().then(() => setIsVideoPlaying(true));
          }
        });
    }
  }, [isOpen, wave.mediaType]);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [isOpen]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    likeMutation.mutate(wave.id);
  };

  const handleSave = (e: React.MouseEvent) => {
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

  const userInitials = wave.user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-7xl h-[90vh] p-0 gap-0 overflow-hidden flex border-border [&>button]:hidden">
        <DialogTitle className="sr-only">{wave.title || 'Wave detail'}</DialogTitle>

        {/* Left Side - Media */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {wave.mediaUrls.length > 0 && (
            <div className="flex-1 relative flex items-center justify-center">
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

              {/* Video Controls */}
              {wave.mediaType === 'VIDEO' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="absolute bottom-4 left-4 bg-black/60 text-white hover:bg-black/80 h-10 w-10 rounded-full"
                >
                  {isVideoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
              )}

              {/* Rating badge */}
              {(wave.personalRating || wave.averageRating) && (
                <div className="absolute bottom-4 right-4">
                  <div className="bg-purple-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2">
                    <Star className="h-4 w-4" fill="currentColor" />
                    <span className="font-semibold">
                      {wave.waveType === 'PERSONAL'
                        ? `${wave.personalRating?.toFixed(1)}/10`
                        : `${wave.averageRating?.toFixed(1)}/${wave.communityRatingScale}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Details and Comments */}
        <div className="w-full lg:w-[450px] flex flex-col bg-background border-l border-border">
          {/* Header - User Info */}
          <div className="p-4">
            <Link
              to="/profile/$username"
              params={{ username: wave.user.username }}
              className="flex items-center gap-3 hover:bg-accent rounded-lg p-2 -m-2 transition-colors"
              onClick={onClose}
            >
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage
                  src={
                    wave.user.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(wave.user.displayName)}&background=3b82f6&color=fff`
                  }
                  alt={wave.user.displayName}
                />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{wave.user.displayName}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>@{wave.user.username}</span>
                  <span>·</span>
                  <span>{formatTimestamp(wave.createdAt)}</span>
                </div>
              </div>
            </Link>

            {wave.location && (
              <Badge variant="secondary" className="mt-3">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                {wave.location}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Wave Details */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {wave.title && <h2 className="text-xl font-semibold text-foreground">{wave.title}</h2>}

            {wave.content && (
              <div>
                <p
                  className={cn(
                    'text-muted-foreground whitespace-pre-wrap',
                    !showFullContent && wave.content.length > 200 && 'line-clamp-3',
                  )}
                >
                  {wave.content}
                </p>
                {wave.content.length > 200 && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm font-medium mt-2"
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    {showFullContent ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </div>
            )}

            {wave.category && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">#{wave.category}</Badge>
              </div>
            )}

            {/* Action Buttons */}
            <Separator />
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
                      : 'text-muted-foreground hover:text-red-500',
                  )}
                >
                  <Heart
                    className="h-[22px] w-[22px]"
                    fill={wave.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={wave.isLiked ? 0 : 2}
                  />
                </Button>
                <span className="text-sm font-medium text-muted-foreground mr-2">
                  {wave.likesCount}
                </span>

                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                  <MessageCircle className="h-[22px] w-[22px]" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground mr-2">
                  {wave.commentsCount}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Share2 className="h-[22px] w-[22px]" />
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
                    : 'text-muted-foreground hover:text-primary',
                )}
              >
                <Bookmark
                  className="h-[22px] w-[22px]"
                  fill={wave.isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={wave.isSaved ? 0 : 2}
                />
              </Button>
            </div>

            {/* Comments Section */}
            <Separator />
            <div>
              <h3 className="font-semibold text-foreground mb-4">Comments</h3>
              <CommentSection wave={wave} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
