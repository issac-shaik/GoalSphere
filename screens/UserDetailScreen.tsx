import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ActivityGrid } from '../components/ActivityGrid';
import { ProfileSkeleton } from '../components/SkeletonLoader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGoalActivity } from '../lib/hooks';
import { GoalWithProgress, ActivityGridDay } from '../types';
import { getLocalDateString } from '../lib/utils';

interface UserDetailScreenProps {
  route: {
    params: {
      userId: string;
      username: string;
    };
  };
  navigation: any;
}

export default function UserDetailScreen({ route, navigation }: UserDetailScreenProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { userId, username } = route.params;
  
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userGoals, setUserGoals] = useState<GoalWithProgress[]>([]);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activityData, setActivityData] = useState<{ [key: string]: ActivityGridDay[] }>({});

  useEffect(() => {
    loadUserProfile();
    loadUserGoals();
    checkFollowStatus();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          name,
          bio,
          avatar_url,
          is_private,
          created_at,
          streaks(current_streak, longest_streak)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get follower counts
      const { data: followersData } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', userId)
        .eq('is_approved', true);

      const { data: followingData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('is_approved', true);

      setUserProfile({
        ...data,
        streak: data.streaks?.[0]?.current_streak || 0,
        longestStreak: data.streaks?.[0]?.longest_streak || 0,
        followersCount: followersData?.length || 0,
        followingCount: followingData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
      setLoading(false);
    }
  };

  const loadUserGoals = async () => {
    if (!user) return;

    try {
      // Check if we can view this user's goals (public account or following)
      const canView = await checkCanViewGoals();
      if (!canView) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_user_goals_with_progress', { user_uuid: userId });

      if (error) throw error;

      setUserGoals(data || []);

      // Load activity data for each goal
      const activityPromises = data.map(async (goal: any) => {
        const { data: activityData, error } = await supabase
          .rpc('get_activity_grid', { 
            goal_uuid: goal.goal_id,
            start_date: getLocalDateString(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
          });

        if (error) {
          console.error('Error loading activity data:', error);
          return { goalId: goal.goal_id, data: [] };
        }

        return { goalId: goal.goal_id, data: activityData || [] };
      });

      const activityResults = await Promise.all(activityPromises);
      const activityMap: { [key: string]: ActivityGridDay[] } = {};
      
      activityResults.forEach(result => {
        activityMap[result.goalId] = result.data;
      });

      setActivityData(activityMap);
    } catch (error) {
      console.error('Error loading user goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanViewGoals = async () => {
    if (!user || !userProfile) return false;
    
    // Can always view own goals
    if (userId === user.id) return true;
    
    // Can view public accounts
    if (!userProfile.is_private) return true;
    
    // Check if following for private accounts
    const { data } = await supabase
      .from('follows')
      .select('is_approved')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    return data?.is_approved || false;
  };

  const checkFollowStatus = async () => {
    if (!user || userId === user.id) return;

    try {
      const { data } = await supabase
        .from('follows')
        .select('is_approved')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(data?.is_approved || false);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
            is_approved: !userProfile?.is_private,
          });

        if (error) throw error;
        
        if (userProfile?.is_private) {
          Alert.alert('Follow Request Sent', `Follow request sent to @${userProfile.username}`);
        } else {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const getIconName = (iconName: string) => {
    const iconMap: any = {
      fitness: 'fitness-outline',
      book: 'book-outline',
      heart: 'heart-outline',
      water: 'water-outline',
      leaf: 'leaf-outline',
      moon: 'moon-outline',
      sunny: 'sunny-outline',
      'musical-notes': 'musical-notes-outline',
      camera: 'camera-outline',
      car: 'car-outline',
      briefcase: 'briefcase-outline',
      school: 'school-outline',
      restaurant: 'restaurant-outline',
      home: 'home-outline',
      people: 'people-outline',
      trophy: 'trophy-outline',
      rocket: 'rocket-outline',
      star: 'star-outline',
      flash: 'flash-outline',
      gamepad: 'game-controller-outline',
      brush: 'brush-outline',
      code: 'code-slash-outline',
      calculator: 'calculator-outline',
      bicycle: 'bicycle-outline',
      target: 'target-outline',
    };
    return iconMap[iconName] || 'target-outline';
  };

  const renderGoalItem = (goal: GoalWithProgress) => {
    const isExpanded = expandedGoal === goal.goal_id;
    
    // Use the goal-specific activity data hook when expanded
    const { activityData: goalActivityData, loading: activityLoading } = 
      useGoalActivity(isExpanded ? goal.goal_id : undefined, 90);

    return (
      <View key={goal.goal_id} style={styles.goalItem}>
        <TouchableOpacity
          style={styles.goalContent}
          onPress={() => setExpandedGoal(isExpanded ? null : goal.goal_id)}
        >
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <View style={styles.goalIcon}>
                <Ionicons
                  name={getIconName(goal.icon)}
                  size={24}
                  color="#6366F1"
                />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                {goal.description && (
                  <Text style={styles.goalDescription}>{goal.description}</Text>
                )}
                <Text style={styles.goalType}>{goal.duration_type}</Text>
              </View>
            </View>
            
            <View style={styles.goalStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{goal.total_completions}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{goal.current_streak}</Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {activityLoading ? (
              <View style={styles.activityLoading}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.activityLoadingText}>Loading activity data...</Text>
              </View>
            ) : (
              <ActivityGrid 
                data={goalActivityData}
                title="Activity History"
                interactive={true}
                onDayPress={(date) => {
                  if (!date) return;
                  
                  const formattedDate = new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  const isCompleted = goalActivityData.find(d => d.date === date)?.completed;
                  
                  Alert.alert(
                    `${goal.title}`,
                    `${isCompleted ? 'Completed' : 'Not completed'} on ${formattedDate}`
                  );
                }}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>@{username}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.content}>
          <ProfileSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canViewGoals = !userProfile.is_private || isFollowing || userId === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{userProfile.username}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userProfile.name?.charAt(0) || userProfile.username.charAt(0)}
              </Text>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>{userProfile.name || userProfile.username}</Text>
              {userProfile.is_private && (
                <Ionicons name="lock-closed" size={16} color="#6B7280" />
              )}
            </View>
            <Text style={styles.profileUsername}>@{userProfile.username}</Text>
            {userProfile.bio && (
              <Text style={styles.profileBio}>{userProfile.bio}</Text>
            )}
          </View>

          {userId !== user?.id && (
            <TouchableOpacity
              style={[styles.followButton, isFollowing && styles.followingButton]}
              onPress={handleFollowToggle}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Followers', {
              userId: userProfile.id,
              username: userProfile.username,
              title: 'Followers',
              type: 'followers'
            })}
          >
            <Text style={styles.statNumber}>{userProfile.followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigation.navigate('Followers', {
              userId: userProfile.id,
              username: userProfile.username,
              title: 'Following',
              type: 'following'
            })}
          >
            <Text style={styles.statNumber}>{userProfile.followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{userProfile.streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        {canViewGoals ? (
          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Goals</Text>
            {userGoals.length > 0 ? (
              userGoals.map(renderGoalItem)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="target-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No goals yet</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.privateAccount}>
            <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
            <Text style={styles.privateText}>This account is private</Text>
            <Text style={styles.privateSubtext}>
              Follow @{userProfile.username} to see their goals
            </Text>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileUsername: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  followButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  followingButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  goalsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  goalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalContent: {
    padding: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  goalType: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  goalStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  expandedContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  privateAccount: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  privateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  privateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  activityLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  activityLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});