import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateCommentDto } from '@wavely/shared';
import { commentsApi } from '../api/comments.api';

export const commentKeys = {
  all: ['comments'] as const,
  byWave: (waveId: string) => [...commentKeys.all, waveId] as const,
};

export const useCommentsForWave = (waveId: string) => {
  return useQuery({
    queryKey: commentKeys.byWave(waveId),
    queryFn: () => commentsApi.getByWave(waveId),
    enabled: !!waveId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentDto) => commentsApi.create(data),
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.byWave(newComment.waveId),
      });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.all,
      });
    },
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => commentsApi.like(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.all,
      });
    },
  });
};
