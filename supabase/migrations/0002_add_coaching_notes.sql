-- supabase/migrations/0002_add_coaching_notes.sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS coaching_notes TEXT;
