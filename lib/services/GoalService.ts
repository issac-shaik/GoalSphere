import { supabase } from '../supabase';
import { BaseService, ServiceResponse } from './BaseService';
import { Goal, Progress, GoalWithProgress } from '../../types';
import { validateGoal, getTodayString, getLocalDateString } from '../utils';

export interface CreateGoalRequest {
  title: string;
  description?: string;
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target_days?: number;
  target_count?: number;
  icon: string;
  color?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  target_count?: number;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export class GoalService extends BaseService {
  async getUserGoals(userId?: string): Promise<ServiceResponse<GoalWithProgress[]>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          progress(*)
        `)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return this.createErrorResponse(error);
      }

      // Calculate progress statistics for each goal
      const goalsWithProgress: GoalWithProgress[] = data?.map(goal => {
        const progressEntries = goal.progress || [];
        const totalCompletions = progressEntries.length;
        
        // Calculate current streak
        let currentStreak = 0;
        const sortedProgress = progressEntries
          .sort((a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime());
        
        if (sortedProgress.length > 0) {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let checkDate = new Date(today);
          
          for (const progress of sortedProgress) {
            const progressDate = new Date(progress.completed_date);
            const checkDateStr = getLocalDateString(checkDate);
            const progressDateStr = getLocalDateString(progressDate);
            
            if (progressDateStr === checkDateStr) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }

        const lastCompleted = sortedProgress.length > 0 ? sortedProgress[0].completed_date : undefined;
        
        // Check if goal is completed today and get daily completion count
        const today = getTodayString();
        const todayEntries = progressEntries.filter(progress => progress.completed_date === today);
        const dailyCompletionCount = todayEntries.length;
        const targetCount = goal.target_count || 1;
        const completedToday = dailyCompletionCount >= targetCount;

        return {
          ...goal,
          total_completions: totalCompletions,
          current_streak: currentStreak,
          last_completed: lastCompleted,
          completed_today: completedToday,
          daily_completion_count: dailyCompletionCount,
        };
      }) || [];

      return this.createSuccessResponse(goalsWithProgress);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async createGoal(goalData: CreateGoalRequest): Promise<ServiceResponse<Goal>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      // Validate goal data
      const validation = validateGoal(goalData);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.errors.join(', '));
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalData,
          user_id: userId,
          target_days: goalData.target_days || 1,
          target_count: goalData.target_count || 1,
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async updateGoal(goalId: string, updates: UpdateGoalRequest): Promise<ServiceResponse<Goal>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async deleteGoal(goalId: string): Promise<ServiceResponse<void>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async toggleGoalCompletion(goalId: string, notes?: string): Promise<ServiceResponse<Progress>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      // Get goal info to check target_count
      const { data: goalData } = await supabase
        .from('goals')
        .select('target_count')
        .eq('id', goalId)
        .single();

      const targetCount = goalData?.target_count || 1;
      const today = getTodayString();

      // Get current progress for today
      const { data: todayProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', userId)
        .eq('completed_date', today);

      const currentCount = todayProgress?.length || 0;

      if (currentCount >= targetCount) {
        // Reset all completions for today when goal is fully completed
        if (todayProgress && todayProgress.length > 0) {
          const { error } = await supabase
            .from('progress')
            .delete()
            .eq('goal_id', goalId)
            .eq('user_id', userId)
            .eq('completed_date', today);

          if (error) {
            return this.createErrorResponse(error);
          }

          return this.createSuccessResponse({ message: 'All completions reset' });
        }
      } else {
        // Add completion
        const { data, error } = await supabase
          .from('progress')
          .insert({
            goal_id: goalId,
            user_id: userId,
            completed_date: today,
            completion_count: 1,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) {
          return this.createErrorResponse(error);
        }

        return this.createSuccessResponse(data);
      }
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getGoalProgress(goalId: string): Promise<ServiceResponse<Progress[]>> {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('goal_id', goalId)
        .order('completed_date', { ascending: false });

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data || []);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getTodaysGoals(userId?: string): Promise<ServiceResponse<GoalWithProgress[]>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const today = getTodayString();

      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          progress!inner(*)
        `)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .eq('duration_type', 'daily')
        .order('created_at', { ascending: false });

      if (error) {
        return this.createErrorResponse(error);
      }

      // Check completion status for today
      const goalsWithProgress: GoalWithProgress[] = await Promise.all(
        (data || []).map(async (goal) => {
          const { data: todayProgress } = await supabase
            .from('progress')
            .select('*')
            .eq('goal_id', goal.id)
            .eq('completed_date', today)
            .single();

          return {
            ...goal,
            total_completions: goal.progress?.length || 0,
            current_streak: 0, // Will be calculated separately if needed
            last_completed: todayProgress?.completed_date,
            completed_today: !!todayProgress,
          };
        })
      );

      return this.createSuccessResponse(goalsWithProgress);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const goalService = new GoalService();