/*
# Create core content tables: sources, knowledge_objects, mcqs, entities

## Purpose
This migration creates the foundational content tables for PulseNews AI.
These tables store news sources, processed articles (knowledge objects),
AI-generated MCQs, and extracted entities.

## New Tables

### 1. sources
Stores metadata about news sources (RSS feeds, government APIs, YouTube channels).
- id (uuid, PK)
- name (text, NOT NULL) — display name
- url (text, NOT NULL) — website URL
- feed_url (text) — RSS/Atom feed URL
- type (text, default 'rss') — source type: rss, government, youtube, news_api
- is_active (boolean, default true) — whether currently polled
- category (text) — primary category
- country (text) — country code
- created_at (timestamptz, default now())

### 2. knowledge_objects
The core table — every processed news article with AI-generated content.
- id (uuid, PK)
- source_id (uuid, FK -> sources)
- source_url (text, NOT NULL) — original article URL
- source_name (text, NOT NULL) — denormalized for query speed
- headline (text, NOT NULL)
- summary (text, NOT NULL)
- category (text, NOT NULL) — exam category
- exam_importance (integer, default 50, CHECK 1-100)
- quick_take (jsonb) — array of 3 bullet points
- entities (text[]) — NER-extracted entity names
- image_url (text) — article image
- video_url (text) — embedded video URL
- tag (text) — display tag
- views (text, default '0') — view count as string for display
- likes (integer, default 0)
- comments_count (integer, default 0)
- shares (integer, default 0)
- is_breaking (boolean, default false)
- is_live (boolean, default false)
- is_local (boolean, default false)
- reviewed (boolean, default false) — passed QC
- monetized (boolean, default false)
- published_at (timestamptz) — original publication time
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 3. mcqs
AI-generated multiple choice questions for each knowledge object.
- id (uuid, PK)
- ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE)
- question (text, NOT NULL)
- options (jsonb, NOT NULL) — array of 4 strings
- correct_index (integer, NOT NULL, CHECK 0-3)
- explanation (text, NOT NULL)
- created_at (timestamptz, default now())

### 4. entities
Named entities extracted from articles (people, organizations, locations).
- id (uuid, PK)
- ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE)
- name (text, NOT NULL) — entity name
- type (text, NOT NULL) — Person, Organization, Location, Policy, Event
- created_at (timestamptz, default now())

## Security
- RLS enabled on all 4 tables.
- sources: public read (anon + authenticated) for active sources; write by authenticated only.
- knowledge_objects: public read for reviewed articles; write by authenticated only.
- mcqs: public read; write by authenticated only.
- entities: public read; write by authenticated only.

## Indexes
- knowledge_objects: published_at DESC, category, is_breaking, reviewed, exam_importance DESC, source_id
- mcqs: ko_id
- entities: ko_id, name

## Notes
1. knowledge_objects is the central table — all other content tables reference it.
2. source_name is denormalized into knowledge_objects to avoid joins on every feed query.
3. views is stored as text because the UI displays formatted strings like "1.2M".
4. quick_take is jsonb to store the 3-bullet array flexibly.
5. entities is a text[] array on knowledge_objects for quick access, plus a separate
   entities table for detailed type information and graph building.
*/

-- ──────────────────────────────────────────────────────────────
-- 1. SOURCES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  feed_url text,
  type text NOT NULL DEFAULT 'rss',
  is_active boolean DEFAULT true,
  category text,
  country text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_active_sources" ON sources;
CREATE POLICY "public_select_active_sources"
  ON sources FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "auth_insert_sources" ON sources;
CREATE POLICY "auth_insert_sources"
  ON sources FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sources" ON sources;
CREATE POLICY "auth_update_sources"
  ON sources FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sources" ON sources;
CREATE POLICY "auth_delete_sources"
  ON sources FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 2. KNOWLEDGE_OBJECTS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  source_url text NOT NULL,
  source_name text NOT NULL,
  headline text NOT NULL,
  summary text NOT NULL,
  category text NOT NULL DEFAULT 'Miscellaneous',
  exam_importance integer NOT NULL DEFAULT 50 CHECK (exam_importance >= 1 AND exam_importance <= 100),
  quick_take jsonb,
  entities text[] DEFAULT '{}',
  image_url text,
  video_url text,
  tag text DEFAULT '',
  views text DEFAULT '0',
  likes integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares integer DEFAULT 0,
  is_breaking boolean DEFAULT false,
  is_live boolean DEFAULT false,
  is_local boolean DEFAULT false,
  reviewed boolean DEFAULT false,
  monetized boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_reviewed_kos" ON knowledge_objects;
CREATE POLICY "public_select_reviewed_kos"
  ON knowledge_objects FOR SELECT
  TO anon, authenticated
  USING (reviewed = true);

DROP POLICY IF EXISTS "auth_insert_kos" ON knowledge_objects;
CREATE POLICY "auth_insert_kos"
  ON knowledge_objects FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_kos" ON knowledge_objects;
CREATE POLICY "auth_update_kos"
  ON knowledge_objects FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_kos" ON knowledge_objects;
CREATE POLICY "auth_delete_kos"
  ON knowledge_objects FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 3. MCQS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mcqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mcqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_mcqs" ON mcqs;
CREATE POLICY "public_select_mcqs"
  ON mcqs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_mcqs" ON mcqs;
CREATE POLICY "auth_insert_mcqs"
  ON mcqs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_mcqs" ON mcqs;
CREATE POLICY "auth_update_mcqs"
  ON mcqs FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_mcqs" ON mcqs;
CREATE POLICY "auth_delete_mcqs"
  ON mcqs FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 4. ENTITIES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Organization',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_entities" ON entities;
CREATE POLICY "public_select_entities"
  ON entities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_entities" ON entities;
CREATE POLICY "auth_insert_entities"
  ON entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_entities" ON entities;
CREATE POLICY "auth_update_entities"
  ON entities FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_entities" ON entities;
CREATE POLICY "auth_delete_entities"
  ON entities FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ko_published_at ON knowledge_objects (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ko_category ON knowledge_objects (category);
CREATE INDEX IF NOT EXISTS idx_ko_breaking ON knowledge_objects (is_breaking) WHERE is_breaking = true;
CREATE INDEX IF NOT EXISTS idx_ko_reviewed ON knowledge_objects (reviewed) WHERE reviewed = true;
CREATE INDEX IF NOT EXISTS idx_ko_exam_importance ON knowledge_objects (exam_importance DESC);
CREATE INDEX IF NOT EXISTS idx_ko_source_id ON knowledge_objects (source_id);

CREATE INDEX IF NOT EXISTS idx_mcq_ko_id ON mcqs (ko_id);

CREATE INDEX IF NOT EXISTS idx_entity_ko_id ON entities (ko_id);
CREATE INDEX IF NOT EXISTS idx_entity_name ON entities (name);
