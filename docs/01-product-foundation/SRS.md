# PulseNews AI — Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for PulseNews AI, an AI-powered news intelligence and educational knowledge platform. It serves as the authoritative requirements reference for all 15 development volumes.

### 1.2 Scope

PulseNews AI collects, processes, and transforms real-time news from trusted sources into exam-ready educational content. The system encompasses news collection pipelines, AI processing agents, a knowledge graph, educational content generation, a conversational AI tutor, and a modern frontend with short-video feeds and live broadcast integration.

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| Knowledge Object | A structured news item with headline, summary, quick-take bullets, MCQs, entities, and exam importance score |
| Quick Take | A 3-bullet-point distillation of a news article's key facts |
| Exam Importance | A score from 1-100 indicating relevance to competitive exams |
| Breaking News | An event reported by 3+ independent sources within a 30-minute window |
| Knowledge Graph | A Neo4j graph database mapping entities (people, organizations, policies, events) and their relationships |
| RAG | Retrieval-Augmented Generation — combining vector search with LLM generation |
| QC Gate | Human review queue for AI-generated content before publication |
| Digest | A compiled PDF of daily/weekly current affairs with MCQs |

---

## 2. Functional Requirements

### 2.1 News Collection

| ID | Requirement | Priority |
|----|------------|----------|
| FR-1.1 | The system shall collect news articles from RSS feeds every 2-5 minutes | High |
| FR-1.2 | The system shall integrate government press release sources (PIB, RBI, ISRO) | High |
| FR-1.3 | The system shall collect news from NewsData.io and GNews APIs | Medium |
| FR-1.4 | The system shall deduplicate articles by normalized URL | High |
| FR-1.5 | The system shall perform fuzzy title matching to detect near-duplicate articles | Medium |
| FR-1.6 | The system shall cache RSS feed results for 24 hours to reduce API calls | High |
| FR-1.7 | The system shall extract article body text, authors, publish date, and images from raw HTML | High |
| FR-1.8 | The system shall support batch URL fetch and summarize operations | Medium |

### 2.2 YouTube Intelligence

| ID | Requirement | Priority |
|----|------------|----------|
| FR-2.1 | The system shall maintain a registry of official YouTube news channels | High |
| FR-2.2 | The system shall detect live streams from monitored channels | High |
| FR-2.3 | The system shall embed YouTube videos using the official iframe API (no downloading) | High |
| FR-2.4 | The system shall detect and categorize YouTube Shorts | Medium |
| FR-2.5 | The system shall collect video metadata (title, description, thumbnail, publish date) | High |
| FR-2.6 | The system shall retrieve transcripts where available and permitted | Low |

### 2.3 AI Processing

| ID | Requirement | Priority |
|----|------------|----------|
| FR-3.1 | The system shall generate a 3-bullet quick take summary for each article using Gemini | High |
| FR-3.2 | The system shall perform Named Entity Recognition (NER) to extract people, organizations, and locations | High |
| FR-3.3 | The system shall classify each article into exam categories (Polity, Economy, Science, etc.) | High |
| FR-3.4 | The system shall assign an exam importance score (1-100) to each article | High |
| FR-3.5 | The system shall detect breaking news when 3+ sources report the same event within 30 minutes | Medium |
| FR-3.6 | The system shall cross-verify facts across multiple sources and assign a verification score | Medium |
| FR-3.7 | The system shall detect and merge duplicate articles covering the same event | High |

### 2.4 Knowledge Engine

| ID | Requirement | Priority |
|----|------------|----------|
| FR-4.1 | The system shall create Knowledge Objects from processed articles | High |
| FR-4.2 | The system shall build entity relationships in a Neo4j knowledge graph | Medium |
| FR-4.3 | The system shall generate vector embeddings for semantic search (pgvector) | High |
| FR-4.4 | The system shall build timelines of related events for ongoing stories | Medium |
| FR-4.5 | The system shall support semantic search across all knowledge objects | High |

### 2.5 Educational Content Generation

| ID | Requirement | Priority |
|----|------------|----------|
| FR-5.1 | The system shall generate MCQs (with 4 options, correct answer, and explanation) for each article | High |
| FR-5.2 | The system shall generate flashcards for key facts | Medium |
| FR-5.3 | The system shall compile daily PDF digests with all processed articles and MCQs | High |
| FR-5.4 | The system shall generate weekly and monthly compilation PDFs | Medium |
| FR-5.5 | The system shall generate AI-powered quick takes on any user-specified topic | High |
| FR-5.6 | The system shall generate one-liner revision notes | Medium |

### 2.6 AI Tutor

| ID | Requirement | Priority |
|----|------------|----------|
| FR-6.1 | The system shall provide a conversational AI tutor using RAG | High |
| FR-6.2 | The tutor shall use vector search to retrieve relevant knowledge objects | High |
| FR-6.3 | The tutor shall maintain multi-turn conversation context | High |
| FR-6.4 | The tutor shall persist chat history per user in Firestore | High |
| FR-6.5 | The tutor shall support exam-specific modes (UPSC, SSC, banking) | Medium |
| FR-6.6 | The tutor shall suggest follow-up questions | Low |

