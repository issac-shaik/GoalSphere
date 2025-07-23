import { supabase } from '../supabase';
import { BaseService, ServiceResponse } from './BaseService';
import { Streak, ActivityGridDay } from '../../types';
import { getLocalDateString } from '../utils';

export class StreakService extends BaseService {
  async getUserStreak(userId?: string): Promise<ServiceResponse<Streak>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async updateStreakOnGoalCompletion(userId: string): Promise<ServiceResponse<Streak>> {
    try {
      // This will be handled by the database trigger, but we can also
      // manually recalculate if needed
      const { error } = await supabase.rpc('update_streak', {
        user_uuid: userId
      });

      if (error) {
        return this.createErrorResponse(error);
      }

      // Return updated streak
      return this.getUserStreak(userId);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getStreakHistory(userId?: string, days = 365): Promise<ServiceResponse<ActivityGridDay[]>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all progress entries for the date range
      const { data: progressData, error } = await supabase
        .from('progress')
        .select('completed_date')
        .eq('user_id', targetUserId)
        .gte('completed_date', getLocalDateString(startDate))
        .lte('completed_date', getLocalDateString(endDate));

      if (error) {
        return this.createErrorResponse(error);
      }

      // Create activity grid data
      const activityMap = new Map<string, boolean>();
      
      // Mark completed dates
      progressData?.forEach(progress => {
        activityMap.set(progress.completed_date, true);
      });

      // Generate full date range
      const activityData: ActivityGridDay[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dateString = getLocalDateString(currentDate);
        activityData.push({
          date: dateString,
          completed: activityMap.has(dateString),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return this.createSuccessResponse(activityData);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async calculateCurrentStreak(userId?: string): Promise<ServiceResponse<number>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      // Get recent progress entries
      const { data: progressData, error } = await supabase
        .from('progress')
        .select('completed_date')
        .eq('user_id', targetUserId)
        .order('completed_date', { ascending: false })
        .limit(100); // Get last 100 days to calculate streak

      if (error) {
        return this.createErrorResponse(error);
      }

      if (!progressData || progressData.length === 0) {
        return this.createSuccessResponse(0);
      }

      // Group by date to handle multiple completions per day
      const uniqueDates = [...new Set(progressData.map(p => p.completed_date))];
      uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      const today = new Date();
      let checkDate = new Date(today);

      for (const dateStr of uniqueDates) {
        const progressDate = new Date(dateStr);
        const checkDateStr = getLocalDateString(checkDate);
        const progressDateStr = getLocalDateString(progressDate);

        if (progressDateStr === checkDateStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (streak === 0 && progressDateStr === getLocalDateString(new Date(today.getTime() - 24 * 60 * 60 * 1000))) {
          // Allow streak to continue if last completion was yesterday
          streak++;
          checkDate.setDate(checkDate.getDate() - 2);
        } else {
          break;
        }
      }

      return this.createSuccessResponse(streak);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getWeeklyProgress(userId?: string): Promise<ServiceResponse<{ [key: string]: number }>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: progressData, error } = await supabase
        .from('progress')
        .select('completed_date')
        .eq('user_id', targetUserId)
        .gte('completed_date', getLocalDateString(startDate))
        .lte('completed_date', getLocalDateString(endDate));

      if (error) {
        return this.createErrorResponse(error);
      }

      // Count completions per day
      const weeklyProgress: { [key: string]: number } = {};
      
      progressData?.forEach(progress => {
        const date = progress.completed_date;
        weeklyProgress[date] = (weeklyProgress[date] || 0) + 1;
      });

      return this.createSuccessResponse(weeklyProgress);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const streakService = new StreakService();