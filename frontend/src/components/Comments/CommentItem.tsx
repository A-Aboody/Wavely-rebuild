import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Comment } from '@wavely/shared';
import {
  Heart,
  MessageCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../stores/authStore';
import { commentsApi } from '../../api/comments.api';
import { useLikeComment, useCreateComment } from '../../hooks/useComments';

interface CommentItemProps {
  comment: Comment;
  waveId: string;
  waveOwnerId: string;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
}

export const CommentItem = ({
  comment,
  waveId,
  waveOwnerId,
  onDelete,
  isReply = false,
}: CommentItemProps) => {
  const { user: currentUser } = useAuthStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const likeMutation = useLikeComment();
  const createReplyMutation = useCreateComment();

  const isCommentOwner = currentUser?.id === comment.userId;
  const isWaveOwner = currentUser?.id === waveOwnerId;
  const canDelete = isCommentOwner || isWaveOwner;
  const creatorLikedIt = comment.userId === waveOwnerId && comment.isLiked;

  const handleLike = () => {
    if (!currentUser) return;
    likeMutation.mutate(comment.id);
  };

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      await commentsApi.delete(comment.id);
      onDelete?.(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsDeleting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !currentUser) return;

    try {
      await createReplyMutation.mutateAsync({
        waveId,
        content: replyText,
        parentCommentId: comment.id,
      });
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true); // Automatically show replies after submitting
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const repliesCount = comment.repliesCount || 0;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-6' : ''}`}>
      {/* Avatar */}
      <Link
        to="/profile/$username"
        params={{ username: comment.user.username }}
        className="flex-shrink-0"
      >
        <img
          src={
            comment.user.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              comment.user.displayName
            )}&background=3b82f6&color=fff`
          }
          alt={comment.user.displayName}
          className="w-8 h-8 rounded-full object-cover"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/profile/$username"
            params={{ username: comment.user.username }}
            className="font-semibold text-sm hover:underline"
          >
            {comment.user.displayName}
          </Link>
          <span className="text-xs text-gray-500">@{comment.user.username}</span>
          {isCommentOwner && (
            <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded">
              Author
            </span>
          )}
          {waveOwnerId === comment.userId && !isCommentOwner && (
            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs rounded">
              Creator
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Comment text */}
        <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <button
            onClick={handleLike}
            disabled={!currentUser || likeMutation.isPending}
            className={`flex items-center gap-1 transition-colors ${
              comment.isLiked
                ? 'text-red-500'
                : 'hover:text-red-500 disabled:opacity-50'
            }`}
          >
            <Heart
              size={14}
              fill={comment.isLiked ? '#ef4444' : 'none'}
              stroke={comment.isLiked ? '#ef4444' : 'currentColor'}
              strokeWidth={comment.isLiked ? 0 : 2}
            />
            <span>{comment.likesCount}</span>
            {creatorLikedIt && <span className="text-xs">❤️</span>}
          </button>

          {!isReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              disabled={!currentUser}
              className="hover:text-blue-500 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              <MessageCircle size={14} />
              <span>Reply</span>
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:text-red-500 disabled:opacity-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}

          {repliesCount > 0 && !isReply && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="hover:text-blue-500 transition-colors flex items-center gap-1"
            >
              {showReplies ? (
                <>
                  <ChevronUp size={14} />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  <span>{repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Reply Input */}
        {!isReply && isReplying && currentUser && (
          <div className="mt-3 flex gap-2">
            <img
              src={
                currentUser.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  currentUser.displayName || currentUser.username
                )}&background=3b82f6&color=fff`
              }
              alt={currentUser.displayName}
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
              />
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || createReplyMutation.isPending}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {!isReply && showReplies && (comment.replies?.length ?? 0) > 0 && (
          <div className="mt-3 space-y-3">
            {(comment.replies || []).map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                waveId={waveId}
                waveOwnerId={waveOwnerId}
                onDelete={onDelete}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
