-- Ensure user deletion cascades cleanly. 0001 already declares ON DELETE
-- CASCADE on most user FKs; this migration re-asserts them idempotently so
-- a DELETE FROM users WHERE id = ? is atomic regardless of schema drift.
--
-- Strategy per table: drop the FK constraint (if it exists) and re-add it
-- with the desired ON DELETE behaviour. Wrapped in DO blocks so a missing
-- constraint or missing column is a no-op instead of a hard failure.
--
-- Defaults to ON DELETE CASCADE for owned rows (authored content, votes,
-- ratings, tokens, messages). Uses ON DELETE SET NULL for moderation/audit
-- trails where losing history would be worse than losing the actor link
-- (flagged_posts.*, chat_user_bans.banned_by, chat_word_blacklist.created_by).

BEGIN;

-- topics.user_id -> users(id): CASCADE (author deletion removes their topics)
DO $$ BEGIN
  ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_user_id_fkey;
  ALTER TABLE topics
    ADD CONSTRAINT topics_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- posts.user_id -> users(id): CASCADE
DO $$ BEGIN
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
  ALTER TABLE posts
    ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- topic_votes.user_id -> users(id): CASCADE (vote is meaningless without voter)
DO $$ BEGIN
  ALTER TABLE topic_votes DROP CONSTRAINT IF EXISTS topic_votes_user_id_fkey;
  ALTER TABLE topic_votes
    ADD CONSTRAINT topic_votes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- post_votes.user_id -> users(id): CASCADE
DO $$ BEGIN
  ALTER TABLE post_votes DROP CONSTRAINT IF EXISTS post_votes_user_id_fkey;
  ALTER TABLE post_votes
    ADD CONSTRAINT post_votes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- topic_ratings.user_id -> users(id): CASCADE
DO $$ BEGIN
  ALTER TABLE topic_ratings DROP CONSTRAINT IF EXISTS topic_ratings_user_id_fkey;
  ALTER TABLE topic_ratings
    ADD CONSTRAINT topic_ratings_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- reset_tokens.user_id -> users(id): CASCADE (tokens are per-user, stale)
DO $$ BEGIN
  ALTER TABLE reset_tokens DROP CONSTRAINT IF EXISTS reset_tokens_user_id_fkey;
  ALTER TABLE reset_tokens
    ADD CONSTRAINT reset_tokens_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- conversation_messages.user_id -> users(id): CASCADE
DO $$ BEGIN
  ALTER TABLE conversation_messages DROP CONSTRAINT IF EXISTS conversation_messages_user_id_fkey;
  ALTER TABLE conversation_messages
    ADD CONSTRAINT conversation_messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- chat_user_bans.user_id -> users(id): CASCADE (delete user = ban record gone)
DO $$ BEGIN
  ALTER TABLE chat_user_bans DROP CONSTRAINT IF EXISTS chat_user_bans_user_id_fkey;
  ALTER TABLE chat_user_bans
    ADD CONSTRAINT chat_user_bans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- chat_user_bans.banned_by -> users(id): SET NULL (keep historical ban record
-- even if the admin who issued it is later deleted). Column may not exist in
-- 0001 but the API writes to it; handle defensively.
DO $$ BEGIN
  ALTER TABLE chat_user_bans DROP CONSTRAINT IF EXISTS chat_user_bans_banned_by_fkey;
  ALTER TABLE chat_user_bans
    ADD CONSTRAINT chat_user_bans_banned_by_fkey
    FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- chat_word_blacklist.created_by -> users(id): SET NULL (preserve blacklist
-- entries when the admin who added them is deleted). Column may not exist
-- in 0001 but the API writes to it; handle defensively.
DO $$ BEGIN
  ALTER TABLE chat_word_blacklist DROP CONSTRAINT IF EXISTS chat_word_blacklist_created_by_fkey;
  ALTER TABLE chat_word_blacklist
    ADD CONSTRAINT chat_word_blacklist_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- flagged_posts: three user FKs — keep all as SET NULL (moderation audit
-- trail must survive user deletion).
DO $$ BEGIN
  ALTER TABLE flagged_posts DROP CONSTRAINT IF EXISTS flagged_posts_post_author_id_fkey;
  ALTER TABLE flagged_posts
    ADD CONSTRAINT flagged_posts_post_author_id_fkey
    FOREIGN KEY (post_author_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE flagged_posts DROP CONSTRAINT IF EXISTS flagged_posts_flagged_by_fkey;
  ALTER TABLE flagged_posts
    ADD CONSTRAINT flagged_posts_flagged_by_fkey
    FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE flagged_posts DROP CONSTRAINT IF EXISTS flagged_posts_reviewed_by_fkey;
  ALTER TABLE flagged_posts
    ADD CONSTRAINT flagged_posts_reviewed_by_fkey
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL;
END $$;

COMMIT;
