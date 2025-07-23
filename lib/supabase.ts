import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = 'https://yjcclyjqbufgnrkubuoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqY2NseWpxYnVmZ25ya3VidW9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTE0NDQsImV4cCI6MjA2Njg2NzQ0NH0.7IpGz9IGvNBhtGlMUeIX1I6KLAWXJwP02DW4gJrwiHc';   

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
  },
});