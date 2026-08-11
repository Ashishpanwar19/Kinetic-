# PulseNews AI — Database Design & Schema

## 1. Database Strategy

PulseNews AI uses polyglot persistence — the right database for each data pattern:

| Data Pattern | Database | Rationale |
|-------------|----------|-----------|
| Structured news articles, MCQs, entities | PostgreSQL | Relational integrity, complex queries, RLS |
| Semantic search / RAG embeddings | pgvector | Cosine similarity search within PostgreSQL |
| User profiles, chat history, bookmarks | Firestore | Real-time sync, offline persistence, Firebase Auth integration |
| Task queues, caching, rate limiting | Redis | In-memory speed, pub/sub, TTL |
| Entity relationship graph | Neo4j | Traversal-optimized graph queries |

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────────┐       ┌─────────────────┐
│    sources       │       │    knowledge_objects      │       │     mcqs         │
│─────────────────│       │──────────────────────────│       │─────────────────│
│ id (PK)         │──┐   │ id (PK)                  │──┐   │ id (PK)         │
│ name            │   │  │ source_id (FK)            │  │   │ ko_id (FK)      │
│ url             │   └──│ source_url                │  │   │ question        │
│ feed_url        │      │ source_name               │  └──│ options (jsonb) │
│ type            │      │ headline                  │      │ correct_index   │
│ is_active       │      │ summary                   │      │ explanation     │
│ category        │      │ category                  │      │ created_at      │
│ created_at      │      │ exam_importance           │      └─────────────────┘
└─────────────────┘      │ quick_take (jsonb)        │
                         │ entities (text[])         │       ┌─────────────────┐
                         │ image_url                 │       │    entities      │
                         │ video_url                 │       │─────────────────│
                         │ is_breaking               │──┐   │ id (PK)         │
                         │ is_live                   │  │   │ ko_id (FK)      │
                         │ is_local                  │  │   │ name            │
                         │ reviewed                  │  │   │ type            │
                         │ published_at              │  └──│ created_at      │
                         │ embedding (vector)        │      └─────────────────┘
                         │ created_at                │
                         │ updated_at                │
                         └──────────────────────────┘

┌──────────────────────────┐       ┌──────────────────────────┐
│    user_bookmarks         │       │    quiz_submissions       │
│──────────────────────────│       │──────────────────────────│
│ id (PK)                   │       │ id (PK)                   │
│ user_id (FK auth.users)   │       │ user_id (FK auth.users)   │
│ ko_id (FK knowledge_objs) │       │ ko_id (FK knowledge_objs) │
│ created_at                │       │ score                     │
└──────────────────────────┘       │ total_questions           │
                                   │ answers (jsonb)           │
┌──────────────────────────┐       │ submitted_at              │
│    user_profiles          │       └──────────────────────────┘
│──────────────────────────│
│ user_id (PK, FK auth)     │       ┌──────────────────────────┐
│ display_name              │       │    article_views          │
│ avatar_url                │       │──────────────────────────│
│ role                      │       │ id (PK)                   │
│ quizzes_solved            │       │ user_id                   │
│ accuracy                  │       │ ko_id (FK)                │
│ total_questions           │       │ viewed_at                 │
│ created_at                │       │ source                    │
│ updated_at                │       └──────────────────────────┘
└──────────────────────────┘

┌──────────────────────────┐       ┌──────────────────────────┐
│   youtube_channels        │       │    live_streams           │
│──────────────────────────│       │──────────────────────────│
│ id (PK)                   │──┐   │ id (PK)                   │
│ channel_id (YT)           │   │  │ channel_id (FK)           │
│ name                      │   └──│ title                     │
│ description               │      │ is_live                   │
│ thumbnail_url             │      │ viewer_count              │
│ category                  │      │ video_id (YT)             │
│ is_monitored              │      │ stream_started_at         │
│ created_at                │      │ last_checked_at           │
└──────────────────────────┘      └──────────────────────────┘

