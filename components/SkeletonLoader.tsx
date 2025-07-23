import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCircle: React.FC<{ size: number; style?: any }> = ({ size, style }) => {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

export const UserCardSkeleton: React.FC = () => {
  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <SkeletonCircle size={48} style={styles.avatar} />
          <View style={styles.userDetails}>
            <SkeletonBox width={120} height={16} style={styles.userName} />
            <SkeletonBox width={80} height={14} style={styles.userUsername} />
            <SkeletonBox width={200} height={14} style={styles.userBio} />
          </View>
        </View>
        <View style={styles.userMeta}>
          <SkeletonBox width={60} height={24} borderRadius={12} style={styles.streak} />
          <SkeletonBox width={80} height={32} borderRadius={8} style={styles.followButton} />
        </View>
      </View>
    </View>
  );
};

export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <SkeletonCircle size={80} style={styles.profileAvatar} />
        <SkeletonBox width={150} height={24} style={styles.profileName} />
        <SkeletonBox width={100} height={16} style={styles.profileUsername} />
        <SkeletonBox width={250} height={14} style={styles.profileBio} />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <SkeletonBox width={40} height={20} style={styles.statNumber} />
          <SkeletonBox width={60} height={12} style={styles.statLabel} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBox width={40} height={20} style={styles.statNumber} />
          <SkeletonBox width={60} height={12} style={styles.statLabel} />
        </View>
        <View style={styles.statItem}>
          <SkeletonBox width={40} height={20} style={styles.statNumber} />
          <SkeletonBox width={60} height={12} style={styles.statLabel} />
        </View>
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <View>
            <SkeletonBox width={30} height={18} style={styles.streakNumber} />
            <SkeletonBox width={80} height={12} style={styles.streakLabel} />
          </View>
        </View>
        <View style={styles.streakItem}>
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <View>
            <SkeletonBox width={30} height={18} style={styles.streakNumber} />
            <SkeletonBox width={80} height={12} style={styles.streakLabel} />
          </View>
        </View>
      </View>

      <View style={styles.goalsContainer}>
        <SkeletonBox width={120} height={16} style={styles.sectionTitle} />
        <View style={styles.goalGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBox key={index} width={40} height={40} borderRadius={8} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    marginBottom: 4,
  },
  userUsername: {
    marginBottom: 4,
  },
  userBio: {
    marginBottom: 0,
  },
  userMeta: {
    alignItems: 'flex-end',
    gap: 8,
  },
  streak: {
    marginBottom: 0,
  },
  followButton: {
    marginBottom: 0,
  },
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileAvatar: {
    marginBottom: 16,
  },
  profileName: {
    marginBottom: 4,
  },
  profileUsername: {
    marginBottom: 8,
  },
  profileBio: {
    marginBottom: 0,
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
    marginBottom: 4,
  },
  statLabel: {
    marginBottom: 0,
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
    marginBottom: 2,
  },
  streakLabel: {
    marginBottom: 0,
  },
  goalsContainer: {
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
    marginBottom: 12,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});