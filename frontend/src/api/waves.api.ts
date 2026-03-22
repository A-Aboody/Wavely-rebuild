import apiClient from '../lib/apiClient';
import {
  Wave,
  CreateWaveDto,
  UpdateWaveDto,
  FeedParams,
  CursorPaginatedResponse,
} from '@wavely/shared';

export const wavesApi = {
  create: async (data: CreateWaveDto): Promise<Wave> => {
    const response = await apiClient.post<Wave>('/waves', data);
    return response.data;
  },

  getWaves: async (params: FeedParams = {}): Promise<CursorPaginatedResponse<Wave>> => {
    const response = await apiClient.get<CursorPaginatedResponse<Wave>>('/waves', { params });
    return response.data;
  },

  getFollowingFeed: async (params: FeedParams = {}): Promise<CursorPaginatedResponse<Wave>> => {
    const response = await apiClient.get<CursorPaginatedResponse<Wave>>('/waves/following', { params });
    return response.data;
  },

  getUserWaves: async (
    username: string,
    params: FeedParams = {}
  ): Promise<CursorPaginatedResponse<Wave>> => {
    const response = await apiClient.get<CursorPaginatedResponse<Wave>>(
      `/waves/user/${username}`,
      { params }
    );
    return response.data;
  },

  getSavedWaves: async (
    username: string,
    params: FeedParams = {}
  ): Promise<CursorPaginatedResponse<Wave>> => {
    const response = await apiClient.get<CursorPaginatedResponse<Wave>>(
      `/waves/user/${username}/saved`,
      { params }
    );
    return response.data;
  },

  getLikedWaves: async (
    username: string,
    params: FeedParams = {}
  ): Promise<CursorPaginatedResponse<Wave>> => {
    const response = await apiClient.get<CursorPaginatedResponse<Wave>>(
      `/waves/user/${username}/liked`,
      { params }
    );
    return response.data;
  },

  getTrending: async (limit: number = 10): Promise<Wave[]> => {
    const response = await apiClient.get<Wave[]>('/waves/trending', {
      params: { limit },
    });
    return response.data;
  },

  getTopRated: async (limit: number = 10): Promise<Wave[]> => {
    const response = await apiClient.get<Wave[]>('/waves/top-rated', {
      params: { limit },
    });
    return response.data;
  },

  getWave: async (id: string): Promise<Wave> => {
    const response = await apiClient.get<Wave>(`/waves/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateWaveDto): Promise<Wave> => {
    const response = await apiClient.put<Wave>(`/waves/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/waves/${id}`);
  },

  like: async (id: string): Promise<{ liked: boolean }> => {
    const response = await apiClient.post<{ liked: boolean }>(`/waves/${id}/like`);
    return response.data;
  },

  save: async (id: string): Promise<{ saved: boolean }> => {
    const response = await apiClient.post<{ saved: boolean }>(`/waves/${id}/save`);
    return response.data;
  },

  incrementView: async (id: string): Promise<void> => {
    await apiClient.post(`/waves/${id}/view`);
  },
};
