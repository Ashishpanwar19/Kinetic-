# Volume 8 — AI Knowledge Engine

## Overview

The AI Knowledge Engine transforms raw news articles into structured, queryable knowledge. It runs as a scheduled background pipeline that processes articles fetched by the RSS ingestion engine (Volume 6), extracting named entities, building a knowledge graph of entity relationships, fact-checking claims against cross-source data, generating event timelines, detecting duplicate coverage, and flagging breaking news.

## Architecture

```
knowledge_objects (from Volume 6 RSS ingestion)
     │
     ▼
 aiKnowledgeEngine.ts (runKnowledgeEnginePipeline)
     │
     ├─ NER + Knowledge Graph Builder
     │   ├─ extractEntitiesAndRelations() — Gemini extracts entities + relationships
     │   ├─ upsertEntityNode() — deduplicate and increment mention counts
     │   ├─ upsertEntityRelation() — create/weight directed edges
     │   └─ linkArticleToEntity() — junction table mapping
     │
     ├─ Fact Checker
     │   ├─ Cross-reference against similar articles in DB
     │   ├─ Gemini evaluates verification status + confidence
     │   └─ Persist to fact_checks table
     │
     ├─ Timeline Builder
     │   ├─ Group articles by category
     │   ├─ Gemini generates chronological events
     │   └─ Persist to timelines table
     │
     ├─ Duplicate Detector
     │   ├─ Fuzzy title similarity (Jaccard on significant words)
     │   ├─ Group articles covering same event
     │   └─ Persist to duplicate_groups table
     │
     └─ Breaking News Detector
         ├─ Keyword scan ("breaking", "urgent", "alert")
         ├─ Entity-cluster detection (3+ sources in 30 min)
         └─ Set is_breaking flag on knowledge_objects
```

## Components

### 1. AI Knowledge Engine (`server/lib/aiKnowledgeEngine.ts`)

Core pipeline module with these exports:

- **`runKnowledgeEnginePipeline(options?)`** — Orchestrates the full pipeline:
  1. Fetches unprocessed articles (not yet linked to entities)
  2. Runs NER + knowledge graph building for each article
  3. Runs fact-checking against cross-source articles
  4. Builds timelines for top categories
  5. Detects duplicate article groups
  6. Detects breaking news (keyword + multi-source threshold)
  7. Returns `KnowledgeEngineResult` with all counts

- **`fetchKnowledgeGraphData(limit)`** — Returns nodes and links for the graph visualization
- **`fetchTimeline(topic)`** — Returns chronological events for a topic
- **`fetchTimelineTopics()`** — Lists all topics with timelines
- **`fetchFactCheck(koId)`** — Returns fact-check result for an article
- **`fetchDuplicateGroups(limit)`** — Returns detected duplicate groups

### 2. AI Agents

| Agent | Input | Output | Model |
|-------|-------|--------|-------|
| NER Extractor | Article headline + summary | Entity list with types + relationships | Gemini 2.5 Flash |
| Knowledge Graph Builder | Entities + relationships | entity_nodes + entity_relations tables | — |
| Fact Checker | Article + cross-source articles | Verification status, confidence, conflicting sources | Gemini 2.5 Flash |
| Timeline Builder | Topic + related articles | Chronological event list | Gemini 2.5 Flash |
| Duplicate Detector | Article headlines (last 100) | Duplicate groups (fuzzy title match, threshold 0.65) | — (algorithmic) |
| Breaking News Detector | Recent articles (30 min window) | is_breaking flag (keyword + 3+ source threshold) | — (algorithmic) |

### 3. Scheduled Processing (`server/lib/scheduler.ts`)

- **`registerKnowledgeEngine(io)`** — Runs the knowledge engine every 45 minutes
- Broadcasts `breaking_news` WebSocket event when breaking news is detected
- Processes up to 10 articles per run

### 4. API Endpoints (`server.ts`)

| Endpoint | Method | Description |
|---|---|---|
| `/api/knowledge-graph` | GET | Real knowledge graph nodes + links from database |
| `/api/knowledge/timeline` | GET | Timeline events for a topic (?topic=X) or list all topics |
| `/api/knowledge/fact-check/:koId` | GET | Fact-check result for a specific article |
| `/api/knowledge/duplicates` | GET | Detected duplicate article groups |
| `/api/knowledge/process` | POST | Manually trigger the knowledge engine pipeline |

### 5. Database Tables

#### entity_nodes
Unique named entities (people, orgs, locations, policies, events) deduplicated by normalized name + type. Tracks mention count and first-seen date.

#### entity_relations
Directed relationships between entities (e.g., RBI -> CONVENES -> MPC). Weighted by how many articles reinforce the relationship. Unique on (source, target, relationship).

#### ko_entities
Junction table linking articles to canonical entity nodes for graph traversal.

#### timelines
AI-generated chronological event timelines per topic, with event date, title, and description.

#### fact_checks
Cross-source verification results: status (verified/partially_verified/unverified/conflicting), confidence score, corroborating source count, conflicting source names.

#### duplicate_groups
Groups of articles covering the same news event, with similarity score and detection method.

## Frontend Integration

The Knowledge Graph Explorer view (`KnowledgeGraphView.tsx`) now:
- Fetches real entity nodes and relationships from the database
- Displays live node count (instead of hardcoded "890")
- Shows entity type color-coding (Organization, Policy, Event, Person)
- Includes an AI Event Timeline section with topic tabs and chronological event display

## Configuration

- **Pipeline interval**: 45 minutes (configurable in `scheduler.ts`)
- **Max articles per run**: 10 (configurable via `max_articles` parameter)
- **Duplicate detection threshold**: 0.65 Jaccard similarity on significant title words
- **Breaking news threshold**: 3+ sources mentioning same entity within 30 minutes, or breaking keywords in headline
- **AI model**: Gemini 2.5 Flash with structured JSON schema responses
- **Fact check scope**: 5 most similar articles by headline match

## Error Handling

- Each article is processed independently — one failure doesn't stop the pipeline
- AI agent failures are caught and logged, pipeline continues with next article
- All errors are collected in the `KnowledgeEngineResult.errors` array
- Entity upserts use idempotent operations (ilike match + insert if not found)
