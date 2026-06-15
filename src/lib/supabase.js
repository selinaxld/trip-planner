import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema types
export const DB_TABLES = {
  TRAVEL_PLANS: 'travel_plans',
  USER_PREFERENCES: 'user_preferences',
  DESTINATIONS: 'destinations',
  POIS: 'points_of_interest',
  BOOKINGS: 'bookings'
}
