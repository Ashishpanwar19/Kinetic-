import React, { useState, useEffect } from 'react';
import { KnowledgeObject } from '../types';

interface PulseNewsSidebarProps {
  items: KnowledgeObject[];
  onSelectItem: (item: KnowledgeObject) => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  sortBy: 'newest' | 'relevance' | 'source';
  onSortChange: (sort: 'newest' | 'relevance' | 'source') => void;
  savedCount: number;
}

export const PulseNewsSidebar: React.FC<PulseNewsSidebarProps> = ({
  items,
  onSelectItem,
  viewMode,
  onToggleViewMode,
  sortBy,
  onSortChange,
  savedCount,
}) => {
  // Reading Stats State
  const [articlesRead, setArticlesRead] = useState<number>(() => {
    return parseInt(localStorage.getItem('pn_articles_read') || '14', 10);
  });
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number>(() => {
    return parseInt(localStorage.getItem('pn_reading_time') || '28', 10);
  });
  const dailyGoal = 20; // 20 articles daily goal

  // Weather Widget State
  const [weatherCity, setWeatherCity] = useState<string>('New Delhi');
  const [weatherTemp, setWeatherTemp] = useState<number>(31);
  const [weatherCond, setWeatherCond] = useState<string>('Mostly Sunny');
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);

  // Newsletter State
  const [emailInput, setEmailInput] = useState<string>('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState<boolean>(false);

  // Editor's Pick
  const editorsPick = items.find((i) => i.verification_status === 'CONFIRMED') || items[0];

  const handleRefreshWeather = () => {
    setIsRefreshingWeather(true);
    setTimeout(() => {
      // Rotate sample weather
      const cities = [
        { city: 'New Delhi', temp: 32, cond: 'Sunny & Clear' },
        { city: 'London', temp: 19, cond: 'Light Rain' },
        { city: 'New York', temp: 24, cond: 'Partly Cloudy' },
        { city: 'Tokyo', temp: 27, cond: 'Humid & Mild' },
      ];
      const next = cities[Math.floor(Math.random() * cities.length)];
      setWeatherCity(next.city);
      setWeatherTemp(next.temp);
      setWeatherCond(next.cond);
      setIsRefreshingWeather(false);
    }, 600);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setNewsletterSubscribed(true);
      setEmailInput('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-6">
      {/* 1. Layout & Sort Control Panel */}
      <div className="bg-[#16152B] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-caps text-[#bbc9cf]">
          <span>LAYOUT & SORT</span>
          <span className="material-symbols-outlined text-base">tune</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#00D1FF] text-black font-bold shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                  : 'text-[#bbc9cf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Grid</span>
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                viewMode === 'list'
                  ? 'bg-[#00D1FF] text-black font-bold shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                  : 'text-[#bbc9cf] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">view_list</span>
              <span>List</span>
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#00D1FF] cursor-pointer"
          >
            <option value="newest" className="bg-[#121127] text-white">Newest First</option>
            <option value="relevance" className="bg-[#121127] text-white">Top Rated</option>
            <option value="source" className="bg-[#121127] text-white">By Source</option>
          </select>
        </div>
      </div>

      {/* 2. Reading Stats Dashboard */}
      <div className="bg-gradient-to-br from-[#121127] to-[#1a1936] border border-white/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00D1FF] text-xl">auto_stories</span>
            <h4 className="text-sm font-sora font-bold text-white">Reading Insights</h4>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] font-mono-caps text-[10px] font-bold">
            DAILY TRACKER
          </span>
        </div>

        {/* Goal Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#bbc9cf] font-mono">
            <span>Daily Goal</span>
            <span className="text-white font-bold">{articlesRead} / {dailyGoal} articles</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D1FF] to-[#EA4C89] transition-all duration-500"
              style={{ width: `${Math.min(100, (articlesRead / dailyGoal) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-lg font-bold text-[#00D1FF] font-sora">{articlesRead}</p>
            <p className="text-[10px] font-mono-caps text-[#bbc9cf]">Read</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-lg font-bold text-[#FFB800] font-sora">{readingTimeMinutes}m</p>
            <p className="text-[10px] font-mono-caps text-[#bbc9cf]">Time Spent</p>
          </div>
          <div className="p-2 bg-white/5 rounded-xl border border-white/5">
            <p className="text-lg font-bold text-[#EA4C89] font-sora">{savedCount}</p>
            <p className="text-[10px] font-mono-caps text-[#bbc9cf]">Saved</p>
          </div>
        </div>
      </div>

      {/* 3. Weather Widget */}
      <div className="bg-[#121127] border border-white/10 rounded-2xl p-5 space-y-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FFB800] text-xl">wb_sunny</span>
            <span className="text-xs font-mono-caps text-[#bbc9cf]">WEATHER BULLETIN</span>
          </div>
          <button
            onClick={handleRefreshWeather}
            className={`p-1 text-[#00D1FF] hover:bg-white/5 rounded-lg cursor-pointer ${isRefreshingWeather ? 'animate-spin' : ''}`}
            title="Refresh Weather"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-2xl font-sora font-extrabold text-white">{weatherTemp}°C</p>
            <p className="text-xs font-medium text-white/80">{weatherCity}</p>
            <p className="text-[11px] text-[#bbc9cf]">{weatherCond}</p>
          </div>
          <div className="text-right text-[11px] font-mono text-[#bbc9cf] space-y-1">
            <p>Humidity: 58%</p>
            <p>Wind: 14 km/h</p>
            <p className="text-[#00D1FF]">AQI: 42 (Good)</p>
          </div>
        </div>
      </div>

      {/* 4. Editor's Pick Featured Card */}
      {editorsPick && (
        <div className="bg-[#121127] border border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/40 font-mono-caps text-[10px] font-extrabold">
              ★ EDITOR'S PICK
            </span>
            <span className="text-[11px] text-[#bbc9cf] font-mono">{editorsPick.category}</span>
          </div>

          <h4
            onClick={() => onSelectItem(editorsPick)}
            className="text-sm font-sora font-bold text-white hover:text-[#00D1FF] cursor-pointer transition-colors line-clamp-3 leading-snug"
          >
            {editorsPick.title}
          </h4>

          <p className="text-xs text-[#bbc9cf] line-clamp-2 leading-relaxed">
            {editorsPick.summary}
          </p>

          <button
            onClick={() => onSelectItem(editorsPick)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-[#00D1FF] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Read Featured Story</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 5. Newsletter Subscription Card */}
      <div className="bg-gradient-to-br from-[#EA4C89]/15 to-[#121127] border border-[#EA4C89]/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#EA4C89]">
          <span className="material-symbols-outlined text-xl">mark_email_unread</span>
          <h4 className="text-sm font-sora font-bold text-white">Daily Dispatch</h4>
        </div>

        <p className="text-xs text-[#bbc9cf] leading-relaxed">
          Get verified breaking news briefings delivered directly to your inbox every morning.
        </p>

        {newsletterSubscribed ? (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium text-center">
            ✓ Subscribed! You will receive tomorrow's morning brief.
          </div>
        ) : (
          <form onSubmit={handleNewsletterSubmit} className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email address..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#EA4C89]"
            />
            <button
              type="submit"
              className="w-full py-2 bg-[#EA4C89] hover:bg-[#d63f79] text-white font-sora font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg"
            >
              Subscribe Free
            </button>
          </form>
        )}
      </div>
    </aside>
  );
};
