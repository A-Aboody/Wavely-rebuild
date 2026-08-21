import { useState } from 'react';
import { Wave } from '@wavely/shared';
import { Send, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useCommentsForWave, useCreateComment, useDeleteComment } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

interface CommentSectionProps {
  wave: Wave;
}

export const CommentSection = ({ wave }: CommentSectionProps) => {
  const { user: currentUser } = useAuthStore();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments = [], isLoading } = useCommentsForWave(wave.id);
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        waveId: wave.id,
        content: commentText,
      });
      setCommentText('');
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId);
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      {currentUser ? (
        <form onSubmit={handleSubmitComment} className="flex gap-3">
          <img
            src={
              currentUser.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentUser.displayName || currentUser.username,
              )}&background=3b82f6&color=fff`
            }
            alt={currentUser.displayName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
          <AlertCircle size={16} />
          Sign in to comment on this wave
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <div className="h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full" />
            </div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments
            .filter((comment) => !comment.parentCommentId)
            .map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                waveId={wave.id}
                waveOwnerId={wave.userId}
                onDelete={handleDeleteComment}
              />
            ))
        )}
      </div>
    </div>
  );
};
