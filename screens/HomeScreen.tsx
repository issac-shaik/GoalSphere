import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHomeFeed, useRefresh, useNotifications } from '../lib/hooks';
import { FeedItem, GoalWithReactions, reactionService } from '../lib/services';
import EmojiReactionPicker from '../components/EmojiReactionPicker';
import FloatingReaction from '../components/FloatingReaction';
import { getTodayString } from '../lib/utils';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { feedItems, loading, refreshing, error, refreshFeed } = useHomeFeed();
  const { refreshing: isRefreshing, onRefresh } = useRefresh(refreshFeed);
  const { unreadCount } = useNotifications();
  
  const [reactingToGoal, setReactingToGoal] = useState<{goalId: string, date: string} | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  }>>([]);

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

  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const handleReactionPress = (goalId: string, progressDate: string, event?: any) => {
    setReactingToGoal({ goalId, date: progressDate });
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!reactingToGoal) return;

    try {
      // Add floating animation
      const reactionId = Date.now().toString();
      setFloatingReactions(prev => [...prev, {
        id: reactionId,
        emoji,
        x: Math.random() * 200 + 100, // Random position
        y: Math.random() * 100 + 200,
      }]);

      // Add reaction to database
      await reactionService.addReaction(reactingToGoal.goalId, reactingToGoal.date, emoji);
      
      // Refresh feed to show updated reactions
      await refreshFeed();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const removeFloatingReaction = (id: string) => {
    setFloatingReactions(prev => prev.filter(reaction => reaction.id !== id));
  };

  const renderGoalGrid = (goals: GoalWithReactions[]) => {
    if (!goals || goals.length === 0) {
      return (
        <View style={styles.emptyGoals}>
          <Text style={styles.emptyGoalsText}>No completed goals today</Text>
        </View>
      );
    }

    const today = getTodayString();

    return (
      <View style={styles.goalsContainer}>
        <View style={styles.goalGrid}>
          {goals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={styles.goalCardContainer}>
              <TouchableOpacity
                style={[
                  styles.goalCard,
                  { backgroundColor: goal.color || '#10B981' }
                ]}
                onPress={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              >
                <View style={styles.goalIconContainer}>
                  <Ionicons
                    name={getIconName(goal.icon)}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.goalContent}>
                  <Text 
                    style={[styles.goalTitle, { color: '#FFFFFF' }]}
                    numberOfLines={1}
                  >
                    {goal.title}
                  </Text>
                  {expandedGoal === goal.id && goal.description && (
                    <Text 
                      style={[styles.goalDescription, { color: '#FFFFFF' }]}
                      numberOfLines={2}
                    >
                      {goal.description}
                    </Text>
                  )}
                </View>
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              {/* Reactions Section */}
              <View style={styles.reactionsContainer}>
                <View style={styles.reactionButtons}>
                  {/* Show existing reactions */}
                  {goal.reactions && Object.entries(goal.reactions.reactions).map(([emoji, count]) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.reactionButton,
                        goal.reactions?.user_reaction === emoji && styles.reactionButtonActive
                      ]}
                      onPress={() => handleReactionPress(goal.id, today)}
                    >
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      <Text style={styles.reactionCount}>{count}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Add reaction button */}
                  <TouchableOpacity
                    style={styles.addReactionButton}
                    onPress={() => handleReactionPress(goal.id, today)}
                  >
                    <Ionicons name="add" size={16} color="#6B7280" />
                    <Text style={styles.addReactionText}>React</Text>
                  </TouchableOpacity>
                </View>
                
                {goal.reactions && goal.reactions.total_count > 0 && (
                  <Text style={styles.totalReactions}>
                    {goal.reactions.total_count} reaction{goal.reactions.total_count !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
        
        {goals.length > 3 && (
          <TouchableOpacity style={styles.moreGoalsButton}>
            <Text style={styles.moreGoalsText}>
              +{goals.length - 3} more goals
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderUserCard = (feedItem: FeedItem) => {
    const { user, goals, streak, completed_today, total_goals } = feedItem;
    
    return (
      <View key={feedItem.id} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user.name || user.username}</Text>
              <Text style={styles.userUsername}>@{user.username}</Text>
            </View>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color="#F59E0B" />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>
        
        {renderGoalGrid(goals)}
        
        <View style={styles.userStats}>
          <Text style={styles.statsText}>
            {completed_today}/{total_goals} completed today
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshFeed}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {feedItems.length === 0 && !loading && !error && (
          <View style={styles.emptyFeedContainer}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyFeedTitle}>No Activity Yet</Text>
            <Text style={styles.emptyFeedText}>
              Follow some friends to see their goals and progress here!
            </Text>
          </View>
        )}
        
        {feedItems.map(renderUserCard)}
      </ScrollView>

      {/* Floating Reactions */}
      {floatingReactions.map((reaction) => (
        <FloatingReaction
          key={reaction.id}
          emoji={reaction.emoji}
          startX={reaction.x}
          startY={reaction.y}
          onComplete={() => removeFloatingReaction(reaction.id)}
        />
      ))}

      {/* Emoji Reaction Picker */}
      <EmojiReactionPicker
        visible={showEmojiPicker}
        onClose={() => {
          setShowEmojiPicker(false);
          setReactingToGoal(null);
        }}
        onEmojiSelect={handleEmojiSelect}
        currentReaction={reactingToGoal ? 
          feedItems
            .flatMap(item => item.goals)
            .find(goal => goal.id === reactingToGoal.goalId)?.reactions?.user_reaction 
          : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
  },
  goalsContainer: {
    marginBottom: 12,
  },
  goalGrid: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    position: 'relative',
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalDescription: {
    fontSize: 12,
    marginTop: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCompleted: {
    backgroundColor: '#10B981',
  },
  goalPending: {
    backgroundColor: '#F3F4F6',
  },
  moreGoalsButton: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  moreGoalsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  userStats: {
    alignItems: 'center',
    marginTop: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyGoals: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyGoalsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  emptyFeedContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyFeedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyFeedText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalCardContainer: {
    marginBottom: 8,
  },
  reactionsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  reactionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 50,
  },
  reactionButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3B82F6',
  },
  addReactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  addReactionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  totalReactions: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});