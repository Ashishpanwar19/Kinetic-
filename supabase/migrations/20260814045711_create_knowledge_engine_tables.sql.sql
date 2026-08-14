/*
# Create AI Knowledge Engine tables

## Purpose
Supports Volume 8 — AI Knowledge Engine. Creates tables for the knowledge graph
(entity nodes + relationships), event timelines, fact-checking results, and
duplicate article groups. These tables allow the AI pipeline to structure raw
news into queryable knowledge beyond the flat knowledge_objects table.

## New Tables

### 1. entity_nodes
Stores unique named entities (people, organizations, locations, policies, events)
extracted across all articles. Each entity is deduplicated by normalized name + type,
with a counter of how many articles mention it.
- id (uuid, PK)
- name (text, NOT NULL) — canonical entity name
- type (text, NOT NULL) — Person, Organization, Location, Policy, Event
- mention_count (integer, default 1) — how many articles reference this entity
- first_seen_at (timestamptz) — earliest article publication mentioning it
- created_at (timestamptz, default now())

### 2. entity_relations
Stores directed relationships between entities (e.g., RBI -> CONVENES -> MPC).
Built by the knowledge graph AI agent.
- id (uuid, PK)
- source_entity_id (uuid, FK -> entity_nodes ON DELETE CASCADE)
- target_entity_id (uuid, FK -> entity_nodes ON DELETE CASCADE)
- relationship (text, NOT NULL) — e.g., OPERATES, DETERMINES, FINANCES
- ko_id (uuid, FK -> knowledge_objects ON DELETE SET NULL) — article that established this relation
- weight (integer, default 1) — number of articles reinforcing this relation
- created_at (timestamptz, default now())
- UNIQUE constraint on (source_entity_id, target_entity_id, relationship)

### 3. ko_entities
Junction table mapping knowledge_objects to entity_nodes for graph traversal.
- id (uuid, PK)
- ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE)
- entity_node_id (uuid, FK -> entity_nodes ON DELETE CASCADE)
- created_at (timestamptz, default now())
- UNIQUE on (ko_id, entity_node_id)

### 4. timelines
Stores AI-generated chronological event timelines for tracked topics.
- id (uuid, PK)
- topic (text, NOT NULL) — e.g., "Economy", "Science"
- event_date (date) — when the event occurred
- event_title (text, NOT NULL) — short title
- event_description (text) — detailed description
- ko_id (uuid, FK -> knowledge_objects ON DELETE SET NULL) — source article
- created_at (timestamptz, default now())

### 5. fact_checks
Stores cross-source fact verification results.
- id (uuid, PK)
- ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE) — article checked
- verification_status (text, NOT NULL) — verified, partially_verified, unverified, conflicting
- confidence_score (integer, default 0, CHECK 0-100) — confidence level
- cross_source_count (integer, default 0) — how many other sources corroborate
- conflicting_sources (text[]) — names of sources with conflicting info
- verification_notes (text) — AI-generated notes
- created_at (timestamptz, default now())

### 6. duplicate_groups
Groups articles that cover the same news event from different sources.
- id (uuid, PK)
- primary_ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE) — the canonical/best article
- duplicate_ko_ids (uuid[]) — array of duplicate article IDs
- similarity_score (numeric, default 1.0) — 0.0 to 1.0
- detection_method (text, default 'fuzzy_title') — how duplicate was detected
- created_at (timestamptz, default now())

## Security
- All tables: RLS enabled with anon+authenticated SELECT (public content), authenticated-only INSERT/UPDATE/DELETE.

## Indexes
- entity_nodes: unique on (lower(name), type), type, mention_count DESC
- entity_relations: source_entity_id, target_entity_id, ko_id
- ko_entities: ko_id, entity_node_id
- timelines: topic, event_date DESC
- fact_checks: ko_id, verification_status
- duplicate_groups: primary_ko_id
*/

-- ──────────────────────────────────────────────────────────────
-- 1. ENTITY_NODES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'Organization',
  mention_count integer DEFAULT 1,
  first_seen_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_nodes_name_type
  ON entity_nodes (lower(name), type);

CREATE INDEX IF NOT EXISTS idx_entity_nodes_type ON entity_nodes (type);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_mentions ON entity_nodes (mention_count DESC);

ALTER TABLE entity_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_entity_nodes" ON entity_nodes;
CREATE POLICY "public_select_entity_nodes"
  ON entity_nodes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_entity_nodes" ON entity_nodes;
CREATE POLICY "auth_insert_entity_nodes"
  ON entity_nodes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_entity_nodes" ON entity_nodes;
