-- Site settings table for storing configurable values (e.g. contact email)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the contact recipient email
INSERT INTO site_settings (key, value)
VALUES ('contact_recipient_email', 'rpochtman@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- Restrict access: only service role can read/write
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- No public policies — only supabaseAdmin (service role) can access
