import { useState, useEffect, useCallback } from 'react';
import { userService, UserWithStats, UpdateUserRequest } from '../services';

interface UseUserDataReturn {
  user: UserWithStats | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: UpdateUserRequest) => Promise<boolean>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

export const useUserData = (): UseUserDataReturn => {
  const [user, setUser] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getCurrentUser();
      
      if (response.error) {
        setError(response.error);
        setUser(null);
      } else {
        setUser(response.data);
      }
    } catch (err) {
      setError('Failed to fetch user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: UpdateUserRequest): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await userService.updateUserProfile(updates);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state with new data
      if (response.data && user) {
        setUser({
          ...user,
          ...response.data,
        });
      }
      
      return true;
    } catch (err) {
      setError('Failed to update profile');
      return false;
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    updateProfile,
    refreshData,
    clearError,
  };
};

// Hook for getting other users' data
export const useUserById = (userId: string | null) => {
  const [user, setUser] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getUserById(id);
      
      if (response.error) {
        setError(response.error);
        setUser(null);
      } else {
        setUser(response.data);
      }
    } catch (err) {
      setError('Failed to fetch user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    } else {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, [userId, fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: userId ? () => fetchUser(userId) : () => {},
  };
};

// Hook for user search
export const useUserSearch = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const searchUsers = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) {
      setUsers([]);
      setHasMore(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.searchUsers(query, page);
      
      if (response.error) {
        setError(response.error);
        if (page === 1) setUsers([]);
      } else {
        if (page === 1) {
          setUsers(response.data);
        } else {
          setUsers(prev => [...prev, ...response.data]);
        }
        setHasMore(response.hasMore);
      }
    } catch (err) {
      setError('Failed to search users');
      if (page === 1) setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setUsers([]);
    setError(null);
    setHasMore(false);
  }, []);

  return {
    users,
    loading,
    error,
    hasMore,
    searchUsers,
    clearSearch,
  };
};