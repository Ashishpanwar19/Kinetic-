# PulseNews AI — Microservices & Service Communication

## 1. Current Architecture: Modular Monolith

PulseNews AI currently runs as a **modular monolith** — a single Express process with clearly separated modules. Each module has a well-defined interface and could be extracted into a microservice when scaling demands it.

### Why Modular Monolith First?

| Factor | Microservice | Modular Monolith |
|--------|-------------|-------------------|
| Deployment complexity | High (N services, N deployments) | Low (1 deployment) |
| Network latency | Inter-service HTTP/gRPC calls | In-process function calls |
| Debugging | Distributed tracing required | Standard debugger works |
| Team size needed | 1+ team per service | 1 team can own all modules |
| Scale independently | Yes | No (until extracted) |
| Operational cost | High (monitoring per service) | Low |

For a team of 1-5 engineers building an MVP, the modular monolith is the correct choice. The architecture is designed so that extraction to microservices is a mechanical refactor, not a redesign.

---

## 2. Module Boundaries

### 2.1 Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (server.ts)                    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │  NewsModule  │  │  AIModule   │  │  UserModule         │     │
│  │              │  │             │  │                      │     │
│  │ - RSS fetch  │  │ - Summarize │  │ - Profile CRUD      │     │
│  │ - Article    │  │ - MCQ gen   │  │ - Bookmarks         │     │
│  │   extract    │  │ - Classify  │  │ - Quiz history      │     │
│  │ - Dedup      │  │ - NER       │  │ - Stats             │     │
│  │ - Search     │  │ - Tutor     │  │                      │     │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬──────────┘     │
│         │                 │                     │                │
│  ┌──────▼─────────────────▼─────────────────────▼──────────┐    │
│  │              SocketModule (Socket.io)                   │    │
│  │                                                          │    │
│  │  - news_update events (new/updated articles)            │    │
│  │  - stream_status events (live broadcast updates)        │    │
│  │  - breaking_news events (threshold-triggered)           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ DigestModule│  │ SystemModule│  │  AuthModule         │     │
│  │              │  │             │  │ (future — Vol 11)   │     │
│  │ - Daily      │  │ - Metrics   │  │ - Firebase token    │     │
│  │   compile    │  │ - Health    │  │   verification      │     │
│  │ - PDF gen    │  │ - Pipeline  │  │ - RBAC check        │     │
│  │              │  │   status    │  │                      │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Responsibilities

| Module | Owns | Does NOT Touch |
|--------|------|----------------|
| NewsModule | RSS fetching, article extraction, dedup, search | User data, AI generation |
| AIModule | Gemini API calls, summarization, MCQ, tutor | Database writes (returns data to caller) |
| UserModule | Profile, bookmarks, quiz history, stats | News collection, AI logic |
| SocketModule | WebSocket connections, event broadcasting | Business logic (only relays events) |
| DigestModule | PDF compilation, daily/weekly digests | Real-time events |
| SystemModule | Health checks, metrics, pipeline status | User data |
| AuthModule | Token verification, RBAC (future) | Business logic |

---

## 3. Event-Driven Architecture

### 3.1 Internal Event Bus

The system uses Node.js `EventEmitter` for in-process events. When a module needs to notify other modules, it emits an event rather than calling them directly.

```
NewsModule discovers new article
        │
        ├──> EventEmitter.emit('article:discovered', { article })
        │            │
        │            ├──> AIModule listens -> enqueues for AI processing
        │            ├──> SocketModule listens -> broadcasts to clients
        │            └──> DigestModule listens -> updates daily digest cache
        │
        └──> PostgreSQL INSERT
```

### 3.2 Event Catalog

