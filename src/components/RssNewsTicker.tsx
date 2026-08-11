import React, { useState, useEffect, useRef } from 'react';

interface TickerArticle {
  title: string;
  link: string;
  pubDate?: string;
  source?: string;
  videoUrl?: string;
}

interface RssNewsTickerProps {
  onArticleClick?: (article: { title: string; link: string }) => void;
}

const PRESET_FEEDS = [
  { name: 'Health Tech', query: 'health-technology' },
  { name: 'AI & Tech', query: 'artificial-intelligence' },
  { name: 'World News', query: 'world-news' },
  { name: 'Business', query: 'global-economy' },
  { name: 'Science', query: 'space-science' },
];

const SAMPLE_REEL_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutback2012.mp4',
];

export const RssNewsTicker: React.FC<RssNewsTickerProps> = ({ onArticleClick }) => {
  const [articles, setArticles] = useState<TickerArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('health-technology');
  const [scrollSpeed, setScrollSpeed] = useState<number>(80); // Default 80s as per README
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Reel Video Mode States
  const [displayMode, setDisplayMode] = useState<'ticker' | 'reel'>('reel');
  const [currentReelIndex, setCurrentReelIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlayingReel, setIsPlayingReel] = useState<boolean>(true);
  const [showFullReelModal, setShowFullReelModal] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const fetchFeed = async (topic: string) => {
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Encoded Google News feed via rss2json API
      const targetUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(apiUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
        const fetchedArticles: TickerArticle[] = data.items.map((item: any, idx: number) => ({
          title: item.title?.replace(/ - [^-]+$/, '') || item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: item.author || 'Live Feed',
          videoUrl: SAMPLE_REEL_VIDEOS[idx % SAMPLE_REEL_VIDEOS.length],
        }));
        setArticles(fetchedArticles);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.message || 'No articles found in feed.');
      }
    } catch (err: any) {
      console.warn('News Ticker primary fetch notice, trying fallback endpoint:', err.message);
      try {
        const fallbackRes = await fetch(`/api/news/search?q=${encodeURIComponent(topic)}&limit=10`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.articles && fallbackData.articles.length > 0) {
            setArticles(
              fallbackData.articles.map((a: any, idx: number) => ({
                title: a.title,
                link: a.url || '#',
                source: a.source_id || 'Global News',
                videoUrl: SAMPLE_REEL_VIDEOS[idx % SAMPLE_REEL_VIDEOS.length],
              }))
            );
            setLastUpdated(new Date());
            setLoading(false);
            return;
          }
        }
      } catch (fallbackErr) {
        // Ignore fallback error
      }

      // High-quality fallback headlines with video links if offline
      setArticles([
        { title: 'Global Tech Summit Highlights AI Breakthroughs in Healthcare', link: '#', source: 'HealthTech', videoUrl: SAMPLE_REEL_VIDEOS[0] },
        { title: 'Next-Gen Quantum Computing Chips Achieve Quantum Supremacy Milestone', link: '#', source: 'Tech Pulse', videoUrl: SAMPLE_REEL_VIDEOS[1] },
        { title: 'Renewable Energy Grid Investments Reach Record High Worldwide', link: '#', source: 'EcoNews', videoUrl: SAMPLE_REEL_VIDEOS[2] },
        { title: 'Autonomous Space Rovers Discover Organic Compounds on Mars', link: '#', source: 'AstroDaily', videoUrl: SAMPLE_REEL_VIDEOS[3] },
      ]);
      setError('Live feed updating via system backup mode');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(activeTopic);

    // Auto-refresh every 5 minutes (300,000ms)
    const intervalId = setInterval(() => {
      fetchFeed(activeTopic);
    }, 300000);

    return () => clearInterval(intervalId);
  }, [activeTopic]);

  // Auto-advance Reel every 8 seconds if playing
  useEffect(() => {
    if (displayMode === 'reel' && isPlayingReel && articles.length > 0) {
      const timer = setTimeout(() => {
        setCurrentReelIndex((prev) => (prev + 1) % articles.length);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [displayMode, isPlayingReel, currentReelIndex, articles.length]);

  const handleTopicChange = (newTopic: string) => {
    setActiveTopic(newTopic);
    setCurrentReelIndex(0);
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      setActiveTopic(customQuery.trim());
      setCustomQuery('');
      setCurrentReelIndex(0);
    }
  };

  const nextReel = () => {
    if (articles.length > 0) {
      setCurrentReelIndex((prev) => (prev + 1) % articles.length);
    }
  };

  const prevReel = () => {
    if (articles.length > 0) {
      setCurrentReelIndex((prev) => (prev - 1 + articles.length) % articles.length);
    }
  };

  const currentArticle = articles[currentReelIndex] || articles[0];

  return (
    <div className="w-full bg-[#16152B] border-b border-white/10 text-white select-none overflow-hidden transition-all duration-300">
      {/* Top Banner Row */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 bg-[#0f0e21] border-b border-white/5 text-xs">
        {/* Brand Badge & Mode Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#FFB800]/20 text-[#FFB800] px-2.5 py-1 rounded-full border border-[#FFB800]/40 font-mono-caps font-extrabold text-[10px] tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#FFB800] animate-ping" />
            <span>LIVE NEWS FEED</span>
          </div>

          {/* Mode Switcher: Ticker vs Video Reel */}
          <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => setDisplayMode('reel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono-caps transition-all cursor-pointer ${
                displayMode === 'reel'
                  ? 'bg-[#00D1FF] text-black font-bold shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                  : 'text-[#bbc9cf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">movie</span>
              <span>Video Reel</span>
            </button>
            <button
              onClick={() => setDisplayMode('ticker')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono-caps transition-all cursor-pointer ${
                displayMode === 'ticker'
                  ? 'bg-[#00D1FF] text-black font-bold shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                  : 'text-[#bbc9cf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_stream</span>
              <span>Ticker Bar</span>
            </button>
          </div>

          {/* Preset Category Chips */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2">
            {PRESET_FEEDS.map((feed) => (
              <button
                key={feed.query}
                onClick={() => handleTopicChange(feed.query)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono-caps transition-all cursor-pointer ${
                  activeTopic === feed.query
                    ? 'bg-[#EA4C89] text-white font-bold shadow-[0_0_10px_rgba(234,76,137,0.4)]'
                    : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
                }`}
              >
                {feed.name}
              </button>
            ))}
          </div>
        </div>

        {/* Controls (Speed, Pause, Settings) */}
        <div className="flex items-center gap-3 shrink-0">
          {displayMode === 'ticker' ? (
            <>
              {/* Pause / Play Toggle for Ticker */}
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#00D1FF] text-[11px] font-mono-caps cursor-pointer transition-all"
                title={isPaused ? 'Resume Ticker Animation' : 'Pause Ticker Animation'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isPaused ? 'play_arrow' : 'pause'}
                </span>
                <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>

              {/* Speed Selector */}
              <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10 text-[11px] font-mono-caps">
                <span className="text-[#bbc9cf] hidden sm:inline">Speed:</span>
                <button
                  onClick={() => setScrollSpeed(120)}
                  className={`px-1.5 py-0.5 rounded ${scrollSpeed === 120 ? 'bg-[#00D1FF] text-black font-bold' : 'text-[#bbc9cf] hover:text-white'}`}
                >
                  Slow
                </button>
                <button
                  onClick={() => setScrollSpeed(80)}
                  className={`px-1.5 py-0.5 rounded ${scrollSpeed === 80 ? 'bg-[#00D1FF] text-black font-bold' : 'text-[#bbc9cf] hover:text-white'}`}
                >
                  Norm
                </button>
                <button
                  onClick={() => setScrollSpeed(40)}
                  className={`px-1.5 py-0.5 rounded ${scrollSpeed === 40 ? 'bg-[#00D1FF] text-black font-bold' : 'text-[#bbc9cf] hover:text-white'}`}
                >
                  Fast
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Reel Audio & Reel Full View Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#00D1FF] text-[11px] font-mono-caps cursor-pointer transition-all"
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                <span className="material-symbols-outlined text-sm">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
                <span className="hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
              </button>

              <button
                onClick={() => setShowFullReelModal(true)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 text-[11px] font-mono-caps hover:bg-[#00D1FF] hover:text-black cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">fullscreen</span>
                <span className="hidden sm:inline">FULL REEL MODE</span>
              </button>
            </>
          )}

          {/* Toggle Expand Settings */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#bbc9cf] hover:text-white cursor-pointer"
            title="Custom Feed Options"
          >
            <span className="material-symbols-outlined text-base">
              {isExpanded ? 'expand_less' : 'tune'}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Custom Search / Topic Bar */}
      {isExpanded && (
        <div className="px-4 py-3 bg-[#121127] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <form onSubmit={handleCustomSearch} className="flex items-center gap-2 flex-grow max-w-md">
            <input
              type="text"
              placeholder="Enter news topic (e.g. Robotics, Space, Crypto)..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-white placeholder-white/40 focus:outline-none focus:border-[#00D1FF]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#00D1FF] text-black font-bold font-sora rounded-lg hover:bg-[#a4e6ff] transition-all cursor-pointer whitespace-nowrap"
            >
              Fetch Feed
            </button>
          </form>

          <div className="flex items-center gap-2 text-[#bbc9cf] text-[11px] font-mono-caps">
            <span>Auto-refresh: Every 5m</span>
            <span>•</span>
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            <button
              onClick={() => fetchFeed(activeTopic)}
              className="p-1 text-[#00D1FF] hover:rotate-180 transition-transform duration-500 cursor-pointer ml-1"
              title="Refresh Feed Now"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* DISPLAY MODE 1: MOVING VIDEO REEL BANNER FORMAT */}
      {displayMode === 'reel' && (
        <div className="relative w-full h-[120px] md:h-[140px] bg-black overflow-hidden flex items-center border-y border-white/15">
          {/* Background Motion Video Stream */}
          {currentArticle?.videoUrl && (
            <video
              ref={videoRef}
              src={currentArticle.videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 filter brightness-90 scale-105 transition-all duration-700"
            />
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#121127] via-[#121127]/80 to-transparent z-10" />

          {/* Reel Content Overlay */}
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
            {/* Story Progress Bars */}
            <div className="absolute top-2 left-4 right-4 z-30 flex items-center gap-1.5">
              {articles.slice(0, 10).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentReelIndex(i)}
                  className={`h-1 flex-grow rounded-full cursor-pointer transition-all ${
                    i === currentReelIndex
                      ? 'bg-[#00D1FF] shadow-[0_0_8px_#00D1FF]'
                      : i < currentReelIndex
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Reel Details Card */}
            <div className="flex items-center gap-4 max-w-3xl mt-3">
              {/* Animated Reel Badge */}
              <div className="relative shrink-0 w-12 h-12 rounded-xl bg-[#00D1FF]/20 border border-[#00D1FF] flex items-center justify-center text-[#00D1FF]">
                <span className="material-symbols-outlined text-2xl animate-spin">
                  motion_photos_on
                </span>
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00D1FF]"></span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-[#EA4C89] text-white font-mono-caps font-bold text-[10px]">
                    REEL #{currentReelIndex + 1} / {articles.length}
                  </span>
                  <span className="text-xs text-[#00D1FF] font-mono-caps font-semibold">
                    {currentArticle?.source || 'LIVE NEWS'}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-sora font-bold text-white line-clamp-2 drop-shadow-md">
                  {currentArticle?.title || 'Loading Video Reel...'}
                </h3>
              </div>
            </div>

            {/* Reel Navigation & Interactive Buttons */}
            <div className="flex items-center gap-2 shrink-0 mt-3">
              <button
                onClick={prevReel}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                title="Previous Story"
              >
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>

              <button
                onClick={() => setIsPlayingReel(!isPlayingReel)}
                className="w-10 h-10 rounded-full bg-[#00D1FF] text-black hover:bg-[#a4e6ff] flex items-center justify-center font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,209,255,0.4)]"
                title={isPlayingReel ? 'Pause Auto-Reel' : 'Play Auto-Reel'}
              >
                <span className="material-symbols-outlined text-2xl">
                  {isPlayingReel ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <button
                onClick={nextReel}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
                title="Next Story"
              >
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>

              {currentArticle?.link && (
                <a
                  href={currentArticle.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono-caps text-white transition-all ml-2"
                >
                  <span>Open Story</span>
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISPLAY MODE 2: MOVING TICKER BANNER FORMAT */}
      {displayMode === 'ticker' && (
        <div
          id="newsTickerContainer"
          className="relative w-full overflow-hidden bg-[#FFB800] text-black py-2.5 px-4 font-sora font-medium text-sm border-y border-[#e6a600] flex items-center group cursor-pointer"
          style={{ whiteSpace: 'nowrap' }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-black font-mono-caps text-xs animate-pulse">
              <span className="material-symbols-outlined text-base animate-spin">sync</span>
              <span>Fetching live headlines ({activeTopic})...</span>
            </div>
          ) : articles.length > 0 ? (
            <div
              id="newsTicker"
              className="inline-block whitespace-nowrap"
              style={{
                animation: `tickerScroll ${scrollSpeed}s linear infinite`,
                animationPlayState: isPaused ? 'paused' : 'running',
              }}
            >
              {[...articles, ...articles].map((item, idx) => (
                <React.Fragment key={idx}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (onArticleClick && item.link === '#') {
                        e.preventDefault();
                        onArticleClick(item);
                      }
                    }}
                    className="inline-flex items-center gap-2 text-black hover:text-[#003B5C] font-semibold transition-colors duration-200 underline-offset-4 hover:underline mr-6 cursor-pointer"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/10 text-[10px] font-mono-caps font-bold">
                      {item.source || 'LIVE'}
                    </span>
                    <span>{item.title}</span>
                  </a>
                  <span className="text-black/40 font-bold mr-6 select-none">•</span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-black/80 font-mono text-xs">
              Latest news unavailable. Please refresh or try another topic.
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN VERTICAL REEL MODAL (TIKTOK/INSTAGRAM STYLE FOR NEWS) */}
      {showFullReelModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm aspect-[9/16] max-h-[85vh] rounded-3xl overflow-hidden bg-black border border-white/20 shadow-2xl flex flex-col justify-between">
            {/* Reel Video Player */}
            {currentArticle?.videoUrl && (
              <video
                ref={modalVideoRef}
                src={currentArticle.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 z-10" />

            {/* Top Bar: Close & Story Indicators */}
            <div className="relative z-20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-[#00D1FF] font-mono-caps">
                <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
                <span>VIDEO REEL</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isMuted ? 'volume_off' : 'volume_up'}
                  </span>
                </button>
                <button
                  onClick={() => setShowFullReelModal(false)}
                  className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            {/* Side Action Buttons */}
            <div className="relative z-20 self-end mr-4 mb-20 flex flex-col items-center gap-4">
              <button
                onClick={prevReel}
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-[#00D1FF] hover:text-black transition-all"
              >
                <span className="material-symbols-outlined text-2xl">arrow_upward</span>
              </button>
              <button
                onClick={nextReel}
                className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center hover:bg-[#00D1FF] hover:text-black transition-all"
              >
                <span className="material-symbols-outlined text-2xl">arrow_downward</span>
              </button>
            </div>

            {/* Bottom Caption & Headlines */}
            <div className="relative z-20 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#EA4C89] text-white font-mono-caps font-bold text-[10px]">
                  {currentArticle?.source || 'HEADLINE'}
                </span>
                <span className="text-xs text-white/70 font-mono">
                  Reel {currentReelIndex + 1} of {articles.length}
                </span>
              </div>

              <h2 className="text-lg font-sora font-bold text-white leading-snug drop-shadow-md">
                {currentArticle?.title}
              </h2>

              <a
                href={currentArticle?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#00D1FF] text-black font-sora font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#a4e6ff] transition-all shadow-lg"
              >
                <span>Read Full Article</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Inline Keyframes & Hover CSS */}
      <style>{`
        @keyframes tickerScroll {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }
        #newsTickerContainer:hover #newsTicker {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  );
};

