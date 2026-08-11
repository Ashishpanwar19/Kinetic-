# PulseNews AI — AI Pipeline & Intelligence Architecture

## 1. AI Pipeline Overview

The AI pipeline transforms raw news articles into structured Knowledge Objects through a series of AI agent steps. Each step is designed to be independent, retryable, and idempotent.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Summarize│──>│   NER    │──>│ Classify │──>│   Rank   │──>│  MCQ Gen │
│  (Quick   │    │(Entities)│    │(Category)│    │(Importance│   │(Questions)│
│   Take)   │    │          │    │          │    │ 1-100)   │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
      │               │               │               │               │
      └───────────────┴───────────────┴───────────────┴───────────────┘
                                    │
                              ┌─────▼─────┐
                              │  Store +  │
                              │  Broadcast│
                              └───────────┘
```

---

## 2. AI Agent Specifications

### 2.1 Summarizer (Quick Take Generator)

| Property | Value |
|----------|-------|
| Model | Gemini Flash |
| Input | Article headline + body text (truncated to 8000 tokens) |
| Output | 3 bullet points, each max 25 words |
| Temperature | 0.3 (factual, low creativity) |
| Max tokens | 200 |
| Timeout | 10s |
| Retry | 3 attempts with exponential backoff |

**System Prompt (stored in `prompts/ai-agents/summarizer.md`):**

```
You are an expert news analyst for competitive exam candidates.
Extract the 3 most important facts from the following news article.
Each fact must be:
- A single bullet point, maximum 25 words
- Factual and verifiable from the article
- Relevant for UPSC/SSC/banking exam preparation
Return as JSON: { "quick_take": ["fact1", "fact2", "fact3"] }
```

### 2.2 NER (Named Entity Recognition)

| Property | Value |
|----------|-------|
| Model | Gemini Flash |
| Input | Article headline + body text |
| Output | Array of entity strings |
| Temperature | 0.1 (deterministic) |
| Max tokens | 200 |
| Timeout | 10s |

**Output format:**

```json
{
  "entities": ["RBI", "Shaktikanta Das", "Monetary Policy Committee", "repo rate"]
}
```

### 2.3 Classifier

| Property | Value |
|----------|-------|
| Model | Gemini Flash |
| Input | Headline + first 500 chars of body |
| Output | Single category from predefined list |
| Temperature | 0.0 |
| Max tokens | 10 |
| Timeout | 5s |

**Categories:**

```
Polity | Economy | Science | Technology | International |
Sports | Local | Environment | Defense | Health |
Education | Agriculture | Heritage | Cricket
```

### 2.4 Importance Ranker

| Property | Value |
|----------|-------|
| Model | Gemini Flash |
| Input | Headline + summary + category |
| Output | Integer 1-100 |
| Temperature | 0.2 |
| Max tokens | 10 |
| Timeout | 5s |

**Scoring rubric:**

| Score Range | Meaning |
|-------------|---------|
| 90-100 | Must-know for prelims — policy changes, Supreme Court rulings, major treaties |
| 70-89 | Important for mains — economic data, scientific breakthroughs, geopolitical shifts |
| 50-69 | Good to know — minor policy updates, sports results, local infrastructure |
| 30-49 | Awareness level — cultural events, awards, appointments |
| 1-29 | Low priority — entertainment, lifestyle, weather |

### 2.5 MCQ Generator

| Property | Value |
|----------|-------|
| Model | Gemini Flash |
| Input | Article body + headline + category |
| Output | 2-5 MCQs with 4 options, correct answer index, explanation |
| Temperature | 0.4 (slightly creative for distractors) |
| Max tokens | 800 |
| Timeout | 15s |

**Output format:**

```json
{
  "mcqs": [
    {
      "id": "mcq-auto-1",
      "question": "What was the RBI's recent repo rate decision?",
      "options": [
        "Increased by 25 basis points to 6.75%",
        "Decreased by 50 basis points to 6.00%",
        "Maintained at 6.50%",
        "Increased by 50 basis points to 7.00%"
      ],
      "correct_index": 2,
      "explanation": "The Monetary Policy Committee voted to maintain the repo rate at 6.50% citing inflation concerns."
    }
  ]
}
```

### 2.6 Fact Checker (Future — Volume 8)

| Property | Value |
|----------|-------|
| Model | Gemini Pro (higher accuracy) |
| Input | Article + 3 cross-source articles on same topic |
| Output | Verification score 0-100 + list of conflicting facts |
| Temperature | 0.0 |
| Timeout | 20s |

### 2.7 AI Tutor (RAG)

See section 4 below for full RAG architecture.

---

## 3. Pipeline Execution

### 3.1 Sequential Processing

Articles are processed sequentially through the pipeline to minimize Gemini API concurrency:

```
Article discovered
    │
    ├──> Step 1: Summarize (10s timeout)
    │       ├──> Success: store quick_take, continue
    │       └──> Failure: log error, continue with empty quick_take
    │
    ├──> Step 2: NER Extract (10s timeout)
    │       ├──> Success: store entities, continue
    │       └──> Failure: log error, continue with empty entities
    │
    ├──> Step 3: Classify (5s timeout)
    │       ├──> Success: store category, continue
    │       └──> Failure: default to "General"
    │
    ├──> Step 4: Rank (5s timeout)
    │       ├──> Success: store exam_importance, continue
    │       └──> Failure: default to 50
    │
    ├──> Step 5: MCQ Generate (15s timeout)
    │       ├──> Success: store mcqs, broadcast update
    │       └──> Failure: log error, article has no MCQs
    │
    └──> Broadcast: Socket.io "news_update" with fully processed article
