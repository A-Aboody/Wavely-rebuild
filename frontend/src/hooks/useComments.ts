import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { CreateCommentDto } from '@wavely/shared';
import { commentsApi } from '../api/comments.api';

// Query Keys
export const commentKeys = {
  all: ['comments'] as const,
  byWave: (waveId: string) => [...commentKeys.all, waveId] as const,
};

// Query to fetch comments for a wave
export const useCommentsForWave = (waveId: string) => {
  return useQuery({
    queryKey: commentKeys.byWave(waveId),
    queryFn: () => commentsApi.getByWave(waveId),
    enabled: !!waveId,
  });
};

// Mutation to create a comment
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => commentsApi.create(data),
    onSuccess: (newComment) => {
      // Update the wave's comments list
      queryClient.invalidateQueries({
        queryKey: commentKeys.byWave(newComment.waveId),
      });
    },
  });
};

// Mutation to delete a comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => {
      // Invalidate all comment queries
      queryClient.invalidateQueries({
        queryKey: commentKeys.all,
      });
    },
  });
};

// Mutation to like a comment
export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.like(id),
    onSuccess: () => {
      // Invalidate all comment queries
      queryClient.invalidateQueries({
        queryKey: commentKeys.all,
      });
    },
  });
};
