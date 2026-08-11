/*
# Enable pgvector extension and add embedding column to knowledge_objects

## Purpose
Enables the pgvector PostgreSQL extension for semantic search and RAG (Retrieval-Augmented
Generation). Adds a vector embedding column to the knowledge_objects table so that each
article's summary can be embedded and searched by cosine similarity.

## Changes

### 1. Enable pgvector extension
- Creates the vector type in PostgreSQL
- Allows columns of type vector(N)

### 2. Add embedding column to knowledge_objects
- Column: embedding (vector(768))
- Stores the text-embedding-004 output for each article's summary + headline
- Nullable — articles that haven't been embedded yet have NULL

### 3. Create vector index
- Index: idx_ko_embedding (ivfflat, vector_cosine_ops, lists=100)
- Enables fast approximate nearest neighbor search for RAG queries

## Security
- No policy changes — the embedding column inherits the existing knowledge_objects RLS.

## Notes
1. 768 dimensions matches the output of Google's text-embedding-004 model.
2. The ivfflat index with lists=100 is appropriate for up to ~100K rows.
   For larger datasets, increase lists proportionally (lists = sqrt(row_count)).
3. Embeddings are generated server-side by the backend using the Gemini embedding API.
4. NULL embeddings are fine — the vector search query filters them out.
5. The extension is created in the "extensions" schema (Supabase default).
*/

-- ──────────────────────────────────────────────────────────────
-- 1. ENABLE PGVECTOR
-- ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────────────────────────────
-- 2. ADD EMBEDDING COLUMN
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_objects'
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE knowledge_objects ADD COLUMN embedding vector(768);
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 3. CREATE VECTOR INDEX
-- ──────────────────────────────────────────────────────────────
-- ivfflat index for approximate nearest neighbor search
-- lists=100 is good for up to ~100K rows
CREATE INDEX IF NOT EXISTS idx_ko_embedding
  ON knowledge_objects
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
