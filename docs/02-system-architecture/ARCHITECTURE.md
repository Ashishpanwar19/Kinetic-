# PulseNews AI — High-Level System Architecture

## 1. Architecture Overview

PulseNews AI uses a **modular monolith** architecture with clear service boundaries. The current MVP runs as a single Express server with Socket.io, but the architecture is designed to split into microservices when scale demands it. Each module has a well-defined interface, enabling future extraction into independent services without rewriting.

### Design Principles

1. **Modular first, microservices when needed** — Start as a well-structured monolith, extract services only when a module has independent scaling needs
2. **Event-driven internal communication** — Modules communicate via typed events through Socket.io and in-process event emitters
3. **Database per concern** — PostgreSQL for relational data, pgvector for embeddings, Neo4j for graph, Redis for cache/queue, Firestore for user state
4. **AI pipeline as async workers** — All AI operations run in background tasks, never blocking the request-response cycle
5. **Real-time push over polling** — WebSocket (Socket.io) for all live updates; REST APIs only for initial loads and mutations

---

## 2. System Topology

```
                              ┌──────────────────────────────────────────────────┐
                              │                  USER DEVICES                     │
                              │   Mobile (360-430px)  |  Desktop (1280-2560px)  │
                              └──────────────┬───────────────────────────────────┘
                                             │
                                    HTTPS / WSS
                                             │
                              ┌──────────────▼───────────────────────────────────┐
                              │              NGINX REVERSE PROXY                  │
                              │  Port 80/443 — SSL termination, rate limiting    │
                              │  Routes: / -> Frontend, /api/ -> Backend,        │
                              │          /socket.io/ -> Backend WebSocket        │
                              └──────────────┬───────────────────────────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          │                  │                  │
               ┌──────────▼─────┐  ┌────────▼────────┐  ┌──────▼───────┐
               │   FRONTEND     │  │     BACKEND     │  │  WEBSOCKET   │
               │  React + Vite  │  │   Express API   │  │  Socket.io   │
               │  Port 3000     │  │  Port 3001      │  │  (same proc) │
               │                │  │                 │  │              │
               │ - Feed View    │  │ /api/digest     │  │ news_update  │
               │ - Live Hub     │  │ /api/quiz       │  │ stream_status│
               │ - AI Digest    │  │ /api/user       │  │ breaking_news│
               │ - Knowledge    │  │ /api/ai/*       │  │              │
               │   Graph        │  │ /api/news/*     │  │              │
               │ - Open Studio  │  │ /api/system     │  │              │
               │ - Profile      │  │                 │  │              │
               └────────────────┘  └────────┬────────┘  └──────────────┘
                                            │
                         ┌──────────────────┼──────────────────────┐
                         │                  │                      │
              ┌──────────▼─────┐  ┌────────▼────────┐  ┌──────────▼───────┐
              │  AI SERVICES   │  │   DATABASES     │  │  EXTERNAL APIs   │
              │  (Gemini)      │  │                 │  │                  │
              │                │  │ Supabase (PG)   │  │ NewsData.io      │
              │ - Summarizer   │  │ pgvector        │  │ GNews            │
              │ - MCQ Generator│  │ Firestore       │  │ RSS Feeds        │
              │ - Classifier   │  │ Redis (future)  │  │ YouTube Data     │
              │ - NER          │  │ Neo4j (future)  │  │ Govt APIs (PIB)  │
              │ - Tutor (RAG)  │  │                 │  │                  │
              │ - Fact Checker │  │                 │  │                  │
              └────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 3. Component Breakdown

### 3.1 Frontend (React + Vite)

| Component | Responsibility | State |
|-----------|---------------|-------|
| `FeedView` | Vertical snap-scroll video feed of news reels | Primary screen |
| `LiveHubView` | Live broadcast monitoring with embedded YouTube | Real-time via Socket.io |
| `ExamDigestView` | AI-generated 3-bullet quick takes + MCQ engine | On-demand AI generation |
| `KnowledgeGraphView` | Interactive Neo4j entity relationship explorer | D3-force graph |
| `OpenNewsStudioView` | RSS aggregator, article extractor, batch summarizer | Researcher tool |
| `SystemArchitectureView` | Real-time pipeline telemetry dashboard | Admin monitoring |
| `ProfileView` | Bookmarks, quiz history, accuracy stats | Firestore-backed |
| `GeminiChatbotModal` | Conversational AI tutor with RAG | Multi-turn chat |
| `ExamQuizModal` | MCQ quiz with scoring and explanations | Session state |
| `Navigation` | Tab bar, search, socket status indicator | Global |
| `RssNewsTicker` | Scrolling breaking news ticker | Socket.io fed |

### 3.2 Backend (Express + Socket.io)

| Module | Responsibility | Endpoints |
|--------|---------------|-----------|
| Digest API | Serve today's knowledge objects | `GET /api/digest/today` |
| Quiz API | Submit quiz answers, track scores | `POST /api/quiz/submit` |
| User API | Profile, bookmarks, history | `GET /api/user/profile`, `POST /api/user/bookmark` |
| AI API | Quick takes, MCQs, tutor chat, custom topics | `POST /api/ai/quick-take`, `POST /api/ai/tutor`, `POST /api/ai/quiz-generate` |
| News API | Open News Studio operations | `POST /api/news/extract`, `POST /api/news/search`, `POST /api/news/rss-discover`, `POST /api/news/batch-summarize` |
| System API | Pipeline metrics, architecture status | `GET /api/system/status`, `GET /api/system/metrics` |
| Socket.io | Real-time push for news updates and stream status | `news_update`, `stream_status`, `breaking_news` |

### 3.3 AI Services (Gemini-powered)

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| Summarizer | Article body text | 3-bullet quick take | Gemini Flash |
| MCQ Generator | Article body + topic | 2-5 MCQs with options, answer, explanation | Gemini Flash |
| Classifier | Article headline + body | Category (Polity, Economy, Science, etc.) | Gemini Flash |
| NER Extractor | Article body | Entity list (people, orgs, locations) | Gemini Flash |
| Importance Ranker | Article + category | Exam importance score 1-100 | Gemini Flash |
| Fact Checker | Article + cross-source articles | Verification score + conflicting facts | Gemini Flash |
| Tutor (RAG) | User query + retrieved context | Conversational answer | Gemini Flash |
| Timeline Builder | Related articles over time | Chronological event timeline | Gemini Flash |

### 3.4 Databases

| Database | Purpose | Volume |
|----------|---------|-------|
| PostgreSQL (Supabase) | Users, knowledge objects, articles, sources, quizzes, analytics | Volume 3 |
| pgvector (Supabase extension) | Semantic search embeddings for RAG | Volume 3 |
| Firestore (Firebase) | User profiles, bookmarks, quiz submissions, chat history | Volume 11 |
| Redis | Task queues, session cache, rate limiting counters | Volume 3 |
| Neo4j | Knowledge graph: entities and relationships | Volume 8 |

---

## 4. Data Flow

### 4.1 News Collection Flow

```
RSS Feed / NewsAPI / Govt API
        │
        ▼
  ┌─────────────┐
  │  Collector   │  Fetch every 2-5 min
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Cleaner     │  Extract body, authors, date, images
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Deduplicator│  URL normalization + fuzzy title match
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Storage     │  Insert into PostgreSQL (knowledge_objects)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  AI Queue    │  Enqueue for AI processing (Redis)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  AI Pipeline │  Summarize -> NER -> Classify -> Rank -> MCQ
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  WebSocket   │  Push to connected clients via Socket.io
  │  Broadcast   │  Event: "news_update"
  └─────────────┘
