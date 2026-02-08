/**
 * Migration script: Forum Sections + Conversation Hub
 *
 * Run with: npx tsx src/scripts/migrate-forum-sections.ts
 *
 * Changes:
 * 1. Adds `section` column to categories table ('medicine' | 'sport' | null)
 * 2. Deactivates old categories
 * 3. Seeds 4 new categories: Медицина, Питание, Тренировки, Допинг
 * 4. Creates conversation_messages table with RLS
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (avoids dotenv dependency)
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
} catch { /* .env.local not found, rely on existing env vars */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runSQL(sql: string, label: string) {
  const { error } = await supabase.rpc('exec_sql', { sql_text: sql })
  if (error) {
    // Try alternative: use the REST API directly
    console.warn(`RPC exec_sql failed for "${label}": ${error.message}`)
    console.log(`Attempting via direct query for "${label}"...`)
    // Fallback: run via .from() if possible, or log SQL for manual execution
    return false
  }
  console.log(`✓ ${label}`)
  return true
}

async function migrate() {

  // Step 1: Add section column to categories
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql_text: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'categories' AND column_name = 'section'
        ) THEN
          ALTER TABLE categories ADD COLUMN section TEXT;
        END IF;
      END $$;
    `
  })

  if (alterError) {
  } else {
  }

  // Step 2: Deactivate all existing categories
  const { error: deactivateError } = await supabase
    .from('categories')
    .update({ is_active: false })
    .neq('id', '00000000-0000-0000-0000-000000000000') // match all

  if (deactivateError) {
    console.error('Failed to deactivate old categories:', deactivateError.message)
  } else {
  }

  // Step 3: Seed new categories
  const newCategories = [
    {
      name: 'Медицина',
      description: 'Обсуждение вопросов здоровья, спортивной медицины и профилактики травм',
      slug: 'medicina',
      order_index: 1,
      is_active: true,
      section: 'medicine'
    },
    {
      name: 'Питание',
      description: 'Рацион, диеты, спортивное питание и нутрициология',
      slug: 'pitanie',
      order_index: 2,
      is_active: true,
      section: 'sport'
    },
    {
      name: 'Тренировки',
      description: 'Программы тренировок, техника выполнения упражнений и методики',
      slug: 'trenirovki',
      order_index: 3,
      is_active: true,
      section: 'sport'
    },
    {
      name: 'Допинг',
      description: 'Фармакология, ПКТ, анаболические стероиды и другие препараты',
      slug: 'doping',
      order_index: 4,
      is_active: true,
      section: 'sport'
    }
  ]

  // Check if categories already exist by slug
  for (const cat of newCategories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .single()

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('categories')
        .update(cat)
        .eq('slug', cat.slug)

      if (error) {
        console.error(`Failed to update category "${cat.name}":`, error.message)
      } else {
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('categories')
        .insert(cat)

      if (error) {
        console.error(`Failed to insert category "${cat.name}":`, error.message)
        // If section column doesn't exist, try without it
        if (error.message.includes('section')) {
          const { section, ...catWithoutSection } = cat
          const { error: retryError } = await supabase
            .from('categories')
            .insert(catWithoutSection)
          if (retryError) {
          } else {
          }
        }
      } else {
      }
    }
  }

  // Step 4: Create conversation_messages table

  const createTableSQL = `
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

    -- Enable RLS
    ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

    -- Anyone can read messages
    DROP POLICY IF EXISTS "Anyone can read conversation messages" ON conversation_messages;
    CREATE POLICY "Anyone can read conversation messages"
      ON conversation_messages FOR SELECT
      USING (true);

    -- Only authenticated users can insert their own messages
    DROP POLICY IF EXISTS "Authenticated users can insert own messages" ON conversation_messages;
    CREATE POLICY "Authenticated users can insert own messages"
      ON conversation_messages FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  `

  const { error: tableError } = await supabase.rpc('exec_sql', { sql_text: createTableSQL })
  if (tableError) {
  } else {
  }

  // Verify categories
  const { data: cats } = await supabase
    .from('categories')
    .select('id, name, slug, section, is_active, order_index')
    .eq('is_active', true)
    .order('order_index')

}

migrate().catch(console.error)
