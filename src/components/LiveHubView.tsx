import React, { useState } from 'react';
import { LiveStreamItem } from '../types';
import { LIVE_STREAMS, UPCOMING_BROADCASTS } from '../data/mockData';
import { VideoPlayer } from './VideoPlayer';

interface LiveHubViewProps {
  onSelectStream: (stream: LiveStreamItem) => void;
  streamStatuses?: Record<string, { id: string; is_live: boolean; viewers: string; title?: string }>;
}

export const LiveHubView: React.FC<LiveHubViewProps> = ({ onSelectStream, streamStatuses }) => {
  const [upcoming, setUpcoming] = useState(UPCOMING_BROADCASTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const liveCategories = ['All', 'Cricket', 'International', 'Science', 'Economy'];

  const dynamicStreams = LIVE_STREAMS.map((st) => {
    if (streamStatuses && streamStatuses[st.id]) {
      return {
        ...st,
        viewers: streamStatuses[st.id].viewers || st.viewers,
        is_live: streamStatuses[st.id].is_live ?? st.is_live,
      };
    }
    return st;
  });

  // Find cricket stream or fallback
  const cricketStream = dynamicStreams.find(
    (s) => s.category.toLowerCase() === 'cricket' || s.id.includes('cricket')
  ) || {
    id: 'live-cricket',
    title: 'Cricket World Cup T20: Live Match & Active Highlights',
    category: 'Cricket',
    tag: '#CRICKET_LIVE',
    viewers: '1.4M',
    is_live: true,
    publisher: 'Live Cricket HD Network',
    description: 'India vs Australia T20 World Cup Final active match highlights, live score ticker, ball-by-ball video feed, and key wicket reels.',
    image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1000&auto=format&fit=crop&q=80',
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  };

  const isCricketSelected = selectedCategory.toLowerCase() === 'cricket';

  // Filter streams by category
  const filteredStreams = dynamicStreams.filter((st) => {
    if (selectedCategory === 'All') return true;
    return st.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const featuredStream = isCricketSelected
    ? cricketStream
    : (filteredStreams.length > 0 ? filteredStreams[0] : dynamicStreams[0]);

  const secondaryStreams = isCricketSelected
    ? dynamicStreams
    : (filteredStreams.length > 1 ? filteredStreams.slice(1) : dynamicStreams.slice(1));

  const toggleNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpcoming((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, notified: !item.notified } : item
      )
    );
  };

  return (
    <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col gap-8">
      {/* Category Filter Navigation Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-[#16152B] p-3 rounded-2xl border border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00D1FF]">live_tv</span>
          <span className="text-xs font-mono-caps text-white font-bold">LIVE BROADCAST CATEGORIES:</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {liveCategories.map((cat) => {
            const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00D1FF] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)] scale-105'
                    : 'bg-white/5 text-[#bbc9cf] hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.toLowerCase() === 'cricket' && (
                  <span className="material-symbols-outlined text-sm">sports_cricket</span>
                )}
                <span>{cat}</span>
                {cat.toLowerCase() === 'cricket' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-500 text-white font-mono text-[9px]">LIVE</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cricket-Specific Embedded Video Player & Active Highlights Feed */}
      {isCricketSelected ? (
        <section className="bg-[#18172e] border border-[#00D1FF]/40 rounded-2xl p-4 md:p-6 space-y-4 shadow-[0_0_35px_rgba(0,209,255,0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30">
                <span className="material-symbols-outlined text-2xl">sports_cricket</span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#00D1FF]/20 text-[#00D1FF] font-mono-caps text-[10px] font-bold px-2 py-0.5 rounded border border-[#00D1FF]/30">
                    CRICKET WORLD CUP T20
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono text-red-400 font-bold">ACTIVE MATCH HIGHLIGHTS FEED</span>
                </div>
                <h2 className="text-xl md:text-2xl font-sora font-extrabold text-white mt-1">
                  India vs Australia • Active Highlights & Live Reel
                </h2>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-right space-y-0.5">
              <p className="text-sm font-mono font-bold text-[#00D1FF]">IND 186/4 (20.0) vs AUS 178/9 (20.0)</p>
              <p className="text-xs text-emerald-400 font-bold">🏆 India won by 8 runs • Highlights Live</p>
            </div>
          </div>

          {/* Embedded Video Player / Live Feed Iframe Container */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/12 shadow-2xl group">
            <VideoPlayer
              videoUrl={cricketStream.video_url}
              poster={cricketStream.image_url}
              headline={cricketStream.title}
              autoPlay={true}
              isMuted={true}
              loop={true}
            />

            {/* Live Scorecard Overlay Badge */}
            <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#00D1FF]/50 text-white font-mono text-xs flex items-center gap-2.5 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-[#00D1FF]">LIVE STREAM:</span>
              <span>Active Boundary & Wicket Highlights</span>
            </div>

            <div className="absolute top-4 right-4 z-10 bg-[#00D1FF]/90 text-black font-sora font-extrabold text-xs px-3 py-1 rounded-lg uppercase shadow-lg">
              1.4M VIEWING
            </div>

            {/* Click overlay banner to open stream detail */}
            <div
              onClick={() => onSelectStream(cricketStream)}
              className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#121127] via-[#121127]/80 to-transparent cursor-pointer z-10 hover:bg-black/40 transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono-caps text-[#00D1FF] block mb-1">
                  CLICK TO VIEW FULL MATCH HIGHLIGHTS & QUIZ
                </span>
                <h3 className="text-lg md:text-xl font-sora font-bold text-white">
                  {cricketStream.title}
                </h3>
              </div>
              <button className="px-4 py-2 bg-[#00D1FF] text-black font-sora font-bold text-xs rounded-xl hover:bg-[#a4e6ff] transition-all flex items-center gap-1.5 shadow-lg">
                <span>Expand Highlights Reel</span>
                <span className="material-symbols-outlined text-sm">open_in_full</span>
              </button>
            </div>
          </div>

          {/* Live Ball-by-Ball Highlight Ticker */}
          <div className="space-y-2 pt-2">
            <p className="text-xs font-mono-caps text-[#00D1FF] font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>CRICKET ACTIVE MATCH HIGHLIGHTS TICKER:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono">
                <p className="text-[#FFB800] font-bold mb-0.5">19.6 OVER • SIX!</p>
                <p className="text-white/90">Smashed over deep mid-wicket to seal the victory!</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono">
                <p className="text-[#EA4C89] font-bold mb-0.5">19.5 OVER • WICKET!</p>
                <p className="text-white/90">Clean bowled! Yorker hits the base of middle stump.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono">
                <p className="text-[#00D1FF] font-bold mb-0.5">19.4 OVER • DOT BALL</p>
                <p className="text-white/90">In-swinging delivery beat the outside edge.</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono">
                <p className="text-emerald-400 font-bold mb-0.5">19.3 OVER • FOUR!</p>
                <p className="text-white/90">Driven through cover with pristine timing.</p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Primary Featured Live Stream for general categories */
        <section
          className="relative w-full rounded-2xl overflow-hidden glass-panel group aspect-video md:aspect-[21/9] border border-white/12 shadow-2xl bg-black"
        >
          <VideoPlayer
            videoUrl={featuredStream.video_url}
            poster={featuredStream.image_url}
            headline={featuredStream.title}
            autoPlay={true}
            isMuted={true}
            loop={true}
          />

          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#121127]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/12 pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#B40B07] pulse-dot"></div>
            <span className="text-[10px] font-mono-caps text-white font-bold">LIVE BROADCAST</span>
          </div>

          <div className="absolute top-4 right-14 z-10 flex items-center gap-2 bg-[#121127]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/12 pointer-events-none">
            <span className="material-symbols-outlined text-[16px] text-[#00D1FF]">
              visibility
            </span>
            <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">
              {featuredStream.viewers}
            </span>
          </div>

          <div
            onClick={() => onSelectStream(featuredStream)}
            className="absolute bottom-0 left-0 w-full p-6 md:p-8 bg-gradient-to-t from-[#121127] via-[#121127]/80 to-transparent cursor-pointer z-10 hover:bg-black/40 transition-colors"
          >
            <div className="flex items-end justify-between w-full">
              <div className="max-w-3xl">
                <span className="inline-block px-2 py-1 rounded bg-[#EA4C89]/20 text-[#EA4C89] text-[10px] font-mono-caps mb-3 border border-[#EA4C89]/30">
                  {featuredStream.tag}
                </span>
                <h1 className="text-2xl md:text-4xl font-sora font-extrabold text-white mb-2 leading-tight drop-shadow-md">
                  {featuredStream.title}
                </h1>
                <p className="text-sm font-hanken text-[#bbc9cf] line-clamp-2 md:line-clamp-none">
                  {featuredStream.description}
                </p>
              </div>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#00D1FF] text-black font-sora font-bold text-xs rounded-xl hover:bg-[#a4e6ff] transition-all shadow-[0_0_15px_rgba(0,209,255,0.4)]">
                <span>Expand Broadcast</span>
                <span className="material-symbols-outlined text-sm">open_in_full</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Live Now Scroller */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-sora font-bold text-white">
            {isCricketSelected ? 'Cricket & Sports Streams' : 'Happening Now'}
          </h2>
          <button className="text-sm font-hanken font-semibold text-[#00D1FF] hover:text-[#a4e6ff] transition-colors flex items-center gap-1 cursor-pointer">
            View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4">
          {secondaryStreams.map((stream) => (
            <div
              key={stream.id}
              onClick={() => onSelectStream(stream)}
              className="min-w-[280px] w-[280px] md:min-w-[340px] md:w-[340px] rounded-xl overflow-hidden glass-panel relative group cursor-pointer flex-shrink-0 border border-white/12 hover:border-[#00D1FF]/50 transition-all"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img
                  className="w-full h-full object-cover opacity-70 group-hover:scale-110 transition-transform duration-500"
                  src={stream.image_url}
                  alt={stream.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16152B] via-transparent to-transparent"></div>
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#121127]/90 px-2 py-1 rounded text-[10px] font-mono-caps font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#B40B07] pulse-dot"></div>
                  <span className="text-white">LIVE</span>
                </div>
                <div className="absolute top-3 right-3 bg-[#121127]/90 px-2 py-1 rounded text-[10px] font-mono-caps text-[#bbc9cf] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  {stream.viewers}
                </div>
              </div>
              <div className="p-4 bg-[#1e1d34]/50">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] mb-1 block">
                  {stream.tag}
                </span>
                <h3 className="text-base font-hanken font-semibold text-white line-clamp-2 leading-snug">
                  {stream.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Broadcasts Schedule */}
      <section className="mt-2">
        <h2 className="text-2xl font-sora font-bold text-white mb-6">Upcoming Broadcasts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((item) => (
            <div
              key={item.id}
              className="glass-panel rounded-lg p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer border border-white/12"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded bg-[#29283f] flex flex-col items-center justify-center border border-white/10">
                <span className="text-[#00D1FF] font-sora font-bold text-lg leading-none">
                  {item.time}
                </span>
                <span className="text-[10px] font-mono-caps text-[#bbc9cf] mt-0.5">
                  {item.timezone}
                </span>
              </div>
              <div className="flex-grow">
                <span className="text-[10px] font-mono-caps text-[#bbc9cf] block mb-1">
                  {item.category}
                </span>
                <h4 className="text-sm font-hanken font-semibold text-white line-clamp-2">
                  {item.title}
                </h4>
              </div>
              <button
                onClick={(e) => toggleNotification(item.id, e)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  item.notified
                    ? 'bg-[#00D1FF] text-[#003543]'
                    : 'bg-[#33324a] text-white hover:text-[#00D1FF]'
                }`}
                title={item.notified ? 'Reminder set' : 'Set reminder'}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: item.notified ? "'FILL' 1" : "'FILL' 0" }}
                >
                  notifications
                </span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
