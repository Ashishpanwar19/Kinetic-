import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";

const rssParser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 open-news/0.2.0"
  },
  timeout: 10000,
});

// Cache map: key -> { timestamp: number, data: any }
const feedCache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const OPEN_NEWS_CATEGORIES = [
  "news",
  "business",
  "politics",
  "geopolitics",
  "tech",
  "science",
  "sports",
  "entertainment"
];

export const OPEN_NEWS_COUNTRIES = [
  { code: "india", name: "India", flag: "🇮🇳" },
  { code: "usa", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "germany", name: "Germany", flag: "🇩🇪" },
  { code: "japan", name: "Japan", flag: "🇯🇵" },
  { code: "france", name: "France", flag: "🇫🇷" },
  { code: "canada", name: "Canada", flag: "🇨🇦" },
  { code: "australia", name: "Australia", flag: "🇦🇺" },
  { code: "brazil", name: "Brazil", flag: "🇧🇷" },
  { code: "singapore", name: "Singapore", flag: "🇸🇬" },
  { code: "italy", name: "Italy", flag: "🇮🇹" },
  { code: "spain", name: "Spain", flag: "🇪🇸" },
  { code: "south_africa", name: "South Africa", flag: "🇿🇦" },
  { code: "south_korea", name: "South Korea", flag: "🇰🇷" },
  { code: "uae", name: "United Arab Emirates", flag: "🇦🇪" }
];

// Curated feed registry mapping categories and countries to verified live RSS feeds
const FEED_REGISTRY: Record<string, string[]> = {
  // Categories
  "category:news": [
    "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://www.reutersagency.com/feed/?best-topics=top-news&post_type=best",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
  ],
  "category:business": [
    "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/news/business/rss.xml",
    "https://search.cnbc.com/rs/search/combinedrender?source=0&id=10000664&target=partner&partnerId=2000",
    "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
    "https://economictimes.indiatimes.com/rssfeedstopstories.cms"
  ],
  "category:politics": [
    "https://news.google.com/rss/headlines/section/topic/POLITICS?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/news/politics/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml"
  ],
  "category:geopolitics": [
    "https://news.google.com/rss/search?q=geopolitics+foreign+policy&hl=en-US&gl=US&ceid=US:en",
    "https://www.foreignaffairs.com/rss.xml",
    "https://rss.dw.com/rdf/rss-en-world"
  ],
  "category:tech": [
    "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
    "https://techcrunch.com/feed/",
    "https://news.ycombinator.com/rss",
    "https://www.wired.com/feed/rss",
    "https://feeds.feedburner.com/TechCrunch/"
  ],
  "category:science": [
    "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    "https://www.sciencedaily.com/rss/top/science.xml"
  ],
  "category:sports": [
    "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/sport/rss.xml",
    "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms"
  ],
  "category:entertainment": [
    "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en",
    "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"
  ],

  // Countries
  "country:india": [
    "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
    "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
    "https://www.thehindu.com/feeder/default.rss",
    "https://pib.gov.in/RssMain.aspx?ModId=6",
    "https://indianexpress.com/feed/"
  ],
  "country:usa": [
    "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "http://rss.cnn.com/rss/cnn_topstories.rss",
    "https://feeds.washingtonpost.com/rss/national"
  ],
  "country:uk": [
    "https://news.google.com/rss?hl=en-GB&gl=GB&ceid=GB:en",
    "http://feeds.bbci.co.uk/news/rss.xml",
    "https://www.theguardian.com/uk/rss"
  ],
  "country:germany": [
    "https://news.google.com/rss?hl=en-DE&gl=DE&ceid=DE:en",
    "https://rss.dw.com/rdf/rss-en-all"
  ],
  "country:japan": [
    "https://news.google.com/rss?hl=en-JP&gl=JP&ceid=JP:en",
    "https://www3.nhk.or.jp/rss/news/cat0.xml"
  ],
  "country:france": [
    "https://news.google.com/rss?hl=en-FR&gl=FR&ceid=FR:en",
    "https://www.france24.com/en/rss"
  ],
  "country:canada": [
    "https://news.google.com/rss?hl=en-CA&gl=CA&ceid=CA:en",
    "https://www.cbc.ca/cbbc/content/rss/rss-topstories.xml"
  ],
  "country:australia": [
    "https://news.google.com/rss?hl=en-AU&gl=AU&ceid=AU:en",
    "https://www.abc.net.au/news/feed/51120/rss.xml"
  ],
  "country:brazil": [
    "https://news.google.com/rss?hl=en-BR&gl=BR&ceid=BR:en"
  ],
  "country:singapore": [
    "https://news.google.com/rss?hl=en-SG&gl=SG&ceid=SG:en",
    "https://www.channelnewsasia.com/api/v1/rss-outbound/rssnews/8395986"
  ]
};

