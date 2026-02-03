-- Forum Sections Migration: Medicine, Sport, Conversation Hub
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add section column to categories (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'section'
  ) THEN
    ALTER TABLE categories ADD COLUMN section TEXT;
  END IF;
END $$;

-- 2. Ensure unique constraint on slug exists (needed for upsert)
-- Drop any existing index/constraint with this name first, then recreate as proper constraint
DROP INDEX IF EXISTS categories_slug_unique;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;
ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- 3. Deactivate all existing categories
UPDATE categories SET is_active = false WHERE is_active = true;

-- 4. Insert new categories (or update if slug already exists)
INSERT INTO categories (name, description, slug, order_index, is_active, section)
VALUES
  ('Медицина', 'Обсуждение вопросов здоровья, спортивной медицины и профилактики травм', 'medicina', 1, true, 'medicine'),
  ('Питание', 'Рацион, диеты, спортивное питание и нутрициология', 'pitanie', 2, true, 'sport'),
  ('Тренировки', 'Программы тренировок, техника выполнения упражнений и методики', 'trenirovki', 3, true, 'sport'),
  ('Допинг', 'Фармакология, ПКТ, анаболические стероиды и другие препараты', 'doping', 4, true, 'sport')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  is_active = EXCLUDED.is_active,
  section = EXCLUDED.section;

-- 5. Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversation_messages_created_idx
  ON conversation_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS conversation_messages_user_idx
  ON conversation_messages (user_id, created_at DESC);

-- 6. Enable RLS on conversation_messages
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies: anyone can read, server-side handles auth for inserts
-- Since we use supabaseAdmin (service role) for API routes, RLS is bypassed server-side.
-- These policies are for direct client access safety.
DROP POLICY IF EXISTS "Anyone can read conversation messages" ON conversation_messages;
CREATE POLICY "Anyone can read conversation messages"
  ON conversation_messages FOR SELECT
  USING (true);

-- For inserts via service role (API routes), RLS is bypassed.
-- Add a restrictive policy for direct client inserts as defense-in-depth.
DROP POLICY IF EXISTS "No direct client inserts" ON conversation_messages;
CREATE POLICY "No direct client inserts"
  ON conversation_messages FOR INSERT
  WITH CHECK (false);

-- 8. Enable realtime on conversation_messages
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_messages;

-- Verify
SELECT id, name, slug, section, is_active, order_index
FROM categories
WHERE is_active = true
ORDER BY order_index;
