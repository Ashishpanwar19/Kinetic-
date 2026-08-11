# PulseNews AI — Environment Configuration

## 1. Overview

This document defines all environment variables required across the PulseNews AI platform. Environment variables are the single source of truth for configuration and must never be hardcoded in application code.

---

## 2. Environment Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env` | Local development | No (gitignored) |
| `.env.example` | Template for developers | Yes |
| `.env.production` | Production deployment | No (injected via CI/CD) |
| `.env.test` | Test environment | No (gitignored) |

---

## 3. Required Variables

### 3.1 AI / LLM

| Variable | Description | Required |
|----------|------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI generation (summaries, MCQs, tutor) | Yes |

### 3.2 Database — Supabase (PostgreSQL)

| Variable | Description | Required |
|----------|------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon/public key for client-side requests | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side privileged operations | Yes |
| `SUPABASE_DB_URL` | Direct PostgreSQL connection string for migrations | Yes |

### 3.3 Firebase

| Variable | Description | Required |
|----------|------------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_APP_ID` | Firebase app ID | Yes |
| `FIREBASE_API_KEY` | Firebase API key | Yes |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `FIREBASE_FIRESTORE_DB_ID` | Firestore database ID | Yes |

### 3.4 News APIs

| Variable | Description | Required |
|----------|------------|----------|
| `NEWSDATA_API_KEY` | NewsData.io API key for live news feeds | No (has fallback) |
| `GNEWS_API_KEY` | GNews API key for news search | No (has fallback) |

### 3.5 YouTube

| Variable | Description | Required |
|----------|------------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key for channel monitoring | No (future) |

### 3.6 Server

| Variable | Description | Default |
|----------|------------|---------|
| `PORT` | Server listening port | `3000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |

### 3.7 Redis (Future)

| Variable | Description | Required |
|----------|------------|----------|
| `REDIS_URL` | Redis connection string for queuing and caching | No (future) |

### 3.8 Neo4j (Future)

| Variable | Description | Required |
|----------|------------|----------|
| `NEO4J_URI` | Neo4j connection URI | No (future) |
| `NEO4J_USERNAME` | Neo4j username | No (future) |
| `NEO4J_PASSWORD` | Neo4j password | No (future) |

---

## 4. Current Environment

The following are pre-provisioned in the development environment:

- Supabase project: Provisioned (URL, anon key, service role key, DB URL available)
- Firebase project: `quaint-leaf-5xctm` (config in `firebase-applet-config.json`)
- Gemini API: Available via `GEMINI_API_KEY` (server-side)

---

## 5. Security Rules

1. **Never commit `.env` files** to version control
2. **Never expose service role keys** to the client-side code
3. **Never hardcode API keys** in source files — always read from `process.env`
4. **Rotate keys** if any credential is accidentally committed
5. **Use `.env.example`** as a template — it contains variable names with dummy values

---

## 6. `.env.example` Template

```bash
# AI / LLM
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://user:pass@host:5432/dbname

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_APP_ID=your_app_id
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_FIRESTORE_DB_ID=your_firestore_db_id

# News APIs (Optional — fallbacks exist)
NEWSDATA_API_KEY=your_newsdata_key
GNEWS_API_KEY=your_gnews_key

# YouTube (Future)
YOUTUBE_API_KEY=your_youtube_key

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# Redis (Future)
REDIS_URL=redis://localhost:6379

# Neo4j (Future)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
```
