import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityGrid } from './ActivityGrid';
import { CustomAlert } from './CustomAlert';
import { SegmentedCircleProgress } from './SegmentedCircleProgress';
import { useGoalActivity } from '../lib/hooks';
import { GoalWithProgress } from '../types';

interface GoalItemProps {
  goal: GoalWithProgress;
  activeTab: string;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (goalId: string) => void;
  onToggleCompletion: (goalId: string) => void;
}

export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  activeTab,
  onEdit,
  onDelete,
  onToggleCompletion,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', isCompleted: false });

  // Use the goal-specific activity data hook when expanded
  const { activityData: goalActivityData, loading: activityLoading } =
    useGoalActivity(isExpanded ? goal.id : undefined, 90);

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

  return (
    <View style={styles.goalItem}>
      <TouchableOpacity
        style={styles.goalContent}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <View style={[styles.goalIcon, { backgroundColor: `${goal.color || '#6366F1'}20` }]}>
              <Ionicons
                name={getIconName(goal.icon)}
                size={24}
                color={goal.color || '#6366F1'}
              />
            </View>
            <View style={styles.goalInfo}>
              <Text style={[
                styles.goalTitle, 
                // Only strike through when fully completed (reached target count)
                (goal.target_count && goal.target_count > 1) 
                  ? (goal.daily_completion_count >= goal.target_count && styles.completedText)
                  : (goal.completed_today && styles.completedText)
              ]}>
                {goal.title}
              </Text>
              {goal.target_count && goal.target_count > 1 && (
                <Text style={[
                  styles.progressText,
                  goal.daily_completion_count >= goal.target_count && styles.completedProgressText
                ]}>
                  {goal.daily_completion_count || 0}/{goal.target_count} completed today
                  {goal.daily_completion_count >= goal.target_count && ' ✓'}
                </Text>
              )}
              {goal.description && (
                <Text style={styles.goalDescription}>{goal.description}</Text>
              )}
            </View>
          </View>

          <View style={styles.goalActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(goal);
              }}
            >
              <Ionicons name="create-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(goal.id);
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.completionButton}
              onPress={(e) => {
                e.stopPropagation();
                onToggleCompletion(goal.id);
              }}
            >
              <SegmentedCircleProgress
                targetCount={goal.target_count || 1}
                completedCount={goal.daily_completion_count || 0}
                size={36}
                strokeWidth={4}
                color={goal.color || '#10B981'}
                backgroundColor="#E5E7EB"
                gapAngle={8}
              />
            </TouchableOpacity>
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
              goalColor={goal.color || '#10B981'}
              onDayPress={(date) => {
                if (!date) return;

                const formattedDate = new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                const isCompleted = goalActivityData.find(d => d.date === date)?.completed;

                setAlertData({
                  title: goal.title,
                  message: `${isCompleted ? 'Completed' : 'Not completed'} on ${formattedDate}`,
                  isCompleted: isCompleted || false,
                });
                setShowAlert(true);
              }}
            />
          )}
        </View>
      )}

      <CustomAlert
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        isCompleted={alertData.isCompleted}
        onClose={() => setShowAlert(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  goalItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalContent: {
    gap: 8,
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
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  completedProgressText: {
    color: '#059669',
    fontWeight: '600',
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  completionButton: {
    padding: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
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