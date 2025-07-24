import { supabase } from '../supabase';
import { BaseService, ServiceResponse, PaginatedResponse } from './BaseService';
import { User } from '../../types';
import { validateUser } from '../utils';

export interface CreateUserRequest {
  username: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface UpdateUserRequest {
  name?: string;
  bio?: string;
  avatar_url?: string;
  is_private?: boolean;
}

export interface UserWithStats extends User {
  followers_count?: number;
  following_count?: number;
  total_goals_completed?: number;
  current_streak?: number;
  longest_streak?: number;
  isFollowing?: boolean;
  isRequested?: boolean;
  streak?: number;
}

export class UserService extends BaseService {
  async createUserProfile(userData: CreateUserRequest): Promise<ServiceResponse<User>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      // Check if user profile already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingUser) {
        return this.createErrorResponse('User profile already exists');
      }

      // Validate user data
      const validation = validateUser(userData);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.errors.join(', '));
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          username: userData.username,
          name: userData.name || 'User',
          bio: userData.bio,
          avatar_url: userData.avatar_url,
        })
        .select()
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      // Also create streak record if it doesn't exist
      await supabase
        .from('streaks')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
        });

      return this.createSuccessResponse(data);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getCurrentUser(): Promise<ServiceResponse<UserWithStats>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          followers:follows!following_id(count),
          following:follows!follower_id(count),
          streaks(current_streak, longest_streak)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      // Get total goals completed
      const { count: totalGoalsCompleted } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const userWithStats: UserWithStats = {
        ...data,
        followers_count: data.followers?.[0]?.count || 0,
        following_count: data.following?.[0]?.count || 0,
        total_goals_completed: totalGoalsCompleted || 0,
        current_streak: data.streaks?.[0]?.current_streak || 0,
        longest_streak: data.streaks?.[0]?.longest_streak || 0,
      };

      return this.createSuccessResponse(userWithStats);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getUserById(id: string): Promise<ServiceResponse<UserWithStats>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          followers:follows!following_id(count),
          following:follows!follower_id(count),
          streaks(current_streak, longest_streak)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return this.createErrorResponse(error);
      }

      // Get total goals completed
      const { count: totalGoalsCompleted } = await supabase
        .from('progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      const userWithStats: UserWithStats = {
        ...data,
        followers_count: data.followers?.[0]?.count || 0,
        following_count: data.following?.[0]?.count || 0,
        total_goals_completed: totalGoalsCompleted || 0,
        current_streak: data.streaks?.[0]?.current_streak || 0,
        longest_streak: data.streaks?.[0]?.longest_streak || 0,
      };

      return this.createSuccessResponse(userWithStats);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async updateUserProfile(updates: UpdateUserRequest): Promise<ServiceResponse<User>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      // Validate user data
      const validation = validateUser(updates);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.errors.join(', '));
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
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

  async searchUsers(query: string, page = 1, limit = 20): Promise<PaginatedResponse<UserWithStats>> {
    try {
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        return {
          data: [],
          count: 0,
          error: 'User not authenticated',
          hasMore: false,
        };
      }

      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('users')
        .select(`
          *,
          streaks(current_streak, longest_streak)
        `, { count: 'exact' })
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .range(offset, offset + limit - 1)
        .order('username');

      if (error) {
        return {
          data: [],
          count: 0,
          error: this.handleError(error),
          hasMore: false,
        };
      }

      // Add follow status and streak info for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        (data || []).map(async (user) => {
          // Get follow status
          const { data: followData } = await supabase
            .from('follows')
            .select('is_approved')
            .eq('follower_id', currentUserId)
            .eq('following_id', user.id)
            .single();

          return {
            ...user,
            current_streak: user.streaks?.[0]?.current_streak || 0,
            longest_streak: user.streaks?.[0]?.longest_streak || 0,
            isFollowing: followData?.is_approved || false,
            isRequested: followData && !followData.is_approved,
            streak: user.streaks?.[0]?.current_streak || 0,
          };
        })
      );

      return this.createPaginatedResponse(usersWithStats, count, page, limit);
    } catch (error) {
      return {
        data: [],
        count: 0,
        error: this.handleError(error),
        hasMore: false,
      };
    }
  }

  async getFollowedUsers(): Promise<ServiceResponse<User[]>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          users!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId)
        .eq('is_approved', true);

      if (error) {
        return this.createErrorResponse(error);
      }

      const followedUsers = data?.map(follow => follow.users).filter(Boolean) || [];
      return this.createSuccessResponse(followedUsers);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getFollowers(userId?: string): Promise<ServiceResponse<User[]>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          users!follows_follower_id_fkey(*)
        `)
        .eq('following_id', targetUserId)
        .eq('is_approved', true);

      if (error) {
        return this.createErrorResponse(error);
      }

      const followers = data?.map(follow => follow.users).filter(Boolean) || [];
      return this.createSuccessResponse(followers);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getFollowing(userId?: string): Promise<ServiceResponse<User[]>> {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        return this.createErrorResponse('User not found');
      }

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          users!follows_following_id_fkey(*)
        `)
        .eq('follower_id', targetUserId)
        .eq('is_approved', true);

      if (error) {
        return this.createErrorResponse(error);
      }

      const following = data?.map(follow => follow.users).filter(Boolean) || [];
      return this.createSuccessResponse(following);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const userService = new UserService();