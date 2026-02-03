# MongoDB to Supabase Migration Plan

## Project: Iron Blog / Tarnovsky Forum
## Date: 2026-01-30

---

## 1. Analysis Summary

### MongoDB Collections Identified (9 total)

| Collection | Purpose | Relationships |
|---|---|---|
| **User** | User accounts (local + OAuth) | Referenced by Topic, Post, Comment, FlaggedPost, ResetToken |
| **Category** | Forum categories | Parent of Topics |
| **Topic** | Forum threads | Belongs to Category, created by User, contains Posts |
| **Post** | Forum replies | Belongs to Topic, created by User |
| **Article** | Blog articles | Standalone content, has Comments |
| **Training** | Training guides | Standalone content, has Comments |
| **Comment** | Polymorphic comments | Belongs to Article/Training/Forum content |
| **FlaggedPost** | Moderation reports | References Post, Topic, and Users |
| **ResetToken** | Auth tokens (reset/verify) | Belongs to User |

### Key Architectural Differences: MongoDB vs PostgreSQL

| Aspect | MongoDB (Current) | PostgreSQL/Supabase (Target) |
|---|---|---|
| IDs | ObjectId strings (`_id`) | UUID (`gen_random_uuid()`) |
| References | String fields (no enforcement) | Foreign keys with constraints |
| Arrays (likedBy, etc.) | Embedded arrays in document | Junction/join tables |
| Timestamps | `timestamps: true` or manual | `DEFAULT now()` with triggers |
| Soft delete | `isActive: boolean` | Same pattern, preserved |
| Polymorphic refs | `contentType` + `contentId` strings | `content_type` enum + UUID |
| Schema | Flexible, schema-on-read | Strict, schema-on-write |
| TTL indexes | `expireAfterSeconds` on ResetToken | `pg_cron` or app-level cleanup |

### Assumptions

1. **UUID primary keys** will replace MongoDB ObjectId strings. This means all `userId`, `topicId`, `categoryId`, etc. references will become proper FK UUIDs.
2. **Denormalized fields** like `userName`, `userEmail` on Topic/Post are preserved for query performance but can be joined from the `users` table.
3. **likedBy/dislikedBy arrays** become a proper junction table (`post_votes`, `topic_votes`) — this is the correct relational approach.
4. **mediaLinks arrays** become a separate table or use PostgreSQL `text[]` array type (we'll use native array since it's simple string lists).
5. The project uses **custom JWT auth** (not Supabase Auth). We'll keep this initially and note the path to migrate to Supabase Auth later.
6. **The existing MongoDB data** may need a data migration script — that is out of scope for this schema design but noted as follow-up.

---

## 2. PostgreSQL Schema Design

### Entity Relationship Diagram (Text)

```
categories 1──∞ topics ∞──1 users
                 │
                 ├──∞ posts ∞──1 users
                 │     │
                 │     ├──∞ post_votes ∞──1 users
                 │     └──∞ flagged_posts ∞──1 users (flaggedBy, reviewedBy)
                 │
                 └──∞ topic_votes ∞──1 users

articles (standalone)
  └──∞ comments ∞──1 users

trainings (standalone)
  └──∞ comments ∞──1 users

users 1──∞ reset_tokens
```

### Naming Conventions

- **Tables**: `snake_case`, plural (e.g., `users`, `topics`, `posts`)
- **Columns**: `snake_case` (e.g., `created_at`, `is_active`)
- **Primary keys**: `id UUID DEFAULT gen_random_uuid()`
- **Foreign keys**: `<entity>_id` (e.g., `user_id`, `topic_id`)
- **Timestamps**: `created_at`, `updated_at` with auto-update trigger
- **Booleans**: `is_` prefix (e.g., `is_active`, `is_admin`)
- **Enums**: PostgreSQL `CREATE TYPE` for fixed sets

---

## 3. SQL Migration Script

