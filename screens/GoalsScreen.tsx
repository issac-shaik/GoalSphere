import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { IconSelector } from '../components/IconSelector';
import { ColorPicker } from '../components/ColorPicker';
import { GoalItem } from '../components/GoalItem';
import { useGoals } from '../lib/hooks';
import { GoalWithProgress } from '../types';

export default function GoalsScreen() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [targetCount, setTargetCount] = useState(1);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  // Removed expandedGoal state since it's now handled in individual GoalItem components

  // Use real data hooks
  const { 
    goals: allGoals, 
    loading, 
    error, 
    createGoal, 
    updateGoal, 
    deleteGoal, 
    toggleCompletion,
    clearError 
  } = useGoals();

  // We don't need this anymore since we're using useGoalActivity for each goal
  // const { activityData } = useActivityGrid();

  // Filter goals by active tab
  const filteredGoals = useMemo(() => {
    return allGoals.filter(goal => goal.duration_type === activeTab);
  }, [allGoals, activeTab]);

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    const success = await createGoal({
      title: newGoalTitle,
      description: newGoalDescription,
      duration_type: activeTab,
      icon: selectedIcon,
      color: selectedColor,
      target_count: targetCount,
    });

    if (success) {
      // Reset form
      setNewGoalTitle('');
      setNewGoalDescription('');
      setSelectedIcon('target');
      setSelectedColor('#6366F1');
      setTargetCount(1);
      setShowAddModal(false);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description || '');
    setSelectedIcon(goal.icon);
    setSelectedColor(goal.color || '#6366F1');
    setTargetCount(goal.target_count || 1);
    setShowEditModal(true);
  };

  const handleUpdateGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (!editingGoal) return;

    const success = await updateGoal(editingGoal.id, {
      title: newGoalTitle,
      description: newGoalDescription,
      icon: selectedIcon,
      color: selectedColor,
      target_count: targetCount,
    });

    if (success) {
      // Reset form
      setNewGoalTitle('');
      setNewGoalDescription('');
      setSelectedIcon('target');
      setSelectedColor('#6366F1');
      setTargetCount(1);
      setEditingGoal(null);
      setShowEditModal(false);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteGoal(goalId);
            if (!success && error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const toggleGoalCompletion = async (goalId: string) => {
    const success = await toggleCompletion(goalId);
    if (!success && error) {
      Alert.alert('Error', error);
    }
  };

  // getIconName function moved to GoalItem component

  // We don't need this function anymore since we're using the GoalItem component

  const renderTabButton = (tab: 'daily' | 'weekly' | 'monthly' | 'yearly', label: string) => {
    return (
      <TouchableOpacity
        style={[styles.tabButton, activeTab === tab && styles.activeTab]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton('daily', 'Daily')}
        {renderTabButton('weekly', 'Weekly')}
        {renderTabButton('monthly', 'Monthly')}
        {renderTabButton('yearly', 'Yearly')}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={clearError}>
              <Text style={styles.retryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {filteredGoals.filter(g => {
                    const targetCount = g.target_count || 1;
                    const completedCount = g.daily_completion_count || 0;
                    return completedCount >= targetCount;
                  }).length}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{filteredGoals.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {filteredGoals.length > 0 
                    ? Math.round((filteredGoals.reduce((total, goal) => {
                        const targetCount = goal.target_count || 1;
                        const completedCount = goal.daily_completion_count || 0;
                        return total + Math.min(completedCount / targetCount, 1);
                      }, 0) / filteredGoals.length) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Progress</Text>
              </View>
            </View>

            <View style={styles.goalsContainer}>
              {filteredGoals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="flag-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No {activeTab} goals yet</Text>
                  <Text style={styles.emptyText}>
                    Tap the + button to create your first {activeTab} goal!
                  </Text>
                </View>
              ) : (
                filteredGoals.map((goal) => (
                  <GoalItem
                    key={goal.id}
                    goal={goal}
                    activeTab={activeTab}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onToggleCompletion={toggleGoalCompletion}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add New {activeTab} Goal</Text>
              <Text style={styles.modalSubtitle}>
                {filteredGoals.length} goals created
              </Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter goal title"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                autoFocus
              />
              
              <TextInput
                style={[styles.modalInput, styles.descriptionInput]}
                placeholder="Enter description (optional)"
                value={newGoalDescription}
                onChangeText={setNewGoalDescription}
                multiline
                numberOfLines={3}
              />
              
              <IconSelector
                selectedIcon={selectedIcon}
                onIconSelect={setSelectedIcon}
              />
              
              <ColorPicker
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />

              <View style={styles.targetCountContainer}>
                <Text style={styles.targetCountLabel}>
                  Target per {activeTab === 'daily' ? 'day' : activeTab === 'weekly' ? 'week' : activeTab === 'monthly' ? 'month' : 'year'}:
                </Text>
                <View style={styles.targetCountInput}>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
                  >
                    <Text style={styles.countButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countValue}>{targetCount}</Text>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => setTargetCount(Math.min(20, targetCount + 1))}
                  >
                    <Text style={styles.countButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addModalButton]}
                  onPress={handleAddGoal}
                >
                  <Text style={styles.addButtonText}>Add Goal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Goal</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter goal title"
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                autoFocus
              />
              
              <TextInput
                style={[styles.modalInput, styles.descriptionInput]}
                placeholder="Enter description (optional)"
                value={newGoalDescription}
                onChangeText={setNewGoalDescription}
                multiline
                numberOfLines={3}
              />
              
              <IconSelector
                selectedIcon={selectedIcon}
                onIconSelect={setSelectedIcon}
              />
              
              <ColorPicker
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />

              <View style={styles.targetCountContainer}>
                <Text style={styles.targetCountLabel}>
                  Target per {editingGoal?.duration_type === 'daily' ? 'day' : editingGoal?.duration_type === 'weekly' ? 'week' : editingGoal?.duration_type === 'monthly' ? 'month' : 'year'}:
                </Text>
                <View style={styles.targetCountInput}>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => setTargetCount(Math.max(1, targetCount - 1))}
                  >
                    <Text style={styles.countButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countValue}>{targetCount}</Text>
                  <TouchableOpacity
                    style={styles.countButton}
                    onPress={() => setTargetCount(Math.min(20, targetCount + 1))}
                  >
                    <Text style={styles.countButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.addModalButton]}
                  onPress={handleUpdateGoal}
                >
                  <Text style={styles.addButtonText}>Update Goal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  goalsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
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
  goalCompleted: {
    opacity: 0.7,
  },
  goalContent: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 35,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
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
  goalDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  completeButton: {
    padding: 4,
  },
  expandedContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  addModalButton: {
    backgroundColor: '#6366F1',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  targetCountContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  targetCountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  targetCountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  countButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  countValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
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