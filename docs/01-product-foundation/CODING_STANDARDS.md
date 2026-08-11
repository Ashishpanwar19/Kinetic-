# PulseNews AI — Coding Standards & Development Guidelines

## 1. Repository Structure

```
PulseNews-AI/
├── docs/                 # Documentation organized by volume
├── frontend/             # React + Vite frontend
├── backend/              # Express + Socket.io server
├── ai-services/          # AI agent prompts and pipelines
├── shared/               # Shared types and utilities
├── database/             # Migrations and schemas
├── infrastructure/       # Docker, Nginx, network config
├── scripts/              # Automation scripts
├── tests/                # Integration and E2E tests
├── prompts/              # AI agent prompts and templates
├── .github/workflows/    # CI/CD pipelines
└── docker-compose.yml    # Multi-service orchestration
```

---

## 2. Naming Conventions

### 2.1 Files and Folders

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase | `FeedView.tsx` |
| Hooks | camelCase with `use` prefix | `useSocket.ts` |
| Services | camelCase | `newsDataService.ts` |
| Types | camelCase | `types.ts` |
| CSS files | camelCase | `index.css` |
| Config files | camelCase or dotfile | `vite.config.ts`, `.env` |
| Documentation | UPPER_SNAKE | `CODING_STANDARDS.md` |
| Directories | lowercase kebab | `ai-services/`, `01-product-foundation/` |

### 2.2 Code Identifiers

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `FeedView`, `VideoPlayer` |
| Functions | camelCase | `handleSelectItem`, `fetchNewsFromApi` |
| Variables | camelCase | `currentTab`, `knowledgeObjects` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `CACHE_TTL_MS` |
| Types/Interfaces | PascalCase | `KnowledgeObject`, `LiveStreamItem` |
| Enum values | PascalCase | `TabType.Feed` |

### 2.3 Database

| Type | Convention | Example |
|------|-----------|---------|
| Tables | snake_case, plural | `knowledge_objects`, `users` |
| Columns | snake_case | `source_url`, `published_at` |
| Indexes | `idx_table_column` | `idx_articles_published_at` |
| Policies | `verb_own_table` | `select_own_todos` |

---

## 3. TypeScript Standards

### 3.1 Type Safety

- Every function parameter must have an explicit type
- No implicit `any` — use `unknown` and narrow if needed
- Enable strict mode in `tsconfig.json`
- Prefer interfaces for object shapes, type aliases for unions

### 3.2 Import Discipline

- Every symbol referenced must have a matching import at the top of the file
- No circular imports
- Group imports: external libraries, internal modules, types
- Use named exports, not default exports (except for page-level components)

### 3.3 Error Handling

- Check API responses before using the data
- Handle error and empty cases explicitly
- Surface visible error states to the user (toast, error banner)
- Never let undefined or malformed values reach the screen
- Log errors with context (function name, input summary)

---

## 4. Component Standards

### 4.1 Structure

Each component file should follow this order:
1. Imports
2. Interfaces / Types
3. Component definition
4. Helper functions (if any)

### 4.2 Props

- All props must be typed with an interface
- Optional props use `?` and must have a default or null check
- Callback props are prefixed with `on`: `onSelectItem`, `onToggleSave`

### 4.3 State

- Use `useState` for local component state
- Use `useRef` for mutable values that don't trigger re-renders
- Use Context for cross-tree shared state (e.g., auth)
- Avoid prop drilling beyond 2 levels — use Context or composition

### 4.4 Comments

- Default to writing no comments
- Only add a comment when the WHY is non-obvious
- Never write comments that explain WHAT the code does
- Never reference the current task or PR in comments

---

## 5. Git Branch Strategy

### 5.1 Branch Model

```
main              <- Production-ready, deployable
├── develop       <- Integration branch for the next release
├── feature/vN-*  <- Feature branches (e.g., feature/v6-rss-pipeline)
├── fix/*         <- Bug fix branches
└── hotfix/*      <- Urgent production fixes
```

