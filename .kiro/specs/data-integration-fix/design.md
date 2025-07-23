# Design Document

## Overview

This design outlines the complete replacement of dummy data with real Supabase database integration across all screens in the productivity social app. The solution includes data fetching services, state management improvements, UI enhancements for better goal visualization, and proper error handling throughout the application.

## Architecture

### Data Layer Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │   Data Services  │    │    Supabase     │
│   Components    │◄──►│   & Hooks        │◄──►│    Database     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Local State   │    │   Cache Layer    │    │   Real-time     │
│   Management    │    │   & Optimistic  │    │   Subscriptions │
│                 │    │   Updates        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Screen-Specific Data Flow
- **HomeScreen**: Fetch followed users' goals and progress
- **GoalsScreen**: Fetch user's own goals with completion history  
- **ProfileScreen**: Fetch user profile, streaks, and statistics
- **SearchScreen**: Fetch and search through real user database

## Components and Interfaces

### 1. Data Service Layer

#### UserService
```typescript
interface UserService {
  getCurrentUser(): Promise<User>
  getUserById(id: string): Promise<User>
  updateUserProfile(updates: Partial<User>): Promise<User>
  searchUsers(query: string): Promise<User[]>
  getFollowedUsers(): Promise<User[]>
}
```

#### GoalService  
```typescript
interface GoalService {
  getUserGoals(userId: string): Promise<Goal[]>
  createGoal(goal: CreateGoalRequest): Promise<Goal>
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal>
  deleteGoal(id: string): Promise<void>
  toggleGoalCompletion(goalId: string): Promise<Progress>
  getGoalProgress(goalId: string): Promise<Progress[]>
}
```

#### SocialService
```typescript
interface SocialService {
  getHomeFeed(): Promise<FeedItem[]>
  followUser(userId: string): Promise<Follow>
  unfollowUser(userId: string): Promise<void>
  getFollowers(userId: string): Promise<User[]>
  getFollowing(userId: string): Promise<User[]>
}
```

#### StreakService
```typescript
interface StreakService {
  getUserStreak(userId: string): Promise<Streak>
  updateStreakOnGoalCompletion(userId: string): Promise<Streak>
  getStreakHistory(userId: string): Promise<ActivityGridDay[]>
}
```

### 2. Custom Hooks for Data Management

#### useUserData Hook
```typescript
const useUserData = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Methods: fetchUser, updateProfile, refreshData
  return { user, loading, error, updateProfile, refreshData }
}
```

#### useGoals Hook
```typescript
const useGoals = (userId?: string) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Methods: createGoal, updateGoal, deleteGoal, toggleCompletion
  return { goals, loading, error, createGoal, updateGoal, deleteGoal, toggleCompletion }
}
```

#### useHomeFeed Hook
```typescript
const useHomeFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Methods: refreshFeed, loadMore
  return { feedItems, loading, refreshing, refreshFeed, loadMore }
}
```

### 3. Enhanced UI Components

#### GoalCard Component
```typescript
interface GoalCardProps {
  goal: Goal
  showFullDetails?: boolean
  onPress?: () => void
  onToggleComplete?: () => void
}
```

Features:
- Display full goal title and description
- Show goal icon and category
- Progress indicators for monthly/yearly goals
- Completion status with visual feedback
- Expandable details view

#### FeedUserCard Component  
```typescript
interface FeedUserCardProps {
  user: User
  goals: Goal[]
  streak: number
  onUserPress?: () => void
}
```

Features:
- User avatar and profile info
- Goal grid with meaningful visualization
- Streak display with flame icon
- Progress summary
- Social interaction buttons

#### ActivityGrid Component (Enhanced)
```typescript
interface ActivityGridProps {
  data: ActivityGridDay[]
  title?: string
  interactive?: boolean
  onDayPress?: (date: string) => void
}
```

Features:
- Real activity data from database
- Interactive day selection
- Tooltip showing goal details
- Different intensity levels
- Responsive grid layout

## Data Models

### Enhanced Goal Model
```typescript
interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  target_days: number
  icon: string
  category?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Computed fields
  total_completions?: number
  current_streak?: number
  completion_rate?: number
  last_completed?: string
}
```

### Feed Item Model
```typescript
interface FeedItem {
  id: string
  user: User
  goals: Goal[]
  streak: Streak
  recent_completions: Progress[]
  timestamp: string
  interaction_count?: number
}
```

### Enhanced User Model
```typescript
interface User {
  id: string
  username: string
  name?: string
  bio?: string
  avatar_url?: string
  is_private: boolean
  created_at: string
  
  // Computed social stats
  followers_count?: number
  following_count?: number
  total_goals_completed?: number
  current_streak?: number
  longest_streak?: number
}
```

## Error Handling

### Error Types and Handling Strategy

#### Network Errors
- Show retry buttons with exponential backoff
- Cache last successful data for offline viewing
- Display network status indicators

#### Authentication Errors  
- Redirect to login screen
- Clear invalid session data
- Show appropriate error messages

#### Data Validation Errors
- Show field-specific error messages
- Prevent invalid data submission
- Provide input format guidance

#### Database Errors
- Log errors for debugging
- Show user-friendly error messages
- Provide fallback UI states

### Loading States

#### Skeleton Screens
- Goal cards with placeholder content
- User profile placeholders
- Feed item skeletons
- Search result placeholders

#### Progressive Loading
- Load critical data first (user profile)
- Load secondary data (social feed) after
- Show partial content while loading details

## Testing Strategy

### Unit Tests
- Data service functions
- Custom hooks behavior
- Component rendering with real data
- Error handling scenarios

### Integration Tests  
- Database query operations
- Authentication flow with real data
- Goal creation and completion flow
- Social features (follow/unfollow)

### End-to-End Tests
- Complete user journey from signup to goal completion
- Social interactions between multiple users
- Data persistence across app sessions
- Offline/online data synchronization

### Performance Tests
- Database query performance
- Large dataset rendering
- Memory usage with real data
- Network request optimization

## Implementation Phases

### Phase 1: Core Data Services
- Set up data service layer
- Implement basic CRUD operations
- Add error handling and loading states

### Phase 2: Screen Integration
- Replace dummy data in GoalsScreen
- Update ProfileScreen with real data
- Integrate SearchScreen with user database

### Phase 3: Social Features
- Implement real home feed
- Add follow/unfollow functionality
- Real-time updates and notifications

### Phase 4: Enhanced UI
- Improve goal visualization
- Add interactive elements
- Implement advanced filtering and sorting

### Phase 5: Performance & Polish
- Optimize database queries
- Add caching and offline support
- Performance monitoring and analytics