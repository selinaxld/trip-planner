-- TripPlanner Database Schema for Supabase

-- Enable Row Level Security
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create destinations table
CREATE TABLE public.destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  coordinates POINT,
  description TEXT,
  popular_attractions TEXT[],
  best_time_to_visit TEXT,
  average_cost_per_day DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points of interest table
CREATE TABLE public.points_of_interest (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id UUID REFERENCES destinations(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'attraction', 'restaurant', 'hotel', 'activity'
  description TEXT,
  coordinates POINT,
  rating DECIMAL(2,1),
  price_level INTEGER, -- 1-4 scale
  opening_hours JSONB,
  contact_info JSONB,
  amadeus_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travel plans table
CREATE TABLE public.travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  user_input TEXT NOT NULL,
  plan_data JSONB NOT NULL,
  destinations TEXT[],
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  travel_type TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'confirmed', 'completed', 'cancelled'
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_plan_id UUID REFERENCES travel_plans(id),
  user_id UUID REFERENCES user_profiles(id),
  booking_type TEXT NOT NULL, -- 'flight', 'hotel', 'car', 'restaurant', 'activity'
  provider TEXT NOT NULL, -- 'amadeus', 'booking.com', 'expedia', etc.
  external_booking_id TEXT,
  booking_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  total_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  booking_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) UNIQUE,
  preferred_destinations TEXT[],
  travel_style TEXT[], -- 'luxury', 'budget', 'adventure', 'cultural', 'relaxation'
  dietary_restrictions TEXT[],
  accessibility_needs TEXT[],
  preferred_airlines TEXT[],
  preferred_hotel_chains TEXT[],
  budget_range JSONB, -- {'min': 1000, 'max': 5000, 'currency': 'USD'}
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  travel_plan_id UUID REFERENCES travel_plans(id),
  poi_id UUID REFERENCES points_of_interest(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  photos TEXT[], -- URLs to uploaded photos
  visit_date DATE,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search analytics table
CREATE TABLE public.search_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'destination', 'activity', 'restaurant', etc.
  results_count INTEGER,
  clicked_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX idx_travel_plans_status ON travel_plans(status);
CREATE INDEX idx_travel_plans_dates ON travel_plans(start_date, end_date);
CREATE INDEX idx_bookings_travel_plan_id ON bookings(travel_plan_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_type ON bookings(booking_type);
CREATE INDEX idx_pois_destination_id ON points_of_interest(destination_id);
CREATE INDEX idx_pois_category ON points_of_interest(category);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_travel_plan_id ON reviews(travel_plan_id);

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for travel_plans
CREATE POLICY "Users can view their own travel plans" ON travel_plans
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create their own travel plans" ON travel_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel plans" ON travel_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel plans" ON travel_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for reviews
CREATE POLICY "Users can view all reviews" ON reviews
  FOR SELECT TO authenticated;

CREATE POLICY "Users can create their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to destinations and POIs
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destinations" ON destinations
  FOR SELECT TO anon, authenticated;

CREATE POLICY "Anyone can view points of interest" ON points_of_interest
  FOR SELECT TO anon, authenticated;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_plans_updated_at BEFORE UPDATE ON travel_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO destinations (name, country, city, description) VALUES
('Paris', 'France', 'Paris', 'The City of Light, famous for its art, fashion, and cuisine'),
('Tokyo', 'Japan', 'Tokyo', 'A bustling metropolis blending traditional and modern culture'),
('New York City', 'United States', 'New York', 'The city that never sleeps, known for its skyline and energy'),
('Rome', 'Italy', 'Rome', 'The Eternal City, rich in history and ancient architecture'),
('London', 'United Kingdom', 'London', 'A historic city with royal palaces, museums, and vibrant culture');

INSERT INTO points_of_interest (destination_id, name, category, description, rating) VALUES
((SELECT id FROM destinations WHERE name = 'Paris'), 'Eiffel Tower', 'attraction', 'Iconic iron lattice tower and symbol of Paris', 4.6),
((SELECT id FROM destinations WHERE name = 'Paris'), 'Louvre Museum', 'attraction', 'World''s largest art museum and historic monument', 4.5),
((SELECT id FROM destinations WHERE name = 'Tokyo'), 'Tokyo Skytree', 'attraction', 'Broadcasting and observation tower, tallest in Japan', 4.3),
((SELECT id FROM destinations WHERE name = 'Tokyo'), 'Senso-ji Temple', 'attraction', 'Ancient Buddhist temple in Asakusa district', 4.4),
((SELECT id FROM destinations WHERE name = 'New York City'), 'Statue of Liberty', 'attraction', 'Symbol of freedom and democracy', 4.5),
((SELECT id FROM destinations WHERE name = 'Rome'), 'Colosseum', 'attraction', 'Ancient amphitheater and iconic symbol of Imperial Rome', 4.7);
