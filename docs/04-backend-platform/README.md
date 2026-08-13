# Volume 4 — Backend Platform

## Overview

This volume transforms the PulseNews AI backend from an in-memory prototype into a production-ready server platform with database persistence, authentication, rate limiting, structured logging, and background task scheduling.

## What's Inside

| Document | Description |
|----------|-------------|
| [BACKEND.md](./BACKEND.md) | Complete API reference, architecture, and integration guide |

## Key Changes

1. **Supabase Database Integration** — All major endpoints (digest, article detail, quiz, bookmarks, user profile, system metrics) now read from and write to Supabase with automatic fallback to in-memory storage when the database is unavailable.

2. **Authentication Middleware** — Firebase JWT token verification with three middleware levels: `requireAuth` (mandatory), `requireAdmin` (role-gated), `optionalAuth` (progressive enhancement).

3. **Rate Limiting** — Per-IP and per-user rate limiting with configurable windows. AI endpoints are capped at 10 requests/minute; general API at 100/minute.

4. **Structured Request Logging** — Every HTTP request is logged with timestamp, method, path, status, duration, IP, and user ID. AI usage is logged separately.

5. **Background Task Scheduler** — A pluggable task registration system runs periodic background jobs (stream status broadcasts, future RSS polling) with graceful startup and shutdown.

## New Server Modules

```
server/
├── lib/
│   ├── supabaseClient.ts       — Server-side Supabase clients (admin + anon)
│   ├── supabaseDataService.ts  — Database queries for all endpoint types
│   ├── authMiddleware.ts       — Firebase JWT verification + role gating
│   ├── rateLimiter.ts          — In-memory sliding-window rate limiter
│   ├── logger.ts               — Structured request + AI usage logger
│   └── scheduler.ts            — Background task registration and execution
├── openNewsEngine.ts           — RSS fetching and article extraction (unchanged)
└── userStore.ts                — File-based user store (fallback only)
```

## Environment Variables

The following must be set for full database integration:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key (bypasses RLS) |
| `SUPABASE_ANON_KEY` | Client-side anon key (respects RLS) |

When these are missing, the server falls back to in-memory storage and logs a warning.
