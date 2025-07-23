import { supabase } from '../supabase';
import { BaseService, ServiceResponse } from './BaseService';
import { User, Follow } from '../../types';
import { UserWithStats } from './UserService';
import { GoalWithProgress } from './GoalService';
import { ReactionSummary } from './ReactionService';
import { requestDeduplicator } from '../utils/requestDeduplicator';
import { getTodayString, getLocalDateString } from '../utils';

export interface GoalWithReactions extends GoalWithProgress {
  reactions?: ReactionSummary;
}

export interface FeedItem {
  id: string;
  user: UserWithStats;
  goals: GoalWithReactions[];
  streak: number;
  recent_completions: any[];
  timestamp: string;
  completed_today: number;
  total_goals: number;
}

export class SocialService extends BaseService {
  async getHomeFeed(): Promise<ServiceResponse<FeedItem[]>> {
    return requestDeduplicator.dedupe(this._getHomeFeedInternal.bind(this), [], 15000); // Cache for 15 seconds
  }

  private async _getHomeFeedInternal(): Promise<ServiceResponse<FeedItem[]>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const today = getTodayString();

      // Single optimized query to get all feed data
      const { data: feedData, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          users!follows_following_id_fkey(
            *,
            streaks(current_streak, longest_streak),
            goals!goals_user_id_fkey(
              *,
              progress!progress_goal_id_fkey(*)
            )
          )
        `)
        .eq('follower_id', userId)
        .eq('is_approved', true)
        .eq('users.goals.is_active', true)
        .eq('users.goals.duration_type', 'daily');

      if (error) {
        return this.createErrorResponse(error);
      }

      if (!feedData || feedData.length === 0) {
        return this.createSuccessResponse([]);
      }

      // Get all user IDs for batch queries
      const userIds = feedData.map(f => f.following_id).filter(Boolean);
      
      // Batch query for today's completions
      const { data: allTodayCompletions } = await supabase
        .from('progress')
        .select('*')
        .in('user_id', userIds)
        .eq('completed_date', today);

      // Batch query for recent completions (last 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const { data: allRecentCompletions } = await supabase
        .from('progress')
        .select(`
          *,
          goals(title, icon)
        `)
        .in('user_id', userIds)
        .gte('completed_date', getLocalDateString(threeDaysAgo))
        .order('completed_date', { ascending: false });

      // Get all goal IDs that are completed today
      const completedGoalIds = allTodayCompletions
        ?.map(c => c.goal_id)
        .filter(Boolean) || [];

      // Batch query for reactions
      const { data: allReactions } = completedGoalIds.length > 0 ? await supabase
        .from('reactions')
        .select('reaction_emoji, user_id, goal_id')
        .in('goal_id', completedGoalIds)
        .eq('progress_date', today) : { data: [] };

      // Process feed items efficiently
      const feedItems: FeedItem[] = [];

      for (const follow of feedData) {
        const user = follow.users;
        if (!user || !user.goals) continue;

        // Filter today's completions for this user
        const userTodayCompletions = allTodayCompletions?.filter(c => c.user_id === user.id) || [];
        const userRecentCompletions = allRecentCompletions?.filter(c => c.user_id === user.id) || [];

        // Process goals - only include completed ones
        const completedGoals = user.goals.filter(goal => 
          userTodayCompletions.some(c => c.goal_id === goal.id)
        ).slice(0, 6); // Limit to 6 for feed

        if (completedGoals.length === 0) continue;

        // Process reactions for completed goals
        const goalsWithReactions: GoalWithReactions[] = completedGoals.map(goal => {
          const goalReactions = allReactions?.filter(r => r.goal_id === goal.id) || [];
          
          const reactionCounts: { [key: string]: number } = {};
          let userReaction: string | undefined;
          
          goalReactions.forEach(reaction => {
            reactionCounts[reaction.reaction_emoji] = (reactionCounts[reaction.reaction_emoji] || 0) + 1;
            if (reaction.user_id === userId) {
              userReaction = reaction.reaction_emoji;
            }
          });

          const reactionSummary: ReactionSummary = {
            goal_id: goal.id,
            progress_date: today,
            reactions: reactionCounts,
            user_reaction: userReaction,
            total_count: goalReactions.length,
          };

          return {
            ...goal,
            total_completions: goal.progress?.length || 0,
            current_streak: 0, // Simplified for feed
            completed_today: true,
            reactions: reactionSummary,
          };
        });

        const feedItem: FeedItem = {
          id: `${user.id}-${today}`,
          user: {
            ...user,
            current_streak: user.streaks?.[0]?.current_streak || 0,
            longest_streak: user.streaks?.[0]?.longest_streak || 0,
          },
          goals: goalsWithReactions,
          streak: user.streaks?.[0]?.current_streak || 0,
          recent_completions: userRecentCompletions.slice(0, 10),
          timestamp: new Date().toISOString(),
          completed_today: userTodayCompletions.length,
          total_goals: goalsWithReactions.length,
        };

        feedItems.push(feedItem);
      }

      // Sort by recent activity
      feedItems.sort((a, b) => {
        if (a.completed_today !== b.completed_today) {
          return b.completed_today - a.completed_today;
        }
        return b.streak - a.streak;
      });

      return this.createSuccessResponse(feedItems);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async followUser(userId: string): Promise<ServiceResponse<Follow>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      if (currentUserId === userId) {
        return this.createErrorResponse('Cannot follow yourself');
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        return this.createErrorResponse('Already following this user');
      }

      // Check if target user is private
      const { data: targetUser } = await supabase
        .from('users')
        .select('is_private')
        .eq('id', userId)
        .single();

      const isApproved = !targetUser?.is_private;

      const { data, error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: userId,
          is_approved: isApproved,
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      // Create notification if it's a follow request
      if (!isApproved) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: currentUserId,
            type: 'follow_request',
            message: 'sent you a follow request',
          });
      }

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async unfollowUser(userId: string): Promise<ServiceResponse<void>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', userId);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getFollowStatus(userId: string): Promise<ServiceResponse<Follow | null>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data || null);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async approveFollowRequest(followId: string): Promise<ServiceResponse<Follow>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follows')
        .update({ is_approved: true })
        .eq('id', followId)
        .eq('following_id', currentUserId)
        .select()
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      // Create approval notification
      await supabase
        .from('notifications')
        .insert({
          user_id: data.follower_id,
          from_user_id: currentUserId,
          type: 'follow_approved',
          message: 'approved your follow request',
        });

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getPendingFollowRequests(): Promise<ServiceResponse<Follow[]>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          *,
          users!follows_follower_id_fkey(*)
        `)
        .eq('following_id', currentUserId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(data || []);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async declineFollowRequest(followId: string): Promise<ServiceResponse<void>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followId)
        .eq('following_id', currentUserId);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const socialService = new SocialService();