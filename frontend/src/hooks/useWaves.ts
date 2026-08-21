import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { wavesApi } from '../api/waves.api';
import { Wave, CreateWaveDto, UpdateWaveDto, FeedParams } from '@wavely/shared';

export const waveKeys = {
  all: ['waves'] as const,
  lists: () => [...waveKeys.all, 'list'] as const,
  list: (params: FeedParams) => [...waveKeys.lists(), params] as const,
  details: () => [...waveKeys.all, 'detail'] as const,
  detail: (id: string) => [...waveKeys.details(), id] as const,
  following: () => [...waveKeys.all, 'following'] as const,
  userWaves: (username: string) => [...waveKeys.all, 'user', username] as const,
  savedWaves: (username: string) => [...waveKeys.all, 'saved', username] as const,
  likedWaves: (username: string) => [...waveKeys.all, 'liked', username] as const,
  trending: () => [...waveKeys.all, 'trending'] as const,
  topRated: () => [...waveKeys.all, 'top-rated'] as const,
};

// Helper function to update wave in any cache structure
const updateWaveInCache = (queryClient: any, waveId: string, updateFn: (wave: any) => any) => {
  const queries = queryClient.getQueriesData({ queryKey: waveKeys.all });

  queries.forEach(([queryKey, data]: [any, any]) => {
    if (!data) return;

    if (data.pages && Array.isArray(data.pages)) {
      const newData = {
        ...data,
        pages: data.pages.map((page: any) => {
          if (page.data && Array.isArray(page.data)) {
            return {
              ...page,
              data: page.data.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave)),
            };
          } else if (Array.isArray(page)) {
            return page.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave));
          }
          return page;
        }),
      };
      queryClient.setQueryData(queryKey, newData);
    } else if (data.id === waveId) {
      queryClient.setQueryData(queryKey, updateFn(data));
    } else if (Array.isArray(data)) {
      queryClient.setQueryData(
        queryKey,
        data.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave)),
      );
    } else if (data.data && Array.isArray(data.data)) {
      const newData = {
        ...data,
        data: data.data.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave)),
      };
      queryClient.setQueryData(queryKey, newData);
    } else if (data.wave && data.wave.id === waveId) {
      queryClient.setQueryData(queryKey, {
        ...data,
        wave: updateFn(data.wave),
      });
    }
  });

  const listQueries = queryClient.getQueriesData({ queryKey: waveKeys.lists() });
  listQueries.forEach(([queryKey, data]: [any, any]) => {
    if (!data || !data.pages) return;

    const newData = {
      ...data,
      pages: data.pages.map((page: any) => ({
        ...page,
        data: Array.isArray(page.data)
          ? page.data.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave))
          : page.data,
      })),
    };
    queryClient.setQueryData(queryKey, newData);
  });

  const followingQueries = queryClient.getQueriesData({ queryKey: waveKeys.following() });
  followingQueries.forEach(([queryKey, data]: [any, any]) => {
    if (!data || !data.pages) return;

    const newData = {
      ...data,
      pages: data.pages.map((page: any) => ({
        ...page,
        data: Array.isArray(page.data)
          ? page.data.map((wave: any) => (wave.id === waveId ? updateFn(wave) : wave))
          : page.data,
      })),
    };
    queryClient.setQueryData(queryKey, newData);
  });
};

export const useWavesFeed = (params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.list(params),
    queryFn: ({ pageParam }) => wavesApi.getWaves({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
};

export const useFollowingFeed = (params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.following(),
    queryFn: ({ pageParam }) => wavesApi.getFollowingFeed({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
};

export const useUserWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.userWaves(username),
    queryFn: ({ pageParam }) => wavesApi.getUserWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: !!username,
  });
};

export const useSavedWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.savedWaves(username),
    queryFn: ({ pageParam }) => wavesApi.getSavedWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: !!username,
  });
};

export const useLikedWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.likedWaves(username),
    queryFn: ({ pageParam }) => wavesApi.getLikedWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: !!username,
  });
};

export const useWave = (
  id: string,
  options?: Omit<UseQueryOptions<Wave>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: waveKeys.detail(id),
    queryFn: () => wavesApi.getWave(id),
    enabled: !!id,
    ...options,
  });
};

export const useTrendingWaves = (limit: number = 10) => {
  return useQuery({
    queryKey: waveKeys.trending(),
    queryFn: () => wavesApi.getTrending(limit),
  });
};

export const useTopRatedWaves = (limit: number = 10) => {
  return useQuery({
    queryKey: waveKeys.topRated(),
    queryFn: () => wavesApi.getTopRated(limit),
  });
};

export const useCreateWave = (options?: UseMutationOptions<Wave, Error, CreateWaveDto>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWaveDto) => wavesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
    ...options,
  });
};

export const useUpdateWave = (
  options?: UseMutationOptions<Wave, Error, { id: string; data: UpdateWaveDto }>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => wavesApi.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(waveKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
    },
    ...options,
  });
};

export const useDeleteWave = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: waveKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
    ...options,
  });
};

export const useLikeWave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.like(id),
    onMutate: async (waveId) => {
      await queryClient.cancelQueries({ queryKey: waveKeys.all });

      const previousQueries = queryClient.getQueriesData({ queryKey: waveKeys.all });

      updateWaveInCache(queryClient, waveId, (wave: any) => ({
        ...wave,
        isLiked: !wave.isLiked,
        likesCount: wave.isLiked
          ? Math.max(0, (wave.likesCount || 0) - 1)
          : (wave.likesCount || 0) + 1,
      }));

      return { previousQueries };
    },
    onError: (_err, _waveId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, waveId) => {
      queryClient.invalidateQueries({ queryKey: waveKeys.detail(waveId) });
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
  });
};

export const useSaveWave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.save(id),
    onMutate: async (waveId) => {
      await queryClient.cancelQueries({ queryKey: waveKeys.all });

      const previousQueries = queryClient.getQueriesData({ queryKey: waveKeys.all });

      updateWaveInCache(queryClient, waveId, (wave: any) => ({
        ...wave,
        isSaved: !wave.isSaved,
        savesCount: wave.isSaved
          ? Math.max(0, (wave.savesCount || 0) - 1)
          : (wave.savesCount || 0) + 1,
      }));

      return { previousQueries };
    },
    onError: (_err, _waveId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, waveId) => {
      queryClient.invalidateQueries({ queryKey: waveKeys.detail(waveId) });
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
  });
};

export const useIncrementView = () => {
  return useMutation({
    mutationFn: (id: string) => wavesApi.incrementView(id),
  });
};
