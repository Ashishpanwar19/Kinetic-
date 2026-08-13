# Volume 5 — Frontend Platform

## Overview

This volume connects the entire React frontend to the backend API, replacing hardcoded mock data with live API calls, adding a centralized API client, implementing loading states, and removing exposed secrets from client-side code.

## What's Inside

| Document | Description |
|----------|-------------|
| [FRONTEND.md](./FRONTEND.md) | Component architecture, data flow, API integration guide |

## Key Changes

1. **Centralized API Client** (`src/services/api.ts`) — All backend endpoints are now called through a single typed client with consistent error handling. Every component that previously used raw `fetch()` now goes through this service.

2. **Removed Mock Data Dependency** — The app no longer seeds its initial state from `INITIAL_KNOWLEDGE_OBJECTS`. Instead, it fetches from `/api/digest/today` on mount and shows a loading spinner while waiting.

3. **Loading States** — The feed view now shows an animated loading spinner while the initial digest is being fetched, instead of appearing empty or showing stale data.

4. **Removed Hardcoded API Key** — The NewsData.io API key that was baked into client-side source code has been removed. The server proxies all news data requests through its own secured key.

5. **Typed API Responses** — All API responses now have TypeScript interfaces, catching shape mismatches at compile time.
