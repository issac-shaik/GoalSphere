# Productivity Social App

A social media app focused on productivity tracking, where users can set goals, track progress, and connect with friends to stay motivated.

## Features

- **User Authentication**: Sign up, login, and secure account management
- **Goal Setting**: Create daily, weekly, and monthly productivity goals
- **Progress Tracking**: Mark goals as complete and track streaks
- **Social Features**: Follow friends, see their progress, and get motivated
- **Privacy Controls**: Set account as public or private
- **Notifications**: Get notified when friends complete goals
- **Grid Visualization**: Visual progress tracking with colorful grid displays

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Navigation**: React Navigation
- **Icons**: Expo Vector Icons
- **State Management**: React Hooks (useState, useEffect)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account

### 1. Clone and Install Dependencies

```bash
cd ProductivitySocialApp
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the SQL from `supabase_schema.sql` in your Supabase SQL editor
4. Update `lib/supabase.ts` with your credentials:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Run the App

```bash
# Start the development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

## App Structure

```
ProductivitySocialApp/
├── screens/              # Main app screens
│   ├── LoginScreen.tsx
│   ├── SignUpScreen.tsx
│   ├── HomeScreen.tsx
│   ├── GoalsScreen.tsx
│   ├── SearchScreen.tsx
│   └── ProfileScreen.tsx
├── navigation/           # Navigation configuration
│   └── AppNavigator.tsx
├── lib/                 # Utilities and configurations
│   └── supabase.ts
├── types/               # TypeScript type definitions
│   └── index.ts
└── supabase_schema.sql  # Database schema
```

## Key Features Explained

### Goal Categories
- **Daily Goals**: Track daily habits and routines
- **Weekly Goals**: Set and track weekly objectives
- **Monthly Goals**: Long-term monthly targets

### Social Features
- **Follow System**: Connect with friends and see their progress
- **Privacy Settings**: Choose between public and private accounts
- **Activity Feed**: See friends' completed goals and celebrate together

### Streak Tracking
- **Current Streak**: Days with at least one completed goal
- **Longest Streak**: Personal best streak record
- **Visual Progress**: Grid-based visualization of daily progress

### User Experience
- **Vibrant Colors**: Eye-catching UI with green for completed, gray for pending
- **Intuitive Navigation**: Bottom tab navigation for easy access
- **Real-time Updates**: Instant feedback on goal completion

## Database Schema

The app uses the following main tables:
- `users`: User profiles and settings
- `goals`: User-defined productivity goals
- `progress`: Daily progress tracking
- `follows`: Social connections between users
- `notifications`: Activity notifications
- `streaks`: Streak calculation and tracking

## Demo Data

The app includes dummy data for demonstration:
- Sample users with different streaks and goals
- Example daily, weekly, and monthly goals
- Mock social interactions and follow relationships

## Future Enhancements

- Push notifications for goal reminders
- Goal templates and categories
- Achievement badges and rewards
- Data export functionality
- Team challenges and group goals
- Analytics and insights dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.