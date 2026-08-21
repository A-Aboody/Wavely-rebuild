import apiClient from '../lib/apiClient';
import { UserProfile, UpdateUserDto, UserStats } from '@wavely/shared';

export const usersApi = {
  getProfile: async (username: string): Promise<UserProfile> => {
    const response = await apiClient.get<UserProfile>(`/users/${username}`);
    return response.data;
  },

  updateProfile: async (data: UpdateUserDto): Promise<UserProfile> => {
    const response = await apiClient.put<UserProfile>('/users/me', data);
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get<UserStats>('/users/me/stats');
    return response.data;
  },

  follow: async (userId: string): Promise<{ following: boolean }> => {
    const response = await apiClient.post<{ following: boolean }>(`/users/${userId}/follow`);
    return response.data;
  },

  getFollowers: async (username: string, limit: number = 20) => {
    const response = await apiClient.get(`/users/${username}/followers`, {
      params: { limit },
    });
    return response.data;
  },

  getFollowing: async (username: string, limit: number = 20) => {
    const response = await apiClient.get(`/users/${username}/following`, {
      params: { limit },
    });
    return response.data;
  },

  searchUsers: async (query: string, limit: number = 20) => {
    const response = await apiClient.get('/users/search', {
      params: { q: query, limit },
    });
    return response.data;
  },
};
