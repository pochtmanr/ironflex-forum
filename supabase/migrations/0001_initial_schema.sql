-- Iron Blog / IronFlex Forum — initial schema
-- Rebuilt 2026-04-14 for self-hosted Supabase on db.tarnovsky.ru
-- Derived from src/ usage (see Explore agent enumeration).

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Helper: set_updated_at trigger
-- ---------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- users (custom JWT auth — not Supabase Auth)
-- ---------------------------------------------------------------
create table users (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  username        text not null unique,
  password_hash   text,
  display_name    text,
  photo_url       text,
  bio             text,
  city            text,
  country         text,
  is_active       boolean not null default true,
  is_admin        boolean not null default false,
  is_verified     boolean not null default false,
  google_id       text unique,
  github_id       text unique,
  vk_id           text unique,
  yandex_id       text unique,
  refresh_token   text,
  last_login      timestamptz,
  telegram_link   text,
  vk_link         text,
  viber_link      text,
  telegram_visible boolean not null default false,
  vk_visible      boolean not null default false,
  viber_visible   boolean not null default false,
  pending_email   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index users_is_active_idx on users (is_active) where is_active = true;
create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- categories (forum sections)
-- ---------------------------------------------------------------
create table categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  slug          text not null unique,
  order_index   int  not null default 0,
  is_active     boolean not null default true,
  section       text check (section in ('medicine','sport') or section is null),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index categories_active_order_idx on categories (is_active, order_index);
create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- topics
-- ---------------------------------------------------------------
create table topics (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references categories(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  user_name     text not null,
  user_email    text,
  title         text not null,
  content       text,
  media_links   text[] not null default '{}',
  views         int not null default 0,
  likes         int not null default 0,
  dislikes      int not null default 0,
  is_pinned     boolean not null default false,
  is_locked     boolean not null default false,
  is_active     boolean not null default true,
  last_post_at  timestamptz not null default now(),
  reply_count   int not null default 0,
  rating_sum    int not null default 0,
  rating_count  int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index topics_cat_active_lastpost_idx on topics (category_id, is_active, last_post_at desc);
create index topics_user_idx on topics (user_id);
create index topics_pinned_idx on topics (is_pinned, last_post_at desc) where is_pinned = true;
create trigger topics_set_updated_at before update on topics
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- posts (replies to topics)
-- ---------------------------------------------------------------
create table posts (
  id                  uuid primary key default gen_random_uuid(),
  topic_id            uuid not null references topics(id) on delete cascade,
  user_id             uuid not null references users(id) on delete cascade,
  user_name           text not null,
  user_email          text,
  content             text not null,
  media_links         text[] not null default '{}',
  likes               int not null default 0,
  dislikes            int not null default 0,
  is_edited           boolean not null default false,
  edited_at           timestamptz,
  is_active           boolean not null default true,
  is_first_post       boolean not null default false,
  reply_to_post_id    uuid references posts(id) on delete set null,
  reply_to_excerpt    jsonb,
  parent_post_id      uuid references posts(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index posts_topic_active_created_idx on posts (topic_id, is_active, created_at);
create index posts_user_idx on posts (user_id);
create unique index posts_first_per_topic_uidx on posts (topic_id) where is_first_post = true;
create trigger posts_set_updated_at before update on posts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- votes (topic + post)
-- ---------------------------------------------------------------
create table topic_votes (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references topics(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  vote_type     text not null check (vote_type in ('like','dislike')),
  created_at    timestamptz not null default now(),
  unique (topic_id, user_id)
);
create index topic_votes_topic_idx on topic_votes (topic_id);

create table post_votes (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  vote_type     text not null check (vote_type in ('like','dislike')),
  created_at    timestamptz not null default now(),
  unique (post_id, user_id)
);
create index post_votes_post_idx on post_votes (post_id);

-- ---------------------------------------------------------------
-- topic_ratings (1..5)
-- ---------------------------------------------------------------
create table topic_ratings (
  id            uuid primary key default gen_random_uuid(),
  topic_id      uuid not null references topics(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (topic_id, user_id)
);
create index topic_ratings_topic_idx on topic_ratings (topic_id);
create trigger topic_ratings_set_updated_at before update on topic_ratings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- flagged_posts (moderation reports)
-- ---------------------------------------------------------------
create table flagged_posts (
  id                uuid primary key default gen_random_uuid(),
  post_id           uuid references posts(id) on delete set null,
  topic_id          uuid references topics(id) on delete set null,
  topic_title       text,
  post_content      text,
  post_author_id    uuid references users(id) on delete set null,
  post_author_name  text,
  flagged_by        uuid references users(id) on delete set null,
  flagged_by_name   text,
  reason            text,
  status            text not null default 'pending' check (status in ('pending','reviewed','dismissed')),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz,
  reviewed_by       uuid references users(id) on delete set null
);
create index flagged_posts_status_idx on flagged_posts (status, created_at desc);

-- ---------------------------------------------------------------
-- reset_tokens (password reset + email verification)
-- ---------------------------------------------------------------
create table reset_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  token         text not null unique,
  type          text not null check (type in ('password_reset','email_verification','email_change')),
  expires_at    timestamptz not null,
  used          boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index reset_tokens_user_type_idx on reset_tokens (user_id, type);
create index reset_tokens_expires_idx on reset_tokens (expires_at);
create trigger reset_tokens_set_updated_at before update on reset_tokens
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------
-- conversation_messages (forum chat hub)
-- ---------------------------------------------------------------
create table conversation_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  user_name     text not null,
  content       text not null check (char_length(content) > 0 and char_length(content) <= 1000),
  media_links   text[] not null default '{}',
  reply_to      jsonb,
  created_at    timestamptz not null default now()
);
create index conversation_messages_created_idx on conversation_messages (created_at desc);
create index conversation_messages_user_idx on conversation_messages (user_id, created_at desc);

-- ---------------------------------------------------------------
-- chat_user_bans (admin-controlled bans for conversation chat)
-- ---------------------------------------------------------------
create table chat_user_bans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  reason        text,
  banned_at     timestamptz not null default now(),
  expires_at    timestamptz,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index chat_user_bans_user_active_idx on chat_user_bans (user_id, is_active);

-- ---------------------------------------------------------------
-- chat_word_blacklist
-- ---------------------------------------------------------------
create table chat_word_blacklist (
  id            uuid primary key default gen_random_uuid(),
  word          text not null unique,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- contact_requests
-- ---------------------------------------------------------------
create table contact_requests (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text,
  subject       text,
  message       text not null,
  ip_address    inet,
  created_at    timestamptz not null default now()
);
create index contact_requests_created_idx on contact_requests (created_at desc);

-- ---------------------------------------------------------------
-- site_settings (key-value config, service-role only)
-- ---------------------------------------------------------------
create table site_settings (
  key           text primary key,
  value         text not null,
  updated_at    timestamptz not null default now()
);
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

insert into site_settings (key, value)
values ('contact_recipient_email', 'rpochtman@gmail.com')
on conflict (key) do nothing;

-- ---------------------------------------------------------------
-- RPC: exec_sql (service-role only; used by migration scripts)
-- ---------------------------------------------------------------
create or replace function exec_sql(sql_text text) returns void
language plpgsql security definer as $$
begin
  execute sql_text;
end;
$$;
revoke all on function exec_sql(text) from public;
revoke all on function exec_sql(text) from anon;
revoke all on function exec_sql(text) from authenticated;

-- ---------------------------------------------------------------
-- Row Level Security
-- The app accesses Postgres via two keys:
--   ANON_KEY         → role "anon"          (public reads only)
--   SERVICE_ROLE_KEY → role "service_role"  (bypasses RLS, used by API routes)
-- Because iron-blog uses custom JWT auth (not Supabase Auth), `auth.uid()` is
-- always null. All write paths go through the Next.js API which uses the
-- service role key and enforces auth itself. Therefore we:
--   • enable RLS on every user-facing table (defense in depth)
--   • grant anon only SELECT on publicly-readable tables
--   • rely on service_role for everything else
-- ---------------------------------------------------------------
alter table users                    enable row level security;
alter table categories               enable row level security;
alter table topics                   enable row level security;
alter table posts                    enable row level security;
alter table topic_votes              enable row level security;
alter table post_votes               enable row level security;
alter table topic_ratings            enable row level security;
alter table flagged_posts            enable row level security;
alter table reset_tokens             enable row level security;
alter table conversation_messages    enable row level security;
alter table chat_user_bans           enable row level security;
alter table chat_word_blacklist      enable row level security;
alter table contact_requests         enable row level security;
alter table site_settings            enable row level security;

-- Public-readable tables (anon can SELECT)
create policy anon_read_users    on users            for select to anon using (is_active);
create policy anon_read_cats     on categories       for select to anon using (is_active);
create policy anon_read_topics   on topics           for select to anon using (is_active);
create policy anon_read_posts    on posts            for select to anon using (is_active);
create policy anon_read_tvotes   on topic_votes      for select to anon using (true);
create policy anon_read_pvotes   on post_votes       for select to anon using (true);
create policy anon_read_tratings on topic_ratings    for select to anon using (true);
create policy anon_read_conv     on conversation_messages for select to anon using (true);

-- Note: no anon policies on reset_tokens, flagged_posts, chat_user_bans,
-- chat_word_blacklist, contact_requests, site_settings — service role only.

commit;
