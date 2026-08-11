/*
# Create YouTube intelligence tables: youtube_channels, live_streams

## Purpose
Stores a registry of monitored YouTube channels and their live stream status.
This supports the LiveHubView feature for embedding official news broadcasts.

## New Tables

### 1. youtube_channels
Registry of monitored YouTube channels (NDTV, WION, DW, NASA, etc.).
- id (uuid, PK)
- channel_id (text, NOT NULL, UNIQUE) — YouTube channel ID
- name (text, NOT NULL) — channel display name
- description (text)
- thumbnail_url (text) — channel avatar
- category (text) — content category
- is_monitored (boolean, default true) — whether to poll this channel
- created_at (timestamptz, default now())

### 2. live_streams
Current live stream status for monitored channels.
- id (uuid, PK)
- channel_id (uuid, FK -> youtube_channels)
- title (text, NOT NULL) — stream title
- is_live (boolean, default false)
- viewer_count (text) — current viewer count (string for display)
- video_id (text) — YouTube video ID for embed
- stream_started_at (timestamptz) — when stream went live
- last_checked_at (timestamptz, default now()) — last status check

## Security
- RLS enabled on both tables.
- youtube_channels: public read for monitored channels; write by authenticated only.
- live_streams: public read for live streams; write by authenticated only.

## Indexes
- youtube_channels: is_monitored, channel_id
- live_streams: channel_id, is_live
*/

-- ──────────────────────────────────────────────────────────────
-- 1. YOUTUBE_CHANNELS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS youtube_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  is_monitored boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_monitored_channels" ON youtube_channels;
CREATE POLICY "public_select_monitored_channels"
  ON youtube_channels FOR SELECT
  TO anon, authenticated
  USING (is_monitored = true);

DROP POLICY IF EXISTS "auth_insert_channels" ON youtube_channels;
CREATE POLICY "auth_insert_channels"
  ON youtube_channels FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_channels" ON youtube_channels;
CREATE POLICY "auth_update_channels"
  ON youtube_channels FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_channels" ON youtube_channels;
CREATE POLICY "auth_delete_channels"
  ON youtube_channels FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- 2. LIVE_STREAMS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES youtube_channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  is_live boolean DEFAULT false,
  viewer_count text,
  video_id text,
  stream_started_at timestamptz,
  last_checked_at timestamptz DEFAULT now()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_live_streams" ON live_streams;
CREATE POLICY "public_select_live_streams"
  ON live_streams FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_streams" ON live_streams;
CREATE POLICY "auth_insert_streams"
  ON live_streams FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_streams" ON live_streams;
CREATE POLICY "auth_update_streams"
  ON live_streams FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_streams" ON live_streams;
CREATE POLICY "auth_delete_streams"
  ON live_streams FOR DELETE
  TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_channels_monitored ON youtube_channels (is_monitored) WHERE is_monitored = true;
CREATE INDEX IF NOT EXISTS idx_streams_channel_id ON live_streams (channel_id);
CREATE INDEX IF NOT EXISTS idx_streams_is_live ON live_streams (is_live) WHERE is_live = true;
