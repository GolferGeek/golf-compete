-- Create event invitations table
CREATE TABLE event_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT event_invitations_email_event_key UNIQUE (email, event_id)
);

-- Add RLS policies
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event invitations are viewable by event participants and admins"
    ON event_invitations FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM event_participants WHERE event_id = event_invitations.event_id
            UNION
            SELECT created_by FROM events WHERE id = event_invitations.event_id
        )
    );

CREATE POLICY "Event invitations are insertable by event admins"
    ON event_invitations FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT created_by FROM events WHERE id = event_id
        )
    );

CREATE POLICY "Event invitations are updatable by invitee or event admins"
    ON event_invitations FOR UPDATE
    USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT created_by FROM events WHERE id = event_id
        )
    ); 