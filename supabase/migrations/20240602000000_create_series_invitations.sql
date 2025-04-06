-- Create Series Invitations table
CREATE TABLE series_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_series_invitation UNIQUE (series_id, user_id),
  CONSTRAINT valid_invitation_status CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Enable RLS
ALTER TABLE series_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Series invitations are viewable by invited users and admins"
  ON series_invitations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Series invitations can be created by admins"
  ON series_invitations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
  ));

CREATE POLICY "Series invitations can be updated by invited users and admins"
  ON series_invitations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE
    )
  );

-- Create indexes for performance
CREATE INDEX idx_series_invitations_series_id ON series_invitations(series_id);
CREATE INDEX idx_series_invitations_user_id ON series_invitations(user_id);
CREATE INDEX idx_series_invitations_status ON series_invitations(status);

-- Function to automatically update series_participants when an invitation is accepted
CREATE OR REPLACE FUNCTION handle_series_invitation_response()
RETURNS TRIGGER AS $$
BEGIN
  -- If the invitation is accepted, create a series participant entry
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO series_participants (series_id, user_id, status, role, joined_at)
    VALUES (NEW.series_id, NEW.user_id, 'active', 'participant', NOW())
    ON CONFLICT (series_id, user_id) DO UPDATE
    SET status = 'active', joined_at = NOW();
  END IF;
  
  -- Set responded_at timestamp
  IF NEW.status IN ('accepted', 'declined') AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for handling invitation responses
CREATE TRIGGER handle_series_invitation_response_trigger
BEFORE UPDATE ON series_invitations
FOR EACH ROW
EXECUTE FUNCTION handle_series_invitation_response(); 