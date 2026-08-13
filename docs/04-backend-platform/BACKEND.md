# Backend Platform — API Reference & Architecture

## Architecture

```
Client (Browser)
    │
    ▼
Express Server (server.ts)
    │
    ├── Request Logger ──► console (structured logs)
    ├── Rate Limiter ────► 429 if exceeded
    ├── Auth Middleware ─► Firebase JWT verification
    │
    ▼
Supabase DataService (server/lib/supabaseDataService.ts)
    │
    ▼
Supabase PostgreSQL (RLS-protected tables)
```

### Fallback Strategy

Every database-backed endpoint follows a **fallback pattern**:

1. If Supabase is configured, attempt the database query.
2. If the query succeeds and returns data, respond with it.
3. If Supabase is not configured or the query fails, fall back to in-memory storage.
4. Log a warning so operators know the fallback was used.

This ensures the server never goes down even if the database is temporarily unreachable.

---

## Middleware

### Request Logger (`server/lib/logger.ts`)

Logs every HTTP request in structured format:

```
[2026-08-12T10:30:00.000Z] INFO  GET /api/digest/today 200 45ms ip=127.0.0.1
[2026-08-12T10:30:01.000Z] WARN  POST /api/ai/chat 429 2ms ip=127.0.0.1 error="Too Many Requests"
```

### Rate Limiter (`server/lib/rateLimiter.ts`)

| Scope | Window | Max Requests | Key |
|-------|--------|-------------|-----|
| General API (`/api/*`) | 60s | 100 | IP address |
| AI endpoints (`/api/ai/*`) | 60s | 10 | User token or IP |

Rate-limited responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

### Auth Middleware (`server/lib/authMiddleware.ts`)

| Middleware | Behavior |
|------------|----------|
| `requireAuth` | Returns 401 if no valid token |
| `requireAdmin` | Returns 403 if user is not admin |
| `optionalAuth` | Attaches user info if token present, continues otherwise |

---

## API Endpoints

### Content

#### `GET /api/health`
Health check. Returns `{ status: "ok", timestamp }`.

#### `GET /api/digest/today`
Returns the day's reviewed knowledge objects.

**Response:**
```json
{
  "date": "2026-08-12",
  "count": 24,
  "knowledge_objects": [...]
}
```

**Database:** Queries `knowledge_objects` where `reviewed = true`, ordered by `published_at DESC`, limited to 50. Joins `mcqs` for each article.

#### `GET /api/digest/unreviewed`
Returns the count of unreviewed articles awaiting QC approval.

**Database:** Counts rows in `knowledge_objects` where `reviewed = false`.

#### `POST /api/article/:id/review`
Approves an article for publication.

**Database:** Updates `knowledge_objects` set `reviewed = true` where `id = :id`. Emits `news_update` socket event.

#### `GET /api/article/:id`
Returns a single knowledge object with its MCQs.

**Database:** Queries `knowledge_objects` by ID, joins `mcqs`.

### User

#### `GET /api/user/profile`
Returns the authenticated user's profile, stats, and bookmarks.

**Auth:** Optional — uses Firebase UID if authenticated, falls back to local user store.

**Database:** Queries `user_profiles` by `user_id`. Creates a default profile if none exists.

#### `POST /api/user/bookmark`
Toggles a bookmark on an article.

**Body:** `{ article_id: string, headline?: string }`

**Database:** Checks `user_bookmarks` for existing entry. Inserts or deletes accordingly.

#### `POST /api/quiz/submit`
Submits quiz answers and returns scored results.

**Body:** `{ article_id: string, answers: number[] }`

**Database:** Fetches MCQs for the article, scores answers, inserts a `quiz_submissions` row, then recalculates and updates `user_profiles` aggregate stats.

#### `POST /api/user/history`
Adds a history item to the user's activity log.

#### `POST /api/user/reset`
Resets the user's profile to defaults.

### AI

#### `POST /api/ai/chat`
Gemini-powered chatbot conversation.

