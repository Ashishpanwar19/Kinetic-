# PulseNews AI — Volume 3: Database & Knowledge Layer

## Overview

This directory contains the complete database design for PulseNews AI. The platform uses a polyglot persistence strategy with PostgreSQL (Supabase) as the primary database, pgvector for semantic search, Firestore for user state, Redis for queuing (future), and Neo4j for the knowledge graph (future).

## Documents

| Document | Description |
|----------|------------|
| [DATABASE_DESIGN.md](DATABASE_DESIGN.md) | Full schema documentation, ER diagrams, table definitions, indexing strategy, RLS policies |

## Migrations

All migrations are applied via the Supabase MCP `apply_migration` tool. The following migrations have been applied:

| Migration | Tables Created | Purpose |
|-----------|---------------|---------|
| `create_core_content_tables` | sources, knowledge_objects, mcqs, entities | News article storage with AI-generated content |
| `create_user_tables` | user_bookmarks, quiz_submissions, user_profiles | User-scoped data with RLS ownership checks |
| `create_youtube_tables` | youtube_channels, live_streams | YouTube channel registry and live stream monitoring |
| `create_analytics_tables` | article_views, search_logs, ai_usage_logs | Usage tracking and AI cost monitoring |
| `enable_pgvector_embeddings` | (alter knowledge_objects) | Semantic search vector column for RAG |
| `seed_sample_data` | (data insert) | Sample knowledge objects and sources for development |

## Database Summary

| Database | Role | Volume |
|----------|------|--------|
| PostgreSQL (Supabase) | Primary relational store — articles, users, quizzes, analytics | Volume 3 |
| pgvector (Supabase extension) | Vector embeddings for semantic search and RAG | Volume 3 |
| Firestore (Firebase) | User profiles, chat history, bookmarks (synced) | Volume 11 |
| Redis | Task queues, caching, rate limiting | Future |
| Neo4j | Knowledge graph entities and relationships | Volume 8 |

## Milestone Output

- All PostgreSQL tables created with RLS enabled
- pgvector enabled for semantic search
- Seed data available for development
- Shared TypeScript types for database entities
- Ready for Volume 4: Backend Platform
