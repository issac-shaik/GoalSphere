# Data Services Layer

This directory contains the complete data service layer for the Productivity Social App, providing a clean interface between the React Native components and the Supabase database.

## Architecture

The data services are built with a layered architecture:

```
Components → Custom Hooks → Services → Supabase Database
```

## Services

### BaseService
- Provides common functionality for all services
- Handles error processing and response formatting
- Manages authentication state
- Provides utility methods for pagination and success/error responses

### UserService
- User profile management (CRUD operations)
- User search functionality
- Social connections (followers/following)
- User statistics and computed fields

### GoalService
- Goal management (create, read, update, delete)
- Progress tracking and completion
- Goal statistics and streaks
- Daily/weekly/monthly/yearly goal support

### SocialService
- Home feed generation
- Follow/unfollow functionality
- Follow request management
- Social interactions and notifications

### StreakService
- Streak calculations and management
- Activity history tracking
- Weekly/monthly progress summaries
- Activity grid data generation

## Usage Examples

### Using UserService
```typescript
import { userService } from '../lib/services';

// Get current user
const { data: user, error } = await userService.getCurrentUser();

// Update profile
const { data: updatedUser, error } = await userService.updateUserProfile({
  name: 'New Name',
  bio: 'Updated bio'
});

// Search users
const { data: users, error } = await userService.searchUsers('john');
```

### Using GoalService
```typescript
import { goalService } from '../lib/services';

// Get user goals
const { data: goals, error } = await goalService.getUserGoals();

// Create new goal
const { data: newGoal, error } = await goalService.createGoal({
  title: 'Morning Exercise',
  description: 'Exercise for 30 minutes',
  duration_type: 'daily',
  icon: 'fitness'
});

// Toggle goal completion
const { data: progress, error } = await goalService.toggleGoalCompletion(goalId);
```

### Using SocialService
```typescript
import { socialService } from '../lib/services';

// Get home feed
const { data: feedItems, error } = await socialService.getHomeFeed();

// Follow a user
const { data: follow, error } = await socialService.followUser(userId);
```

## Error Handling

All services use consistent error handling:

```typescript
const { data, error } = await userService.getCurrentUser();

if (error) {
  // Handle error - error is a user-friendly string message
  console.error('Failed to get user:', error);
  return;
}

// Use data safely
console.log('User:', data);
```

## Validation

Input validation is built into the services:

```typescript
import { validateGoal, validateUser } from '../lib/utils';

// Validate before creating
const validation = validateGoal(goalData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}
```

## Response Types

All services return consistent response types:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  count: number | null;
  error: string | null;
  hasMore: boolean;
}
```

## Testing

Run tests with:
```bash
npm test lib/services/__tests__/
```

## Next Steps

After setting up the data services, the next steps are:
1. Create custom hooks that use these services
2. Replace dummy data in components with real service calls
3. Add loading states and error handling to UI components
4. Implement real-time updates and caching