CREATE POLICY "auth_update_entity_nodes"
  ON entity_nodes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_entity_nodes" ON entity_nodes;
CREATE POLICY "auth_delete_entity_nodes"
  ON entity_nodes FOR DELETE
  TO authenticated USING (true);

-- ──────────────────────────────────────────────────────────────
-- 2. ENTITY_RELATIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id uuid NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  ko_id uuid REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  weight integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (source_entity_id, target_entity_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_relations_source ON entity_relations (source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON entity_relations (target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relations_ko ON entity_relations (ko_id);

ALTER TABLE entity_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_relations" ON entity_relations;
CREATE POLICY "public_select_relations"
  ON entity_relations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_relations" ON entity_relations;
CREATE POLICY "auth_insert_relations"
  ON entity_relations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_relations" ON entity_relations;
CREATE POLICY "auth_update_relations"
  ON entity_relations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_relations" ON entity_relations;
CREATE POLICY "auth_delete_relations"
  ON entity_relations FOR DELETE
  TO authenticated USING (true);

-- ──────────────────────────────────────────────────────────────
-- 3. KO_ENTITIES (junction)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ko_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  entity_node_id uuid NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (ko_id, entity_node_id)
);

CREATE INDEX IF NOT EXISTS idx_ko_entities_ko ON ko_entities (ko_id);
CREATE INDEX IF NOT EXISTS idx_ko_entities_node ON ko_entities (entity_node_id);

ALTER TABLE ko_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_ko_entities" ON ko_entities;
CREATE POLICY "public_select_ko_entities"
  ON ko_entities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_ko_entities" ON ko_entities;
CREATE POLICY "auth_insert_ko_entities"
  ON ko_entities FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_ko_entities" ON ko_entities;
CREATE POLICY "auth_update_ko_entities"
  ON ko_entities FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_ko_entities" ON ko_entities;
CREATE POLICY "auth_delete_ko_entities"
  ON ko_entities FOR DELETE
  TO authenticated USING (true);

-- ──────────────────────────────────────────────────────────────
-- 4. TIMELINES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  event_date date,
  event_title text NOT NULL,
  event_description text,
  ko_id uuid REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timelines_topic ON timelines (topic);
CREATE INDEX IF NOT EXISTS idx_timelines_date ON timelines (event_date DESC);

ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_timelines" ON timelines;
CREATE POLICY "public_select_timelines"
  ON timelines FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_timelines" ON timelines;
CREATE POLICY "auth_insert_timelines"
  ON timelines FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_timelines" ON timelines;
CREATE POLICY "auth_update_timelines"
  ON entity_relations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_timelines" ON timelines;
CREATE POLICY "auth_delete_timelines"
  ON timelines FOR DELETE
  TO authenticated USING (true);

-- ──────────────────────────────────────────────────────────────
-- 5. FACT_CHECKS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fact_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  verification_status text NOT NULL DEFAULT 'unverified',
  confidence_score integer DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  cross_source_count integer DEFAULT 0,
  conflicting_sources text[] DEFAULT '{}',
  verification_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fact_checks_ko ON fact_checks (ko_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_status ON fact_checks (verification_status);

ALTER TABLE fact_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_fact_checks" ON fact_checks;
CREATE POLICY "public_select_fact_checks"
  ON fact_checks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_fact_checks" ON fact_checks;
CREATE POLICY "auth_insert_fact_checks"
  ON fact_checks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_fact_checks" ON fact_checks;
CREATE POLICY "auth_update_fact_checks"
  ON fact_checks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_fact_checks" ON fact_checks;
CREATE POLICY "auth_delete_fact_checks"
  ON fact_checks FOR DELETE
  TO authenticated USING (true);

-- ──────────────────────────────────────────────────────────────
-- 6. DUPLICATE_GROUPS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS duplicate_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  duplicate_ko_ids uuid[] DEFAULT '{}',
  similarity_score numeric DEFAULT 1.0,
  detection_method text DEFAULT 'fuzzy_title',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dup_groups_primary ON duplicate_groups (primary_ko_id);

ALTER TABLE duplicate_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_dup_groups" ON duplicate_groups;
CREATE POLICY "public_select_dup_groups"
  ON duplicate_groups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_dup_groups" ON duplicate_groups;
CREATE POLICY "auth_insert_dup_groups"
  ON duplicate_groups FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_dup_groups" ON duplicate_groups;
CREATE POLICY "auth_update_dup_groups"
  ON duplicate_groups FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_dup_groups" ON duplicate_groups;
CREATE POLICY "auth_delete_dup_groups"
  ON duplicate_groups FOR DELETE
  TO authenticated USING (true);