┌──────────────────────────┐       ┌──────────────────────────┐
│    search_logs            │       │    ai_usage_logs          │
│──────────────────────────│       │──────────────────────────│
│ id (PK)                   │       │ id (PK)                   │
│ user_id                   │       │ agent                     │
│ query                     │       │ ko_id                     │
│ results_count             │       │ input_tokens              │
│ searched_at               │       │ output_tokens             │
└──────────────────────────┘       │ latency_ms                │
                                   │ success                   │
                                   │ model                     │
                                   │ created_at                │
                                   └──────────────────────────┘
```

---

## 3. Table Definitions

### 3.1 sources

Stores metadata about news sources (RSS feeds, government APIs, YouTube channels).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| name | text | NOT NULL | Display name (e.g., "Reuters", "PIB India") |
| url | text | NOT NULL | Website URL |
| feed_url | text | | RSS/Atom feed URL (if applicable) |
| type | text | NOT NULL, default 'rss' | Source type: rss, government, youtube, news_api |
| is_active | boolean | default true | Whether this source is currently being polled |
| category | text | | Primary category for this source |
| country | text | | Country code (IN, US, etc.) |
| created_at | timestamptz | default now() | When source was added |

### 3.2 knowledge_objects

The core table — stores every processed news article with AI-generated content.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| source_id | uuid | FK -> sources(id) | Linked source |
| source_url | text | NOT NULL | Original article URL |
| source_name | text | NOT NULL | Source display name (denormalized for speed) |
| headline | text | NOT NULL | Article headline |
| summary | text | NOT NULL | AI-generated or extracted summary |
| category | text | NOT NULL | Exam category (Polity, Economy, Science, etc.) |
| exam_importance | integer | default 50, CHECK 1-100 | AI-ranked importance for exams |
| quick_take | jsonb | | Array of 3 bullet points (AI-generated) |
| entities | text[] | | NER-extracted entity names |
| image_url | text | | Article image / thumbnail |
| video_url | text | | Embedded video URL (YouTube) |
| tag | text | | Display tag (#TECH, #GLOBAL, etc.) |
| views | text | default '0' | View count (string for display formatting) |
| likes | integer | default 0 | Like count |
| comments_count | integer | default 0 | Comment count |
| shares | integer | default 0 | Share count |
| is_breaking | boolean | default false | Breaking news flag |
| is_live | boolean | default false | Associated with live event |
| is_local | boolean | default false | Local/regional news flag |
| reviewed | boolean | default false | Passed QC review |
| monetized | boolean | default false | Part of premium content |
| published_at | timestamptz | | Original article publication time |
| embedding | vector(768) | | pgvector embedding for semantic search |
| created_at | timestamptz | default now() | When KO was created in system |
| updated_at | timestamptz | default now() | Last modification time |

### 3.3 mcqs

Multiple choice questions generated by AI for each knowledge object.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| ko_id | uuid | FK -> knowledge_objects(id) ON DELETE CASCADE | Parent article |
| question | text | NOT NULL | Question text |
| options | jsonb | NOT NULL | Array of 4 option strings |
| correct_index | integer | NOT NULL, CHECK 0-3 | Index of correct option (0-based) |
| explanation | text | NOT NULL | Why the correct answer is correct |
| created_at | timestamptz | default now() | When MCQ was generated |

### 3.4 entities

Named entities extracted from articles (people, organizations, locations, policies).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| ko_id | uuid | FK -> knowledge_objects(id) ON DELETE CASCADE | Source article |
| name | text | NOT NULL | Entity name (e.g., "RBI", " Narendra Modi") |
| type | text | NOT NULL | Entity type: Person, Organization, Location, Policy, Event |
| created_at | timestamptz | default now() | When entity was extracted |

### 3.5 user_profiles

Extended user data beyond Firebase Auth (role, quiz stats).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| user_id | uuid | PK, FK -> auth.users(id) ON DELETE CASCADE | Firebase auth user |
| display_name | text | | User's display name |
| avatar_url | text | | Profile image URL |
| role | text | NOT NULL, default 'user' | Role: user, admin |
| quizzes_solved | integer | default 0 | Total quizzes completed |
| accuracy | numeric | default 0 | Average accuracy percentage |
| total_questions | integer | default 0 | Total MCQs answered |
| created_at | timestamptz | default now() | Account creation time |
| updated_at | timestamptz | default now() | Last profile update |

### 3.6 user_bookmarks

Articles saved by users for later review.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| user_id | uuid | NOT NULL, default auth.uid() | Owner |
| ko_id | uuid | FK -> knowledge_objects(id) ON DELETE CASCADE | Bookmarked article |
| created_at | timestamptz | default now() | When bookmarked |

### 3.7 quiz_submissions

Records of completed quizzes with scores and answers.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| user_id | uuid | NOT NULL, default auth.uid() | Owner |
| ko_id | uuid | FK -> knowledge_objects(id) | Quiz subject article |
| score | integer | NOT NULL | Correct answers count |
| total_questions | integer | NOT NULL | Total questions in quiz |
| answers | jsonb | | Array of { question_id, selected_index, correct } |
| submitted_at | timestamptz | default now() | When quiz was submitted |

### 3.8 youtube_channels

Registry of monitored YouTube channels.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| channel_id | text | NOT NULL, UNIQUE | YouTube channel ID |
| name | text | NOT NULL | Channel display name |
| description | text | | Channel description |
| thumbnail_url | text | | Channel avatar |
| category | text | | Content category |
| is_monitored | boolean | default true | Whether to poll this channel |
| created_at | timestamptz | default now() | When channel was added |

### 3.9 live_streams

Current live stream status for monitored channels.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| channel_id | uuid | FK -> youtube_channels(id) | Parent channel |
| title | text | NOT NULL | Stream title |
| is_live | boolean | default false | Currently live |
| viewer_count | text | | Current viewer count |
| video_id | text | | YouTube video ID for embed |
| stream_started_at | timestamptz | | When stream went live |
| last_checked_at | timestamptz | default now() | Last status check |

### 3.10 article_views

Tracks when users view articles (for analytics and recommendations).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| user_id | uuid | | Viewer (null for anonymous) |
| ko_id | uuid | FK -> knowledge_objects(id) | Article viewed |
| viewed_at | timestamptz | default now() | When view occurred |
| source | text | default 'feed' | Where the view came from (feed, search, bookmark) |

### 3.11 search_logs

Tracks search queries for analytics and search improvement.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| user_id | uuid | | Searcher (null for anonymous) |
| query | text | NOT NULL | Search query text |
| results_count | integer | | Number of results returned |
| searched_at | timestamptz | default now() | When search occurred |

### 3.12 ai_usage_logs

Tracks every Gemini API call for cost monitoring and debugging.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Unique identifier |
| agent | text | NOT NULL | Which AI agent (summarizer, mcq_generator, etc.) |
| ko_id | uuid | | Associated knowledge object (if any) |
| input_tokens | integer | | Tokens consumed in prompt |
| output_tokens | integer | | Tokens generated |
| latency_ms | integer | | Response time in milliseconds |
| success | boolean | NOT NULL | Whether the call succeeded |
| model | text | default 'gemini-flash' | Model used |
| created_at | timestamptz | default now() | When call was made |

---

## 4. Indexing Strategy

| Index | Table | Column(s) | Purpose |
|-------|-------|-----------|---------|
| `idx_ko_published_at` | knowledge_objects | published_at DESC | Feed ordering by recency |
| `idx_ko_category` | knowledge_objects | category | Category filtering |
| `idx_ko_breaking` | knowledge_objects | is_breaking WHERE true | Breaking news queries |
| `idx_ko_reviewed` | knowledge_objects | reviewed WHERE true | Published content only |
| `idx_ko_exam_importance` | knowledge_objects | exam_importance DESC | Sort by importance |
| `idx_ko_source_id` | knowledge_objects | source_id | Join with sources |
| `idx_mcq_ko_id` | mcqs | ko_id | Fetch MCQs for an article |
| `idx_entity_ko_id` | entities | ko_id | Fetch entities for an article |
| `idx_entity_name` | entities | name | Entity search |
| `idx_bookmark_user_id` | user_bookmarks | user_id | Fetch user's bookmarks |
| `idx_quiz_user_id` | quiz_submissions | user_id | Fetch user's quiz history |
| `idx_views_ko_id` | article_views | ko_id | Article popularity |
| `idx_views_user_id` | article_views | user_id | User reading history |
| `idx_ai_logs_created_at` | ai_usage_logs | created_at DESC | Recent AI calls |
| `idx_ai_logs_agent` | ai_usage_logs | agent | Per-agent cost analysis |
| `idx_embedding` | knowledge_objects | embedding (ivfflat) | Vector similarity search |

### Vector Index (pgvector)

```sql
CREATE INDEX idx_ko_embedding ON knowledge_objects
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## 5. Row Level Security (RLS) Policy Summary

