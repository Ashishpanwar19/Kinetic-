# PulseNews AI — Deployment Topology & Infrastructure

## 1. Current Deployment (Development)

```
┌──────────────────────────────────────────────────────────┐
│                  DEVELOPMENT MACHINE                      │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐                    │
│  │  Vite Dev    │    │  Express +    │                   │
│  │  Server      │    │  Socket.io    │                   │
│  │  Port 3000   │    │  Port 3000    │                   │
│  │  (HMR)       │    │  (same proc)  │                   │
│  └─────────────┘    └──────────────┘                    │
│         │                    │                           │
│         └─────────┬──────────┘                          │
│                   │                                      │
│         ┌─────────▼──────────┐                          │
│         │  External Services  │                         │
│         │  - Supabase (cloud) │                         │
│         │  - Firestore (cloud)│                         │
│         │  - Gemini API       │                         │
│         │  - RSS feeds        │                         │
│         │  - NewsData.io      │                         │
│         └────────────────────┘                          │
└──────────────────────────────────────────────────────────┘
```

In development, Vite and Express run in a single `tsx server.ts` process. Vite middleware handles frontend asset serving, and Express handles API routes and Socket.io.

---

## 2. Docker Deployment (Staging/Production)

```
                    ┌─────────────────┐
                    │   Internet       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx (Port    │
                    │   80/443)        │
                    │   SSL term,      │
                    │   rate limit     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼───────┐  ┌──▼────────┐
     │ Frontend    │  │ Backend      │  │ Redis      │
     │ Container   │  │ Container    │  │ Container  │
     │ (Vite build │  │ (Express +   │  │ (Queue +   │
     │  served via │  │  Socket.io)  │  │  Cache)    │
     │  nginx)     │  │              │  │            │
     │ Port 3000   │  │ Port 3001    │  │ Port 6379  │
     └─────────────┘  └──────────────┘  └────────────┘
              │              │
              └──────────────┘
                    │
         ┌──────────▼──────────┐
         │  External Services   │
         │  - Supabase (cloud)  │
         │  - Firestore (cloud) │
         │  - Gemini API        │
         └─────────────────────┘
```

---

## 3. Docker Compose Services

### 3.1 Service Definitions

| Service | Image | Port | Depends On | Purpose |
|---------|-------|------|-----------|---------|
| `frontend` | Custom (Dockerfile.frontend) | 3000 | backend | React static build served via Vite preview |
| `backend` | Custom (Dockerfile.backend) | 3001 | redis | Express API + Socket.io server |
| `redis` | redis:7-alpine | 6379 | — | Task queue, cache, session store |
| `nginx` | nginx:alpine | 80, 443 | frontend, backend | Reverse proxy, SSL, rate limiting |
| `prometheus` | prom/prometheus | 9090 | backend | Metrics scraping (profile: monitoring) |
| `grafana` | grafana/grafana | 3002 | prometheus | Dashboards (profile: monitoring) |

### 3.2 Docker Network

All services are on a single bridge network (`pulsenews-net`). Services communicate by container name (e.g., `backend:3001`), not localhost.

### 3.3 Volume Mapping

| Volume | Service | Purpose |
|--------|---------|---------|
| `redis-data` | redis | Persist queue and cache across restarts |
| `grafana-data` | grafana | Persist dashboard configurations |
| `./src:/app/src` | frontend | Hot reload in development |
| `./server.ts:/app/server.ts` | backend | Hot reload in development |

---

## 4. Environment Configuration

### 4.1 Development

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `development` | docker-compose.yml |
| `PORT` | `3001` | docker-compose.yml |
| `GEMINI_API_KEY` | (from .env) | host environment |
| `SUPABASE_URL` | (from .env) | host environment |
| `SUPABASE_ANON_KEY` | (from .env) | host environment |
| `SUPABASE_SERVICE_ROLE_KEY` | (from .env) | host environment |

### 4.2 Production

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | CI/CD environment |
| `PORT` | `3001` | CI/CD environment |
| All secrets | (encrypted) | GitHub Actions secrets -> Docker env |

---

## 5. Nginx Configuration

### 5.1 Routing Rules

```
/location          /target           /method
─────────────────────────────────────────────
/api/              backend:3001      proxy_pass + WebSocket upgrade
/socket.io/        backend:3001      proxy_pass + WebSocket upgrade
/                  frontend:3000     proxy_pass + WebSocket upgrade (HMR)
```

### 5.2 SSL Configuration (Production)

```nginx
server {
    listen 443 ssl http2;
    server_name pulsenews.ai;

    ssl_certificate /etc/letsencrypt/live/pulsenews.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pulsenews.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... same location blocks as port 80
}

server {
    listen 80;
    server_name pulsenews.ai;
    return 301 https://$server_name$request_uri;
}
```

### 5.3 Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=ai:10m rate=2r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend_upstream;
}

location /api/ai/ {
    limit_req zone=ai burst=5 nodelay;
    proxy_pass http://backend_upstream;
}
```

---

## 6. Scaling Strategy

### 6.1 Vertical Scaling (First)

| Resource | Current | Scale When | Target |
|----------|---------|-----------|--------|
| CPU | 1 core | > 70% sustained 5 min | 2-4 cores |
| RAM | 512MB | > 80% usage | 1-2GB |
| Database | Supabase free | Connection pool exhausted | Supabase Pro |

### 6.2 Horizontal Scaling (When Vertical Is Insufficient)

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    │   (Nginx)        │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───┐  ┌──────▼───────┐  ┌──▼────────┐
     │ Backend 1   │  │ Backend 2    │  │ Backend 3 │
     │ (Express +  │  │ (Express +   │  │ (Express +│
     │  Socket.io) │  │  Socket.io)  │  │  Socket.io)│
     └─────────────┘  └──────────────┘  └────────────┘
              │              │              │
              └──────────────┼──────────────┘
                    │
           ┌────────▼────────┐
           │  Redis Adapter   │  (Socket.io multi-node)
           │  (Pub/Sub)       │
           └─────────────────┘
```

