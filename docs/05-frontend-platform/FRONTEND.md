# Frontend Platform — Component Architecture & API Integration

## Overview

The PulseNews AI frontend is a React 19 + Vite single-page application. The root `App.tsx` is the central state orchestrator — it fetches the daily digest and user profile on mount, maintains the `knowledgeObjects` array, and pushes data slices down to child views as props. Socket.io provides real-time news updates and live stream status.

## API Client

All backend communication goes through `src/services/api.ts`, a centralized client that:

- Provides typed methods for every endpoint
- Sets JSON content-type headers automatically
- Throws on non-2xx responses with a descriptive error
- Returns typed response objects

### Usage

```typescript
import { api } from '../services/api';

const { knowledge_objects } = await api.fetchTodayDigest();
const result = await api.submitQuiz(articleId, [0, 2, 1, 3]);
const { is_saved } = await api.toggleBookmark(articleId);
```

### Available Methods

| Method | Endpoint | Returns |
|--------|----------|---------|
| `api.fetchTodayDigest()` | `GET /api/digest/today` | `DigestResponse` |
| `api.fetchUnreviewed()` | `GET /api/digest/unreviewed` | `UnreviewedResponse` |
| `api.approveArticle(id)` | `POST /api/article/:id/review` | `{ success, article }` |
| `api.fetchArticle(id)` | `GET /api/article/:id` | `KnowledgeObject` |
| `api.fetchProfile()` | `GET /api/user/profile` | `{ success, user }` |
| `api.toggleBookmark(id)` | `POST /api/user/bookmark` | `BookmarkResponse` |
| `api.resetProfile()` | `POST /api/user/reset` | `{ success }` |
| `api.submitQuiz(id, answers)` | `POST /api/quiz/submit` | `QuizSubmitResponse` |
| `api.fetchMetrics()` | `GET /api/system/metrics` | `{ success, metrics }` |
| `api.fetchKnowledgeGraph()` | `GET /api/knowledge-graph` | `KnowledgeGraphData` |
| `api.aiChat(messages)` | `POST /api/ai/chat` | `{ success, reply }` |
| `api.aiQuickTake(url, headline)` | `POST /api/ai/quick-take` | `{ success, aiResult }` |
| `api.workerPoll()` | `POST /api/worker/poll` | `{ success }` |
| `api.fetchSportsEvents()` | `GET /api/sports/events` | `{ success, events }` |
| `api.captureSportsVideo(event)` | `POST /api/sports/capture-video` | `{ success, video }` |
| `api.openNewsCategories()` | `GET /api/open-news/categories-countries` | categories + countries |
| `api.openNewsFetchArticle(url)` | `POST /api/open-news/fetch-article` | extracted article |
| `api.openNewsRssDiscover(site)` | `POST /api/open-news/rss-discover` | RSS feeds |
| `api.openNewsSearchSite(site, q)` | `POST /api/open-news/search-site` | search results |
| `api.openNewsBatchSummarize(urls)` | `POST /api/open-news/batch-summarize` | batch results |
| `api.openNewsClearCache()` | `POST /api/open-news/clear-cache` | confirmation |

---

## Component Data Flow

### Tier 1: App-Orchestrated (props from App)

| Component | Props | Own API Calls |
|-----------|-------|---------------|
| **FeedView** | `items`, `isLoading`, 4 handlers | None |
| **ExamDigestView** | `items`, `onOpenQuiz` | `api.aiQuickTake()` |
| **ExamQuizModal** | `item`, `onClose`, `onCompleteQuiz` | `api.submitQuiz()` |
| **ProfileView** | `savedItems`, `userStats`, handlers | `api.fetchProfile()`, `api.resetProfile()` |
| **DiscoverView** | `items`, `onSelectItem` | `api.fetchSportsEvents()`, `api.captureSportsVideo()` |
| **Navigation** | `currentTab`, handlers, `isSocketConnected` | None (uses AuthContext) |

### Tier 2: Self-Contained (no props, self-fetching)

| Component | API Calls |
|-----------|-----------|
| **SystemArchitectureView** | `api.fetchMetrics()`, `api.fetchUnreviewed()`, `api.approveArticle()`, `api.workerPoll()` (polls every 5s) |
| **KnowledgeGraphView** | `api.fetchKnowledgeGraph()` (on mount) |
| **OpenNewsStudioView** | 8 Open News endpoints |