// URL Normalization for Deduplication
function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.hash = "";
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("utm_term");
    parsed.searchParams.delete("utm_content");
    let clean = parsed.toString().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    return clean;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

// Simple Levenshtein or Token Jaccard Similarity for Fuzzy Dedupe
function isFuzzyTitleDuplicate(title1: string, title2: string): boolean {
  const t1 = title1.toLowerCase().replace(/[^\w\s]/gi, "").split(/\s+/).filter(w => w.length > 2);
  const t2 = title2.toLowerCase().replace(/[^\w\s]/gi, "").split(/\s+/).filter(w => w.length > 2);
  if (t1.length === 0 || t2.length === 0) return false;
  const set1 = new Set(t1);
  const set2 = new Set(t2);
  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }
  const union = new Set([...t1, ...t2]).size;
  const jaccard = intersection / union;
  return jaccard > 0.65; // High semantic overlap threshold
}

export function dedupeArticles(articles: any[], fuzzy: boolean = false): any[] {
  const seenUrls = new Set<string>();
  const result: any[] = [];

  for (const art of articles) {
    const norm = normalizeUrl(art.url || "");
    if (!norm || seenUrls.has(norm)) continue;

    if (fuzzy && result.some(r => isFuzzyTitleDuplicate(r.title || "", art.title || ""))) {
      continue;
    }

    seenUrls.add(norm);
    result.push(art);
  }

  return result;
}