```sql
-- ============================================================
-- SUPABASE MIGRATION: MongoDB → PostgreSQL
-- Project: Iron Blog / Tarnovsky Forum
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================

CREATE TYPE comment_content_type AS ENUM ('article', 'training', 'forum');
CREATE TYPE flag_status AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE token_type AS ENUM ('password_reset', 'email_verification');
CREATE TYPE training_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- ============================================================
-- TABLE: users
-- Source: MongoDB User collection
-- Purpose: User accounts with local + OAuth authentication
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  photo_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  city TEXT,
  country TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  google_id TEXT,
  github_id TEXT,
  vk_id TEXT,
  refresh_token TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraints (matching MongoDB unique indexes)
CREATE UNIQUE INDEX users_email_unique ON users (LOWER(email));
CREATE UNIQUE INDEX users_username_unique ON users (LOWER(username));

-- Sparse unique indexes for OAuth IDs (only enforce uniqueness when NOT NULL)
CREATE UNIQUE INDEX users_google_id_unique ON users (google_id) WHERE google_id IS NOT NULL;
CREATE UNIQUE INDEX users_github_id_unique ON users (github_id) WHERE github_id IS NOT NULL;
CREATE UNIQUE INDEX users_vk_id_unique ON users (vk_id) WHERE vk_id IS NOT NULL;

-- ============================================================
-- TABLE: categories
-- Source: MongoDB Category collection
-- Purpose: Forum category groupings
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_slug_unique ON categories (LOWER(slug));
CREATE INDEX categories_order_idx ON categories (order_index);

-- ============================================================
-- TABLE: topics
-- Source: MongoDB Topic collection
-- Purpose: Forum discussion threads
-- ============================================================

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Denormalized fields for query performance (mirrors MongoDB design)
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 255),
  content TEXT NOT NULL,
  media_links TEXT[] DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_post_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reply_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX topics_category_id_idx ON topics (category_id);
CREATE INDEX topics_user_id_idx ON topics (user_id);
CREATE INDEX topics_pinned_last_post_idx ON topics (is_pinned DESC, last_post_at DESC);
CREATE INDEX topics_is_active_idx ON topics (is_active) WHERE is_active = TRUE;

-- ============================================================
-- TABLE: posts
-- Source: MongoDB Post collection
-- Purpose: Replies within forum topics
-- ============================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Denormalized fields
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  media_links TEXT[] DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  dislikes INTEGER NOT NULL DEFAULT 0,
  is_edited BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX posts_topic_id_idx ON posts (topic_id);
CREATE INDEX posts_user_id_idx ON posts (user_id);
CREATE INDEX posts_parent_post_id_idx ON posts (parent_post_id) WHERE parent_post_id IS NOT NULL;
CREATE INDEX posts_created_at_idx ON posts (created_at);

-- ============================================================
-- TABLE: topic_votes
-- Source: MongoDB Topic likedBy/dislikedBy arrays
-- Purpose: Track individual user votes on topics
-- ============================================================

CREATE TABLE topic_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX topic_votes_unique ON topic_votes (topic_id, user_id);
CREATE INDEX topic_votes_topic_idx ON topic_votes (topic_id);
CREATE INDEX topic_votes_user_idx ON topic_votes (user_id);

-- ============================================================
-- TABLE: post_votes
-- Source: MongoDB Post likedBy/dislikedBy arrays
-- Purpose: Track individual user votes on posts
-- ============================================================

CREATE TABLE post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX post_votes_unique ON post_votes (post_id, user_id);
CREATE INDEX post_votes_post_idx ON post_votes (post_id);
CREATE INDEX post_votes_user_idx ON post_votes (user_id);

-- ============================================================
-- TABLE: articles
-- Source: MongoDB Article collection
-- Purpose: Blog/documentation articles
-- ============================================================

CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  subheader TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover_image_url TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX articles_slug_unique ON articles (slug);
CREATE INDEX articles_created_at_idx ON articles (created_at DESC);

-- ============================================================
-- TABLE: trainings
-- Source: MongoDB Training collection
-- Purpose: Training/tutorial content
-- ============================================================

CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  subheader TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover_image_url TEXT NOT NULL DEFAULT '',
  level training_level NOT NULL DEFAULT 'beginner',
  duration_minutes INTEGER,
  author_name TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX trainings_slug_unique ON trainings (slug);
CREATE INDEX trainings_created_at_idx ON trainings (created_at DESC);

-- ============================================================
-- TABLE: comments
-- Source: MongoDB Comment collection
-- Purpose: Polymorphic comments on articles, trainings, forum
-- ============================================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type comment_content_type NOT NULL,
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Compound index matching MongoDB: contentType + contentId + created_at
CREATE INDEX comments_content_lookup_idx ON comments (content_type, content_id, created_at DESC);
CREATE INDEX comments_user_id_idx ON comments (user_id);

-- ============================================================
-- TABLE: flagged_posts
-- Source: MongoDB FlaggedPost collection
-- Purpose: Post moderation/reporting system
-- ============================================================

CREATE TABLE flagged_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  topic_title TEXT NOT NULL,
  post_content TEXT NOT NULL,
  post_author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_author_name TEXT NOT NULL,
  flagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flagged_by_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  status flag_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX flagged_posts_post_id_idx ON flagged_posts (post_id);
CREATE INDEX flagged_posts_topic_id_idx ON flagged_posts (topic_id);
CREATE INDEX flagged_posts_status_created_idx ON flagged_posts (status, created_at DESC);
CREATE INDEX flagged_posts_flagged_by_idx ON flagged_posts (flagged_by);

-- ============================================================
-- TABLE: reset_tokens
-- Source: MongoDB ResetToken collection
-- Purpose: Password reset and email verification tokens
-- ============================================================

CREATE TABLE reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  type token_type NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX reset_tokens_token_unique ON reset_tokens (token);
CREATE INDEX reset_tokens_user_id_idx ON reset_tokens (user_id);
CREATE INDEX reset_tokens_expires_at_idx ON reset_tokens (expires_at);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- Replaces Mongoose timestamps: true behavior
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainings_updated_at
  BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reset_tokens_updated_at
  BEFORE UPDATE ON reset_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EXPIRED TOKEN CLEANUP
-- Replaces MongoDB TTL index (expireAfterSeconds)
-- Run periodically via pg_cron or application logic
-- ============================================================

-- To enable pg_cron (Supabase has this available):
-- SELECT cron.schedule(
--   'cleanup-expired-tokens',
--   '0 * * * *',  -- Every hour
--   $$DELETE FROM reset_tokens WHERE expires_at < now()$$
-- );
```

