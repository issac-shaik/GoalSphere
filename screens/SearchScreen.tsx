import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserSearch, useSocialActions, useFollowRequests, useDebounce } from '../lib/hooks';
import { useTheme } from '../contexts/ThemeContext';
import { UserCardSkeleton } from '../components/SkeletonLoader';

interface SearchScreenProps {
  navigation: any;
}

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Use real data hooks
  const { 
    users: searchResults, 
    loading: searchLoading, 
    error: searchError, 
    hasMore,
    searchUsers, 
    clearSearch 
  } = useUserSearch();
  
  const { 
    loading: socialLoading, 
    error: socialError, 
    followUser, 
    unfollowUser, 
    getFollowStatus,
    clearError: clearSocialError 
  } = useSocialActions();
  
  const { 
    requests: followRequests, 
    loading: requestsLoading, 
    error: requestsError, 
    approveRequest,
    refetch: refetchRequests 
  } = useFollowRequests();

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      searchUsers(debouncedSearchQuery);
    } else if (debouncedSearchQuery.length === 0) {
      clearSearch();
    }
  }, [debouncedSearchQuery, searchUsers, clearSearch]);

  const handleFollowToggle = async (targetUserId: string) => {
    try {
      const targetUser = searchResults.find(u => u.id === targetUserId);
      const followStatus = await getFollowStatus(targetUserId);
      
      if (followStatus?.is_approved) {
        // Unfollow
        const success = await unfollowUser(targetUserId);
        if (!success && socialError) {
          Alert.alert('Error', socialError);
        }
      } else if (followStatus && !followStatus.is_approved) {
        // Cancel request
        const success = await unfollowUser(targetUserId);
        if (!success && socialError) {
          Alert.alert('Error', socialError);
        }
      } else {
        // Follow or request
        const success = await followUser(targetUserId);
        if (success && targetUser?.is_private) {
          Alert.alert('Follow Request Sent', `Follow request sent to @${targetUser.username}`);
        } else if (!success && socialError) {
          Alert.alert('Error', socialError);
        }
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const success = await approveRequest(requestId);
    if (success) {
      refetchRequests();
    } else if (requestsError) {
      Alert.alert('Error', requestsError);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    // For now, we'll use the same unfollowUser logic to decline
    // In a real app, you might want a separate decline function
    const request = followRequests.find(r => r.id === requestId);
    if (request) {
      const success = await unfollowUser(request.follower_id);
      if (success) {
        refetchRequests();
      } else if (socialError) {
        Alert.alert('Error', socialError);
      }
    }
  };

  const handleUserPress = (userData: any) => {
    navigation.navigate('UserDetail', {
      userId: userData.id,
      username: userData.username,
    });
  };

  const renderUserItem = (user: any) => {
    return (
      <TouchableOpacity 
        key={user.id} 
        style={styles.userCard}
        onPress={() => handleUserPress(user)}
      >
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>{user.name}</Text>
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
          
          <View style={styles.userMeta}>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.streakText}>{user.streak}</Text>
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
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {followRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Follow Requests ({followRequests.length})
            </Text>
            {followRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {request.users.name?.charAt(0) || request.users.username.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.requestName}>{request.users.name}</Text>
                    <Text style={styles.requestUsername}>@{request.users.username}</Text>
                  </View>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleApproveRequest(request.id)}
                  >
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.declineButton}
                    onPress={() => handleDeclineRequest(request.id)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {searchError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{searchError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => searchUsers(debouncedSearchQuery)}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {socialError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{socialError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={clearSocialError}>
              <Text style={styles.retryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {searchQuery.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Search Results {searchLoading ? '(Searching...)' : `(${searchResults.length})`}
            </Text>
            {searchLoading ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <UserCardSkeleton key={index} />
                ))}
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map(renderUserItem)
            ) : searchQuery.length >= 2 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color="#9CA3AF" />
                <Text style={styles.emptyStateText}>No users found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Try searching with a different keyword
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.emptySearchState}>
            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Discover People</Text>
            <Text style={styles.emptyStateSubtext}>
              Search for users by name or username
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
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
  userMeta: {
    alignItems: 'flex-end',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 4,
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
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  requestedButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  requestedButtonText: {
    color: '#D97706',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  requestCard: {
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
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  requestUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  declineButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
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
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
});