### 5.2 Branch Naming

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/vN-description` | `feature/v3-postgres-migrations` |
| Bug fix | `fix/description` | `fix/websocket-reconnection` |
| Hotfix | `hotfix/description` | `hotfix/feed-crash-on-empty` |
| Docs | `docs/description` | `docs/v1-srs-update` |

### 5.3 Commit Messages

Format: `<type>(<scope>): <description>`

```
feat(feed): add vertical snap-scroll video player
fix(socket): handle reconnection after network drop
docs(v1): add SRS functional requirements
refactor(types): extract MCQ interface to shared types
chore(docker): add Redis service to compose
```

Types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`

---

## 6. API Standards

### 6.1 Endpoint Naming

- RESTful: `/api/resource/action`
- All endpoints under `/api/` prefix
- Use nouns for resources, verbs for actions
- Examples:
  - `GET /api/digest/today`
  - `POST /api/quiz/submit`
  - `POST /api/user/bookmark`

### 6.2 Response Format

All API responses follow this envelope:

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Descriptive error message"
}
```

### 6.3 CORS

- All API responses must include CORS headers
- Allowed origins: `*` during development, domain-restricted in production

---

## 7. CSS / Styling Standards

### 7.1 Framework

- Tailwind CSS 4 with the Vite plugin
- Custom utilities defined in `@layer utilities` in `index.css`
- No CSS modules or styled-components

### 7.2 Color System

| Role | Color | Usage |
|------|-------|-------|
| Primary | `#00D1FF` (cyan) | Links, active states, highlights |
| Secondary | `#EA4C89` (pink) | Likes, secondary actions |
| Accent | `#FFB800` (amber) | Warnings, live indicators |
| Background | `#121127` (dark navy) | App background |
| Surface | `#1e1d34` (dark purple) | Cards, panels |
| Text Primary | `#e3dffe` (light lavender) | Body text |
| Text Secondary | `#bbc9cf` (gray-blue) | Captions, metadata |
| Error | `#B40B07` (red) | Breaking news, errors |
| Success | `#34D399` (emerald) | Success states |

### 7.3 Typography

| Role | Font | Weight |
|------|------|--------|
| Display / Headings | Sora | 600, 700, 800 |
| Body | Hanken Grotesk | 400, 600 |
| Monospace / Labels | JetBrains Mono | 700 |

### 7.4 Spacing

- 8px spacing system (Tailwind defaults)
- Use `gap-*` for flex/grid spacing
- Minimum touch target: 44x44px

---

## 8. Testing Standards

### 8.1 What to Test

| Layer | Test Type | Tool |
|-------|----------|------|
| Functions / utils | Unit | Vitest |
| API endpoints | Integration | Supertest |
| React components | Component | React Testing Library |
| AI pipeline | Accuracy | Custom assertion scripts |
| Full flow | E2E | Playwright (future) |

### 8.2 Test File Location

- Unit tests: alongside source files (`.test.ts` / `.test.tsx`)
- Integration tests: `tests/` directory
- E2E tests: `tests/e2e/` directory

---

## 9. AI / Prompt Standards

### 9.1 Prompt Storage

- All AI prompts stored in `prompts/` directory
- Versioned with comments (v1.0, v1.1, etc.)
- Never inline prompts in application code — import from `prompts/`

### 9.2 AI Output Validation

- Always validate AI-generated JSON structure before using
- Fallback to extractive methods if AI call fails
- Log AI latency, token usage, and success rate
- Never expose raw AI output to users without structural validation

### 9.3 Model Selection

| Task | Model | Rationale |
|------|-------|-----------|
| Quick take summaries | Gemini Flash | Fast, cost-effective |
| MCQ generation | Gemini Flash | Structured JSON output |
| AI tutor | Gemini Flash | Multi-turn conversation |
| Fact verification | Gemini Pro (future) | Higher accuracy needed |
| Embeddings | text-embedding-004 | pgvector compatible |
