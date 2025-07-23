export interface User {
  id: string;
  username: string;
  name?: string;
  bio?: string;
  avatar_url?: string;
  is_private: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target_days: number;
  target_count: number; // How many times per day/week/etc (e.g., brush teeth 2x/day)
  icon: string;
  color?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface GoalWithProgress extends Goal {
  total_completions: number;
  current_streak: number;
  last_completed?: string;
  completed_today?: boolean;
  completion_rate?: number;
  daily_completion_count?: number; // How many times completed today (e.g., 2 out of 3)
}

export interface ActivityGridDay {
  date: string;
  completed: boolean;
}

export interface Progress {
  id: string;
  goal_id: string;
  user_id: string;
  completed_date: string;
  completion_count: number; // How many times completed on this date
  notes?: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  is_approved: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  from_user_id: string;
  type: 'goal_completed' | 'follow_request' | 'follow_approved';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}