import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userService } from '../lib/services';
import { UserWithStats } from '../lib/services/UserService';
import { UserCardSkeleton } from '../components/SkeletonLoader';
import { useSocialActions } from '../lib/hooks';
import { useTheme } from '../contexts/ThemeContext';

interface FollowersScreenProps {
  route: {
    params: {
      userId: string;
      username: string;
      title: string; // "Followers" or "Following"
      type: 'followers' | 'following';
    };
  };
  navigation: any;
}

export default function FollowersScreen({ route, navigation }: FollowersScreenProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId, username, title, type } = route.params;
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { followUser, unfollowUser, getFollowStatus } = useSocialActions();

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (type === 'followers') {
        response = await userService.getFollowers(userId);
      } else {
        response = await userService.getFollowing(userId);
      }

      if (response.error) {
        setError(response.error);
        setUsers([]);
      } else {
        // Add follow status for each user
        const usersWithFollowStatus = await Promise.all(
          (response.data || []).map(async (user) => {
            const followStatus = await getFollowStatus(user.id);
            return {
              ...user,
              isFollowing: followStatus?.is_approved || false,
              isRequested: followStatus && !followStatus.is_approved,
            };
          })
        );
        setUsers(usersWithFollowStatus);
      }
    } catch (err) {
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleFollowToggle = async (targetUserId: string) => {
    try {
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return;

      if (targetUser.isFollowing) {
        const success = await unfollowUser(targetUserId);
        if (success) {
          setUsers(prev => prev.map(u => 
            u.id === targetUserId 
              ? { ...u, isFollowing: false, isRequested: false }
              : u
          ));
        }
      } else if (targetUser.isRequested) {
        const success = await unfollowUser(targetUserId);
        if (success) {
          setUsers(prev => prev.map(u => 
            u.id === targetUserId 
              ? { ...u, isRequested: false }
              : u
          ));
        }
      } else {
        const success = await followUser(targetUserId);
        if (success) {
          setUsers(prev => prev.map(u => 
            u.id === targetUserId 
              ? { 
                  ...u, 
                  isFollowing: !targetUser.is_private,
                  isRequested: targetUser.is_private 
                }
              : u
          ));
        }
      }
    } catch (error) {
      console.error('Error handling follow:', error);
    }
  };

  const handleUserPress = (user: UserWithStats) => {
    navigation.navigate('UserDetail', {
      userId: user.id,
      username: user.username,
    });
  };

  const renderUserItem = (user: UserWithStats) => {
    return (
      <TouchableOpacity 
        key={user.id} 
        style={styles.userCard}
        onPress={() => handleUserPress(user)}
      >
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name || user.username}</Text>
              {user.is_private && (
                <Ionicons name="lock-closed" size={14} color="#6B7280" />
              )}
            </View>
            <Text style={styles.userUsername}>@{user.username}</Text>
            {user.bio && (
              <Text style={styles.userBio} numberOfLines={2}>
                {user.bio}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.followButton,
            user.isFollowing && styles.followingButton,
            user.isRequested && styles.requestedButton,
          ]}
          onPress={() => handleFollowToggle(user.id)}
        >
          <Text
            style={[
              styles.followButtonText,
              user.isFollowing && styles.followingButtonText,
              user.isRequested && styles.requestedButtonText,
            ]}
          >
            {user.isFollowing ? 'Following' : user.isRequested ? 'Requested' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View>
            {Array.from({ length: 5 }).map((_, index) => (
              <UserCardSkeleton key={index} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUsers}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              No {type === 'followers' ? 'followers' : 'following'} yet
            </Text>
            <Text style={styles.emptyText}>
              {type === 'followers' 
                ? `@${username} doesn't have any followers yet`
                : `@${username} isn't following anyone yet`
              }
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {users.length} {type === 'followers' ? 'follower' : 'following'}{users.length !== 1 ? 's' : ''}
            </Text>
            {users.map(renderUserItem)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 16,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  userBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  followButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
  },
  followingButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  requestedButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  requestedButtonText: {
    color: '#D97706',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});