```

### 4.2 AI Tutor RAG Flow

```
User asks question
        │
        ▼
  ┌─────────────┐
  │  Embedding   │  Convert query to vector (text-embedding-004)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Vector      │  pgvector cosine similarity search
  │  Search      │  Top-K=5 knowledge objects
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Context     │  Build prompt with retrieved facts + chat history
  │  Assembly    │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  LLM         │  Gemini Flash generates answer
  │  Generation  │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Response    │  Return answer + source citations
  └─────────────┘
```

### 4.3 Real-Time Update Flow

```
[News Collector discovers new article]
        │
        ├──> PostgreSQL INSERT (knowledge_objects)
        │
        ├──> AI Pipeline enqueue (Redis)
        │
        └──> Socket.io broadcast: { event: "news_update", article: {...} }
                    │
                    ├──> FeedView prepends new card
                    ├──> RssNewsTicker updates ticker
                    └──> Toast notification shows headline

[AI Pipeline completes processing]
        │
        ├──> PostgreSQL UPDATE (add quick_take, mcqs, entities, importance)
        │
        └──> Socket.io broadcast: { event: "news_update", article: {...} }
                    │
                    └──> FeedView updates existing card with AI content

[Breaking news detected (3+ sources, 30 min window)]
        │
        ├──> PostgreSQL UPDATE (is_breaking = true)
        │
        └──> Socket.io broadcast: { event: "breaking_news", article: {...} }
                    │
                    ├──> Push notification (FCM — Volume 11)
                    └──> Breaking news banner appears in feed
```

---

## 5. Request-Response Architecture

### 5.1 Initial Page Load

```
Browser ────────GET /──────────> Nginx ───────> Frontend (Vite)
                                                       │
                                          React mounts <App>
                                                       │
                              ┌────────────────────────┤
                              │                        │
                    GET /api/digest/today         Socket.io connect
                              │                        │
                    Backend queries Supabase     Socket.io emits
                    Returns knowledge_objects    "stream_status"
                              │                        │
                    React renders FeedView       LiveHubView updates
