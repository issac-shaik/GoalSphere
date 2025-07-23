import { useState, useEffect, useCallback } from 'react';
import { streakService } from '../services';
import { Streak, ActivityGridDay } from '../../types';

interface UseStreaksReturn {
  streak: Streak | null;
  loading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
  clearError: () => void;
}

export const useStreaks = (userId?: string): UseStreaksReturn => {
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await streakService.getUserStreak(userId);
      
      if (response.error) {
        setError(response.error);
        setStreak(null);
      } else {
        setStreak(response.data);
      }
    } catch (err) {
      setError('Failed to fetch streak data');
      setStreak(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshStreak = useCallback(async () => {
    await fetchStreak();
  }, [fetchStreak]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return {
    streak,
    loading,
    error,
    refreshStreak,
    clearError,
  };
};

// Hook for activity grid data
export const useActivityGrid = (userId?: string, days = 365) => {
  const [activityData, setActivityData] = useState<ActivityGridDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await streakService.getStreakHistory(userId, days);
      
      if (response.error) {
        setError(response.error);
        setActivityData([]);
      } else {
        setActivityData(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch activity data');
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  return {
    activityData,
    loading,
    error,
    refetch: fetchActivityData,
  };
};

// Hook for weekly progress
export const useWeeklyProgress = (userId?: string) => {
  const [weeklyProgress, setWeeklyProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await streakService.getWeeklyProgress(userId);
      
      if (response.error) {
        setError(response.error);
        setWeeklyProgress({});
      } else {
        setWeeklyProgress(response.data || {});
      }
    } catch (err) {
      setError('Failed to fetch weekly progress');
      setWeeklyProgress({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWeeklyProgress();
  }, [fetchWeeklyProgress]);

  return {
    weeklyProgress,
    loading,
    error,
    refetch: fetchWeeklyProgress,
  };
};

// Hook for calculating current streak manually
export const useCurrentStreak = (userId?: string) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStreak = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await streakService.calculateCurrentStreak(userId);
      
      if (response.error) {
        setError(response.error);
        setCurrentStreak(0);
      } else {
        setCurrentStreak(response.data || 0);
      }
    } catch (err) {
      setError('Failed to calculate streak');
      setCurrentStreak(0);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    calculateStreak();
  }, [calculateStreak]);

  return {
    currentStreak,
    loading,
    error,
    recalculate: calculateStreak,
  };
};