### Public Tables (read by anyone, write by authenticated only)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| sources | anon, authenticated (active only) | authenticated (admin) | authenticated (admin) | authenticated (admin) |
| knowledge_objects | anon, authenticated (reviewed only) | authenticated | authenticated (admin) | authenticated (admin) |
| mcqs | anon, authenticated | authenticated | authenticated (admin) | authenticated (admin) |
| entities | anon, authenticated | authenticated | authenticated (admin) | authenticated (admin) |
| youtube_channels | anon, authenticated (monitored only) | authenticated (admin) | authenticated (admin) | authenticated (admin) |
| live_streams | anon, authenticated (live only) | authenticated | authenticated (admin) | authenticated (admin) |

### User-Scoped Tables (owner can CRUD own rows)

| Table | Policy | Check |
|-------|--------|-------|
| user_profiles | owner only | auth.uid() = user_id |
| user_bookmarks | owner only | auth.uid() = user_id |
| quiz_submissions | owner only | auth.uid() = user_id |

### Analytics Tables (insert by anyone, read by owner/admin)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| article_views | owner or admin | anon, authenticated | — | — |
| search_logs | owner or admin | anon, authenticated | — | — |
| ai_usage_logs | admin only | authenticated | — | — |

---

## 6. Firestore Collections (Volume 11)

