# Volume 6 — Live News Intelligence Engine

## Overview

The Live News Intelligence Engine is the automated news collection pipeline that powers PulseNews AI. It continuously polls RSS feeds from major news sources (BBC, NYT, Times of India, The Hindu, PIB, Reuters, TechCrunch, DW, and Google News), deduplicates articles against the database, enriches each new article with AI-generated summaries and quiz questions, and persists everything to Supabase — ready for human review and publishing.

## Architecture

```
RSS Feeds (14 sources)
     │
     ▼
 rssIngestionEngine.ts
     │
     ├─ parseFeed() — fetch & parse RSS XML via rss-parser
     │
     ├─ deduplicateUrls() — check source_url against knowledge_objects table
     │
     ├─ enrichWithAI() — Gemini 2.5 Flash generates summary, MCQs, entities
     │
     ├─ persistArticle() — insert into knowledge_objects + mcqs tables
     │
     └─ logIngestionRun() — record stats in ingestion_runs table
```

## Components

### 1. RSS Ingestion Engine (`server/lib/rssIngestionEngine.ts`)

Core pipeline module with these exports:

- **`runIngestionPipeline(feeds?, options?)`** — Orchestrates the full pipeline:
  1. Fetches all RSS feeds in parallel via `Promise.allSettled`
  2. Deduplicates URLs against existing articles in Supabase
  3. AI-enriches each new article using Gemini (summary, category, entities, MCQs)
  4. Persists to `knowledge_objects` and `mcqs` tables
  5. Returns `IngestionResult` with counts (fetched, new, duplicate, enriched, failed)

- **`logIngestionRun()`** — Records each pipeline run to `ingestion_runs` table for monitoring

- **`getRecentIngestionRuns()`** — Fetches recent run history for the status dashboard

- **`DEFAULT_FEEDS`** — 14 curated RSS feeds covering news, business, science, sports, and Indian sources (PIB, The Hindu, Times of India, Indian Express)

### 2. Scheduled Polling (`server/lib/scheduler.ts`)

- **`registerRssIngestion(io)`** — Registers a recurring task that runs the ingestion pipeline every 30 minutes
- Broadcasts a `news_update` WebSocket event when new articles are found
- Logs each run (success or failure) to the `ingestion_runs` table

### 3. API Endpoints (`server.ts`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/worker/poll` | POST | Manually trigger the RSS ingestion pipeline. Body: `{ auto_review?: boolean, max_new?: number }` |
| `/api/ingest/poll` | GET | Fetch latest articles from the database (replaces in-memory store) |
| `/api/ingest/status` | GET | Pipeline monitoring — recent ingestion runs with stats and unreviewed count |

### 4. Database Table — `ingestion_runs`

Tracks every pipeline run with:
- `run_type`: `scheduled` | `manual` | `worker_poll`
- `feeds_polled`, `articles_fetched`, `articles_new`, `articles_duplicate`
- `ai_enriched`, `ai_failed`
- `status`: `running` | `completed` | `failed`
- `duration_ms`, `error_message`

## Data Flow

1. **Fetch**: 14 RSS feeds polled in parallel, 6 items per feed (max 84 raw articles per run)
2. **Deduplicate**: Each article's URL is normalized and checked against `knowledge_objects.source_url`
3. **AI Enrichment**: Gemini 2.5 Flash processes each new article with structured JSON schema output:
   - Headline, summary, category, entities, exam importance score
   - 3 quick-take bullet points
   - 2-3 multiple choice questions with explanations
4. **Persistence**: Article inserted into `knowledge_objects` (with `reviewed=false`); MCQs inserted into `mcqs` table
5. **WebSocket Broadcast**: Connected clients receive `news_update` event when new articles are available

## Configuration

- **Polling interval**: 30 minutes (configurable in `scheduler.ts`)
- **Max new articles per run**: 15 (configurable via `max_new` parameter)
- **Items per feed**: 6
- **AI model**: Gemini 2.5 Flash with structured JSON schema response
- **Auto-review**: Off by default — articles enter QC queue (`reviewed=false`) until approved

## Error Handling

- Feed parse failures are caught per-feed (one broken feed doesn't stop the pipeline)
- AI enrichment failures fall back to raw article data (no summary/MCQs, but article is still persisted)
- Pipeline errors are logged to `ingestion_runs` with error message
- All Supabase operations use the admin client (service role key, bypasses RLS)
