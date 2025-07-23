// Basic service tests to verify setup
import { userService, goalService, socialService, streakService } from '../index';

describe('Data Services Setup', () => {
  test('UserService should be instantiated', () => {
    expect(userService).toBeDefined();
    expect(typeof userService.getCurrentUser).toBe('function');
    expect(typeof userService.getUserById).toBe('function');
    expect(typeof userService.updateUserProfile).toBe('function');
    expect(typeof userService.searchUsers).toBe('function');
  });

  test('GoalService should be instantiated', () => {
    expect(goalService).toBeDefined();
    expect(typeof goalService.getUserGoals).toBe('function');
    expect(typeof goalService.createGoal).toBe('function');
    expect(typeof goalService.updateGoal).toBe('function');
    expect(typeof goalService.deleteGoal).toBe('function');
    expect(typeof goalService.toggleGoalCompletion).toBe('function');
  });

  test('SocialService should be instantiated', () => {
    expect(socialService).toBeDefined();
    expect(typeof socialService.getHomeFeed).toBe('function');
    expect(typeof socialService.followUser).toBe('function');
    expect(typeof socialService.unfollowUser).toBe('function');
  });

  test('StreakService should be instantiated', () => {
    expect(streakService).toBeDefined();
    expect(typeof streakService.getUserStreak).toBe('function');
    expect(typeof streakService.getStreakHistory).toBe('function');
  });
});

// Test validation utilities
import { validateGoal, validateUser, validateEmail } from '../../utils';

describe('Validation Utilities', () => {
  test('validateGoal should work correctly', () => {
    const validGoal = {
      title: 'Test Goal',
      description: 'Test description',
      duration_type: 'daily',
      icon: 'target',
    };

    const result = validateGoal(validGoal);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateGoal should catch invalid data', () => {
    const invalidGoal = {
      title: '', // Empty title
      duration_type: 'invalid', // Invalid type
      icon: '', // Empty icon
    };

    const result = validateGoal(invalidGoal);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('validateUser should work correctly', () => {
    const validUser = {
      username: 'testuser',
      name: 'Test User',
      bio: 'Test bio',
    };

    const result = validateUser(validUser);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validateEmail should work correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});