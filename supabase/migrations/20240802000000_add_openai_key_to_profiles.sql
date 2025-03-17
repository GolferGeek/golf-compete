-- Add OpenAI API key fields to the profiles table
ALTER TABLE profiles
ADD COLUMN openai_api_key TEXT DEFAULT NULL,
ADD COLUMN use_own_openai_key BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT TRUE;

-- Add comments
COMMENT ON COLUMN profiles.openai_api_key IS 'The user''s OpenAI API key for client-side processing';
COMMENT ON COLUMN profiles.use_own_openai_key IS 'Whether the user chooses to use their own OpenAI API key';
COMMENT ON COLUMN profiles.ai_assistant_enabled IS 'Whether the AI assistant is enabled for this user';

-- Add encryption-related security policy (optional, if you have pgcrypto extension)
-- This is a suggested approach, but implementation depends on your security needs
-- ALTER TABLE public.profiles ALTER COLUMN openai_api_key SET DATA TYPE TEXT; 