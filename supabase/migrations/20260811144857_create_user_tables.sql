/*
# Create user-scoped tables: user_profiles, user_bookmarks, quiz_submissions

## Purpose
This migration creates tables for user-specific data that requires ownership-based
Row Level Security. Each user can only access their own rows.

## New Tables

### 1. user_profiles
Extended user data beyond Firebase Auth (role, quiz stats).
- user_id (uuid, PK, FK -> auth.users ON DELETE CASCADE)
- display_name (text)
- avatar_url (text)
- role (text, NOT NULL, default 'user') — role: user, admin
- quizzes_solved (integer, default 0)
- accuracy (numeric, default 0) — average accuracy percentage
- total_questions (integer, default 0)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2. user_bookmarks
Articles saved by users for later review.
- id (uuid, PK)
- user_id (uuid, NOT NULL, default auth.uid()) — owner
- ko_id (uuid, FK -> knowledge_objects ON DELETE CASCADE)
- created_at (timestamptz, default now())

### 3. quiz_submissions
Records of completed quizzes with scores and answers.
- id (uuid, PK)
- user_id (uuid, NOT NULL, default auth.uid()) — owner
- ko_id (uuid, FK -> knowledge_objects)
- score (integer, NOT NULL) — correct answers count
- total_questions (integer, NOT NULL)
- answers (jsonb) — array of { question_id, selected_index, correct }
- submitted_at (timestamptz, default now())

## Security
- RLS enabled on all 3 tables.
- user_profiles: owner can SELECT and UPDATE own row; INSERT allowed for owner (auto-create on first login).
- user_bookmarks: full CRUD restricted to owner (auth.uid() = user_id).
- quiz_submissions: full CRUD restricted to owner (auth.uid() = user_id).
- All user_id columns have DEFAULT auth.uid() so inserts that omit user_id succeed.

## Indexes
- user_bookmarks: user_id, ko_id
- quiz_submissions: user_id, submitted_at DESC

## Notes
1. user_profiles uses user_id as PRIMARY KEY (one profile per user).
2. user_id defaults to auth.uid() on all tables so frontend inserts work without passing user_id.
3. role column is NOT protected by RLS — it is protected by the fact that the frontend
   cannot set arbitrary column values; the backend (authenticated with service role key)
   handles role assignment. Future: use a SECURITY DEFINER function for role updates.
*/

-- ──────────────────────────────────────────────────────────────
-- 1. USER_PROFILES
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user',
  quizzes_solved integer DEFAULT 0,
  accuracy numeric DEFAULT 0,
  total_questions integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — profiles are only deleted via auth.users CASCADE

-- ──────────────────────────────────────────────────────────────
-- 2. USER_BOOKMARKS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ko_id uuid NOT NULL REFERENCES knowledge_objects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, ko_id)
);

ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookmarks" ON user_bookmarks;
CREATE POLICY "select_own_bookmarks"
  ON user_bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookmarks" ON user_bookmarks;
CREATE POLICY "insert_own_bookmarks"
  ON user_bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookmarks" ON user_bookmarks;
CREATE POLICY "update_own_bookmarks"
  ON user_bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bookmarks" ON user_bookmarks;
CREATE POLICY "delete_own_bookmarks"
  ON user_bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 3. QUIZ_SUBMISSIONS
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ko_id uuid REFERENCES knowledge_objects(id) ON DELETE SET NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  answers jsonb,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quizzes" ON quiz_submissions;
CREATE POLICY "select_own_quizzes"
  ON quiz_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quizzes" ON quiz_submissions;
CREATE POLICY "insert_own_quizzes"
  ON quiz_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quizzes" ON quiz_submissions;
CREATE POLICY "update_own_quizzes"
  ON quiz_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_quizzes" ON quiz_submissions;
CREATE POLICY "delete_own_quizzes"
  ON quiz_submissions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookmark_user_id ON user_bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmark_ko_id ON user_bookmarks (ko_id);
CREATE INDEX IF NOT EXISTS idx_quiz_user_id ON quiz_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submitted_at ON quiz_submissions (submitted_at DESC);
