import apiClient from '../lib/apiClient';
import { Comment, CreateCommentDto, UpdateCommentDto } from '@wavely/shared';

export const commentsApi = {
  create: async (data: CreateCommentDto): Promise<Comment> => {
    const response = await apiClient.post<Comment>('/comments', data);
    return response.data;
  },

  getByWave: async (waveId: string): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/comments/wave/${waveId}`);
    return response.data;
  },

  update: async (id: string, data: UpdateCommentDto): Promise<Comment> => {
    const response = await apiClient.put<Comment>(`/comments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },

  like: async (id: string): Promise<{ liked: boolean }> => {
    const response = await apiClient.post<{ liked: boolean }>(`/comments/${id}/like`);
    return response.data;
  },
};
