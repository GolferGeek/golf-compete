-- Add status column to user_notes table
ALTER TABLE user_notes
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'added'
CHECK (status IN ('added', 'working_on', 'implemented'));

-- Add index for status column for better filtering performance
CREATE INDEX idx_user_notes_status ON user_notes(status);

-- Add comment for documentation
COMMENT ON COLUMN user_notes.status IS 'Status of the note: added (default), working_on, or implemented'; 