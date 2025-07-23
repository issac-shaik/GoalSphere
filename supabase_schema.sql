-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Goals table
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_type TEXT CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
  target_days INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Progress table
CREATE TABLE public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  completed_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Follows table
CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('goal_completed', 'follow_request', 'follow_approved', 'goal_reaction')) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Streaks table
CREATE TABLE public.streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Public users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view goals of public accounts or followed accounts" ON public.goals
  FOR SELECT USING (
    user_id IN (
      SELECT u.id FROM public.users u 
      WHERE u.is_private = FALSE 
      OR u.id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f 
        WHERE f.following_id = u.id 
        AND f.follower_id = auth.uid() 
        AND f.is_approved = TRUE
      )
    )
  );

CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Progress policies
CREATE POLICY "Users can view own progress" ON public.progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view progress of public accounts or followed accounts" ON public.progress
  FOR SELECT USING (
    user_id IN (
      SELECT u.id FROM public.users u 
      WHERE u.is_private = FALSE 
      OR u.id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f 
        WHERE f.following_id = u.id 
        AND f.follower_id = auth.uid() 
        AND f.is_approved = TRUE
      )
    )
  );

CREATE POLICY "Users can insert own progress" ON public.progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view all follows" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can insert follow requests" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can update follow requests they received" ON public.follows
  FOR UPDATE USING (auth.uid() = following_id);

CREATE POLICY "Users can delete their own follow requests" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view streaks of public accounts or followed accounts" ON public.streaks
  FOR SELECT USING (
    user_id IN (
      SELECT u.id FROM public.users u 
      WHERE u.is_private = FALSE 
      OR u.id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f 
        WHERE f.following_id = u.id 
        AND f.follower_id = auth.uid() 
        AND f.is_approved = TRUE
      )
    )
  );

CREATE POLICY "Users can insert own streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'name', 'User')
  );
  
  INSERT INTO public.streaks (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_streak(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  last_activity DATE;
  current_date DATE := CURRENT_DATE;
  streak_record RECORD;
BEGIN
  -- Get current streak info
  SELECT * INTO streak_record FROM public.streaks WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (user_uuid, 1, 1, current_date);
    RETURN;
  END IF;
  
  last_activity := streak_record.last_activity_date;
  
  -- If last activity was yesterday, increment streak
  IF last_activity = current_date - 1 THEN
    UPDATE public.streaks 
    SET 
      current_streak = current_streak + 1,
      longest_streak = GREATEST(longest_streak, current_streak + 1),
      last_activity_date = current_date,
      updated_at = NOW()
    WHERE user_id = user_uuid;
  
  -- If last activity was today, don't change streak
  ELSIF last_activity = current_date THEN
    RETURN;
    
  -- If gap > 1 day, reset streak
  ELSE
    UPDATE public.streaks 
    SET 
      current_streak = 1,
      last_activity_date = current_date,
      updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update streak when progress is added
CREATE OR REPLACE FUNCTION public.handle_progress_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.update_streak(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_progress_created
  AFTER INSERT ON public.progress
  FOR EACH ROW EXECUTE PROCEDURE public.handle_progress_insert();