```

### 3.2 Failure Strategy

- Each step is independent — failure in one step does not block others
- Default values are assigned for missing fields (category="General", importance=50)
- Failed steps are logged with article ID for manual review
- After 3 consecutive AI failures for the same article, the article is marked `ai_failed=true`
- Admins can trigger reprocessing from the System Architecture dashboard

### 3.3 Cost Optimization

| Strategy | Implementation |
|----------|---------------|
| Batch summarization | Process articles in batches of 5 when queue depth > 20 |
| Cache by content hash | Skip AI processing if article content hash matches existing KO |
| Rate limiting | Max 10 concurrent Gemini API calls |
| Model selection | Use Flash for all steps; Pro only for fact-checking |
| Token budget | Truncate input to 8000 tokens max per article |

---

## 4. RAG Architecture (AI Tutor)

### 4.1 RAG Pipeline

```
User sends message: "What happened at the RBI monetary policy meeting?"
    │
    ▼
┌────────────────────┐
│  1. Query Embedding │  text-embedding-004
│  Convert question    │  Output: 768-dim float vector
│  to vector           │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│  2. Vector Search   │  pgvector cosine similarity
│  Find top-K=5       │  Query: SELECT * FROM knowledge_objects
│  relevant articles  │  ORDER BY embedding <=> $query_vector
│                     │  LIMIT 5
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│  3. Context Assembly│  Build system prompt with:
│                     │  - Retrieved article summaries
│  - Article 1 summary│  - User's question
│  - Article 2 summary│  - Chat history (last 5 turns)
│  - Article 3 summary│  - Tutor system instructions
│  - ...              │
│  - Chat history     │
│  - User question    │
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│  4. LLM Generation  │  Gemini Flash
│  Generate answer    │  Temperature: 0.3
│  with citations     │  Max tokens: 500
└──────────┬─────────┘
           │
           ▼
┌────────────────────┐
│  5. Response        │  Return answer + source article titles
│  Answer + Sources   │  Persist conversation to Firestore
└────────────────────┘
```

### 4.2 Embedding Strategy

| Element | Embedding Model | Dimensions | Stored In |
|---------|----------------|------------|-----------|
| Knowledge Object summary | text-embedding-004 | 768 | pgvector column |
| User query (tutor) | text-embedding-004 | 768 | Computed at query time |
| MCQ questions (future) | text-embedding-004 | 768 | pgvector column |

### 4.3 Context Window Management

| Conversation Length | Strategy |
|---------------------|----------|
| 1-5 turns | Include full chat history in prompt |
| 6-15 turns | Include last 5 turns + summary of earlier turns |
| 16+ turns | Include last 5 turns + AI-generated conversation summary |

### 4.4 Tutor System Prompt

```
You are PulseNews AI Tutor, an expert mentor for competitive exam candidates.
Answer questions about current affairs using the provided context articles.
Rules:
- Only use facts from the provided context. If the context doesn't contain
  the answer, say "I don't have enough information about that yet."
- Cite source articles by name when stating facts.
- Keep answers concise (max 150 words) unless the user asks for detail.
- Suggest 2-3 follow-up questions at the end.
- If the user asks about a specific exam (UPSC, SSC, banking), tailor
  the answer to that exam's syllabus perspective.
```

---

## 5. AI Cost Tracking

### 5.1 Per-Request Metrics

Every Gemini API call logs:

```typescript
{
  agent: "summarizer" | "mcq_generator" | "classifier" | ...,
  article_id: string,
  input_tokens: number,
  output_tokens: number,
  latency_ms: number,
  success: boolean,
  model: "gemini-flash" | "gemini-pro",
  timestamp: ISO 8601
}
```

### 5.2 Daily Cost Dashboard (Future — Volume 14)

| Metric | Display |
|--------|---------|
| Total Gemini calls today | Counter |
| Total tokens consumed | Counter |
| Estimated cost (INR) | Calculated from pricing |
| Calls by agent type | Bar chart |
| Success rate | Percentage |
| Average latency | Line chart |
| Cost per article | Derived metric |

---

## 6. Prompt Management

### 6.1 Version Control

All prompts are stored in `prompts/ai-agents/` and `prompts/templates/` as markdown files. Each file contains:

```markdown
# Agent: Summarizer
# Version: 1.0
# Last updated: 2026-08-11

## System Prompt

[Full prompt text]

## Parameters

- temperature: 0.3
- max_tokens: 200
- timeout: 10s

## Output Schema

{ "quick_take": ["string", "string", "string"] }
```

### 6.2 Prompt Loading

Prompts are loaded at server startup and cached. Hot-reload is supported in development mode:

```typescript
import { readFileSync } from 'fs';

const loadPrompt = (path: string): string => {
  return readFileSync(`prompts/ai-agents/${path}`, 'utf-8');
};

const SUMMARIZER_PROMPT = loadPrompt('summarizer.md');
```

### 6.3 A/B Testing (Future)

| Feature | Implementation |
|---------|---------------|
| Prompt variants | Store as `summarizer.v1.md`, `summarizer.v2.md` |
| Traffic split | 90% v1, 10% v2 |
| Success metric | MCQ accuracy improvement, user engagement |
| Rollback | Switch active version in config, no code deploy needed |
