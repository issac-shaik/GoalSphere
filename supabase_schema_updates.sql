-- Additional schema updates for new features

-- Add icon field to goals table (if not exists)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'target';

-- Add color field to goals table (if not exists)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366F1';

-- First, update any existing invalid duration_type values
UPDATE public.goals 
SET duration_type = 'daily' 
WHERE duration_type NOT IN ('daily', 'weekly', 'monthly', 'yearly');

-- Update duration_type constraint to include all valid types
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_duration_type_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_duration_type_check 
  CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly'));

-- Create function to check goal limits per user
CREATE OR REPLACE FUNCTION check_goal_limit()
RETURNS TRIGGER AS $$
DECLARE
  goal_count INTEGER;
BEGIN
  -- Count existing goals of the same type for this user
  SELECT COUNT(*) INTO goal_count 
  FROM public.goals 
  WHERE user_id = NEW.user_id 
    AND duration_type = NEW.duration_type 
    AND is_active = TRUE;
  
  -- Check limits: 3 for each type
  IF goal_count >= 3 THEN
    RAISE EXCEPTION 'Cannot create more than 3 % goals', NEW.duration_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce goal limits
DROP TRIGGER IF EXISTS enforce_goal_limit ON public.goals;
CREATE TRIGGER enforce_goal_limit
  BEFORE INSERT ON public.goals
  FOR EACH ROW
  EXECUTE FUNCTION check_goal_limit();

-- Create view for user search (views don't need RLS policies)
CREATE OR REPLACE VIEW public.user_search AS
SELECT 
  u.id,
  u.username,
  u.name,
  u.bio,
  u.avatar_url,
  u.is_private,
  s.current_streak,
  s.longest_streak,
  (SELECT COUNT(*) FROM public.follows WHERE following_id = u.id AND is_approved = true) as followers_count,
  (SELECT COUNT(*) FROM public.follows WHERE follower_id = u.id AND is_approved = true) as following_count
FROM public.users u
LEFT JOIN public.streaks s ON u.id = s.user_id;

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS get_activity_grid(UUID, DATE);
DROP FUNCTION IF EXISTS get_activity_grid(UUID);

-- Function to get activity grid data (GitHub-style)
CREATE OR REPLACE FUNCTION get_activity_grid(goal_uuid UUID, start_date DATE DEFAULT CURRENT_DATE - INTERVAL '365 days')
RETURNS TABLE(
  date DATE,
  completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT start_date::DATE as date
    UNION ALL
    SELECT (date + 1)::DATE
    FROM date_series
    WHERE date < CURRENT_DATE
  )
  SELECT 
    ds.date,
    CASE 
      WHEN p.completed_date IS NOT NULL THEN true 
      ELSE false 
    END as completed
  FROM date_series ds
  LEFT JOIN public.progress p ON p.completed_date = ds.date AND p.goal_id = goal_uuid
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing function first to avoid conflicts
DROP FUNCTION IF EXISTS get_user_goals_with_progress(UUID);

-- Function to get user's goal details with progress
CREATE OR REPLACE FUNCTION get_user_goals_with_progress(user_uuid UUID)
RETURNS TABLE(
  goal_id UUID,
  title TEXT,
  description TEXT,
  duration_type TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ,
  total_completions BIGINT,
  current_streak INTEGER,
  last_completed DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as goal_id,
    g.title,
    g.description,
    g.duration_type,
    g.icon,
    g.color,
    g.created_at,
    COUNT(p.id) as total_completions,
    CASE 
      WHEN g.duration_type = 'daily' THEN 
        (SELECT COUNT(*) FROM public.progress p2 
         WHERE p2.goal_id = g.id 
         AND p2.completed_date >= CURRENT_DATE - INTERVAL '30 days')
      ELSE 0
    END as current_streak,
    MAX(p.completed_date) as last_completed
  FROM public.goals g
  LEFT JOIN public.progress p ON g.id = p.goal_id
  WHERE g.user_id = user_uuid AND g.is_active = true
  GROUP BY g.id, g.title, g.description, g.duration_type, g.icon, g.color, g.created_at
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy for the new function
GRANT EXECUTE ON FUNCTION get_user_goals_with_progress(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_grid(UUID, DATE) TO authenticated;

-- Create reactions table for goal posts
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  progress_date DATE NOT NULL, -- The date when the goal was completed
  reaction_emoji TEXT NOT NULL, -- Any emoji character(s)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, goal_id, progress_date) -- One reaction per user per goal completion
);

-- Enable RLS for reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Users can view reactions on goals they can see" ON public.reactions
  FOR SELECT USING (
    goal_id IN (
      SELECT g.id FROM public.goals g
      JOIN public.users u ON g.user_id = u.id
      WHERE u.is_private = FALSE 
      OR g.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.follows f 
        WHERE f.following_id = g.user_id 
        AND f.follower_id = auth.uid() 
        AND f.is_approved = TRUE
      )
    )
  );

CREATE POLICY "Users can insert own reactions" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Update notifications table to include reaction type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('goal_completed', 'follow_request', 'follow_approved', 'goal_reaction'));

-- Add reaction_id field to notifications for reaction notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reaction_id UUID REFERENCES public.reactions(id) ON DELETE CASCADE;

-- Add target_count column to goals table for multiple completions per day
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1;

-- Update progress table to support multiple completions per day
ALTER TABLE public.progress ADD COLUMN IF NOT EXISTS completion_count INTEGER DEFAULT 1;

-- Drop the unique constraint if it exists (to allow multiple completions per goal per day)
ALTER TABLE public.progress DROP CONSTRAINT IF EXISTS progress_goal_date_unique;

-- Add index for better performance on progress queries
CREATE INDEX IF NOT EXISTS idx_progress_goal_date ON public.progress(goal_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON public.progress(user_id, completed_date);

-- Add missing DELETE policy for goals table
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

-- Add missing DELETE policy for progress table  
CREATE POLICY "Users can delete own progress" ON public.progress
  FOR DELETE USING (auth.uid() = user_id);

--Alter commands run in the supabase cli:
--ALTER TABLE public.goals ADD COLUMN color TEXT DEFAULT '#6366F1';
--ALTER TABLE public.goals DROP CONSTRAINT goals_duration_type_check;
--ALTER TABLE public.goals ADD CONSTRAINT goals_duration_type_check CHECK (duration_type IN ('daily', 'weekly', 'monthly', 'yearly'));
--ALTER TABLE public.goals ADD COLUMN target_count INTEGER DEFAULT 1;
--ALTER TABLE public.progress ADD COLUMN completion_count INTEGER DEFAULT 1;