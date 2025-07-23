import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useRefresh } from '../lib/hooks';
import { Notification } from '../lib/services';

interface NotificationsScreenProps {
  navigation: any;
}

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { 
    notifications, 
    loading, 
    error, 
    refreshNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearError 
  } = useNotifications();
  
  const { refreshing, onRefresh } = useRefresh(refreshNotifications);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const handleMarkAsRead = async (notificationId: string) => {
    setProcessingIds(prev => new Set(prev).add(notificationId));
    
    try {
      const success = await markAsRead(notificationId);
      if (!success) {
        Alert.alert('Error', 'Failed to mark notification as read');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessingIds(prev => new Set(prev).add(notificationId));
            
            try {
              const success = await deleteNotification(notificationId);
              if (!success) {
                Alert.alert('Error', 'Failed to delete notification');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            } finally {
              setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markAllAsRead();
      if (!success) {
        Alert.alert('Error', 'Failed to mark all notifications as read');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow_request':
        navigation.navigate('FollowRequests');
        break;
      case 'follow_approved':
        if (notification.from_user_id) {
          navigation.navigate('UserDetail', { userId: notification.from_user_id });
        }
        break;
      case 'goal_reaction':
        // Navigate to goals or profile - depending on your app structure
        navigation.navigate('Goals');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
        return 'person-add';
      case 'follow_approved':
        return 'checkmark-circle';
      case 'goal_reaction':
        return 'heart';
      case 'goal_completed':
        return 'trophy';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'follow_request':
        return '#3B82F6';
      case 'follow_approved':
        return '#10B981';
      case 'goal_reaction':
        return '#EF4444';
      case 'goal_completed':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNotification = (notification: Notification) => {
    const isProcessing = processingIds.has(notification.id);
    
    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.is_read && styles.unreadNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        disabled={isProcessing}
      >
        <View style={[
          styles.notificationIcon,
          { backgroundColor: getNotificationColor(notification.type) + '20' }
        ]}>
          <Ionicons 
            name={getNotificationIcon(notification.type)} 
            size={20} 
            color={getNotificationColor(notification.type)} 
          />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationText}>
              {notification.from_user?.name || notification.from_user?.username || 'Someone'}{' '}
              <Text style={styles.notificationMessage}>{notification.message}</Text>
            </Text>
            {!notification.is_read && (
              <View style={styles.unreadDot} />
            )}
          </View>
          
          <Text style={styles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(notification.id)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <Ionicons name="close" size={18} color="#6B7280" />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshNotifications}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {notifications.length === 0 && !loading && !error && (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              When you have notifications, they'll appear here.
            </Text>
          </View>
        )}

        {notifications.length > 0 && (
          <View style={styles.notificationsContainer}>
            {unreadCount > 0 && (
              <Text style={styles.sectionTitle}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </Text>
            )}
            {notifications.map(renderNotification)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 32,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  notificationsContainer: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  notificationMessage: {
    fontWeight: '400',
    color: '#6B7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  notificationTime: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});