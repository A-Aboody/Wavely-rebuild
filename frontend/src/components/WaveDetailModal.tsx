import { useState, useRef, useEffect } from 'react';
import { Wave } from '@wavely/shared';
import { X, Heart, MessageCircle, Bookmark, Share2, Star, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useLikeWave, useSaveWave } from '../hooks/useWaves';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { CommentSection } from './Comments/CommentSection';
import { Link } from '@tanstack/react-router';

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

  // Reset video state when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && wave.mediaType === 'VIDEO') {
      videoRef.current.currentTime = 0;
      videoRef.current.play()
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

  // Pause video when modal closes
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      {/* Modal Container */}
      <div className="relative w-full max-w-7xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-gray-900/50 hover:bg-gray-900/70 text-white rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Left Side - Wave Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {/* Media Section */}
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
                <button
                  onClick={toggleMute}
                  className="absolute bottom-4 left-4 bg-black/60 text-white p-3 rounded-full hover:bg-black/80 transition-colors"
                >
                  {isVideoMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              )}

              {/* Rating badge */}
              {(wave.personalRating || wave.averageRating) && (
                <div className="absolute bottom-4 right-4">
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
            </div>
          )}
        </div>

        {/* Right Side - Details & Comments */}
        <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
          {/* Header - User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <Link
              to="/profile/$username"
              params={{ username: wave.user.username }}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors"
              onClick={onClose}
            >
              <img
                src={wave.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(wave.user.displayName)}&background=3b82f6&color=fff`}
                alt={wave.user.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {wave.user.displayName}
                </p>
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>@{wave.user.username}</span>
                  <span>•</span>
                  <span>{formatTimestamp(wave.createdAt)}</span>
                </div>
              </div>
            </Link>

            {/* Location */}
            {wave.location && (
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <MapPin size={14} />
                <span>{wave.location}</span>
              </div>
            )}
          </div>

          {/* Wave Details */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title */}
            {wave.title && (
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {wave.title}
              </h2>
            )}

            {/* Content */}
            {wave.content && (
              <div>
                <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${!showFullContent && wave.content.length > 200 ? 'line-clamp-3' : ''}`}>
                  {wave.content}
                </p>
                {wave.content.length > 200 && (
                  <button
                    onClick={() => setShowFullContent(!showFullContent)}
                    className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600"
                  >
                    {showFullContent ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            )}

            {/* Category */}
            {wave.category && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium">
                  #{wave.category}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 transition-colors ${
                    wave.isLiked
                      ? 'text-red-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart
                    size={22}
                    fill={wave.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={wave.isLiked ? 0 : 2}
                  />
                  <span className="text-sm font-medium">{wave.likesCount}</span>
                </button>

                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <MessageCircle size={22} />
                  <span className="text-sm font-medium">{wave.commentsCount}</span>
                </div>

                <button className="text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  <Share2 size={22} />
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
                  size={22}
                  fill={wave.isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={wave.isSaved ? 0 : 2}
                />
              </button>
            </div>

            {/* Comments Section */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Comments
              </h3>
              <CommentSection wave={wave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
