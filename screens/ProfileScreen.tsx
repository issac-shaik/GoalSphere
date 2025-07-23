import React, { useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useUserData, useTodaysGoals, useStreaks, useRefresh, useFollowRequests } from '../lib/hooks';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { signOut } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // Use real data hooks
  const { user, loading, error, updateProfile, refreshData, clearError } = useUserData();
  const { goals: todaysGoals, loading: goalsLoading, refetch: refetchGoals } = useTodaysGoals();
  const { streak, loading: streakLoading, refreshStreak } = useStreaks();
  const { requests } = useFollowRequests();

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await Promise.all([
      refreshData(),
      refetchGoals(),
      refreshStreak(),
    ]);
  };

  const { refreshing, onRefresh } = useRefresh(handleRefresh);

  // Initialize edit form when user data loads
  React.useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditBio(user.bio || '');
    }
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile({
      name: editName,
      bio: editBio,
    });

    if (success) {
      setShowEditModal(false);
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const togglePrivacy = async () => {
    if (!user) return;
    
    const success = await updateProfile({
      is_private: !user.is_private,
    });

    if (!success && error) {
      Alert.alert('Error', error);
    }
  };

  const renderGoalGrid = () => {
    if (!todaysGoals || todaysGoals.length === 0) {
      return (
        <View style={styles.emptyGoals}>
          <Text style={styles.emptyGoalsText}>No daily goals yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.goalGrid}>
        {todaysGoals.slice(0, 8).map((goal) => (
          <View
            key={goal.id}
            style={[
              styles.goalCell,
              goal.completed_today 
                ? { backgroundColor: goal.color || '#10B981' }
                : styles.goalPending,
            ]}
          >
            {goal.icon ? (
              <Ionicons
                name={getIconName(goal.icon)}
                size={16}
                color={goal.completed_today ? '#FFFFFF' : '#6B7280'}
              />
            ) : (
              <Text style={[
                styles.goalText,
                { color: goal.completed_today ? '#FFFFFF' : '#6B7280' }
              ]}>
                {goal.title.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        ))}
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Ionicons name="create-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading profile...</Text>
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

        {!loading && user && (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.editAvatarButton}>
                  <Ionicons name="camera" size={16} color="#6366F1" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.profileName}>{user.name || user.username}</Text>
                  {user.is_private && (
                    <Ionicons name="lock-closed" size={16} color="#6B7280" />
                  )}
                </View>
                <Text style={styles.profileUsername}>@{user.username}</Text>
                {user.bio && (
                  <Text style={styles.profileBio}>{user.bio}</Text>
                )}
              </View>
            </View>

            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Followers', {
                  userId: user.id,
                  username: user.username,
                  title: 'Followers',
                  type: 'followers'
                })}
              >
                <Text style={styles.statNumber}>{user.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate('Followers', {
                  userId: user.id,
                  username: user.username,
                  title: 'Following',
                  type: 'following'
                })}
              >
                <Text style={styles.statNumber}>{user.following_count || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.total_goals_completed || 0}</Text>
                <Text style={styles.statLabel}>Goals</Text>
              </View>
            </View>

            <View style={styles.streakContainer}>
              <View style={styles.streakItem}>
                <Ionicons name="flame" size={24} color="#F59E0B" />
                <View>
                  <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
                  <Text style={styles.streakLabel}>Current Streak</Text>
                </View>
              </View>
              <View style={styles.streakItem}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <View>
                  <Text style={styles.streakNumber}>{streak?.longest_streak || 0}</Text>
                  <Text style={styles.streakLabel}>Longest Streak</Text>
                </View>
              </View>
            </View>

            <View style={styles.todayGoalsContainer}>
              <Text style={styles.sectionTitle}>Today's Goals</Text>
              {goalsLoading ? (
                <View style={styles.goalsLoadingContainer}>
                  <ActivityIndicator size="small" color="#6366F1" />
                  <Text style={styles.goalsLoadingText}>Loading goals...</Text>
                </View>
              ) : (
                <>
                  {renderGoalGrid()}
                  <Text style={styles.goalsProgress}>
                    {todaysGoals?.filter(g => g.completed_today).length || 0}/{todaysGoals?.length || 0} completed
                  </Text>
                </>
              )}
            </View>

            <View style={styles.settingsContainer}>
              <TouchableOpacity style={styles.settingItem} onPress={togglePrivacy}>
                <View style={styles.settingLeft}>
                  <Ionicons 
                    name={user.is_private ? "lock-closed" : "lock-open"} 
                    size={20} 
                    color="#6B7280" 
                  />
                  <Text style={styles.settingText}>Private Account</Text>
                </View>
                <View style={[
                  styles.toggle,
                  user.is_private && styles.toggleActive
                ]}>
                  <View style={[
                    styles.toggleThumb,
                    user.is_private && styles.toggleThumbActive
                  ]} />
                </View>
              </TouchableOpacity>

              {user.is_private && (
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => navigation.navigate('FollowRequests')}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="person-add-outline" size={20} color="#6B7280" />
                    <Text style={styles.settingText}>Follow Requests</Text>
                  </View>
                  <View style={styles.settingRight}>
                    {requests.length > 0 && (
                      <View style={styles.requestsBadge}>
                        <Text style={styles.requestsBadgeText}>
                          {requests.length > 9 ? '9+' : requests.length.toString()}
                        </Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Ionicons name="notifications-outline" size={20} color="#6B7280" />
                  <Text style={styles.settingText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                  <Text style={[styles.settingText, { color: '#EF4444' }]}>Logout</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
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
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    alignItems: 'center',
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
  statItem: {
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
  streakContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  todayGoalsContainer: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  goalCell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCompleted: {
    backgroundColor: '#10B981',
  },
  goalPending: {
    backgroundColor: '#E5E7EB',
  },
  goalText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalsProgress: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  settingsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingText: {
    fontSize: 16,
    color: '#1F2937',
  },
  requestsBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  requestsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#6366F1',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  emptyGoals: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyGoalsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  goalsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  goalsLoadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
});