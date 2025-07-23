import { useState, useEffect, useCallback } from 'react';
import { goalService, GoalWithProgress, CreateGoalRequest, UpdateGoalRequest } from '../services';
import { getTodayString } from '../utils';

interface UseGoalsReturn {
  goals: GoalWithProgress[];
  loading: boolean;
  error: string | null;
  createGoal: (goalData: CreateGoalRequest) => Promise<boolean>;
  updateGoal: (goalId: string, updates: UpdateGoalRequest) => Promise<boolean>;
  deleteGoal: (goalId: string) => Promise<boolean>;
  toggleCompletion: (goalId: string, notes?: string) => Promise<boolean>;
  refreshGoals: () => Promise<void>;
  clearError: () => void;
}

export const useGoals = (userId?: string): UseGoalsReturn => {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await goalService.getUserGoals(userId);
      
      if (response.error) {
        setError(response.error);
        setGoals([]);
      } else {
        setGoals(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createGoal = useCallback(async (goalData: CreateGoalRequest): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await goalService.createGoal(goalData);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Refresh goals to get updated list with progress data
      await fetchGoals();
      return true;
    } catch (err) {
      setError('Failed to create goal');
      return false;
    }
  }, [fetchGoals]);

  const updateGoal = useCallback(async (goalId: string, updates: UpdateGoalRequest): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await goalService.updateGoal(goalId, updates);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state optimistically
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, ...updates, updated_at: new Date().toISOString() }
          : goal
      ));
      
      return true;
    } catch (err) {
      setError('Failed to update goal');
      return false;
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await goalService.deleteGoal(goalId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Remove from local state
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      return true;
    } catch (err) {
      setError('Failed to delete goal');
      return false;
    }
  }, []);

  const toggleCompletion = useCallback(async (goalId: string, notes?: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await goalService.toggleGoalCompletion(goalId, notes);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state optimistically
      const today = getTodayString();
      setGoals(prev => prev.map(goal => {
        if (goal.id === goalId) {
          const targetCount = goal.target_count || 1;
          const currentCount = goal.daily_completion_count || 0;
          
          // Determine if we're adding or removing a completion
          const isAddingCompletion = currentCount < targetCount;
          const newCompletionCount = isAddingCompletion 
            ? currentCount + 1 
            : 0; // Reset to 0 when goal is fully completed
          
          return {
            ...goal,
            daily_completion_count: newCompletionCount,
            completed_today: newCompletionCount >= targetCount,
            total_completions: isAddingCompletion 
              ? goal.total_completions + 1 
              : goal.total_completions - currentCount, // Subtract all current completions when resetting
            last_completed: isAddingCompletion ? today : goal.last_completed,
          };
        }
        return goal;
      }));
      
      return true;
    } catch (err) {
      setError('Failed to toggle goal completion');
      return false;
    }
  }, []);

  const refreshGoals = useCallback(async () => {
    await fetchGoals();
  }, [fetchGoals]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleCompletion,
    refreshGoals,
    clearError,
  };
};

// Hook for getting today's goals specifically
export const useTodaysGoals = (userId?: string) => {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaysGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await goalService.getTodaysGoals(userId);
      
      if (response.error) {
        setError(response.error);
        setGoals([]);
      } else {
        setGoals(response.data || []);
      }
    } catch (err) {
      setError('Failed to fetch today\'s goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTodaysGoals();
  }, [fetchTodaysGoals]);

  return {
    goals,
    loading,
    error,
    refetch: fetchTodaysGoals,
  };
};

// Hook for goals by duration type
export const useGoalsByType = (durationType: 'daily' | 'weekly' | 'monthly' | 'yearly', userId?: string) => {
  const { goals, loading, error, ...rest } = useGoals(userId);
  
  const filteredGoals = goals.filter(goal => goal.duration_type === durationType);
  
  return {
    goals: filteredGoals,
    loading,
    error,
    ...rest,
  };
};