import React, { useState, useEffect } from 'react';
import { KnowledgeObject, SportsEvent } from '../types';
import { fetchNewsFromApi, fetchDirectNewsData } from '../services/newsDataService';
import { PulseNewsSidebar } from './PulseNewsSidebar';
import { LiveMatchVideoModal } from './LiveMatchVideoModal';

interface DiscoverViewProps {
  items: KnowledgeObject[];
  onSelectItem: (item: KnowledgeObject) => void;
  onCategorySelect?: (category: string) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  items,
  onSelectItem,
  onCategorySelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sportsEvents, setSportsEvents] = useState<SportsEvent[]>([]);
  const [isCapturingSports, setIsCapturingSports] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [captureStatusMsg, setCaptureStatusMsg] = useState<string | null>(null);

  // Live Match Video Feed Modal states
  const [isLiveMatchModalOpen, setIsLiveMatchModalOpen] = useState(false);
  const [selectedLiveMatchEvent, setSelectedLiveMatchEvent] = useState<SportsEvent | null>(null);

  // PulseNews view mode and sorting states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'relevance' | 'source'>('newest');

  // NewsData.io live integration state
  const [newsDataApiKey, setNewsDataApiKey] = useState('');
  const [newsDataQuery, setNewsDataQuery] = useState('international');
  const [isFetchingNewsData, setIsFetchingNewsData] = useState(false);
  const [newsDataStatusMsg, setNewsDataStatusMsg] = useState<string | null>(null);

  // Fetch live sports events scorecards on mount
  useEffect(() => {
    fetch('/api/sports/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.events) {
          setSportsEvents(data.events);
        }
      })
      .catch((err) => console.error('Failed to fetch sports events:', err));
  }, []);

  const handleCaptureSportsVideo = async () => {
    setIsCapturingSports(true);
    setCaptureStatusMsg(`Opening Live Stream & Capturing ${selectedSport} Video Feed...`);

    try {
      const res = await fetch('/api/sports/capture-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          event_query: `Latest ${selectedSport} tournament final highlights and match result`,
        }),
      });

      const data = await res.json();
      if (data.success && data.article) {
        setCaptureStatusMsg(`Live ${selectedSport} Match Feed Active!`);
        setTimeout(() => {
          setCaptureStatusMsg(null);
          // Match matching event
          const matchingEvent = sportsEvents.find(
            (e) => e.sport.toLowerCase() === selectedSport.toLowerCase()
          );
          setSelectedLiveMatchEvent(matchingEvent || null);
          setIsLiveMatchModalOpen(true);
        }, 600);
      } else {
        const matchingEvent = sportsEvents.find(
          (e) => e.sport.toLowerCase() === selectedSport.toLowerCase()
        );
        setSelectedLiveMatchEvent(matchingEvent || null);
        setIsLiveMatchModalOpen(true);
      }
    } catch (err) {
      console.error('Sports capture error:', err);
      const matchingEvent = sportsEvents.find(
        (e) => e.sport.toLowerCase() === selectedSport.toLowerCase()
      );
      setSelectedLiveMatchEvent(matchingEvent || null);
      setIsLiveMatchModalOpen(true);
    } finally {
      setIsCapturingSports(false);
    }
  };

  const handleFetchNewsData = async () => {
    setIsFetchingNewsData(true);
    setNewsDataStatusMsg(`Connecting to NewsData.io API live stream for "${newsDataQuery}"...`);

    try {
      let articles: KnowledgeObject[] = [];
      if (newsDataApiKey) {
        articles = await fetchDirectNewsData(newsDataApiKey, newsDataQuery || 'international');
      } else {
        articles = await fetchNewsFromApi({
          query: newsDataQuery || 'international',
        });
      }

      if (articles && articles.length > 0) {
        setNewsDataStatusMsg(`Successfully fetched ${articles.length} live articles with video streams!`);
        setTimeout(() => {
          setNewsDataStatusMsg(null);
          onSelectItem(articles[0]);
        }, 1500);
      } else {
        setNewsDataStatusMsg('NewsData.io wire updated!');
        setTimeout(() => setNewsDataStatusMsg(null), 3000);
      }
    } catch (err) {
      console.error('NewsData fetch error:', err);
      setNewsDataStatusMsg('Error contacting NewsData.io live news service.');
      setTimeout(() => setNewsDataStatusMsg(null), 3000);
    } finally {
      setIsFetchingNewsData(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (onCategorySelect) {
      onCategorySelect(cat);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Sports') return item.category === 'Sports' || item.tag === '#SPORTS';
    if (selectedCategory === 'Politics') return item.category === 'Polity' || item.tag === '#POLITICS';
    if (selectedCategory === 'Bhakti') return item.category === 'Bhakti' || item.tag === '#BHAKTI';
    if (selectedCategory === 'Local') return item.is_local || item.tag === '#LOCAL' || item.category === 'Local';
    if (selectedCategory === 'Breaking News') return item.is_breaking || item.tag === '#BREAKING' || item.tag === '#TECH';

    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'relevance') {
      return (b.views || 0) - (a.views || 0);
    }
    if (sortBy === 'source') {
      return (a.source_name || '').localeCompare(b.source_name || '');
    }
    // Default newest
    return new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime();
  });

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28">
      {/* Search Bar Input */}
      <div className="relative w-full mb-6 mt-2 group">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sports video reels, news, topics, creators..."
          className="w-full bg-[#29283f]/60 text-[#e3dffe] border border-[#3c494e] focus:border-[#00D1FF] focus:ring-1 focus:ring-[#00D1FF] px-4 py-3.5 pl-11 font-hanken text-base transition-all placeholder:text-[#bbc9cf] rounded-xl outline-none backdrop-blur-md shadow-lg"
        />
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#bbc9cf] group-focus-within:text-[#00D1FF] transition-colors">
          search
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bbc9cf] hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-sora font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#e3dffe] to-[#bbc9cf]">
            Discover
          </h1>
          <p className="text-sm font-hanken text-[#bbc9cf] mt-1">
            Explore sports video highlights, breaking news reels, and local current affairs
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {['All', 'Sports', 'Breaking News', 'Politics', 'Bhakti', 'Local'].map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`px-4 py-2 rounded-full text-xs font-mono-caps transition-all flex-shrink-0 cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-[#00D1FF] text-black font-bold border-[#00D1FF] shadow-[0_0_12px_rgba(0,209,255,0.4)]'
                  : 'bg-[#29283f]/40 text-[#bbc9cf] hover:text-white border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ⚡ Dedicated Sports Video Capture Control & Live Scorecards Banner */}
      <section className="mb-12 glass-card rounded-2xl p-6 border border-[#00D1FF]/30 relative overflow-hidden bg-gradient-to-br from-[#121127] via-[#1a1836] to-[#0d1b2a]">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-[#00D1FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00D1FF]/20 border border-[#00D1FF]/50 flex items-center justify-center text-[#00D1FF] shadow-[0_0_15px_rgba(0,209,255,0.3)]">
              <span className="material-symbols-outlined text-2xl">sports_score</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00D1FF]/20 text-[#00D1FF] text-[10px] font-mono-caps font-bold px-2 py-0.5 rounded border border-[#00D1FF]/40">
                  AI SPORTS CAPTURE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">LIVE EVENTS ACTIVE</span>
              </div>
              <h2 className="text-xl md:text-2xl font-sora font-bold text-white mt-1">
                Latest Sports News & Event Highlights
              </h2>
            </div>
          </div>

          {/* Capture Trigger Bar */}
          <div className="flex items-center gap-3 bg-[#121127]/80 p-2 rounded-xl border border-white/12 w-full lg:w-auto">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-[#29283f] text-white text-xs font-sora font-semibold px-3 py-2 rounded-lg border border-white/10 outline-none cursor-pointer"
            >
              <option value="Cricket">Cricket World Cup</option>
              <option value="Football">Football / UEFA</option>
              <option value="Tennis">Tennis Grand Slam</option>
              <option value="F1">Formula 1 Racing</option>
              <option value="Olympics">Olympics Athletics</option>
              <option value="Badminton">Badminton Tour</option>
            </select>

            <button
              onClick={handleCaptureSportsVideo}
              disabled={isCapturingSports}
              className="flex-1 lg:flex-none px-5 py-2 rounded-lg bg-gradient-to-r from-[#00D1FF] to-[#0088FF] text-black font-sora font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,209,255,0.4)] disabled:opacity-50"
            >
              {isCapturingSports ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                  Capturing Reel...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">videocam</span>
                  Capture {selectedSport} Video
                </>
              )}
            </button>
          </div>
        </div>

        {captureStatusMsg && (
          <div className="mb-4 p-3 rounded-lg bg-[#00D1FF]/10 border border-[#00D1FF]/30 text-[#00D1FF] text-xs font-mono flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {captureStatusMsg}
          </div>
        )}

        {/* Sports Scorecards Ticker */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sportsEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                setSelectedLiveMatchEvent(ev);
                setIsLiveMatchModalOpen(true);
              }}
              className="glass-card rounded-xl p-4 border border-white/10 hover:border-[#00D1FF]/50 transition-all cursor-pointer group relative overflow-hidden bg-[#18172e]/60"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono-caps font-bold px-2 py-0.5 rounded bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30">
                  {ev.sport}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {ev.status_badge}
                </span>
              </div>

              <h4 className="text-sm font-sora font-bold text-white group-hover:text-[#00D1FF] transition-colors mb-1">
                {ev.match_title}
              </h4>

              <p className="text-xs font-mono font-semibold text-[#00D1FF] mb-2">
                {ev.teams_or_players}
              </p>

              <p className="text-[11px] font-hanken text-[#bbc9cf] line-clamp-2 mb-3">
                {ev.summary}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#bbc9cf] pt-2 border-t border-white/5">
                <span className="truncate max-w-[160px]">{ev.venue}</span>
                <span className="text-[#00D1FF] group-hover:underline flex items-center gap-0.5 font-bold">
                  <span className="material-symbols-outlined text-[12px]">play_circle</span>
                  Watch Video Feed
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🌐 Live NewsData.io Wire Ingestion Card */}
      <section className="mb-12 glass-card rounded-2xl p-6 border border-[#00D1FF]/30 relative overflow-hidden bg-gradient-to-br from-[#121127] via-[#1a1836] to-[#0d1b2a]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#00D1FF]/20 border border-[#00D1FF]/50 flex items-center justify-center text-[#00D1FF] shadow-[0_0_15px_rgba(0,209,255,0.3)]">
              <span className="material-symbols-outlined text-2xl">newspaper</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00D1FF]/20 text-[#00D1FF] text-[10px] font-mono-caps font-bold px-2 py-0.5 rounded border border-[#00D1FF]/40">
                  NEWSDATA.IO LIVE WIRE
                </span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <h2 className="text-xl md:text-2xl font-sora font-bold text-white mt-1">
                Real-Time International News & Video Feeds
              </h2>
            </div>
          </div>

          <button
            onClick={handleFetchNewsData}
            disabled={isFetchingNewsData}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#0088FF] text-black font-sora font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,209,255,0.4)] disabled:opacity-50"
          >
            {isFetchingNewsData ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                Syncing News Wire...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">rss_feed</span>
                Sync Live NewsData Wire
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#121127]/80 p-4 rounded-xl border border-white/10">
          <div>
            <label className="block text-[11px] font-mono-caps text-[#bbc9cf] mb-1">
              NewsData.io API Key (Optional / Provided):
            </label>
            <input
              type="password"
              value={newsDataApiKey}
              onChange={(e) => setNewsDataApiKey(e.target.value)}
              placeholder="Paste your NewsData.io API key (e.g. pub_...)"
              className="w-full bg-[#1e1d34] text-white text-xs font-mono px-3 py-2 rounded-lg border border-white/10 focus:border-[#00D1FF] outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-mono-caps text-[#bbc9cf] mb-1">
              Query Topic / Filter:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newsDataQuery}
                onChange={(e) => setNewsDataQuery(e.target.value)}
                placeholder="e.g. international, sports, technology"
                className="w-full bg-[#1e1d34] text-white text-xs font-mono px-3 py-2 rounded-lg border border-white/10 focus:border-[#00D1FF] outline-none"
              />
              <button
                onClick={() => { setNewsDataQuery('sports'); }}
                className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  newsDataQuery === 'sports'
                    ? 'bg-[#00D1FF] text-black font-bold border-[#00D1FF]'
                    : 'bg-[#29283f] hover:bg-[#3c494e] text-[#00D1FF] border-white/10'
                }`}
              >
                ⚽ Sports
              </button>
              <button
                onClick={() => { setNewsDataQuery('international'); }}
                className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all flex-shrink-0 cursor-pointer ${
                  newsDataQuery === 'international'
                    ? 'bg-[#00D1FF] text-black font-bold border-[#00D1FF]'
                    : 'bg-[#29283f] hover:bg-[#3c494e] text-[#00D1FF] border-white/10'
                }`}
              >
                🌐 Global
              </button>
            </div>
          </div>
        </div>

        {newsDataStatusMsg && (
          <div className="mt-4 p-3 rounded-lg bg-[#00D1FF]/10 border border-[#00D1FF]/30 text-[#00D1FF] text-xs font-mono flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            {newsDataStatusMsg}
          </div>
        )}
      </section>

      {/* Main Category Cards Grid */}
      <h3 className="text-2xl font-sora font-bold text-white mb-4">Browse News Categories</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {/* Category: Breaking News */}
        <div
          onClick={() => handleCategoryClick('Breaking News')}
          className={`glass-card rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 border ${
            selectedCategory === 'Breaking News' ? 'border-[#00D1FF] ring-2 ring-[#00D1FF]/50' : 'border-white/12'
          }`}
        >
          <div className="relative h-44 w-full">
            <img
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop&q=80"
              alt="Breaking News"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121127] via-[#121127]/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-[#B40B07]/20 text-[#B40B07] border border-[#B40B07]/50 px-2 py-0.5 rounded text-[10px] font-mono-caps backdrop-blur-md mb-2 inline-block">
                LIVE NOW
              </span>
              <h2 className="text-xl font-sora font-semibold text-white">Breaking News</h2>
            </div>
          </div>
        </div>

        {/* Category: Sports */}
        <div
          onClick={() => handleCategoryClick('Sports')}
          className={`glass-card rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 border ${
            selectedCategory === 'Sports' ? 'border-[#00D1FF] ring-2 ring-[#00D1FF]/50' : 'border-white/12'
          }`}
        >
          <div className="relative h-44 w-full">
            <img
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80"
              alt="Sports"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121127] via-[#121127]/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/50 px-2 py-0.5 rounded text-[10px] font-mono-caps backdrop-blur-md mb-2 inline-block">
                MATCH REELS
              </span>
              <h2 className="text-xl font-sora font-semibold text-white">Sports</h2>
            </div>
          </div>
        </div>

        {/* Category: Local */}
        <div
          onClick={() => handleCategoryClick('Local')}
          className={`glass-card rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 border ${
            selectedCategory === 'Local' ? 'border-[#00D1FF] ring-2 ring-[#00D1FF]/50' : 'border-white/12'
          }`}
        >
          <div className="relative h-44 w-full">
            <img
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80"
              alt="Local News"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121127] via-[#121127]/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-mono-caps backdrop-blur-md mb-2 inline-block">
                CIVIC & STATE
              </span>
              <h2 className="text-xl font-sora font-semibold text-white">Local Affairs</h2>
            </div>
          </div>
        </div>

        {/* Category: Bhakti */}
        <div
          onClick={() => handleCategoryClick('Bhakti')}
          className={`glass-card rounded-xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform duration-300 border ${
            selectedCategory === 'Bhakti' ? 'border-[#00D1FF] ring-2 ring-[#00D1FF]/50' : 'border-white/12'
          }`}
        >
          <div className="relative h-44 w-full">
            <img
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              src="https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&auto=format&fit=crop&q=80"
              alt="Bhakti"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121127] via-[#121127]/50 to-transparent"></div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-[#EA4C89]/20 text-[#EA4C89] border border-[#EA4C89]/50 px-2 py-0.5 rounded text-[10px] font-mono-caps backdrop-blur-md mb-2 inline-block">
                SPIRITUAL
              </span>
              <h2 className="text-xl font-sora font-semibold text-white">Bhakti & Culture</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid / List Layout with PulseNews Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Left Main Content Stream */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-2xl font-sora font-semibold text-white">
                {selectedCategory === 'All' ? 'Trending Live Stories & Video Shorts' : `${selectedCategory} Live Feed`}
              </h3>
              <p className="text-xs text-[#bbc9cf]">
                Showing {sortedItems.length} curated stories • {viewMode.toUpperCase()} VIEW
              </p>
            </div>
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-[#00D1FF] text-xs font-mono hover:underline cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>

          {sortedItems.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center border border-white/10">
              <span className="material-symbols-outlined text-4xl text-[#00D1FF] mb-2">search_off</span>
              <p className="text-white font-sora font-semibold">No items match your search or filter.</p>
              <p className="text-xs text-[#bbc9cf] mt-1">Try clearing your search query or selecting 'All' category.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-[#00D1FF] text-black text-xs font-bold font-sora"
              >
                Show All Stories
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="glass-card rounded-xl aspect-[4/5] relative overflow-hidden group cursor-pointer border border-white/12 hover:border-[#00D1FF]/60 transition-all shadow-lg flex flex-col justify-end p-4"
                >
                  <img
                    className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:opacity-95 group-hover:scale-105 transition-all duration-300"
                    src={item.image_url}
                    alt={item.headline}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#121127] via-[#121127]/30 to-transparent"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 text-[9px] font-mono-caps px-1.5 py-0.5 rounded font-bold">
                        {item.tag}
                      </span>
                      {item.category === 'Sports' && (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono-caps px-1.5 py-0.5 rounded font-bold">
                          SPORTS REEL
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-hanken font-bold text-white line-clamp-2 mb-2 leading-snug group-hover:text-[#00D1FF] transition-colors">
                      {item.headline}
                    </p>

                    <div className="flex items-center justify-between text-[#bbc9cf] text-[10px] font-mono-caps">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">visibility</span>
                        {item.views}
                      </span>
                      <span>{item.source_name}</span>
                    </div>
                  </div>

                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-[#00D1FF]/50 text-[#00D1FF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(0,209,255,0.5)]">
                    <span
                      className="material-symbols-outlined text-2xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      play_arrow
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT LIST VIEW */
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="glass-card rounded-2xl p-4 border border-white/10 hover:border-[#00D1FF]/50 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={item.image_url}
                      alt={item.headline}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/10 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#00D1FF]/20 text-[#00D1FF] font-mono-caps text-[10px] font-bold">
                          {item.category}
                        </span>
                        <span className="text-xs text-[#bbc9cf] font-mono">{item.source_name}</span>
                        <span className="text-xs text-[#bbc9cf]">•</span>
                        <span className="text-xs text-[#bbc9cf] font-mono">{item.time}</span>
                      </div>
                      <h4 className="text-sm font-sora font-bold text-white group-hover:text-[#00D1FF] transition-colors truncate">
                        {item.headline}
                      </h4>
                      <p className="text-xs text-[#bbc9cf] line-clamp-1">{item.summary}</p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white/5 group-hover:bg-[#00D1FF] group-hover:text-black text-[#00D1FF] transition-all">
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PulseNews Sidebar */}
        <PulseNewsSidebar
          items={items}
          onSelectItem={onSelectItem}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          savedCount={items.filter((i) => i.is_bookmarked).length}
        />
      </div>

      {/* Live Match Small Video Feed Modal */}
      <LiveMatchVideoModal
        isOpen={isLiveMatchModalOpen}
        onClose={() => setIsLiveMatchModalOpen(false)}
        selectedSport={selectedSport}
        initialEvent={selectedLiveMatchEvent}
        allEvents={sportsEvents}
        onCaptureHighlight={(captured) => {
          const newObject: KnowledgeObject = {
            id: `captured-${Date.now()}`,
            headline: captured.headline || `Live ${selectedSport} Highlight`,
            summary: captured.summary || 'Live sports event captured.',
            category: captured.category || 'Sports',
            tag: captured.tag || '#SPORTS',
            source_name: captured.sourceName || 'Live AI Capture',
            source_url: 'https://pulsenews.app/sports-live',
            published_at: 'Just now',
            image_url: captured.imageUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
            video_url: captured.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            exam_importance: 90,
            monetized: true,
            views: '1.5M',
            likes: 48000,
            comments_count: 3200,
            shares: 1200,
            saved: true,
            liked: false,
            entities: ['Sports', selectedSport, 'Live Stream'],
            mcqs: [],
            quick_take: [
              captured.headline || 'Live Sports match capture.',
              captured.summary || 'Real-time highlight reel processed.',
              'Added directly to your saved news reel feed.'
            ]
          };
          onSelectItem(newObject);
        }}
      />
    </main>
  );
};
