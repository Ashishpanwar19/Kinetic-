import Parser from 'rss-parser';
import { GoogleGenAI, Type } from '@google/genai';
import { getAdminClient, isSupabaseConfigured } from './supabaseClient.js';

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PulseNews/6.0',
  },
  timeout: 12000,
});

export interface FeedConfig {
  url: string;
  name: string;
  category: string;
  country?: string;
}

const DEFAULT_FEEDS: FeedConfig[] = [
  { url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en', name: 'Google News Top', category: 'news' },
  { url: 'http://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', category: 'news' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT World', category: 'International' },
  { url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms', name: 'Times of India', category: 'news', country: 'india' },
  { url: 'https://www.thehindu.com/feeder/default.rss', name: 'The Hindu', category: 'news', country: 'india' },
  { url: 'https://pib.gov.in/RssMain.aspx?ModId=6', name: 'PIB India', category: 'Polity', country: 'india' },
  { url: 'https://indianexpress.com/feed/', name: 'Indian Express', category: 'news', country: 'india' },
  { url: 'http://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', category: 'Economy' },
  { url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en', name: 'Google Science', category: 'Science' },
  { url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml', name: 'BBC Science', category: 'Science' },
  { url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en', name: 'Google Sports', category: 'Sports' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'Science' },
  { url: 'https://rss.dw.com/rdf/rss-en-world', name: 'DW World', category: 'International' },
  { url: 'https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best', name: 'Reuters Top', category: 'news' },
];

interface RawArticle {
  title: string;
  url: string;
  source: string;
  published: string;
  description: string;
  category: string;
  country?: string;
}

interface EnrichedArticle {
  headline: string;
  summary: string;
  category: string;
  entities: string[];
  exam_importance: number;
  quick_take: string[];
  mcqs: Array<{
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }>;
}

function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = '';
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    return parsed.toString().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

async function parseFeed(feed: FeedConfig): Promise<RawArticle[]> {
  try {
    const parsed = await rssParser.parseURL(feed.url);
    return parsed.items.slice(0, 6).map(item => {
      let sourceName = feed.name;
      if (item.link?.includes('news.google.com')) {
        const parts = (item.title || '').split(' - ');
        if (parts.length > 1) sourceName = parts[parts.length - 1];
      }
      return {
        title: item.title || 'Headline Update',
        url: item.link || item.guid || feed.url,
        source: sourceName,
        published: item.pubDate || item.isoDate || new Date().toISOString(),
        description: (item.contentSnippet || item.content || '').replace(/<[^>]+>/g, '').slice(0, 300),
        category: feed.category,
        country: feed.country,
      };
    });
  } catch (err: any) {
    console.warn(`[ingestion] Feed parse error for ${feed.url}: ${err.message}`);
    return [];
  }
}

async function deduplicateUrls(urls: string[]): Promise<{ newUrls: Set<string>; existingUrls: Set<string> }> {
  if (!isSupabaseConfigured()) {
    return { newUrls: new Set(urls), existingUrls: new Set() };
  }
  const client = getAdminClient();
  const normalized = urls.map(normalizeUrl);

  const { data: existing } = await client
    .from('knowledge_objects')
    .select('source_url')
    .in('source_url', normalized);

  const existingUrls = new Set((existing || []).map((r: any) => r.source_url));
  const newUrls = new Set(urls.filter(u => !existingUrls.has(normalizeUrl(u))));

  return { newUrls, existingUrls };
}

async function enrichWithAI(article: RawArticle): Promise<EnrichedArticle | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `Process this news article into a structured Knowledge Object for competitive exam preparation:

Title: ${article.title}
Source: ${article.source}
Description: ${article.description}
Category hint: ${article.category}

Produce JSON matching this exact schema:
{
  "headline": string (engaging, crisp news title),
  "summary": string (3-4 lines exam-oriented overview),
  "category": one of ["Economy", "Science", "Environment", "Polity", "International", "Sports", "Local"],
  "entities": array of strings (key people, organizations, places),
  "exam_importance": integer 1-100,
  "quick_take": array of exactly 3 bullet point strings,
  "mcqs": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correct_index": integer (0 to 3),
      "explanation": string
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            summary: { type: Type.STRING },
            category: { type: Type.STRING },
            entities: { type: Type.ARRAY, items: { type: Type.STRING } },
            exam_importance: { type: Type.INTEGER },
            quick_take: { type: Type.ARRAY, items: { type: Type.STRING } },
            mcqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct_index: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                },
                required: ['question', 'options', 'correct_index', 'explanation'],
              },
            },
          },
          required: ['headline', 'summary', 'category', 'exam_importance', 'quick_take', 'mcqs'],
        },
      },
    });

    return JSON.parse(response.text || '{}') as EnrichedArticle;
  } catch (err: any) {
    console.warn(`[ingestion] AI enrichment failed for "${article.title.slice(0, 50)}": ${err.message}`);
    return null;
  }
}

async function persistArticle(raw: RawArticle, enriched: EnrichedArticle | null): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const client = getAdminClient();
  const normalized = normalizeUrl(raw.url);

  const { data: ko, error } = await client
    .from('knowledge_objects')
    .insert({
      source_url: normalized,
      source_name: raw.source,
      headline: enriched?.headline || raw.title,
      summary: enriched?.summary || raw.description || 'Ingested via RSS pipeline.',
      category: enriched?.category || raw.category,
      exam_importance: enriched?.exam_importance || 75,
      quick_take: enriched?.quick_take || [
        `Source: ${raw.source}`,
        `Published: ${raw.published}`,
        'Ingested via automated RSS pipeline.',
      ],
      entities: enriched?.entities || [],
      image_url: null,
      tag: '#RSS',
      views: '0',
      reviewed: false,
      is_breaking: false,
      is_local: raw.country === 'india',
      published_at: raw.published,
    })
    .select('id')
    .maybeSingle();

  if (error || !ko) {
    console.warn(`[ingestion] Failed to persist article: ${error?.message}`);
    return null;
  }

  if (enriched?.mcqs && enriched.mcqs.length > 0) {
    const mcqRows = enriched.mcqs.map(m => ({
      ko_id: ko.id,
      question: m.question,
      options: m.options,
      correct_index: m.correct_index,
      explanation: m.explanation,
    }));

    const { error: mcqError } = await client.from('mcqs').insert(mcqRows);
    if (mcqError) {
      console.warn(`[ingestion] Failed to insert MCQs for ${ko.id}: ${mcqError.message}`);
    }
  }

  return ko.id;
}

export interface IngestionResult {
  feedsPolled: number;
  articlesFetched: number;
  articlesNew: number;
  articlesDuplicate: number;
  aiEnriched: number;
  aiFailed: number;
  newArticleIds: string[];
}

export async function runIngestionPipeline(
  feeds: FeedConfig[] = DEFAULT_FEEDS,
  options?: { autoReview?: boolean; maxNew?: number }
): Promise<IngestionResult> {
  const autoReview = options?.autoReview ?? false;
  const maxNew = options?.maxNew ?? 15;

  console.log(`[ingestion] Starting pipeline with ${feeds.length} feeds...`);

  const feedResults = await Promise.allSettled(feeds.map(parseFeed));
  const allArticles: RawArticle[] = [];
  feedResults.forEach((res) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      allArticles.push(...res.value);
    }
  });

  console.log(`[ingestion] Fetched ${allArticles.length} raw articles from ${feeds.length} feeds`);

  const allUrls = allArticles.map(a => a.url);
  const { newUrls } = await deduplicateUrls(allUrls);

  const newArticles = allArticles.filter(a => newUrls.has(a.url)).slice(0, maxNew);
  const duplicateCount = allArticles.length - newArticles.length;

  console.log(`[ingestion] ${newArticles.length} new articles, ${duplicateCount} duplicates skipped`);

  let aiEnriched = 0;
  let aiFailed = 0;
  const newArticleIds: string[] = [];

  for (const article of newArticles) {
    const enriched = await enrichWithAI(article);
    if (enriched) {
      aiEnriched++;
    } else {
      aiFailed++;
    }

    const koId = await persistArticle(article, enriched);
    if (koId) newArticleIds.push(koId);

    if (autoReview && isSupabaseConfigured() && koId) {
      const client = getAdminClient();
      await client
        .from('knowledge_objects')
        .update({ reviewed: true, updated_at: new Date().toISOString() })
        .eq('id', koId);
    }
  }

  console.log(`[ingestion] Pipeline complete: ${newArticles.length} new, ${aiEnriched} AI-enriched, ${aiFailed} AI-failed`);

  return {
    feedsPolled: feeds.length,
    articlesFetched: allArticles.length,
    articlesNew: newArticles.length,
    articlesDuplicate: duplicateCount,
    aiEnriched,
    aiFailed,
    newArticleIds,
  };
}

export async function logIngestionRun(
  runType: 'scheduled' | 'manual' | 'worker_poll',
  result: IngestionResult,
  durationMs: number,
  errorMessage?: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const client = getAdminClient();
  await client.from('ingestion_runs').insert({
    run_type: runType,
    feeds_polled: result.feedsPolled,
    articles_fetched: result.articlesFetched,
    articles_new: result.articlesNew,
    articles_duplicate: result.articlesDuplicate,
    ai_enriched: result.aiEnriched,
    ai_failed: result.aiFailed,
    status: errorMessage ? 'failed' : 'completed',
    error_message: errorMessage || null,
    started_at: new Date(Date.now() - durationMs).toISOString(),
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  });
}

export async function getRecentIngestionRuns(limit: number = 10): Promise<any[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getAdminClient();
  const { data, error } = await client
    .from('ingestion_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data;
}

export { DEFAULT_FEEDS };
export type { RawArticle, EnrichedArticle };