```

### 5.2 AI Generation Request

```
User clicks "Generate Quick Take"
        │
        ▼
POST /api/ai/quick-take { topic: "RBI monetary policy" }
        │
        ▼
Backend calls Gemini Flash
        │
        ├──> Success: { success: true, data: { quick_take: [...] } }
        │
        └──> Failure: { success: false, error: "AI generation failed" }
                │
                └──> Frontend shows error toast, offers retry
```

---

## 6. Technology Decision Matrix

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | React 19 + Vite | Fast HMR, mature ecosystem, existing codebase |
| Styling | Tailwind CSS 4 | Utility-first, no CSS files to manage, consistent spacing |
| Animation | Motion (Framer) | Spring physics, layout animations, gesture support |
| Backend | Express + Socket.io | Single process for REST + WebSocket, simple to deploy |
| AI provider | Google Gemini | Cost-effective Flash model, structured JSON output, existing integration |
| Primary DB | Supabase (PostgreSQL) | Managed, RLS built-in, pgvector support, free tier |
| User state | Firestore | Real-time sync, offline persistence, Firebase Auth integration |
| Auth | Firebase Auth (Google OAuth) | One-click sign-in, JWT tokens, no password management |
| Queue | Redis (future) | In-memory, pub/sub, task queues with BullMQ |
| Graph | Neo4j (future) | Purpose-built for relationship traversal, Cypher query language |
| PDF | jsPDF | Client-side generation, no server compute needed |
| RSS | rss-parser | Mature, handles all RSS/Atom feed formats |
| Real-time | Socket.io | Auto-reconnection, rooms, broadcast, fallback to polling |
| Container | Docker + Docker Compose | Reproducible environments, easy multi-service orchestration |
| CI/CD | GitHub Actions | Free for public repos, integrated with GitHub |

---

## 7. Module Dependency Graph

```
                    ┌──────────────┐
                    │   App.tsx    │  Root component, state management
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
    │ Navigation  │ │ FeedView   │ │  Profile    │
    │ + Drawer    │ │ + Snippet  │ │  View       │
    └─────────────┘ │ Detail     │ └─────────────┘
                    └────────────┘
                                        │
           ┌───────────┬────────┬───────┼────────┬──────────┐
           │           │        │       │        │          │
    ┌──────▼──┐ ┌─────▼───┐ ┌──▼───┐ ┌─▼────┐ ┌─▼─────┐ ┌──▼──────┐
    │ LiveHub │ │ Exam    │ │ Know │ │ Open │ │ System │ │ Gemini  │
    │ View    │ │ Digest  │ │ Graph│ │ News │ │ Arch   │ │ Chatbot │
    │         │ │ +Quiz   │ │ View │ │ Studio│ │ View   │ │ Modal   │
    └─────────┘ └─────────┘ └──────┘ └──────┘ └───────┘ └─────────┘
           │           │        │       │        │          │
           │           │        │       │        │          │
    ┌──────▼───────────▼────────▼───────▼────────▼──────────▼──────┐
    │                     SHARED SERVICES                          │
    │  useSocket (hooks)  |  newsDataService  |  AuthContext       │
    │  pdfDigestService   |  firebase.ts      |  types.ts          │
    └──────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │        BACKEND API            │
                    │  Express + Socket.io          │
                    │  /api/digest, /api/ai, etc.   │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │     EXTERNAL SERVICES         │
                    │  Gemini AI | Supabase | RSS   │
                    │  NewsData | GNews | Firebase  │
                    └───────────────────────────────┘
```

---

## 8. Scalability Path

### Current (MVP — Single Process)

```
[Nginx] -> [Frontend + Backend + Socket.io (single process)]
                    │
                    ├── Supabase (managed)
                    ├── Firestore (managed)
                    └── Gemini API (managed)
```

### Phase 2 (10K users — Frontend/Backend split)

```
[Nginx] -> [Frontend (Vite preview)]
         -> [Backend (Express + Socket.io)]
         -> [Socket.io (sticky sessions via Nginx)]
```

### Phase 3 (50K users — Service extraction)

```
[Nginx] -> [Frontend CDN]
         -> [API Gateway]
              ├── [News Service]
              ├── [AI Service]
              ├── [User Service]
              ├── [Quiz Service]
              └── [Socket.io Gateway (Redis adapter)]
                    │
                    ├── Supabase (read replicas)
                    ├── Redis (shared state)
                    └── Neo4j cluster
```

The modular monolith design means Phase 2 and 3 are extraction operations, not rewrites. Each module's interface stays the same; only the transport changes (in-process call -> HTTP/gRPC).
