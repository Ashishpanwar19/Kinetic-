import React, { useState, useEffect } from 'react';
import { ExtractedArticle, OpenNewsLiveItem, BatchSummarizeResult, OpenNewsCategoryCountryInfo } from '../types';

const DEFAULT_CATEGORIES = [
  "news", "business", "politics", "geopolitics", "tech", "science", "sports", "entertainment"
];

const DEFAULT_COUNTRIES = [
  { code: "india", name: "India", flag: "🇮🇳" },
  { code: "usa", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "germany", name: "Germany", flag: "🇩🇪" },
  { code: "japan", name: "Japan", flag: "🇯🇵" },
  { code: "france", name: "France", flag: "🇫🇷" },
  { code: "canada", name: "Canada", flag: "🇨🇦" },
  { code: "australia", name: "Australia", flag: "🇦🇺" },
  { code: "brazil", name: "Brazil", flag: "🇧🇷" },
  { code: "singapore", name: "Singapore", flag: "🇸🇬" }
];

interface OpenNewsStudioProps {
  onOpenArticleDetail?: (article: any) => void;
}

export const OpenNewsStudioView: React.FC<OpenNewsStudioProps> = ({ onOpenArticleDetail }) => {
  const [activeTab, setActiveTab] = useState<'extractor' | 'live' | 'search' | 'rss' | 'batch' | 'code'>('live');

  // Extractor State
  const [extractUrl, setExtractUrl] = useState('https://techcrunch.com');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedArticle | null>(null);

  // Live News State
  const [categoriesCountries, setCategoriesCountries] = useState<OpenNewsCategoryCountryInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('news');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [dedupeExact, setDedupeExact] = useState(true);
  const [dedupeFuzzy, setDedupeFuzzy] = useState(false);
  const [liveArticles, setLiveArticles] = useState<OpenNewsLiveItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Search & Site Search State
  const [searchQuery, setSearchQuery] = useState('artificial intelligence');
  const [siteDomain, setSiteDomain] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // RSS Discovery State
  const [rssWebsite, setRssWebsite] = useState('https://techcrunch.com');
  const [discoveredFeeds, setDiscoveredFeeds] = useState<string[]>([]);
  const [rssArticles, setRssArticles] = useState<any[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);

  // Batch Summarize State
  const [batchUrlsInput, setBatchUrlsInput] = useState(
    "https://techcrunch.com\nhttps://www.bbc.com/news\nhttps://www.reuters.com"
  );
  const [sentenceCount, setSentenceCount] = useState(3);
  const [batchResults, setBatchResults] = useState<BatchSummarizeResult[]>([]);
  const [isBatching, setIsBatching] = useState(false);

  // Python Code View State
  const [codeMode, setCodeMode] = useState<'python' | 'curl' | 'js'>('python');

  // Load Categories & Countries on Mount
  useEffect(() => {
    fetch('/api/open-news/categories-countries')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.countries) {
          setCategoriesCountries(data);
        }
      })
      .catch(err => console.error("Error loading categories/countries:", err));

    fetchLiveNews();
  }, []);

  // Fetch Live News
  const fetchLiveNews = async (overrideRefresh?: boolean) => {
    setIsLoadingLive(true);
    try {
      const isRef = overrideRefresh !== undefined ? overrideRefresh : forceRefresh;
      let endpoint = `/api/open-news/live-news?dedupe=${dedupeExact}&dedupe_fuzzy=${dedupeFuzzy}`;
      if (isRef) endpoint += `&force_refresh=true`;
      if (selectedCountry) {
        endpoint += `&country=${encodeURIComponent(selectedCountry)}`;
      } else {
        endpoint += `&category=${encodeURIComponent(selectedCategory)}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLiveArticles(data);
      }
    } catch (err) {
      console.error("Failed to fetch live news:", err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Extract Article Content
  const handleExtractArticle = async (urlToExtract?: string) => {
    const targetUrl = urlToExtract || extractUrl;
    if (!targetUrl.trim()) return;
    setIsExtracting(true);
    setExtractedData(null);
    try {
      const res = await fetch('/api/open-news/fetch-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim() })
      });
      const data = await res.json();
      setExtractedData(data);
    } catch (err) {
      console.error("Extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Perform Search or Site Search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      let res;
      if (siteDomain.trim()) {
        res = await fetch('/api/open-news/search-site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: searchQuery.trim(), domain: siteDomain.trim(), limit: 12 })
        });
      } else {
        res = await fetch('/api/open-news/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: searchQuery.trim(), limit: 12 })
        });
      }
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Discover RSS
  const handleDiscoverRss = async () => {
    if (!rssWebsite.trim()) return;
    setIsDiscovering(true);
    setDiscoveredFeeds([]);
    setRssArticles([]);
    try {
      const res = await fetch('/api/open-news/rss-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_url: rssWebsite.trim(), limit: 10 })
      });
      const data = await res.json();
      if (data.feeds) setDiscoveredFeeds(data.feeds);
      if (data.articles) setRssArticles(data.articles);
    } catch (err) {
      console.error("RSS Discovery error:", err);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Batch Summarize
  const handleBatchSummarize = async () => {
    const urls = batchUrlsInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (urls.length === 0) return;
    setIsBatching(true);
    setBatchResults([]);
    try {
      const res = await fetch('/api/open-news/batch-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          sentence_count: sentenceCount,
          include_full_text: true,
          include_images_videos: true
        })
      });
      const data = await res.json();
      if (Array.isArray(data)) setBatchResults(data);
    } catch (err) {
      console.error("Batch summarization error:", err);
    } finally {
      setIsBatching(false);
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 text-white pb-28">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#121127] via-[#1a183d] to-[#0d0c1d] border border-[#00D1FF]/30 rounded-2xl p-6 mb-6 shadow-[0_0_30px_rgba(0,209,255,0.15)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-[#00D1FF]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#00D1FF] text-black font-extrabold text-xs px-2.5 py-0.5 rounded-full font-mono-caps">
                OPEN-NEWS ENGINE v0.2.0
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-mono-caps">
                Zero-Config RSS & Extraction
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-sora font-extrabold text-white tracking-tight">
              Batteries-Included Article Extractor & Feed Aggregator
            </h1>
            <p className="text-sm text-[#bbc9cf] mt-1 max-w-2xl font-sans">
              Full Python <code className="text-[#00D1FF] bg-black/40 px-1.5 py-0.5 rounded">open-news-api</code> parity: LXML metadata extraction, auto-discovering feeds, Google News search with decoded links, smart 24h caching, and batch summarization.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                fetch('/api/open-news/clear-cache', { method: 'POST' })
                  .then(() => fetchLiveNews(true));
              }}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs px-3.5 py-2 rounded-xl transition-all font-mono-caps flex items-center gap-1.5 cursor-pointer"
              title="Clear 24h Feed Cache & Force Refresh"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Force Refresh Cache</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-white/10 pt-4 scrollbar-none">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'live'
                ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">rss_feed</span>
            <span>Live Feeds ({liveArticles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('extractor')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'extractor'
                ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">article</span>
            <span>Article Extractor</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">search</span>
            <span>Google & Site Search</span>
          </button>

          <button
            onClick={() => setActiveTab('rss')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'rss'
                ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">travel_explore</span>
            <span>RSS Feed Discovery</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>Batch Summarizer</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#EA4C89] text-white shadow-[0_0_15px_rgba(234,76,137,0.4)]'
                : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">code</span>
            <span>Python & REST Code</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE NEWS FEEDS */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-[#121127] border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono-caps text-[#bbc9cf] mr-1">Category:</span>
                {(categoriesCountries?.categories || DEFAULT_CATEGORIES).map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCountry('');
                      setSelectedCategory(cat);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-caps transition-all cursor-pointer capitalize ${
                      !selectedCountry && selectedCategory === cat
                        ? 'bg-[#00D1FF] text-black font-bold'
                        : 'bg-white/5 text-[#bbc9cf] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Country selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono-caps text-[#bbc9cf]">Country:</span>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-[#1d1b38] text-white text-xs font-mono-caps px-3 py-1.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF] cursor-pointer"
                >
                  <option value="">-- All / Category Feed --</option>
                  {(categoriesCountries?.countries || DEFAULT_COUNTRIES).map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dedupe & Cache Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10 text-xs text-[#bbc9cf]">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dedupeExact}
                    onChange={(e) => setDedupeExact(e.target.checked)}
                    className="accent-[#00D1FF] rounded"
                  />
                  <span>Dedupe Exact URLs</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dedupeFuzzy}
                    onChange={(e) => setDedupeFuzzy(e.target.checked)}
                    className="accent-[#00D1FF] rounded"
                  />
                  <span>Fuzzy Title Matching</span>
                </label>
              </div>

              <button
                onClick={() => fetchLiveNews()}
                disabled={isLoadingLive}
                className="bg-[#00D1FF] hover:bg-[#00b0d9] text-black font-mono-caps font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_0_12px_rgba(0,209,255,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingLive ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Syncing Feeds...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">sync</span>
                    <span>Fetch Feeds</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Articles Grid */}
          {isLoadingLive ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-10 h-10 border-4 border-[#00D1FF] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-mono-caps text-[#00D1FF]">Agreggating Live RSS Feeds...</p>
              <p className="text-xs text-[#bbc9cf] mt-1">Merging curated feeds with Google News RSS & applying deduplication.</p>
            </div>
          ) : liveArticles.length === 0 ? (
            <div className="bg-[#121127] border border-white/10 rounded-2xl p-12 text-center text-[#bbc9cf]">
              <span className="material-symbols-outlined text-4xl mb-2 text-[#00D1FF]">rss_feed</span>
              <p className="text-sm font-mono-caps text-white">No articles loaded for selected filters.</p>
              <button
                onClick={() => fetchLiveNews(true)}
                className="mt-4 bg-[#00D1FF] text-black px-4 py-2 rounded-xl text-xs font-mono-caps font-bold cursor-pointer"
              >
                Fetch Fresh Articles
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveArticles.map((art, idx) => (
                <div
                  key={idx}
                  className="bg-[#121127] border border-white/10 hover:border-[#00D1FF]/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,209,255,0.15)] group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono-caps text-[#00D1FF] font-bold bg-[#00D1FF]/10 border border-[#00D1FF]/20 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                        {art.source}
                      </span>
                      <span className="text-[10px] text-[#bbc9cf] font-mono-caps">
                        {new Date(art.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-sora font-bold text-sm text-white group-hover:text-[#00D1FF] transition-colors line-clamp-2 leading-snug mb-2">
                      {art.title}
                    </h3>

                    <p className="text-xs text-[#bbc9cf] line-clamp-3 leading-relaxed mb-4">
                      {art.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <button
                      onClick={() => {
                        setActiveTab('extractor');
                        setExtractUrl(art.url);
                        handleExtractArticle(art.url);
                      }}
                      className="text-xs text-[#00D1FF] hover:text-white font-mono-caps font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">find_in_page</span>
                      <span>Extract LXML</span>
                    </button>

                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#bbc9cf] hover:text-white font-mono-caps flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Original</span>
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARTICLE EXTRACTOR */}
      {activeTab === 'extractor' && (
        <div className="space-y-6">
          <div className="bg-[#121127] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-sora font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">article</span>
              <span>LXML Article Body & Metadata Extractor</span>
            </h2>
            <p className="text-xs text-[#bbc9cf] mb-4">
              Pass any article URL to extract headline, authors, publish timestamp, lead image, videos, and body paragraphs directly from raw HTML.
            </p>

            {/* Quick Fill Presets */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="text-xs font-mono-caps text-[#bbc9cf]">Sample Presets:</span>
              <button
                onClick={() => { setExtractUrl('https://techcrunch.com'); handleExtractArticle('https://techcrunch.com'); }}
                className="bg-white/5 hover:bg-white/15 text-xs text-[#00D1FF] px-2.5 py-1 rounded-lg border border-white/10 font-mono-caps cursor-pointer"
              >
                TechCrunch
              </button>
              <button
                onClick={() => { setExtractUrl('https://www.bbc.com/news'); handleExtractArticle('https://www.bbc.com/news'); }}
                className="bg-white/5 hover:bg-white/15 text-xs text-[#00D1FF] px-2.5 py-1 rounded-lg border border-white/10 font-mono-caps cursor-pointer"
              >
                BBC News
              </button>
              <button
                onClick={() => { setExtractUrl('https://pib.gov.in'); handleExtractArticle('https://pib.gov.in'); }}
                className="bg-white/5 hover:bg-white/15 text-xs text-[#00D1FF] px-2.5 py-1 rounded-lg border border-white/10 font-mono-caps cursor-pointer"
              >
                PIB India
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="url"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                placeholder="https://example.com/article-slug"
                className="w-full bg-[#1b1a36] text-white text-sm px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF]"
              />
              <button
                onClick={() => handleExtractArticle()}
                disabled={isExtracting}
                className="w-full sm:w-auto bg-[#00D1FF] hover:bg-[#00b0d9] text-black font-mono-caps font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isExtracting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Extract Article</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extracted Article Result */}
          {extractedData && (
            <div className="bg-[#121127] border border-[#00D1FF]/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#00D1FF]/20 text-[#00D1FF] font-mono-caps text-xs px-2.5 py-0.5 rounded-full border border-[#00D1FF]/30 font-bold">
                    {extractedData.source}
                  </span>
                  {extractedData.publish_date && (
                    <span className="text-xs text-[#bbc9cf] font-mono-caps">
                      Published: {new Date(extractedData.publish_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h1 className="text-xl md:text-2xl font-sora font-extrabold text-white leading-tight">
                  {extractedData.title}
                </h1>

                {extractedData.authors.length > 0 && (
                  <p className="text-xs text-[#bbc9cf] mt-2 font-mono-caps">
                    By: {extractedData.authors.join(', ')}
                  </p>
                )}
              </div>

              {/* Lead Image if available */}
              {extractedData.top_image && (
                <div className="w-full max-h-[350px] overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={extractedData.top_image}
                    alt={extractedData.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Body Text */}
              <div>
                <h3 className="text-xs font-mono-caps text-[#00D1FF] font-bold mb-2">Extracted Body Text</h3>
                <div className="bg-[#191834] p-5 rounded-xl border border-white/10 text-sm text-[#e3dffe] leading-relaxed whitespace-pre-line max-h-[400px] overflow-y-auto">
                  {extractedData.text}
                </div>
              </div>

              {/* Images & Videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-mono-caps text-[#bbc9cf] mb-2">Body Images ({extractedData.images.length})</h4>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {extractedData.images.map((img, i) => (
                      <img key={i} src={img} alt={`Asset ${i}`} className="w-20 h-20 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono-caps text-[#bbc9cf] mb-2">Embedded Video Media ({extractedData.videos.length})</h4>
                  <div className="text-xs text-[#00D1FF]">
                    {extractedData.videos.map((vid, i) => (
                      <a key={i} href={vid} target="_blank" rel="noopener noreferrer" className="block truncate hover:underline">
                        📺 {vid}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SEARCH & SITE SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-[#121127] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-sora font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">search</span>
              <span>Google News & Single-Site Scoped Search</span>
            </h2>
            <p className="text-xs text-[#bbc9cf]">
              Search real decoded news articles via Google News RSS or scope your search to a specific domain using <code className="text-[#00D1FF]">search_site()</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs font-mono-caps text-[#bbc9cf] mb-1 block">Search Query:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query e.g. climate change, quantum computing..."
                  className="w-full bg-[#1b1a36] text-white text-sm px-4 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF]"
                />
              </div>

              <div>
                <label className="text-xs font-mono-caps text-[#bbc9cf] mb-1 block">Domain Filter (Optional):</label>
                <input
                  type="text"
                  value={siteDomain}
                  onChange={(e) => setSiteDomain(e.target.value)}
                  placeholder="e.g. reuters.com, bbc.com"
                  className="w-full bg-[#1b1a36] text-white text-sm px-4 py-2.5 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF]"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-[#00D1FF] hover:bg-[#00b0d9] text-black font-mono-caps font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Searching News...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">search</span>
                  <span>{siteDomain ? 'Search Domain' : 'Search Global News'}</span>
                </>
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((item, idx) => (
                <div key={idx} className="bg-[#121127] border border-white/10 hover:border-[#00D1FF]/50 p-5 rounded-2xl flex flex-col justify-between transition-all">
                  <div>
                    <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold bg-[#00D1FF]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                      {item.source}
                    </span>
                    <h3 className="font-sora font-bold text-sm text-white leading-snug mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#bbc9cf] line-clamp-3 mb-4">
                      {item.description}
                    </p>
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00D1FF] hover:underline font-mono-caps flex items-center gap-1 border-t border-white/10 pt-3"
                  >
                    <span>View Decoded Link</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RSS DISCOVERY */}
      {activeTab === 'rss' && (
        <div className="space-y-6">
          <div className="bg-[#121127] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-sora font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">travel_explore</span>
              <span>Website RSS Auto-Discovery Engine</span>
            </h2>
            <p className="text-xs text-[#bbc9cf]">
              Enter any news website domain homepage (e.g. <code className="text-[#00D1FF]">techcrunch.com</code>). The engine will parse HTML header tags and feed candidates to auto-discover active RSS feeds!
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="url"
                value={rssWebsite}
                onChange={(e) => setRssWebsite(e.target.value)}
                placeholder="https://techcrunch.com"
                className="w-full bg-[#1b1a36] text-white text-sm px-4 py-3 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF]"
              />
              <button
                onClick={handleDiscoverRss}
                disabled={isDiscovering}
                className="w-full sm:w-auto bg-[#00D1FF] hover:bg-[#00b0d9] text-black font-mono-caps font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isDiscovering ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Discovering Feeds...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">radar</span>
                    <span>Discover RSS Feeds</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {discoveredFeeds.length > 0 && (
            <div className="bg-[#121127] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-mono-caps text-[#00D1FF] font-bold">Discovered Feed URLs ({discoveredFeeds.length})</h3>
              <div className="space-y-1">
                {discoveredFeeds.map((f, i) => (
                  <div key={i} className="text-xs text-[#e3dffe] font-mono bg-black/30 p-2 rounded border border-white/10 truncate">
                    📡 {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rssArticles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rssArticles.map((art, idx) => (
                <div key={idx} className="bg-[#121127] border border-white/10 p-5 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="font-sora font-bold text-sm text-white mb-2">{art.title}</h4>
                    <p className="text-xs text-[#bbc9cf] line-clamp-3 mb-4">{art.description}</p>
                  </div>
                  <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00D1FF] hover:underline font-mono-caps flex items-center gap-1">
                    <span>Read Discovered Feed Item</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BATCH SUMMARIZER */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          <div className="bg-[#121127] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-sora font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">auto_awesome</span>
              <span>Concurrent Batch Article Fetcher & Summarizer</span>
            </h2>
            <p className="text-xs text-[#bbc9cf]">
              Input multiple article URLs (one per line) to process concurrently with Gemini AI high-speed summarization.
            </p>

            <textarea
              value={batchUrlsInput}
              onChange={(e) => setBatchUrlsInput(e.target.value)}
              rows={4}
              className="w-full bg-[#1b1a36] text-white text-xs font-mono p-4 rounded-xl border border-white/20 focus:outline-none focus:border-[#00D1FF]"
              placeholder="https://example.com/article1&#10;https://example.com/article2"
            />

            <div className="flex items-center gap-4">
              <label className="text-xs font-mono-caps text-[#bbc9cf] flex items-center gap-2">
                <span>Summary Sentence Count:</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={sentenceCount}
                  onChange={(e) => setSentenceCount(parseInt(e.target.value, 10) || 3)}
                  className="bg-[#1b1a36] text-white px-2 py-1 rounded border border-white/20 w-16 text-center"
                />
              </label>

              <button
                onClick={handleBatchSummarize}
                disabled={isBatching}
                className="bg-[#00D1FF] hover:bg-[#00b0d9] text-black font-mono-caps font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBatching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Summarizing Batch...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">bolt</span>
                    <span>Run Batch Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {batchResults.length > 0 && (
            <div className="space-y-4">
              {batchResults.map((res, i) => (
                <div key={i} className="bg-[#121127] border border-white/10 rounded-2xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono-caps px-2 py-0.5 rounded ${res.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {(res.status || 'error').toUpperCase()}
                    </span>
                    <span className="text-xs text-[#bbc9cf] truncate max-w-[300px]">{res.url}</span>
                  </div>

                  {res.title && <h3 className="font-sora font-bold text-sm text-white">{res.title}</h3>}
                  {res.summary && (
                    <div className="bg-[#1a183d] p-3 rounded-lg text-xs text-[#e3dffe] leading-relaxed border border-white/10">
                      <strong>Summary:</strong> {res.summary}
                    </div>
                  )}
                  {res.error && <p className="text-xs text-red-400">Error: {res.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PYTHON & REST CODE GENERATOR */}
      {activeTab === 'code' && (
        <div className="bg-[#121127] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-lg font-sora font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#EA4C89]">code</span>
              <span>Python SDK & REST API Code Generator</span>
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCodeMode('python')}
                className={`px-3 py-1 rounded-lg text-xs font-mono-caps font-bold cursor-pointer ${codeMode === 'python' ? 'bg-[#EA4C89] text-white' : 'bg-white/5 text-[#bbc9cf]'}`}
              >
                Python SDK
              </button>
              <button
                onClick={() => setCodeMode('curl')}
                className={`px-3 py-1 rounded-lg text-xs font-mono-caps font-bold cursor-pointer ${codeMode === 'curl' ? 'bg-[#EA4C89] text-white' : 'bg-white/5 text-[#bbc9cf]'}`}
              >
                cURL
              </button>
              <button
                onClick={() => setCodeMode('js')}
                className={`px-3 py-1 rounded-lg text-xs font-mono-caps font-bold cursor-pointer ${codeMode === 'js' ? 'bg-[#EA4C89] text-white' : 'bg-white/5 text-[#bbc9cf]'}`}
              >
                JavaScript fetch
              </button>
            </div>
          </div>

          <div className="bg-black/50 p-5 rounded-xl border border-white/10 font-mono text-xs text-[#00D1FF] overflow-x-auto leading-relaxed">
            {codeMode === 'python' && (
              <pre>{`# Install open-news library:
# pip install open-news-api

from open_news import fetch_article, live_news, search_news, search_site

# 1. Extract Article Content & Metadata
article = fetch_article("${extractUrl}")
print(article["title"])
print(article["text"][:300])

# 2. Get Live Country-Specific News
india_news = live_news(country="india", limit_per_feed=5, dedupe=True)

# 3. Search News across Google News
results = search_news("${searchQuery}", limit=5)

# 4. Search single news domain
site_results = search_site("quantum", domain="reuters.com", limit=5)`}</pre>
            )}

            {codeMode === 'curl' && (
              <pre>{`# 1. Article Extractor
curl -X POST "${window.location.origin}/api/open-news/fetch-article" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "${extractUrl}"}'

# 2. Live News Feeds
curl "${window.location.origin}/api/open-news/live-news?category=news&dedupe=true"

# 3. Search Site
curl -X POST "${window.location.origin}/api/open-news/search-site" \\
  -H "Content-Type: application/json" \\
  -d '{"keyword": "${searchQuery}", "domain": "bbc.com"}'`}</pre>
            )}

            {codeMode === 'js' && (
              <pre>{`// Fetch live feeds from Open News REST API
const response = await fetch('/api/open-news/live-news?country=india&dedupe=true');
const articles = await response.json();
console.log(articles);`}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
