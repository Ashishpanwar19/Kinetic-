import React from 'react';
import { KnowledgeObject } from '../types';

export interface NewsDataFetchOptions {
  apikey?: string;
  query?: string;
  category?: string;
}

/**
 * NewsData.io Service
 * Integrates real-time NewsData.io API feeds for sports, world, and breaking news,
 * mapping them into the application's KnowledgeObject state.
 *
 * The API key is stored server-side and never exposed in client code.
 * Direct client-side fetches require the user to provide their own key via the UI.
 */

export const DEFAULT_NEWSDATA_API_KEY = '';

/**
 * Fetch real-time news articles from the server endpoint /api/news/fetch-newsdata
 * which calls NewsData.io API and returns structured KnowledgeObjects with video playback feeds.
 */
export async function fetchNewsFromApi(options: NewsDataFetchOptions = {}): Promise<KnowledgeObject[]> {
  const { apikey = DEFAULT_NEWSDATA_API_KEY, query = 'sports', category } = options;

  try {
    const res = await fetch('/api/news/fetch-newsdata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apikey,
        q: query,
        category,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.articles)) {
      return data.articles;
    }
    return [];
  } catch (error) {
    console.error('Error fetching from NewsData service via API route:', error);
    return [];
  }
}

/**
 * Direct client-side fetch helper for NewsData.io API (with automatic fallback handling)
 */
export async function fetchDirectNewsData(apiKey: string, query: string = 'sports'): Promise<KnowledgeObject[]> {
  if (!apiKey) {
    return fetchNewsFromApi({ query });
  }
  const url = `https://newsdata.io/api/1/latest?apikey=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&language=en`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success' && Array.isArray(data.results)) {
      return data.results.slice(0, 10).map((art: any, index: number) => {
        const id = `newsdata-direct-${art.article_id || Date.now() + index}`;
        const realVideos = [
          'https://www.youtube.com/embed/0B984G1WAn4',
          'https://www.youtube.com/embed/4yP395RToj0',
          'https://www.youtube.com/embed/WB-y7_n6W-U',
          'https://www.youtube.com/embed/9Auq9mYxFEE',
          'https://www.youtube.com/embed/S_8d4052X50',
        ];

        return {
          id,
          source_url: art.link || 'https://newsdata.io',
          source_name: art.source_name || art.source_id || 'NewsData Wire',
          published_at: art.pubDate || new Date().toISOString(),
          headline: art.title || `Breaking ${query} News Update`,
          summary: art.description || art.content || `Live coverage of ${query} news fetched via NewsData.io.`,
          category: query.toLowerCase().includes('sport') ? 'Sports' : 'International',
          entities: art.keywords || [query, 'NewsData.io'],
          exam_importance: 92,
          reviewed: true,
          monetized: true,
          tag: query.toLowerCase().includes('sport') ? '#SPORTS' : '#GLOBAL',
          views: `${Math.floor(Math.random() * 800 + 100)}K`,
          likes: Math.floor(Math.random() * 100000 + 20000),
          comments_count: Math.floor(Math.random() * 5000 + 500),
          shares: Math.floor(Math.random() * 2000 + 300),
          image_url: art.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80',
          video_url: art.video_url || realVideos[index % realVideos.length],
          quick_take: [
            art.title || `Live ${query} event reported globally.`,
            art.description ? art.description.slice(0, 120) + '...' : 'Verified news source coverage.',
            'Updated in real-time via NewsData.io integration.',
          ],
          mcqs: [
            {
              id: `mcq-${id}`,
              question: `Which news event concerning ${query} was recently covered by ${art.source_name || 'global press'}?`,
              options: [
                art.title ? art.title.slice(0, 50) + '...' : `Major ${query} developments`,
                'Routine municipal council vote',
                'Unrelated weather advisory',
                'Local traffic speed test',
              ],
              correct_index: 0,
              explanation: `Reported by accredited news source ${art.source_name || 'NewsData.io'}.`,
            },
          ],
        };
      });
    }
  } catch (err) {
    console.warn('Direct NewsData client fetch failed, falling back to server route:', err);
  }

  // Fallback to server route
  return fetchNewsFromApi({ apikey: apiKey, query });
}

/**
 * Utility to synchronize real-time NewsData.io articles directly into React state
 */
export async function syncNewsDataToState(
  setKnowledgeObjects: React.Dispatch<React.SetStateAction<KnowledgeObject[]>>,
  options: NewsDataFetchOptions = {}
): Promise<KnowledgeObject[]> {
  const articles = await fetchNewsFromApi(options);
  if (articles && articles.length > 0) {
    setKnowledgeObjects((prev) => {
      // Merge unique articles at top of feed
      const existingIds = new Set(prev.map((item) => item.id));
      const newUnique = articles.filter((art) => !existingIds.has(art.id));
      return [...newUnique, ...prev];
    });
  }
  return articles;
}