| Event | Emitted By | Listened By | Payload |
|-------|-----------|-------------|---------|
| `article:discovered` | NewsModule | AIModule, SocketModule | `{ article: KnowledgeObject }` |
| `article:processed` | AIModule | SocketModule, DigestModule | `{ article: KnowledgeObject }` |
| `breaking:detected` | NewsModule | SocketModule, NotificationService | `{ articles: KnowledgeObject[] }` |
| `stream:status` | LiveHubPoller | SocketModule | `{ streams: LiveStreamUpdate[] }` |
| `quiz:submitted` | UserModule | DigestModule | `{ userId, score, total }` |
| `ai:failed` | AIModule | SystemModule | `{ error, articleId, agent }` |

### 3.3 Socket.io Event Flow

```
Server-side EventEmitter
        │
        ▼
  SocketModule translates internal events to Socket.io events
        │
        ├──> "news_update"     -> all connected clients
        ├──> "stream_status"   -> all connected clients
        ├──> "breaking_news"   -> all connected clients (future: room-based)
        └──> "quiz_result"     -> specific user (via socket.id)
```

---

## 4. Service Communication Patterns

### 4.1 Synchronous (Request-Response)

Used for user-initiated actions that need an immediate response.

```
Frontend ────HTTP POST──> Backend ───> Process ───> JSON Response
```

| Endpoint | Pattern | Timeout |
|----------|---------|---------|
| `GET /api/digest/today` | Cache-first (Redis), fallback DB | 5s |
| `POST /api/quiz/submit` | DB write + return score | 3s |
| `POST /api/ai/quick-take` | Gemini API call | 10s |
| `POST /api/ai/tutor` | Gemini API call + vector search | 10s |
| `POST /api/news/extract` | HTTP fetch + parse | 10s |
| `POST /api/news/batch-summarize` | N x Gemini calls (sequential) | 30s |

### 4.2 Asynchronous (Fire-and-Forget)

Used for background processing that doesn't need to block the response.

```
Frontend ────HTTP POST──> Backend ───> Enqueue task ───> 202 Accepted
                                            │
                                    Background worker processes
                                            │
                                    Socket.io pushes result
```

| Task | Trigger | Completion Signal |
|------|---------|-------------------|
| AI summarization | Article discovered | Socket.io `news_update` |
| MCQ generation | Article processed | Socket.io `news_update` |
| Breaking news detection | 3+ articles same topic | Socket.io `breaking_news` |
| PDF digest compilation | Scheduled (daily at 6AM) | Firestore write + notification |

### 4.3 Real-Time (Push)

Used for server-to-client updates without client polling.

```
Backend ────Socket.io emit──> All clients (or room)
```

| Event | Direction | Trigger |
|-------|-----------|---------|
| `news_update` | Server -> Client | New article or AI processing complete |
| `stream_status` | Server -> Client | Live stream viewer count update (every 10s) |
| `breaking_news` | Server -> Client | Breaking news threshold met |
| `client_ping` | Client -> Server | Heartbeat / connection test |

---

## 5. API Gateway Pattern

### Current (Single Server)

```
Nginx ───> Express (handles all routes)
```

### Future (Microservices)

```
Nginx ───> API Gateway (Express)
              ├──> /api/news/*     ──>  News Service
              ├──> /api/ai/*       ──>  AI Service
              ├──> /api/user/*     ──>  User Service
              ├──> /api/quiz/*     ──>  Quiz Service
              ├──> /api/digest/*   ──>  Digest Service
              └──> /api/system/*   ──>  System Service
```

### Gateway Responsibilities

| Responsibility | Current | Future |
|---------------|---------|--------|
| Routing | Nginx + Express | API Gateway service |
| Authentication | Firebase token check (middleware) | Gateway-level JWT validation |
| Rate limiting | Express middleware | Gateway-level Redis-backed limiter |
| Request logging | Express middleware | Gateway-level structured logging |
| CORS | Express middleware | Gateway-level CORS |
| Response caching | In-memory (server variable) | Redis cache at gateway |

---

## 6. Queue Architecture (Redis — Volume 3+)

