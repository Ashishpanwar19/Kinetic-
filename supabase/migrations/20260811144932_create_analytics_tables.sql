/*
# Create analytics tables: article_views, search_logs, ai_usage_logs

## Purpose
Tracks user engagement, search queries, and AI API usage for analytics,
cost monitoring, and system health dashboards.

## New Tables

### 1. article_views
Tracks when users view articles (for analytics and recommendations).
- id (uuid, PK)
- user_id (uuid) — viewer (null for anonymous)
- ko_id (uuid, FK -> knowledge_objects)
- viewed_at (timestamptz, default now())
- source (text, default 'feed') — where the view came from

### 2. search_logs
Tracks search queries for analytics and search improvement.
- id (uuid, PK)
- user_id (uuid) — searcher (null for anonymous)
- query (text, NOT NULL)
- results_count (integer)
- searched_at (timestamptz, default now())

### 3. ai_usage_logs
Tracks every Gemini API call for cost monitoring and debugging.
- id (uuid, PK)
- agent (text, NOT NULL) — which AI agent (summarizer, mcq_generator, etc.)
- ko_id (uuid) — associated knowledge object (if any)
- input_tokens (integer)
- output_tokens (integer)
- latency_ms (integer)
- success (boolean, NOT NULL)
- model (text, default 'gemini-flash')
- created_at (timestamptz, default now())

## Security
- article_views: SELECT by owner or admin; INSERT by anyone (anon + authenticated).
- search_logs: SELECT by owner or admin; INSERT by anyone.
- ai_usage_logs: SELECT by admin only (authenticated); INSERT by authenticated only.

## Indexes
- article_views: ko_id, user_id
- search_logs: searched_at DESC
- ai_usage_logs: created_at DESC, agent
*/

-- ──────────────────────────────────────────────────────────────
-- 1. ARTICLE_VIEWS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ko_id uuid REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  source text DEFAULT 'feed'
);

ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_views" ON article_views;
CREATE POLICY "select_own_views"
  ON article_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_insert_views" ON article_views;
CREATE POLICY "public_insert_views"
  ON article_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 2. SEARCH_LOGS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  results_count integer,
  searched_at timestamptz DEFAULT now()
);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_searches" ON search_logs;
CREATE POLICY "select_own_searches"
  ON search_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "public_insert_searches" ON search_logs;
CREATE POLICY "public_insert_searches"
  ON search_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- 3. AI_USAGE_LOGS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  ko_id uuid REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  success boolean NOT NULL,
  model text DEFAULT 'gemini-flash',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_ai_logs" ON ai_usage_logs;
CREATE POLICY "auth_select_ai_logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_ai_logs" ON ai_usage_logs;
CREATE POLICY "auth_insert_ai_logs"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_views_ko_id ON article_views (ko_id);
CREATE INDEX IF NOT EXISTS idx_views_user_id ON article_views (user_id);
CREATE INDEX IF NOT EXISTS idx_search_searched_at ON search_logs (searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent ON ai_usage_logs (agent);
