import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { ActivityGridDay } from '../../types';
import { getLocalDateString } from '../utils';

interface UseGoalActivityReturn {
  activityData: ActivityGridDay[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useGoalActivity = (goalId?: string, days = 90): UseGoalActivityReturn => {
  const [activityData, setActivityData] = useState<ActivityGridDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityData = useCallback(async () => {
    if (!goalId) {
      setActivityData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get the date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Format dates for query
      const startDateStr = getLocalDateString(startDate);
      const endDateStr = getLocalDateString(endDate);
      
      // Get progress entries for this specific goal
      const { data: progressData, error } = await supabase
        .from('progress')
        .select('completed_date')
        .eq('goal_id', goalId)
        .gte('completed_date', startDateStr)
        .lte('completed_date', endDateStr)
        .order('completed_date', { ascending: false });

      if (error) {
        setError(error.message);
        setActivityData([]);
        return;
      }

      // Create a map of completed dates
      const completedDates = new Map<string, boolean>();
      progressData?.forEach(progress => {
        completedDates.set(progress.completed_date, true);
      });

      // Generate the full date range
      const result: ActivityGridDay[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = getLocalDateString(currentDate);
        result.push({
          date: dateString,
          completed: completedDates.has(dateString),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setActivityData(result);
    } catch (err) {
      setError('Failed to fetch activity data');
      setActivityData([]);
    } finally {
      setLoading(false);
    }
  }, [goalId, days]);

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