### Tier 3: WebSocket-Enhanced

| Component | Socket Events |
|-----------|--------------|
| **LiveHubView** | Receives `streamStatuses` prop from App's `useSocket` hook |
| **Navigation** | Receives `isSocketConnected` prop for live status badge |

---

## State Management

All state lives in `App.tsx` via `useState`:

| State | Type | Source |
|-------|------|--------|
| `knowledgeObjects` | `KnowledgeObject[]` | `api.fetchTodayDigest()` + WebSocket `news_update` |
| `isLoadingFeed` | `boolean` | Set false after digest fetch completes |
| `selectedItem` | `KnowledgeObject \| null` | User click |
| `activeQuizItem` | `KnowledgeObject \| null` | User opens quiz |
| `userStats` | `{ quizzes_solved, accuracy, total_questions, history }` | `api.fetchProfile()` |
| `streamStatuses` | `Record<string, StreamStatus>` | WebSocket `stream_status` |
| `isSocketConnected` | `boolean` | `useSocket()` hook |
| `currentTab` | `TabType` | User navigation |

### Real-time Updates

The `useSocket()` hook establishes a Socket.io connection on mount. When a `news_update` event arrives (e.g., article approved), App upserts the article into `knowledgeObjects` and shows a toast notification. Stream status updates flow to LiveHubView.

---

## Loading States

### Feed Loading

When the app loads, `isLoadingFeed` is `true`. FeedView displays an animated spinner with "Loading Feed — Fetching today's latest news reels..." Once the digest API returns, the spinner is replaced with the video feed.

### Empty States

If the digest returns no articles, the feed shows an empty state with a prompt to switch filters or try again.

### Error Handling

All API calls use try/catch with `console.warn`. The app degrades gracefully:
- Feed: shows empty state with "No stories right now"
- Profile: falls back to prop-based `userStats`
- System Metrics: SystemArchitectureView shows hardcoded fallback values
- Knowledge Graph: shows empty graph with message

---

## Authentication

Firebase Authentication is managed by `AuthContext.tsx`:

- `AuthProvider` wraps the entire app
- `useAuth()` hook provides `{ user, loading, loginWithGoogle, logout }`
- Google sign-in button lives in Navigation
- Chat history in GeminiChatbotModal is keyed to `user.uid`

---

## Security Improvements

### Removed Hardcoded API Key

**Before:** `newsDataService.ts` contained `DEFAULT_NEWSDATA_API_KEY = 'pub_6543210fedcba'` in client-side source code, visible to anyone viewing the page source.

**After:** The key is empty string. All news data requests go through the server's proxy endpoint, which holds the real key in environment variables. Direct browser-to-NewsData.io fetches only work if the user provides their own key via the UI.

---

## File Structure

```
src/
├── App.tsx                        — Root component, state orchestrator
├── main.tsx                       — React entry point
├── index.css                      — Global styles + Tailwind
├── types.ts                       — TypeScript interfaces
├── context/
│   └── AuthContext.tsx            — Firebase Auth provider
├── hooks/
│   └── useSocket.ts              — Socket.io connection hook
├── services/
│   ├── api.ts                     — Centralized API client (NEW)
│   ├── newsDataService.ts         — NewsData.io service (cleaned)
│   └── pdfDigestService.ts        — PDF generation service
├── data/
│   └── mockData.ts                — Static seed data (LiveHubView only)
├── components/
│   ├── Navigation.tsx
│   ├── NavigationDrawer.tsx
│   ├── FeedView.tsx               — Video feed with loading state
│   ├── DiscoverView.tsx
│   ├── LiveHubView.tsx
│   ├── SnippetDetailView.tsx
│   ├── ExamDigestView.tsx
│   ├── ExamQuizModal.tsx
│   ├── ProfileView.tsx
│   ├── GeminiChatbotModal.tsx
│   ├── KnowledgeGraphView.tsx
│   ├── SystemArchitectureView.tsx
│   ├── OpenNewsStudioView.tsx
│   ├── RssNewsTicker.tsx
│   ├── PulseNewsSidebar.tsx
│   ├── VideoPlayer.tsx
│   └── LiveMatchVideoModal.tsx
└── lib/
    └── firebase.ts                — Firebase init + Firestore helpers
```