**Rate limited:** 10 requests/minute.

**Body:** `{ message: string, context?: string }`

#### `POST /api/ai/quick-take`
Generates a quick-take summary for an article.

**Rate limited:** 10 requests/minute.

**Body:** `{ article_url: string, headline: string }`

### System

#### `GET /api/system/metrics`
Returns real-time platform metrics.

**Database:** Aggregates counts from `knowledge_objects`, `ai_usage_logs`, and `mcqs` for the last 24 hours. Computes average AI latency from recent successful logs.

#### `GET /api/knowledge-graph`
Returns entity graph data for visualization.

### Open News

#### `POST /api/open-news/fetch-article`
Fetches and extracts content from a URL.

#### `POST /api/open-news/rss-discover`
Discovers RSS feeds for a site.

#### `POST /api/open-news/search-site`
Searches for news on a specific site.

#### `POST /api/open-news/batch-summarize`
Fetches and summarizes multiple articles.

#### `POST /api/open-news/search-and-summarize`
Searches for news and summarizes results.

#### `GET /api/open-news/categories-countries`
Returns available categories and countries for news filtering.

#### `POST /api/open-news/clear-cache`
Clears the RSS feed cache.

### Sports

#### `GET /api/sports/events`
Returns scheduled sports events.

#### `POST /api/sports/capture-video`
Captures a sports video clip.

### Real-time

#### `POST /api/socket/emit-news`
Emits a news update to all connected WebSocket clients.

### Worker

#### `POST /api/worker/poll`
Triggers an RSS polling cycle. Fetches feeds, creates knowledge objects.

### PDF

#### `GET /api/pdf/:date`
Returns a PDF digest for a given date.

#### `GET /api/pdf/:date/download`
Downloads the PDF digest for a given date.

---

## Background Scheduler

The scheduler (`server/lib/scheduler.ts`) runs periodic background tasks:

| Task | Interval | Description |
|------|----------|-------------|
| `stream-status-broadcast` | 10s | Broadcasts live stream viewer counts via Socket.io |

Tasks are registered before server startup and started with `startScheduler()`. On `SIGTERM`/`SIGINT`, `stopScheduler()` clears all intervals for graceful shutdown.

---

## Supabase Data Service

The `supabaseDataService.ts` module is the single point of contact between the API layer and the database. It provides:

- **`fetchTodayDigest(limit)`** — Reviewed articles with MCQs
- **`fetchKnowledgeObjectById(id)`** — Single article with MCQs
- **`fetchUnreviewedCount()`** — QC queue depth
- **`approveKnowledgeObject(id)`** — Approve article
- **`submitQuiz(userId, koId, answers)`** — Score and persist quiz
- **`toggleBookmark(userId, koId)`** — Save/unsave article
- **`fetchUserBookmarks(userId)`** — User's saved articles
- **`fetchUserProfile(userId)`** — Profile with auto-creation
- **`updateUserStats(userId)`** — Recalculate aggregate stats
- **`logArticleView(userId, koId, source)`** — Analytics
- **`logAIUsage(agent, success, latency, model)`** — AI metrics
- **`fetchSystemMetrics()`** — Dashboard data

All functions return empty arrays or null when Supabase is not configured, allowing the caller to fall back gracefully.

---

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `news_update` | Server → Client | `{ action, article, timestamp }` |
| `stream_status` | Server → Client | `{ type, streams, timestamp }` |
| `connection` | Client → Server | Socket connection event |

---

## Deployment

### Build

```bash
npm run build
```

This runs `vite build` (frontend) and `esbuild` (backend server bundling).

### Start

```bash
npm start
```

Runs the compiled server from `dist/server.cjs`.

### Environment

Required for full functionality:

```
SUPABASE_URL=<project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
GEMINI_API_KEY=<google-ai-api-key>
```

The server starts and runs even without Supabase configured — it falls back to in-memory storage and logs a warning.