// 1. Fetch & Extract Article Content
export async function fetchArticleContent(url: string, jsMode: boolean = false): Promise<any> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch article HTTP ${res.status}`);
    }

    const html = await res.text();

    // Extract Title
    let title = "";
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

    title = (ogTitleMatch?.[1] || twitterTitleMatch?.[1] || titleTagMatch?.[1] || h1Match?.[1] || "Untitled Article").trim();

    // Extract Meta Description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = (ogDescMatch?.[1] || metaDescMatch?.[1] || "").trim();

    // Extract Top Image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const top_image = ogImageMatch?.[1] || null;

    // Extract Authors
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const authors = authorMatch?.[1] ? [authorMatch[1].trim()] : [];

    // Extract Publish Date
    const pubDateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*name=["']pubdate["'][^>]*content=["']([^"']+)["']/i);
    const publish_date = pubDateMatch?.[1] || null;

    // Extract Source Domain
    let source = "";
    try {
      source = new URL(url).hostname.replace("www.", "");
    } catch {
      source = "Web Source";
    }

    // Clean body text from HTML paragraphs
    const cleanHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "");

    const pMatches = [...cleanHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const paragraphs = pMatches
      .map(m => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(p => p.length > 35 && !p.toLowerCase().includes("cookie") && !p.toLowerCase().includes("rights reserved"));

    let bodyText = paragraphs.join("\n\n");
    if (!bodyText) {
      bodyText = description || "Full article text extraction completed.";
    }

    // Extract Images
    const imgMatches = [...cleanHtml.matchAll(/<img[^>]*src=["']([^"']+)["']/gi)];
    const images = imgMatches
      .map(m => m[1])
      .filter(img => img.startsWith("http") && !img.includes("icon") && !img.includes("logo"))
      .slice(0, 5);

    // Extract Videos
    const videoMatches = [...cleanHtml.matchAll(/<iframe[^>]*src=["']([^"']+)["']/gi)];
    const videos = videoMatches
      .map(m => m[1])
      .filter(v => v.includes("youtube") || v.includes("vimeo") || v.includes("player"))
      .slice(0, 3);

    return {
      url,
      title,
      text: bodyText,
      authors,
      publish_date,
      top_image,
      images,
      videos,
      source,
      meta: {
        description,
        site_name: source,
        keywords: title.split(" ").slice(0, 5).join(", ")
      }
    };
  } catch (err: any) {
    console.error(`Error in open-news fetchArticleContent for ${url}:`, err.message);
    return {
      url,
      title: "Extraction Fallback",
      text: `Could not retrieve HTML content from source URL. Error: ${err.message}`,
      authors: [],
      publish_date: new Date().toISOString(),
      top_image: null,
      images: [],
      videos: [],
      source: "Unknown",
      meta: { description: err.message }
    };
  }
}

// 2. Fetch Live News Feeds with Caching & Deduplication
export async function getLiveNewsFeed(params: {
  country?: string;
  category?: string;
  force_refresh?: boolean;
  limit_per_feed?: number;
  dedupe?: boolean;
  dedupe_fuzzy?: boolean;
}): Promise<any[]> {
  const countryKey = params.country ? params.country.toLowerCase().trim() : null;
  const categoryKey = params.category ? params.category.toLowerCase().trim() : "news";

  const cacheKey = countryKey ? `country:${countryKey}` : `category:${categoryKey}`;

  // Check cache
  if (!params.force_refresh) {
    const cached = feedCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      console.log(`⚡ [open-news] Serving cached feeds for ${cacheKey}`);
      let data = cached.data;
      if (params.dedupe !== false) {
        data = dedupeArticles(data, params.dedupe_fuzzy || false);
      }
      return data;
    }
  }

  const feedUrls = FEED_REGISTRY[cacheKey] || FEED_REGISTRY["category:news"];
  console.log(`🌐 [open-news] Fetching live feeds for ${cacheKey} (${feedUrls.length} feeds)...`);

  const feedResults = await Promise.allSettled(
    feedUrls.map(async (fUrl) => {
      try {
        const feed = await rssParser.parseURL(fUrl);
        const limit = params.limit_per_feed || 8;
        return feed.items.slice(0, limit).map(item => {
          let sourceName = feed.title || "Live Wire";
          if (item.link?.includes("news.google.com")) {
            const titleParts = (item.title || "").split(" - ");
            if (titleParts.length > 1) {
              sourceName = titleParts[titleParts.length - 1];
            }
          }
          return {
            title: item.title || "Headline Update",
            url: item.link || item.guid || fUrl,
            source: sourceName,
            published: item.pubDate || item.isoDate || new Date().toISOString(),
            description: (item.contentSnippet || item.content || "").replace(/<[^>]+>/g, "").slice(0, 300),
            category: categoryKey,
            country: countryKey || "global"
          };
        });
      } catch (err: any) {
        console.warn(`[open-news] Feed parse error for ${fUrl}:`, err.message);
        return [];
      }
    })
  );

  let rawArticles: any[] = [];
  feedResults.forEach(res => {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      rawArticles.push(...res.value);
    }
  });

  // Cache raw result
  feedCache.set(cacheKey, { timestamp: Date.now(), data: rawArticles });

  let finalArticles = rawArticles;
  if (params.dedupe !== false) {
    finalArticles = dedupeArticles(rawArticles, params.dedupe_fuzzy || false);
  }

  return finalArticles;
}

// 3. Search News via Google News RSS
export async function searchNews(query: string, limit: number = 10): Promise<any[]> {
  try {
    const encodedQ = encodeURIComponent(query);
    const searchFeedUrl = `https://news.google.com/rss/search?q=${encodedQ}&hl=en-US&gl=US&ceid=US:en`;
    const feed = await rssParser.parseURL(searchFeedUrl);

    return feed.items.slice(0, limit).map(item => {
      let sourceName = "Google News Search";
      const titleParts = (item.title || "").split(" - ");
      let cleanTitle = item.title || "";
      if (titleParts.length > 1) {
        sourceName = titleParts.pop() || "News Outlet";
        cleanTitle = titleParts.join(" - ");
      }

      return {
        title: cleanTitle.trim(),
        url: item.link || searchFeedUrl,
        source: sourceName.trim(),
        published: item.pubDate || item.isoDate || new Date().toISOString(),
        description: (item.contentSnippet || item.content || "").replace(/<[^>]+>/g, "").slice(0, 300)
      };
    });
  } catch (err: any) {
    console.error("Error in open-news searchNews:", err.message);
    return [];
  }
}

// 4. Site-Specific Search
export async function searchSite(keyword: string, domain: string, limit: number = 10): Promise<any[]> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  const scopedQuery = `site:${cleanDomain} ${keyword}`;
  const results = await searchNews(scopedQuery, limit * 2);

  // Post-fetch domain filter
  const filtered = results.filter(r => {
    const rUrl = r.url.toLowerCase();
    const rDesc = r.description.toLowerCase();
    return rUrl.includes(cleanDomain) || r.source.toLowerCase().includes(cleanDomain.split(".")[0]);
  });

  return filtered.length > 0 ? filtered.slice(0, limit) : results.slice(0, limit);
}

