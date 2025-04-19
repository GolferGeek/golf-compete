-- Migration to move quick notes from profile metadata to user_notes table
-- Version: 2024-03-19

DO $$
DECLARE
  quick_notes_count INTEGER := 0;
  migrated_quick_notes INTEGER := 0;
BEGIN
  -- Count quick notes in profile metadata
  WITH quick_notes AS (
    SELECT 
      p.id AS profile_id,
      qn->>'note' AS note_text,
      qn->>'category' AS category,
      (qn->>'created_at')::TIMESTAMPTZ AS created_at
    FROM profiles p,
    jsonb_array_elements(CASE WHEN p.metadata->'quick_notes' IS NULL THEN '[]'::jsonb ELSE p.metadata->'quick_notes' END) AS qn
    WHERE qn->>'note' IS NOT NULL
  )
  SELECT COUNT(*) INTO quick_notes_count FROM quick_notes;
  
  -- Migrate quick notes to user_notes table
  INSERT INTO user_notes (profile_id, note_text, category, created_at)
  WITH quick_notes AS (
    SELECT 
      p.id AS profile_id,
      qn->>'note' AS note_text,
      qn->>'category' AS category,
      (qn->>'created_at')::TIMESTAMPTZ AS created_at
    FROM profiles p,
    jsonb_array_elements(CASE WHEN p.metadata->'quick_notes' IS NULL THEN '[]'::jsonb ELSE p.metadata->'quick_notes' END) AS qn
  )
  SELECT 
    profile_id,
    note_text,
    COALESCE(category, 'quick-note'),
    COALESCE(created_at, now())
  FROM quick_notes qn
  WHERE note_text IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_notes un 
    WHERE un.profile_id = qn.profile_id 
      AND un.note_text = qn.note_text
  );
  
  GET DIAGNOSTICS migrated_quick_notes = ROW_COUNT;
  RAISE NOTICE 'Migrated % of % quick notes', migrated_quick_notes, quick_notes_count;
  
  -- Clean up profile metadata quick_notes after migration
  IF migrated_quick_notes > 0 THEN
    UPDATE profiles
    SET metadata = metadata - 'quick_notes'
    WHERE metadata ? 'quick_notes';
    
    RAISE NOTICE 'Removed quick_notes from profile metadata';
  END IF;
END $$; 