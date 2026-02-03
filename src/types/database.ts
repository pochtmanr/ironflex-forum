// TypeScript types matching the Supabase PostgreSQL schema
// These replace the Mongoose Document interfaces

export interface DbUser {
  id: string
  email: string
  username: string
  password_hash: string | null
  display_name: string | null
  photo_url: string | null
  bio: string | null
  city: string | null
  country: string | null
  is_active: boolean
  is_admin: boolean
  is_verified: boolean
  google_id: string | null
  github_id: string | null
  vk_id: string | null
  yandex_id: string | null
  refresh_token: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface DbCategory {
  id: string
  name: string
  description: string | null
  slug: string
  order_index: number
  is_active: boolean
  section: 'medicine' | 'sport' | null
  created_at: string
  updated_at: string
}

export interface DbConversationMessage {
  id: string
  user_id: string
  user_name: string
  content: string
  created_at: string
}

export interface DbTopic {
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

export interface DbPost {
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
  edited_at: string | null
  is_active: boolean
  parent_post_id: string | null
  created_at: string
  updated_at: string
}

export interface DbArticle {
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

export interface DbTraining {
  id: string
  title: string
  slug: string
  subheader: string
  content: string
  cover_image_url: string
  level: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes: number | null
  author_name: string
  likes: number
  views: number
  comment_count: number
  created_at: string
  updated_at: string
}

export interface DbComment {
  id: string
  content_type: 'article' | 'training' | 'forum'
  content_id: string
  user_id: string
  content: string
  likes: number
  created_at: string
  updated_at: string | null
}

export interface DbFlaggedPost {
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
  reviewed_at: string | null
  reviewed_by: string | null
}

export interface DbResetToken {
  id: string
  user_id: string
  token: string
  type: 'password_reset' | 'email_verification'
  expires_at: string
  used: boolean
  created_at: string
  updated_at: string
}

export interface DbTopicVote {
  id: string
  topic_id: string
  user_id: string
  vote_type: 'like' | 'dislike'
  created_at: string
}

export interface DbPostVote {
  id: string
  post_id: string
  user_id: string
  vote_type: 'like' | 'dislike'
  created_at: string
}