---

## 4. Row Level Security (RLS) Policies

**Important Context**: The current project uses custom JWT auth (not Supabase Auth). RLS policies below are designed for when/if you migrate to Supabase Auth, or when using the service role key for server-side operations and anon key for client-side.

For the initial migration phase, you'll use the **service_role** key from server-side API routes (which bypasses RLS). RLS becomes relevant when you expose the Supabase client directly to the browser.

```sql
-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reset_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS TABLE
-- ============================================================

-- Anyone can read basic user profiles (forum is public)
CREATE POLICY "users_public_read" ON users
  FOR SELECT USING (TRUE);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only service role can insert users (registration goes through API)
-- No INSERT policy for anon/authenticated = denied by default

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================

-- Anyone can read active categories
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT USING (is_active = TRUE);

-- Only admins can manage categories (handled via service role in API routes)

-- ============================================================
-- TOPICS TABLE
-- ============================================================

-- Anyone can read active topics
CREATE POLICY "topics_public_read" ON topics
  FOR SELECT USING (is_active = TRUE);

-- Authenticated users can create topics
CREATE POLICY "topics_authenticated_insert" ON topics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Topic owners can update their own topics
CREATE POLICY "topics_owner_update" ON topics
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- POSTS TABLE
-- ============================================================

-- Anyone can read active posts
CREATE POLICY "posts_public_read" ON posts
  FOR SELECT USING (is_active = TRUE);

-- Authenticated users can create posts
CREATE POLICY "posts_authenticated_insert" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Post owners can update their own posts
CREATE POLICY "posts_owner_update" ON posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Post owners can delete their own posts
CREATE POLICY "posts_owner_delete" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- VOTES TABLES
-- ============================================================

-- Anyone can read votes (needed for vote counts)
CREATE POLICY "topic_votes_public_read" ON topic_votes
  FOR SELECT USING (TRUE);

CREATE POLICY "post_votes_public_read" ON post_votes
  FOR SELECT USING (TRUE);

-- Authenticated users can manage their own votes
CREATE POLICY "topic_votes_own_manage" ON topic_votes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "post_votes_own_manage" ON post_votes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- ARTICLES & TRAININGS (public content, admin-managed)
-- ============================================================

CREATE POLICY "articles_public_read" ON articles
  FOR SELECT USING (TRUE);

CREATE POLICY "trainings_public_read" ON trainings
  FOR SELECT USING (TRUE);

-- Admin write operations handled via service_role key in API routes

-- ============================================================
-- COMMENTS TABLE
-- ============================================================

-- Anyone can read comments
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (TRUE);

-- Authenticated users can create comments
CREATE POLICY "comments_authenticated_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comment owners can update/delete their own comments
CREATE POLICY "comments_owner_update" ON comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_owner_delete" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FLAGGED POSTS (moderation - restricted access)
-- ============================================================

-- Only the flagger can see their own flags (and admins via service role)
CREATE POLICY "flagged_posts_own_read" ON flagged_posts
  FOR SELECT USING (auth.uid() = flagged_by);

-- Authenticated users can create flags
CREATE POLICY "flagged_posts_create" ON flagged_posts
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

-- ============================================================
-- RESET TOKENS (fully private, service role only)
-- ============================================================

-- No public/authenticated access to reset_tokens.
-- All operations go through API routes using service_role key.
-- The default-deny policy applies (RLS enabled, no policies = no access).
```

