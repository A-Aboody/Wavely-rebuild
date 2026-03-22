import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { wavesApi } from '../api/waves.api';
import {
  Wave,
  CreateWaveDto,
  UpdateWaveDto,
  FeedParams,
  CursorPaginatedResponse,
} from '@wavely/shared';

// Query Keys
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
  // Get all wave-related queries
  const queries = queryClient.getQueriesData({ queryKey: waveKeys.all });

  queries.forEach(([queryKey, data]: [any, any]) => {
    if (!data) return;

    // Handle infinite query pages (feed data - both For You and Following)
    if (data.pages && Array.isArray(data.pages)) {
      const newData = {
        ...data,
        pages: data.pages.map((page: any) => {
          // Handle different page structures
          if (page.data && Array.isArray(page.data)) {
            return {
              ...page,
              data: page.data.map((wave: any) => 
                wave.id === waveId ? updateFn(wave) : wave
              ),
            };
          }
          // Some queries might have waves directly in the page
          else if (Array.isArray(page)) {
            return page.map((wave: any) => 
              wave.id === waveId ? updateFn(wave) : wave
            );
          }
          return page;
        }),
      };
      queryClient.setQueryData(queryKey, newData);
    }
    // Handle single wave
    else if (data.id === waveId) {
      queryClient.setQueryData(queryKey, updateFn(data));
    }
    // Handle array of waves (non-paginated lists)
    else if (Array.isArray(data)) {
      queryClient.setQueryData(queryKey, data.map((wave: any) => 
        wave.id === waveId ? updateFn(wave) : wave
      ));
    }
    // Handle trending/top-rated queries that might have different structures
    else if (data.data && Array.isArray(data.data)) {
      const newData = {
        ...data,
        data: data.data.map((wave: any) => 
          wave.id === waveId ? updateFn(wave) : wave
        ),
      };
      queryClient.setQueryData(queryKey, newData);
    }
    // Handle the case where data is a single wave object in a different structure
    else if (data.wave && data.wave.id === waveId) {
      queryClient.setQueryData(queryKey, {
        ...data,
        wave: updateFn(data.wave)
      });
    }
  });

  // Also update any queries that might be using different structures
  // Specifically handle the "For You" and "Following" tabs separately
  const listQueries = queryClient.getQueriesData({ queryKey: waveKeys.lists() });
  listQueries.forEach(([queryKey, data]: [any, any]) => {
    if (!data || !data.pages) return;
    
    const newData = {
      ...data,
      pages: data.pages.map((page: any) => ({
        ...page,
        data: Array.isArray(page.data) ? page.data.map((wave: any) => 
          wave.id === waveId ? updateFn(wave) : wave
        ) : page.data,
      })),
    };
    queryClient.setQueryData(queryKey, newData);
  });

  // Handle following queries specifically
  const followingQueries = queryClient.getQueriesData({ queryKey: waveKeys.following() });
  followingQueries.forEach(([queryKey, data]: [any, any]) => {
    if (!data || !data.pages) return;
    
    const newData = {
      ...data,
      pages: data.pages.map((page: any) => ({
        ...page,
        data: Array.isArray(page.data) ? page.data.map((wave: any) => 
          wave.id === waveId ? updateFn(wave) : wave
        ) : page.data,
      })),
    };
    queryClient.setQueryData(queryKey, newData);
  });
};

// Infinite Query for Feed
export const useWavesFeed = (params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.list(params),
    queryFn: ({ pageParam }) =>
      wavesApi.getWaves({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });
};

// Infinite Query for Following Feed
export const useFollowingFeed = (params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.following(),
    queryFn: ({ pageParam }) =>
      wavesApi.getFollowingFeed({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
  });
};

// Infinite Query for User Waves
export const useUserWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.userWaves(username),
    queryFn: ({ pageParam }) =>
      wavesApi.getUserWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled: !!username,
  });
};

// Infinite Query for Saved Waves
export const useSavedWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.savedWaves(username),
    queryFn: ({ pageParam }) =>
      wavesApi.getSavedWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled: !!username,
  });
};

// Infinite Query for Liked Waves
export const useLikedWaves = (username: string, params: FeedParams = {}) => {
  return useInfiniteQuery({
    queryKey: waveKeys.likedWaves(username),
    queryFn: ({ pageParam }) =>
      wavesApi.getLikedWaves(username, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    enabled: !!username,
  });
};

// Query for Single Wave
export const useWave = (
  id: string,
  options?: Omit<UseQueryOptions<Wave>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: waveKeys.detail(id),
    queryFn: () => wavesApi.getWave(id),
    enabled: !!id,
    ...options,
  });
};

// Query for Trending Waves
export const useTrendingWaves = (limit: number = 10) => {
  return useQuery({
    queryKey: waveKeys.trending(),
    queryFn: () => wavesApi.getTrending(limit),
  });
};

// Query for Top Rated Waves
export const useTopRatedWaves = (limit: number = 10) => {
  return useQuery({
    queryKey: waveKeys.topRated(),
    queryFn: () => wavesApi.getTopRated(limit),
  });
};

// Mutation to Create Wave
export const useCreateWave = (
  options?: UseMutationOptions<Wave, Error, CreateWaveDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWaveDto) => wavesApi.create(data),
    onSuccess: () => {
      // Invalidate and refetch waves lists
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
    ...options,
  });
};

// Mutation to Update Wave
export const useUpdateWave = (
  options?: UseMutationOptions<Wave, Error, { id: string; data: UpdateWaveDto }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => wavesApi.update(id, data),
    onSuccess: (data) => {
      // Update the specific wave in cache
      queryClient.setQueryData(waveKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
    },
    ...options,
  });
};

// Mutation to Delete Wave
export const useDeleteWave = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: waveKeys.detail(id) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
    ...options,
  });
};

// Mutation to Like Wave - FIXED with better cache updates
export const useLikeWave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.like(id),
    onMutate: async (waveId) => {
      // Cancel all outgoing wave queries
      await queryClient.cancelQueries({ queryKey: waveKeys.all });

      // Store previous values for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: waveKeys.all });

      // Update wave in all cache structures
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
      // Rollback all optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, waveId) => {
      // Invalidate specific queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: waveKeys.detail(waveId) });
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
  });
};

// Mutation to Save Wave - FIXED with better cache updates
export const useSaveWave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => wavesApi.save(id),
    onMutate: async (waveId) => {
      // Cancel all outgoing wave queries
      await queryClient.cancelQueries({ queryKey: waveKeys.all });

      // Store previous values for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: waveKeys.all });

      // Update wave in all cache structures
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
      // Rollback all optimistic updates
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, waveId) => {
      // Invalidate specific queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: waveKeys.detail(waveId) });
      queryClient.invalidateQueries({ queryKey: waveKeys.lists() });
      queryClient.invalidateQueries({ queryKey: waveKeys.following() });
    },
  });
};

// Mutation to Increment View
export const useIncrementView = () => {
  return useMutation({
    mutationFn: (id: string) => wavesApi.incrementView(id),
  });
};