### 2.7 User Features

| ID | Requirement | Priority |
|----|------------|----------|
| FR-7.1 | Users shall authenticate via Google OAuth (Firebase Auth) | High |
| FR-7.2 | Users shall bookmark articles for later review | High |
| FR-7.3 | Users shall take MCQ quizzes and receive scored results | High |
| FR-7.4 | Users shall view quiz history and accuracy statistics | High |
| FR-7.5 | Users shall download PDF digests | High |
| FR-7.6 | Users shall like, comment, and share articles | Medium |
| FR-7.7 | Users shall receive push notifications for breaking news | Medium |
| FR-7.8 | Users shall filter the feed by category (Trending, For You, Local) | High |

### 2.8 Real-Time Features

| ID | Requirement | Priority |
|----|------------|----------|
| FR-8.1 | The system shall push new articles to connected clients via WebSocket (Socket.io) | High |
| FR-8.2 | The system shall broadcast live stream status updates via WebSocket | High |
| FR-8.3 | The system shall show a real-time connection status indicator | Medium |
| FR-8.4 | The system shall display a scrolling news ticker with latest headlines | Medium |

### 2.9 Administration

| ID | Requirement | Priority |
|----|------------|----------|
| FR-9.1 | Admins shall view a QC review queue of unreviewed AI-generated articles | High |
| FR-9.2 | Admins shall approve or reject articles in the QC queue | High |
| FR-9.3 | Admins shall trigger manual news ingestion pipeline runs | Medium |
| FR-9.4 | Admins shall view system metrics (active pollers, queue depth, processing latency) | High |
| FR-9.5 | Admins shall manage users (view, suspend, role assignment) | Medium |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-1.1 | Page load time (initial) | < 2 seconds |
| NFR-1.2 | API response time (cached) | < 100ms |
| NFR-1.3 | API response time (AI generation) | < 5 seconds |
| NFR-1.4 | WebSocket event propagation | < 500ms |
| NFR-1.5 | News ingestion latency (source to feed) | < 10 minutes |
| NFR-1.6 | Concurrent users supported | 10,000 |
| NFR-1.7 | Video feed auto-play start time | < 1 second |

### 3.2 Scalability

| ID | Requirement |
|----|------------|
| NFR-2.1 | The system shall horizontally scale backend services via Docker |
| NFR-2.2 | The system shall use Redis for session caching and task queuing |
| NFR-2.3 | The system shall support 50,000 DAU without architecture changes |
| NFR-2.4 | Database queries shall be indexed for sub-100ms response at 1M+ rows |

### 3.3 Reliability

| ID | Requirement |
|----|------------|
| NFR-3.1 | System uptime shall be 99.9% (8.76 hours downtime/year max) |
| NFR-3.2 | The system shall gracefully degrade when external APIs are unavailable |
| NFR-3.3 | RSS feed failures shall not cascade — each feed is independent |
| NFR-3.4 | The system shall retry failed AI operations with exponential backoff |

### 3.4 Security

| ID | Requirement |
|----|------------|
| NFR-4.1 | All API endpoints shall require authentication (except public feed) |
| NFR-4.2 | User data shall be isolated — users can only access their own bookmarks, history, and chats |
| NFR-4.3 | API keys and secrets shall never be exposed to the client |
| NFR-4.4 | The system shall implement rate limiting (100 requests/minute per user) |
| NFR-4.5 | All passwords/secrets shall be encrypted at rest |
| NFR-4.6 | The system shall mitigate OWASP Top 10 vulnerabilities |

### 3.5 Usability

| ID | Requirement |
|----|------------|
| NFR-5.1 | The interface shall be mobile-first with a vertical video feed as the primary screen |
| NFR-5.2 | The system shall be usable on screens 360px to 2560px wide |
| NFR-5.3 | Color contrast shall meet WCAG AA standards (4.5:1 for body text) |
| NFR-5.4 | All interactive elements shall have visible hover and active states |
| NFR-5.5 | The system shall provide toast notifications for user actions |

### 3.6 Maintainability

| ID | Requirement |
|----|------------|
| NFR-6.1 | Code shall follow the coding standards defined in CODING_STANDARDS.md |
| NFR-6.2 | All code shall be typed (TypeScript) with no implicit any |
| NFR-6.3 | Each module shall have a single clear responsibility |
| NFR-6.4 | Documentation shall be updated alongside code changes |
| NFR-6.5 | The system shall use semantic versioning |

### 3.7 Observability

| ID | Requirement |
|----|------------|
| NFR-7.1 | All API requests shall be logged with timestamp, user ID, and response code |
| NFR-7.2 | AI pipeline operations shall log input, output, latency, and token usage |
| NFR-7.3 | System metrics shall be exposed for Prometheus scraping |
| NFR-7.4 | Error rates shall be monitored and alerted at > 5% |