### RLS Policy Summary (Plain Language)

| Table | Read | Create | Update | Delete |
|---|---|---|---|---|
| **users** | Everyone can read profiles | Server-only (registration API) | Own profile only | Server-only |
| **categories** | Everyone reads active ones | Admin only (server) | Admin only (server) | Admin only (server) |
| **topics** | Everyone reads active ones | Authenticated, own user_id | Own topics only | Server-only (admin) |
| **posts** | Everyone reads active ones | Authenticated, own user_id | Own posts only | Own posts only |
| **topic_votes** | Everyone | Own votes only | Own votes only | Own votes only |
| **post_votes** | Everyone | Own votes only | Own votes only | Own votes only |
| **articles** | Everyone | Admin only (server) | Admin only (server) | Admin only (server) |
| **trainings** | Everyone | Admin only (server) | Admin only (server) | Admin only (server) |
| **comments** | Everyone | Authenticated, own user_id | Own comments only | Own comments only |
| **flagged_posts** | Own flags only | Authenticated, own flagged_by | Server-only (admin review) | Server-only |
| **reset_tokens** | Nobody (server-only) | Server-only | Server-only | Server-only |

---

## 5. Integration Guidance

### 5.1 Supabase Client Setup

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side: uses anon key (subject to RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side: uses service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

Environment variables needed (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://robdolytmgphidphmrtd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 5.2 Query Translation Examples

#### Before (MongoDB): Get categories with stats
```typescript
await connectDB()
const categories = await Category.find({ isActive: true }).sort({ orderIndex: 1 })
```

#### After (Supabase): Get categories with stats
```typescript
const { data: categories, error } = await supabaseAdmin
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('order_index', { ascending: true })
```

---

#### Before (MongoDB): Create a topic
```typescript
await connectDB()
const topic = await Topic.create({
  categoryId, userId, userName, userEmail, title, content, mediaLinks
})
```

#### After (Supabase): Create a topic
```typescript
const { data: topic, error } = await supabaseAdmin
  .from('topics')
  .insert({
    category_id: categoryId,
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    title,
    content,
    media_links: mediaLinks
  })
  .select()
  .single()
```

---

#### Before (MongoDB): Get topic with posts (paginated)
```typescript
const topic = await Topic.findById(topicId)
const posts = await Post.find({ topicId, isActive: true })
  .sort({ createdAt: 1 })
  .skip((page - 1) * limit)
  .limit(limit)
```

#### After (Supabase): Get topic with posts (paginated)
```typescript
const { data: topic } = await supabaseAdmin
  .from('topics')
  .select('*')
  .eq('id', topicId)
  .single()

const { data: posts, count } = await supabaseAdmin
  .from('posts')
  .select('*', { count: 'exact' })
  .eq('topic_id', topicId)
  .eq('is_active', true)
  .order('created_at', { ascending: true })
  .range((page - 1) * limit, page * limit - 1)
```

---

#### Before (MongoDB): Vote on post (likedBy array)
```typescript
const post = await Post.findById(postId)
if (post.likedBy.includes(userId)) {
  post.likedBy = post.likedBy.filter(id => id !== userId)
  post.likes -= 1
} else {
  post.likedBy.push(userId)
  post.likes += 1
}
await post.save()
```

#### After (Supabase): Vote on post (junction table)
```typescript
// Check existing vote
const { data: existing } = await supabaseAdmin
  .from('post_votes')
  .select('*')
  .eq('post_id', postId)
  .eq('user_id', userId)
  .single()

if (existing) {
  if (existing.vote_type === voteType) {
    // Remove vote (toggle off)
    await supabaseAdmin.from('post_votes').delete().eq('id', existing.id)
    await supabaseAdmin.rpc('decrement_post_vote', { p_post_id: postId, p_vote_type: voteType })
  } else {
    // Change vote type
    await supabaseAdmin.from('post_votes').update({ vote_type: voteType }).eq('id', existing.id)
    await supabaseAdmin.rpc('swap_post_vote', { p_post_id: postId, p_old_type: existing.vote_type, p_new_type: voteType })
  }
} else {
  // New vote
  await supabaseAdmin.from('post_votes').insert({ post_id: postId, user_id: userId, vote_type: voteType })
  await supabaseAdmin.rpc('increment_post_vote', { p_post_id: postId, p_vote_type: voteType })
}
```

---

#### Before (MongoDB): Find user by email or username
```typescript
const user = await User.findOne({
  $or: [
    { email: emailOrUsername.toLowerCase() },
    { username: emailOrUsername.toLowerCase() }
  ],
  isActive: true
})
```

#### After (Supabase): Find user by email or username
```typescript
const { data: user } = await supabaseAdmin
  .from('users')
  .select('*')
  .eq('is_active', true)
  .or(`email.eq.${emailOrUsername.toLowerCase()},username.eq.${emailOrUsername.toLowerCase()}`)
  .single()
```

### 5.3 Files That Need Changes

Each file currently importing from MongoDB models or `connectDB` must be updated:

| File Pattern | Change Required |
|---|---|
| `src/lib/mongodb.ts` | Replace with `src/lib/supabase.ts` |
| `src/models/*.ts` | No longer needed (schema is in PostgreSQL). Can keep TypeScript interfaces for type safety. |
| `src/app/api/auth/*.ts` | Replace `connectDB()` + `User.findOne()` etc. with Supabase client calls |
| `src/app/api/forum/**/*.ts` | Replace all Mongoose queries with Supabase queries |
| `src/app/api/content/**/*.ts` | Replace Article/Training/Comment queries |
| `src/app/api/admin/**/*.ts` | Replace all admin Mongoose queries |
| `src/lib/auth.ts` | Keep JWT logic; replace `User` model lookups with Supabase |

### 5.4 TypeScript Types (Replacing Mongoose Interfaces)

Create `src/types/database.ts` with interfaces matching the new schema:

```typescript
export interface User {
  id: string
  email: string
  username: string
  password_hash?: string
  display_name?: string
  photo_url?: string
  bio?: string
  city?: string
  country?: string
  is_active: boolean
  is_admin: boolean
  is_verified: boolean
  google_id?: string
  github_id?: string
  vk_id?: string
  refresh_token?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  category_id: string
  user_id: string
  user_name: string
  user_email: string
  title: string
  content: string
  media_links: string[]
  views: number
  likes: number
  dislikes: number
  is_pinned: boolean
  is_locked: boolean
  is_active: boolean
  last_post_at: string
  reply_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  topic_id: string
  user_id: string
  user_name: string
  user_email: string
  content: string
  media_links: string[]
  likes: number
  dislikes: number
  is_edited: boolean
  edited_at?: string
  is_active: boolean
  parent_post_id?: string
  created_at: string
  updated_at: string
}

export interface Article {
  id: string
  title: string
  slug: string
  subheader: string
  content: string
  cover_image_url: string
  tags: string
  likes: number
  views: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface Training {
  id: string
  title: string
  slug: string
  subheader: string
  content: string
  cover_image_url: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes?: number
  author_name: string
  likes: number
  views: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  content_type: 'article' | 'training' | 'forum'
  content_id: string
  user_id: string
  content: string
  likes: number
  created_at: string
  updated_at?: string
}

export interface FlaggedPost {
  id: string
  post_id: string
  topic_id: string
  topic_title: string
  post_content: string
  post_author_id: string
  post_author_name: string
  flagged_by: string
  flagged_by_name: string
  reason: string
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface ResetToken {
  id: string
  user_id: string
  token: string
  type: 'password_reset' | 'email_verification'
  expires_at: string
  used: boolean
  created_at: string
  updated_at: string
}

export interface TopicVote {
  id: string
  topic_id: string
  user_id: string
  vote_type: 'like' | 'dislike'
  created_at: string
}

export interface PostVote {
  id: string
  post_id: string
  user_id: string
  vote_type: 'like' | 'dislike'
  created_at: string
}
```

---

## 6. Migration Summary

### What Changed
- Database engine: **MongoDB → PostgreSQL** (via Supabase)
- Connection layer: `mongoose.connect()` → `createClient()` (Supabase JS SDK)
- Schema: Flexible documents → Strict relational tables with foreign keys
- Arrays (likedBy/dislikedBy): Embedded arrays → Junction tables (`post_votes`, `topic_votes`)
- IDs: MongoDB ObjectId → PostgreSQL UUID
- Field naming: camelCase → snake_case
- Timestamps: Mongoose plugin → PostgreSQL trigger function
- TTL cleanup: MongoDB TTL index → pg_cron or application logic

### What Will Be Created in Supabase
- **11 tables**: users, categories, topics, posts, topic_votes, post_votes, articles, trainings, comments, flagged_posts, reset_tokens
- **4 enum types**: comment_content_type, flag_status, token_type, training_level
- **1 trigger function**: `update_updated_at_column()` (applied to 7 tables)
- **20+ indexes** for query performance
- **RLS policies** on all 11 tables

### What Remains To Be Done in the Codebase
1. **Install Supabase SDK**: `npm install @supabase/supabase-js`
2. **Create `src/lib/supabase.ts`** client configuration
3. **Create `src/types/database.ts`** with TypeScript interfaces
4. **Update every API route** to replace Mongoose calls with Supabase calls (40+ route files)
5. **Update `src/lib/auth.ts`** to use Supabase for user lookups
6. **Remove MongoDB dependencies**: `mongoose` package, `src/lib/mongodb.ts`, `src/models/*.ts`
7. **Data migration**: Write a script to transfer existing MongoDB data to Supabase (if there is production data)
8. **Test all endpoints** after migration
9. **Optional future step**: Migrate from custom JWT to Supabase Auth for unified auth management
10. **Optional**: Set up `pg_cron` for expired token cleanup
