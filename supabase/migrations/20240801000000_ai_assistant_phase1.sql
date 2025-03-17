-- Migration for AI Golf Assistant - Phase 1
-- Creates tables for voice interactions, AI preferences, and round notes

-- Store user voice interactions
CREATE TABLE IF NOT EXISTS public.user_voice_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  interaction_type TEXT NOT NULL,
  voice_input TEXT,
  processed_command JSONB,
  response TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster query by user
CREATE INDEX IF NOT EXISTS idx_voice_interactions_user_id ON public.user_voice_interactions(user_id);

-- User AI preferences
CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  voice_enabled BOOLEAN DEFAULT TRUE,
  api_key_source TEXT DEFAULT 'app', -- 'app' or 'user'
  user_api_key TEXT,
  voice_type TEXT DEFAULT 'alloy',
  speaking_rate FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store round notes
CREATE TABLE IF NOT EXISTS public.round_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  round_id UUID REFERENCES public.rounds(id),
  hole_number INTEGER,
  note_text TEXT NOT NULL,
  note_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster query by round
CREATE INDEX IF NOT EXISTS idx_round_notes_round_id ON public.round_notes(round_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.user_voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_notes ENABLE ROW LEVEL SECURITY;

-- User voice interactions policies
CREATE POLICY user_voice_interactions_select_policy ON public.user_voice_interactions
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY user_voice_interactions_insert_policy ON public.user_voice_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User AI preferences policies
CREATE POLICY user_ai_preferences_select_policy ON public.user_ai_preferences
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY user_ai_preferences_insert_policy ON public.user_ai_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_ai_preferences_update_policy ON public.user_ai_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Round notes policies
CREATE POLICY round_notes_select_policy ON public.round_notes
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY round_notes_insert_policy ON public.round_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY round_notes_update_policy ON public.round_notes
  FOR UPDATE USING (auth.uid() = user_id AND auth.uid() = user_id);
  
CREATE POLICY round_notes_delete_policy ON public.round_notes
  FOR DELETE USING (auth.uid() = user_id); 