# Requirements Document

## Introduction

The current app displays dummy data throughout ALL screens including home feed, goals screen, profile screen, and search functionality. Additionally, the home feed shows poor goal visualization (only first letters instead of meaningful goal information). This feature will completely replace dummy data with real Supabase database integration across the entire application and improve goal display throughout the app.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see real data from the database instead of dummy data across all screens, so that I can track my actual goals and see my friends' real progress throughout the entire app.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL fetch real user data from Supabase instead of using dummy data on all screens
2. WHEN viewing the home feed THEN the system SHALL display actual goals from followed users with real completion status
3. WHEN viewing my profile THEN the system SHALL show my actual streak data, goal counts, and progress from the database
4. WHEN viewing the goals screen THEN the system SHALL display my actual goals with real completion history and progress tracking
5. WHEN viewing the search screen THEN the system SHALL show real users from the database with actual profile information
6. WHEN viewing user detail screens THEN the system SHALL display real user data, goals, and social connections

### Requirement 2

**User Story:** As a user, I want to see meaningful goal information in the home feed, so that I can understand what my friends accomplished and get motivated by their progress.

#### Acceptance Criteria

1. WHEN viewing the home feed THEN the system SHALL display full goal titles instead of just first letters
2. WHEN a goal is completed THEN the system SHALL show the goal title, description, and completion time
3. WHEN viewing goal grids THEN the system SHALL use icons or abbreviated titles that are recognizable
4. WHEN hovering or tapping goal cells THEN the system SHALL show tooltip or expanded view with full goal details

### Requirement 3

**User Story:** As a user, I want to see real-time updates when I or my friends complete goals, so that the social aspect feels engaging and current.

#### Acceptance Criteria

1. WHEN I complete a goal THEN the system SHALL immediately update my progress in the database
2. WHEN friends complete goals THEN the system SHALL update their feed cards within 30 seconds
3. WHEN viewing progress data THEN the system SHALL reflect actual completion dates and streaks
4. WHEN the app regains focus THEN the system SHALL refresh data to show latest updates

### Requirement 4

**User Story:** As a user, I want proper error handling when data fails to load, so that I have a smooth experience even when there are connectivity issues.

#### Acceptance Criteria

1. WHEN database queries fail THEN the system SHALL show appropriate error messages instead of crashing
2. WHEN network is unavailable THEN the system SHALL show cached data with offline indicators
3. WHEN data is loading THEN the system SHALL show skeleton screens or loading states
4. WHEN retrying failed requests THEN the system SHALL provide manual refresh options

### Requirement 5

**User Story:** As a new user, I want to see sample data or onboarding content when I have no goals or friends yet, so that I understand how the app works.

#### Acceptance Criteria

1. WHEN a user has no goals THEN the system SHALL show onboarding prompts to create their first goal
2. WHEN a user has no friends THEN the system SHALL show suggestions to find and follow other users
3. WHEN the home feed is empty THEN the system SHALL show helpful tips about using the social features
4. WHEN displaying empty states THEN the system SHALL provide clear call-to-action buttons