These collections live in Firebase Firestore and sync with the PostgreSQL tables:

| Collection | Document ID | Purpose |
|-----------|------------|---------|
| `users/{uid}` | Firebase UID | User profile (mirrors user_profiles) |
| `users/{uid}/bookmarks/{koId}` | Knowledge object ID | Bookmark sync for offline access |
| `users/{uid}/chats/{chatId}` | Auto-generated | AI tutor chat history |
| `users/{uid}/quiz_history/{quizId}` | Auto-generated | Quiz submission history |

---

## 7. Redis Schema (Future — Volume 4+)

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `rss:cache:{feed_url_hash}` | string | 24h | Cached RSS feed response |
| `ai:queue:summarize` | list | — | Summarization task queue |
| `ai:queue:mcq` | list | — | MCQ generation task queue |
| `rate:{user_id}:{endpoint}` | counter | 1 min | Rate limiting counter |
| `session:{socket_id}` | hash | 1h | WebSocket session data |
| `digest:today` | string | 6h | Cached daily digest JSON |

---

## 8. Neo4j Graph Schema (Future — Volume 8)

### Nodes

| Label | Properties | Source |
|-------|-----------|--------|
| `Entity` | name, type, created_at | entities table |
| `KnowledgeObject` | id, headline, category | knowledge_objects table |
| `Source` | id, name, type | sources table |
| `Category` | name | distinct categories |

### Relationships

| Type | From -> To | Properties |
|------|-----------|-----------|
| `MENTIONS` | KnowledgeObject -> Entity | position, context |
| `PUBLISHED_BY` | KnowledgeObject -> Source | published_at |
| `BELONGS_TO` | KnowledgeObject -> Category | — |
| `RELATED_TO` | Entity -> Entity | relationship_type, strength |
| `CO_OCCURS_WITH` | Entity -> Entity | article_count, last_seen |
