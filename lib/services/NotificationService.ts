import { supabase } from '../supabase';
import { BaseService, ServiceResponse } from './BaseService';

export interface Notification {
  id: string;
  user_id: string;
  from_user_id?: string;
  type: 'goal_completed' | 'follow_request' | 'follow_approved' | 'goal_reaction';
  message: string;
  is_read: boolean;
  reaction_id?: string;
  created_at: string;
  from_user?: {
    username: string;
    name: string;
    avatar_url?: string;
  };
}

export class NotificationService extends BaseService {
  async getUserNotifications(): Promise<ServiceResponse<Notification[]>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          users!notifications_from_user_id_fkey(username, name, avatar_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return this.createErrorResponse(error);
      }

      const notifications: Notification[] = (data || []).map(notification => ({
        ...notification,
        from_user: notification.users,
      }));

      return this.createSuccessResponse(notifications);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async getUnreadCount(): Promise<ServiceResponse<number>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(count || 0);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async markAsRead(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async markAllAsRead(): Promise<ServiceResponse<void>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  async deleteNotification(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return this.createErrorResponse('User not authenticated');
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return this.createErrorResponse(error);
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }
}

export const notificationService = new NotificationService();