// 5. Discover & Fetch RSS from Website Homepage
export async function discoverAndFetchRss(websiteUrl: string, limit: number = 10): Promise<{ feeds: string[]; articles: any[] }> {
  let targetUrl = websiteUrl;
  if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;

  const discoveredFeeds: string[] = [];

  // 1. Fetch Homepage HTML to look for <link rel="alternate">
  try {
    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) open-news/0.2.0" }
    });
    if (res.ok) {
      const html = await res.text();
      const rssLinks = [...html.matchAll(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]+href=["']([^"']+)["']/gi)];
      for (const m of rssLinks) {
        let feedHref = m[2];
        if (feedHref.startsWith("/")) {
          const origin = new URL(targetUrl).origin;
          feedHref = `${origin}${feedHref}`;
        }
        discoveredFeeds.push(feedHref);
      }
    }
  } catch (e) {
    console.warn("Could not fetch site HTML for RSS discovery:", e);
  }

  // Fallback candidate paths if none found in HTML
  if (discoveredFeeds.length === 0) {
    const origin = new URL(targetUrl).origin;
    discoveredFeeds.push(`${origin}/feed`, `${origin}/rss.xml`, `${origin}/atom.xml`, `${origin}/rss`);
  }

  // Try parsing the discovered feeds
  let articles: any[] = [];
  for (const feedUrl of discoveredFeeds) {
    try {
      const parsed = await rssParser.parseURL(feedUrl);
      if (parsed.items && parsed.items.length > 0) {
        articles = parsed.items.slice(0, limit).map(item => ({
          title: item.title || "Feed Article",
          url: item.link || item.guid || feedUrl,
          source: parsed.title || new URL(websiteUrl).hostname,
          published: item.pubDate || item.isoDate || new Date().toISOString(),
          description: (item.contentSnippet || item.content || "").replace(/<[^>]+>/g, "").slice(0, 300)
        }));
        break; // Successfully got items from this feed
      }
    } catch {
      // Continue to next feed candidate
    }
  }

  return {
    feeds: discoveredFeeds,
    articles
  };
}

// 6. Batch Fetch & Summarize using Gemini AI
export async function batchFetchAndSummarize(
  urls: string[],
  sentenceCount: number = 3,
  includeFullText: boolean = false,
  includeImagesVideos: boolean = false,
  apiKey?: string
): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || "" });

  const results = await Promise.all(
    urls.map(async (u) => {
      try {
        const ext = await fetchArticleContent(u);

        if (!ext.text || ext.text.length < 50) {
          return {
            url: u,
            status: "failed",
            error: "Article body text could not be extracted"
          };
        }

        // Call Gemini 3.6 Flash for concise summary
        let summaryText = "";
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Please summarize the following news article text in exactly ${sentenceCount} key bullet points/sentences:\n\nTitle: ${ext.title}\nText: ${ext.text.slice(0, 3000)}`,
          });
          summaryText = response.text || ext.meta.description || ext.text.slice(0, 300);
        } catch {
          // Extractive fallback summary
          const sents = ext.text.split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
          summaryText = sents.slice(0, sentenceCount).join(" ");
        }

        const item: any = {
          url: u,
          status: "success",
          title: ext.title,
          summary: summaryText,
        };

        if (includeFullText) item.text = ext.text;
        if (includeImagesVideos) {
          item.images = ext.images;
          item.videos = ext.videos;
          item.top_image = ext.top_image;
        }

        return item;
      } catch (err: any) {
        return {
          url: u,
          status: "failed",
          error: err.message
        };
      }
    })
  );

  return results;
}

// Clear Feed Cache
export function clearOpenNewsCache(category?: string, country?: string): { cleared: boolean; message: string } {
  if (category) {
    feedCache.delete(`category:${category.toLowerCase()}`);
    return { cleared: true, message: `Cleared cache for category: ${category}` };
  }
  if (country) {
    feedCache.delete(`country:${country.toLowerCase()}`);
    return { cleared: true, message: `Cleared cache for country: ${country}` };
  }
  feedCache.clear();
  return { cleared: true, message: "Cleared all open-news feed caches" };
}
