-- Fix the user creation trigger to properly handle metadata

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_username TEXT;
BEGIN
  -- Extract name and username from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.user_metadata->>'name', 
    'User'
  );
  
  user_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.user_metadata->>'username',
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Insert user profile
  INSERT INTO public.users (id, username, name)
  VALUES (NEW.id, user_username, user_name)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert streak record
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();