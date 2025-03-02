-- Remove rating and slope columns from courses table
ALTER TABLE courses 
DROP COLUMN rating,
DROP COLUMN slope;
