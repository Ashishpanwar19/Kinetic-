import type { KnowledgeObject, SystemMetrics } from '../types';

const API_BASE = '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${path} returned ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface DigestResponse {
  date: string;
  count: number;
  knowledge_objects: KnowledgeObject[];
}

export interface UserProfile {
  user_id?: string;
  display_name?: string;
  avatar_url?: string | null;
  role?: string;
  quizzes_solved: number;
  accuracy: number;
  total_questions: number;
  history?: Array<{ article_id: string; headline: string; timestamp: string }>;
}

export interface QuizSubmitResponse {
  article_id: string;
  score: number;
  total: number;
  percentage: number;
  results: Array<{
    mcq_id: string;
    question: string;
    user_choice: number | null;
    correct_choice: number;
    is_correct: boolean;
    explanation: string;
  }>;
}

export interface BookmarkResponse {
  success: boolean;
  is_saved: boolean;
  user?: UserProfile;
}

export interface UnreviewedResponse {
  success: boolean;
  count: number;
  unreviewed_items: KnowledgeObject[];
}

export interface KnowledgeGraphData {
  nodes: Array<{ id: string; label: string; type: string; val: number }>;
  links: Array<{ source: string; target: string; relationship: string }>;
}

export const api = {
  health: () => apiFetch<{ status: string; timestamp: string }>('/api/health'),

  fetchTodayDigest: () => apiFetch<DigestResponse>('/api/digest/today'),

  fetchUnreviewed: () => apiFetch<UnreviewedResponse>('/api/digest/unreviewed'),

  approveArticle: (id: string) =>
    apiFetch<{ success: boolean; article: KnowledgeObject }>(`/api/article/${id}/review`, {
      method: 'POST',
    }),

  fetchArticle: (id: string) => apiFetch<KnowledgeObject>(`/api/article/${id}`),

  fetchProfile: () => apiFetch<{ success: boolean; user: UserProfile }>('/api/user/profile'),

  toggleBookmark: (articleId: string, headline?: string) =>
    apiFetch<BookmarkResponse>('/api/user/bookmark', {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId, headline }),
    }),

  resetProfile: () =>
    apiFetch<{ success: boolean }>('/api/user/reset', { method: 'POST' }),

  submitQuiz: (articleId: string, answers: number[]) =>
    apiFetch<QuizSubmitResponse>('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId, answers }),
    }),

  fetchMetrics: () => apiFetch<{ success: boolean; metrics: SystemMetrics }>('/api/system/metrics'),

  fetchKnowledgeGraph: () => apiFetch<KnowledgeGraphData>('/api/knowledge-graph'),

  aiChat: (messages: Array<{ role: string; content: string }>, context?: string) =>
    apiFetch<{ success: boolean; reply: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context }),
    }),

  aiQuickTake: (articleUrl: string, headline: string) =>
    apiFetch<{ success: boolean; aiResult: any }>('/api/ai/quick-take', {
      method: 'POST',
      body: JSON.stringify({ article_url: articleUrl, headline }),
    }),

  workerPoll: () =>
    apiFetch<{ success: boolean }>('/api/worker/poll', { method: 'POST' }),

  fetchSportsEvents: () =>
    apiFetch<{ success: boolean; events: any[] }>('/api/sports/events'),

  captureSportsVideo: (event: any) =>
    apiFetch<{ success: boolean; video?: any }>('/api/sports/capture-video', {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  openNewsCategories: () =>
    apiFetch<{ categories: string[]; countries: Array<{ code: string; name: string; flag: string }> }>(
      '/api/open-news/categories-countries'
    ),

  openNewsFetchArticle: (url: string) =>
    apiFetch<any>('/api/open-news/fetch-article', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  openNewsRssDiscover: (site: string) =>
    apiFetch<any>('/api/open-news/rss-discover', {
      method: 'POST',
      body: JSON.stringify({ site }),
    }),

  openNewsSearchSite: (site: string, query: string) =>
    apiFetch<any>('/api/open-news/search-site', {
      method: 'POST',
      body: JSON.stringify({ site, query }),
    }),

  openNewsBatchSummarize: (urls: string[]) =>
    apiFetch<any>('/api/open-news/batch-summarize', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    }),

  openNewsClearCache: () =>
    apiFetch<any>('/api/open-news/clear-cache', { method: 'POST' }),
};
