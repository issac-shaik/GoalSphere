import { useState, useCallback, useEffect } from 'react';

interface UseRefreshReturn {
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export const useRefresh = (refreshFunction: () => Promise<void>): UseRefreshReturn => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refreshFunction();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshFunction]);

  return {
    refreshing,
    onRefresh,
  };
};

// Hook for handling loading states with timeout
export const useLoadingTimeout = (timeoutMs = 10000) => {
  const [loading, setLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const startLoading = useCallback(() => {
    setLoading(true);
    setTimedOut(false);
    
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => {
      clearTimeout(timeout);
      setLoading(false);
      setTimedOut(false);
    };
  }, [timeoutMs]);

  return {
    loading,
    timedOut,
    startLoading,
  };
};

// Hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};