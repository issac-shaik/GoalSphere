import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/NotificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsResponse, countResponse] = await Promise.all([
        notificationService.getUserNotifications(),
        notificationService.getUnreadCount(),
      ]);
      
      if (notificationsResponse.error) {
        setError(notificationsResponse.error);
        setNotifications([]);
      } else {
        setNotifications(notificationsResponse.data || []);
      }

      if (countResponse.error) {
        setError(countResponse.error);
        setUnreadCount(0);
      } else {
        setUnreadCount(countResponse.data || 0);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await notificationService.markAsRead(notificationId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      setError('Failed to mark notification as read');
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await notificationService.markAllAsRead();
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      setError('Failed to mark all notifications as read');
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await notificationService.deleteNotification(notificationId);
      
      if (response.error) {
        setError(response.error);
        return false;
      }
      
      // Update local state
      const wasRead = notifications.find(n => n.id === notificationId)?.is_read;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (!wasRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      setError('Failed to delete notification');
      return false;
    }
  }, [notifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  };
};