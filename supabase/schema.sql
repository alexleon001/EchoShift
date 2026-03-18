-- EchoShift Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================================================
-- Profiles table (extends auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL DEFAULT 'Player',
  avatar_url TEXT,
  total_xp INTEGER NOT NULL DEFAULT 0,
  echoes INTEGER NOT NULL DEFAULT 100,
  rank TEXT NOT NULL DEFAULT 'Bronce',
  skill_level TEXT NOT NULL DEFAULT 'Novice',
  avg_response_ms INTEGER,
  games_played INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- Scores table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('endless', 'blitz', 'daily', 'duo')),
  score INTEGER NOT NULL DEFAULT 0,
  max_combo INTEGER NOT NULL DEFAULT 0,
  cells_hit INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  grid_size INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scores are viewable by everyone" ON public.scores
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores" ON public.scores
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_mode_score ON public.scores(mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_player ON public.scores(player_id);

-- ============================================================================
-- Daily Challenges table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  pattern JSONB NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 5,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily challenges are viewable by everyone" ON public.daily_challenges
  FOR SELECT USING (true);

-- ============================================================================
-- Daily Challenge Attempts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_challenge_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, challenge_id)
);

ALTER TABLE public.daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attempts are viewable by everyone" ON public.daily_challenge_attempts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own attempts" ON public.daily_challenge_attempts
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own attempts" ON public.daily_challenge_attempts
  FOR UPDATE USING (auth.uid() = player_id);

-- ============================================================================
-- Player Items (skins, power-ups)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.player_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('skin', 'power_up')),
  quantity INTEGER NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.player_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own items" ON public.player_items
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own items" ON public.player_items
  FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ============================================================================
-- Friendships
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they're part of
CREATE POLICY "Users can view their friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update friendships addressed to them (accept/reject)
CREATE POLICY "Users can respond to friend requests" ON public.friendships
  FOR UPDATE USING (auth.uid() = addressee_id);

-- Users can delete their own friendships
CREATE POLICY "Users can remove friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id, status);

-- ============================================================================
-- Analytics Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  platform TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert events
CREATE POLICY "Users can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Only server/admin can read events
CREATE POLICY "Analytics events are not publicly readable" ON public.analytics_events
  FOR SELECT USING (false);

-- Index for querying by event type and date
CREATE INDEX IF NOT EXISTS idx_analytics_type_date ON public.analytics_events(event_type, created_at DESC);

-- ============================================================================
-- Functions
-- ============================================================================

-- Increment daily challenge attempt counter
CREATE OR REPLACE FUNCTION public.increment_daily_attempts(challenge_date DATE)
RETURNS VOID AS $$
BEGIN
  UPDATE public.daily_challenges
  SET attempts = attempts + 1
  WHERE date = challenge_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'Player')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile when auth.users gets a new row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
