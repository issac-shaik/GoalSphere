import { useState, useEffect, useCallback } from 'react';
import { socialService, FeedItem } from '../services';
import { requestDeduplicator } from '../utils/requestDeduplicator';

interface UseHomeFeedReturn {
  feedItems: FeedItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refreshFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  clearError: () => void;
}

export const useHomeFeed = (): UseHomeFeedReturn => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await socialService.getHomeFeed();
      
      if (response.error) {
        setError(response.error);
        if (!isRefresh) {
          setFeedItems([]);
        }
      } else {
        setFeedItems(response.data || []);
      }
    } catch (err) {
      setError('Failed to load feed');
      if (!isRefresh) {
        setFeedItems([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshFeed = useCallback(async () => {
    await fetchFeed(true);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    // For now, just refresh the feed
    // In the future, this could implement pagination
    await refreshFeed();
  }, [refreshFeed]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    feedItems,
    loading,
    refreshing,
    error,
    refreshFeed,
    loadMore,
    clearError,
  };
};

// Hook for social interactions
export const useSocialActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const followUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await socialService.followUser(userId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to follow user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await socialService.unfollowUser(userId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Failed to unfollow user');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowStatus = useCallback(async (userId: string) => {
    try {
      return await requestDeduplicator.dedupe(
        socialService.getFollowStatus.bind(socialService),
        [userId],
        5000 // Cache for 5 seconds
      );
    } catch (err) {
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    getFollowStatus,
    clearError,
  };
};

// Hook for follow requests
export const useFollowRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await socialService.getPendingFollowRequests();
      
      if (response.error) {
        setError(response.error);
        setRequests([]);
      } else {
        setRequests(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch follow requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const approveRequest = useCallback(async (followId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await socialService.approveFollowRequest(followId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== followId));
      return true;
    } catch (err) {
      setError('Failed to approve request');
      return false;
    }
  }, []);

  const declineRequest = useCallback(async (followId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await socialService.declineFollowRequest(followId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== followId));
      return true;
    } catch (err) {
      setError('Failed to decline request');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    approveRequest,
    declineRequest,
    refetch: fetchRequests,
  };
};