### 6.1 Queue Design

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Producers    │────>│   Redis Queue   │────>│  Consumers   │
│               │     │                 │     │              │
│ NewsModule    │     │ ai:summarize    │     │ AI Worker 1  │
│ (on discover) │     │ ai:mcq          │     │ AI Worker 2  │
│               │     │ ai:classify     │     │ AI Worker 3  │
│ Scheduler     │     │ ai:ner          │     │              │
│ (cron)        │     │ ai:rank         │     │              │
│               │     │ digest:daily    │     │ Digest Worker│
└──────────────┘     └─────────────────┘     └──────────────┘
```

### 6.2 Queue Topics

| Queue | Producer | Consumer | Priority | Max Retries |
|-------|----------|----------|----------|-------------|
| `ai:summarize` | NewsModule | AI Worker | Normal | 3 |
| `ai:mcq` | NewsModule | AI Worker | Normal | 3 |
| `ai:classify` | NewsModule | AI Worker | Normal | 3 |
| `ai:ner` | NewsModule | AI Worker | Normal | 3 |
| `ai:rank` | NewsModule | AI Worker | Low | 2 |
| `ai:factcheck` | NewsModule | AI Worker | Low | 2 |
| `digest:daily` | Scheduler | Digest Worker | High | 1 |
| `digest:weekly` | Scheduler | Digest Worker | High | 1 |
| `breaking:detect` | NewsModule | Breaking News Worker | Critical | 5 |

### 6.3 Failure Handling

- **Retry with exponential backoff**: 1s, 4s, 16s, 64s
- **Dead letter queue**: After max retries, move to `dlq:<queue-name>`
- **Circuit breaker**: If Gemini API fails 5 times in 60s, pause queue for 5 min
- **Idempotency**: Each task has a unique `task_id` — reprocessing the same task is safe

---

## 7. Scheduler Architecture

### 7.1 Scheduled Tasks

| Task | Schedule | Purpose |
|------|----------|---------|
| RSS Feed Polling | Every 2-5 min | Collect new articles from all feeds |
| Government API Poll | Every 10 min | Check PIB, RBI, ISRO for new releases |
| Breaking News Check | Every 1 min | Scan for 3+ source clustering |
| Daily Digest Compile | 6:00 AM daily | Compile yesterday's articles into PDF |
| Weekly Digest | Sunday 8:00 AM | Compile weekly current affairs PDF |
| Cache Cleanup | Every 1 hour | Clear expired RSS cache entries |
| Analytics Aggregation | Every 15 min | Roll up user activity metrics |

### 7.2 Implementation

Current: `setInterval` in the Express process.

Future: BullMQ scheduler with Redis-backed cron:
```
Redis ───> BullMQ Repeatable Job ───> Worker picks up ───> Executes task
```

---

## 8. Future Microservice Extraction Plan

### When to Extract

| Signal | Threshold | Service to Extract |
|--------|-----------|-------------------|
| AI processing latency > 5s | 10% of requests | AI Service |
| News collection CPU > 70% | Sustained 5 min | News Collection Service |
| WebSocket connections > 10K | Concurrent | Socket.io Gateway Service |
| Database write contention | Lock wait > 100ms | Split by table ownership |

### Extraction Steps

1. **Extract interface** — Define the HTTP/gRPC contract the new service will expose
2. **Create service** — Copy module code into new service, implement contract
3. **Update callers** — Change in-process calls to HTTP/gRPC calls
4. **Deploy independently** — Separate Docker container, separate scaling
5. **Remove old code** — Delete module from monolith

### Service Extraction Order (by priority)

1. **AI Service** — Most CPU-intensive, benefits most from independent scaling
2. **News Collection Service** — I/O heavy, can scale horizontally per source
3. **Socket.io Gateway** — Needs sticky sessions and Redis adapter for scaling
4. **User Service** — Low traffic, extract last
5. **Digest Service** — Batch processing, extract for isolated failure domains
