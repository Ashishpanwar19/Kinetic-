/**
 * PulseNews AI — Shared Database Types
 *
 * These types mirror the PostgreSQL tables created in Volume 3.
 * They are shared across frontend, backend, and AI services.
 */

// ──────────────────────────────────────────────────────────────
// Sources
// ──────────────────────────────────────────────────────────────

export type SourceType = 'rss' | 'government' | 'youtube' | 'news_api';

export interface Source {
  id: string;
  name: string;
  url: string;
  feed_url: string | null;
  type: SourceType;
  is_active: boolean;
  category: string | null;
  country: string | null;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Knowledge Objects
// ──────────────────────────────────────────────────────────────

export interface KnowledgeObjectRow {
  id: string;
  source_id: string | null;
  source_url: string;
  source_name: string;
  headline: string;
  summary: string;
  category: string;
  exam_importance: number;
  quick_take: string[] | null;
  entities: string[];
  image_url: string | null;
  video_url: string | null;
  tag: string;
  views: string;
  likes: number;
  comments_count: number;
  shares: number;
  is_breaking: boolean;
  is_live: boolean;
  is_local: boolean;
  reviewed: boolean;
  monetized: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// MCQs
// ──────────────────────────────────────────────────────────────

export interface MCQRow {
  id: string;
  ko_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Entities
// ──────────────────────────────────────────────────────────────

export type EntityType = 'Person' | 'Organization' | 'Location' | 'Policy' | 'Event';

export interface EntityRow {
  id: string;
  ko_id: string;
  name: string;
  type: EntityType;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// User Profiles
// ──────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'admin';

export interface UserProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  quizzes_solved: number;
  accuracy: number;
  total_questions: number;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────
// User Bookmarks
// ──────────────────────────────────────────────────────────────

export interface UserBookmarkRow {
  id: string;
  user_id: string;
  ko_id: string;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Quiz Submissions
// ──────────────────────────────────────────────────────────────

export interface QuizAnswer {
  question_id: string;
  selected_index: number;
  correct: boolean;
}

export interface QuizSubmissionRow {
  id: string;
  user_id: string;
  ko_id: string | null;
  score: number;
  total_questions: number;
  answers: QuizAnswer[] | null;
  submitted_at: string;
}

// ──────────────────────────────────────────────────────────────
// YouTube Channels
// ──────────────────────────────────────────────────────────────

export interface YouTubeChannelRow {
  id: string;
  channel_id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  is_monitored: boolean;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Live Streams
// ──────────────────────────────────────────────────────────────

export interface LiveStreamRow {
  id: string;
  channel_id: string | null;
  title: string;
  is_live: boolean;
  viewer_count: string | null;
  video_id: string | null;
  stream_started_at: string | null;
  last_checked_at: string;
}

// ──────────────────────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────────────────────

export interface ArticleViewRow {
  id: string;
  user_id: string | null;
  ko_id: string;
  viewed_at: string;
  source: string;
}

export interface SearchLogRow {
  id: string;
  user_id: string | null;
  query: string;
  results_count: number | null;
  searched_at: string;
}

export interface AIUsageLogRow {
  id: string;
  agent: string;
  ko_id: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  latency_ms: number | null;
  success: boolean;
  model: string;
  created_at: string;
}
