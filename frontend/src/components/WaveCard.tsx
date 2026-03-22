import { useState, useRef, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Wave } from '@wavely/shared';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, Star, MapPin } from 'lucide-react';
import { useLikeWave, useSaveWave, useIncrementView } from '../hooks/useWaves';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { useInView } from 'react-intersection-observer';

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

  // Intersection observer for video autoplay
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.6,
    rootMargin: '0px 0px -50px 0px',
  });

  // Handle video autoplay
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

  // Track view
  useEffect(() => {
    if (inView) {
      incrementViewMutation.mutate(wave.id);
    }
  }, [inView, wave.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      // Redirect to login or show toast
      return;
    }

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

  return (
    <div
      ref={inViewRef}
      onClick={handleCardClick}
      className="w-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
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
                <img
                  src={wave.user.profileImage || '/default-avatar.png'}
                  alt={wave.user.displayName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div>
                  <p className="font-semibold text-white text-sm">
                    {wave.user.displayName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <span>@{wave.user.username}</span>
                    <span>•</span>
                    <span>{formatTimestamp(wave.createdAt)}</span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {wave.location && (
                  <div className="flex items-center gap-1 text-white text-xs bg-black/30 px-2 py-1 rounded-full">
                    <MapPin size={12} />
                    <span>{wave.location}</span>
                  </div>
                )}
                {isOwner && (
                  <button 
                    className="text-white p-2 rounded-full hover:bg-white/20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Rating badge */}
          {(wave.personalRating || wave.averageRating) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-purple-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2">
                <Star size={16} fill="currentColor" />
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
              <button
                onClick={toggleMute}
                className="bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
              >
                {isVideoMuted ? '🔇' : '🔊'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Title and content */}
        {wave.title && (
          <h3 className="font-bold text-lg mb-2">{wave.title}</h3>
        )}

        {wave.content && (
          <div className="relative">
            <p className={`text-gray-700 dark:text-gray-300 ${!showFullContent ? 'line-clamp-2' : ''}`}>
              {wave.content}
            </p>
            {wave.content.length > 100 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullContent(!showFullContent);
                }}
                className="text-blue-500 text-sm font-medium mt-1"
              >
                {showFullContent ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                wave.isLiked
                  ? 'text-red-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart 
                size={20} 
                fill={wave.isLiked ? 'currentColor' : 'none'} 
                stroke="currentColor"
                strokeWidth={wave.isLiked ? 0 : 2}
              />
              <span className="text-sm">{wave.likesCount}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onCommentsClick?.(wave.id);
              }}
              className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <MessageCircle size={20} />
              <span className="text-sm">{wave.commentsCount}</span>
            </button>

            <button
              onClick={(e) => e.stopPropagation()}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
            >
              <Share2 size={20} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className={`transition-colors ${
              wave.isSaved
                ? 'text-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-500'
            }`}
          >
            <Bookmark 
              size={20} 
              fill={wave.isSaved ? 'currentColor' : 'none'} 
              stroke="currentColor"
              strokeWidth={wave.isSaved ? 0 : 2}
            />
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{wave.likesCount} likes</span>
          <span>•</span>
          <span>{wave.commentsCount} comments</span>
          {wave.category && (
            <>
              <span>•</span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full">
                #{wave.category}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};