### 6.3 Database Scaling

| Database | Current | Scale Strategy |
|----------|---------|---------------|
| Supabase (PostgreSQL) | Managed free tier | Upgrade to Pro for connection pooling + read replicas |
| Firestore | Managed | Auto-scales by Google |
| Redis | Single container | Redis Cluster or managed Redis (Upstash) |
| Neo4j (future) | Single container | Neo4j Cluster (Causal Cluster) |

---

## 7. Monitoring & Observability

### 7.1 Metrics (Prometheus)

| Metric | Type | Labels | Source |
|--------|------|--------|--------|
| `http_requests_total` | Counter | method, path, status | Express middleware |
| `http_request_duration_seconds` | Histogram | method, path | Express middleware |
| `socket_connections_active` | Gauge | — | Socket.io server |
| `ai_requests_total` | Counter | agent, success | AI module |
| `ai_request_duration_seconds` | Histogram | agent | AI module |
| `ai_tokens_used_total` | Counter | agent, type (input/output) | AI module |
| `news_articles_collected_total` | Counter | source | News module |
| `redis_queue_depth` | Gauge | queue_name | Redis client |

### 7.2 Grafana Dashboards

| Dashboard | Panels |
|-----------|--------|
| API Overview | Request rate, latency p50/p95/p99, error rate |
| AI Pipeline | Requests by agent, success rate, token usage, cost estimate |
| Real-time | Active WebSocket connections, events/sec, broadcast latency |
| News Pipeline | Articles collected, dedup rate, processing latency |
| System Health | CPU, memory, disk, Redis memory, DB connections |

### 7.3 Alerting

| Alert | Condition | Severity |
|-------|-----------|----------|
| API error rate > 5% | 5 min window | Critical |
| AI failure rate > 20% | 5 min window | Warning |
| WebSocket connections < 1 | For 5 min | Info (dev only) |
| Redis memory > 80% | Sustained | Warning |
| Gemini API quota > 80% | Daily | Warning |

---

## 8. Backup & Disaster Recovery

### 8.1 Backup Strategy

| Data | Backup Method | Frequency | Retention |
|------|-------------|-----------|-----------|
| PostgreSQL (Supabase) | Supabase automated backups | Daily | 7 days (free) / 30 days (pro) |
| Firestore | Google Cloud export | Weekly | 4 weeks |
| Redis | RDB snapshot | Hourly | 24 snapshots |
| Docker volumes | Volume backup script | Daily | 7 days |
| Code | Git (GitHub) | Every push | Infinite |
| Prompts | Git (GitHub) | Every push | Infinite |

### 8.2 Recovery Procedures

| Scenario | RTO | RPO | Procedure |
|----------|-----|-----|-----------|
| Server crash | 5 min | 0 min | Docker auto-restart policy (`unless-stopped`) |
| Database failure | 30 min | 24 hrs | Restore from Supabase backup |
| Redis failure | 5 min | 1 hr | Restart container, rebuild cache from DB |
| AI API outage | 1 hr | 0 min | Circuit breaker pauses queue; resumes on recovery |
| Full region failure | 4 hrs | 24 hrs | Deploy to new region, restore DB backup |

### 8.3 Health Checks

| Endpoint | Check | Expected Response |
|----------|-------|------------------|
| `GET /api/system/status` | Server alive | `{ status: "ok", uptime: N }` |
| `GET /api/system/metrics` | Prometheus metrics | Prometheus format text |
| Docker healthcheck | Container alive | `HEALTHCHECK CMD curl -f http://localhost:3001/api/system/status` |

---

## 9. CI/CD Pipeline

### 9.1 Pipeline Stages

```
Git Push
    │
    ├──> Stage 1: Build
    │     - npm ci
    │     - npm run lint (TypeScript type check)
    │     - npm run build (Vite + esbuild)
    │
    ├──> Stage 2: Test (Volume 12+)
    │     - npm test (unit + integration)
    │     - npm run test:e2e (Playwright)
    │
    ├──> Stage 3: Docker Build
    │     - docker build -f infrastructure/docker/Dockerfile.frontend
    │     - docker build -f infrastructure/docker/Dockerfile.backend
    │     - Tag with git SHA + latest
    │
    ├──> Stage 4: Deploy (main branch only)
    │     - Push images to registry
    │     - SSH to production server
    │     - docker-compose pull && docker-compose up -d
    │     - Health check verification
    │
    └──> Stage 5: Notify
          - Slack/Discord notification with deploy status
```

### 9.2 Rollback Strategy

```
Deploy fails or causes issues:
    │
    ├──> Auto-rollback if health check fails after 60s
    │     - docker-compose down
    │     - docker tag pulsenews-backend:previous pulsenews-backend:latest
    │     - docker-compose up -d
    │
    └──> Manual rollback
          - git revert to previous commit
          - Re-run CI/CD pipeline
```
