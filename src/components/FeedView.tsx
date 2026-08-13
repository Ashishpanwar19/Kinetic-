import React, { useState, useRef, useEffect } from 'react';
import { KnowledgeObject, SubFeedFilter } from '../types';
import { VideoPlayer } from './VideoPlayer';

interface FeedViewProps {
  items: KnowledgeObject[];
  isLoading?: boolean;
  onSelectItem: (item: KnowledgeObject) => void;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  onShare: (item: KnowledgeObject, e: React.MouseEvent) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  items,
  isLoading = false,
  onSelectItem,
  onToggleSave,
  onToggleLike,
  onShare,
}) => {
  const [activeFilter, setActiveFilter] = useState<SubFeedFilter>('For You');
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(items[0]?.id || null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'Trending') {
      return item.views.includes('M') || item.likes > 100000 || (item.views.includes('K') && parseFloat(item.views) > 500);
    }
    if (activeFilter === 'Local') {
      return (
        item.is_local ||
        item.tag === '#LOCAL' ||
        item.tag === '#POLITICS' ||
        item.tag === '#BHAKTI' ||
        item.tag === '#CIVIC' ||
        item.category === 'Local' ||
        item.headline.toLowerCase().includes('metro') ||
        item.headline.toLowerCase().includes('varanasi') ||
        item.headline.toLowerCase().includes('state') ||
        item.headline.toLowerCase().includes('capital')
      );
    }
    return true; // For You
  });

  // IntersectionObserver to auto-play visible video and pause others on scroll
  useEffect(() => {
    const observerOptions = {
      root: containerRef.current,
      threshold: 0.6,
    };

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('data-id');
        if (!id) return;

        const videoEl = videoRefs.current[id];

        if (entry.isIntersecting) {
          setPlayingVideoId(id);
          if (videoEl) {
            videoEl.play().catch(() => {});
          }
        } else {
          if (videoEl) {
            videoEl.pause();
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    Object.values(cardRefs.current).forEach((card) => {
      if (card) observer.observe(card as Element);
    });

    return () => {
      observer.disconnect();
    };
  }, [filteredItems]);

  // Handle Video Ended -> Automatically scroll & play next video back-to-back
  const handleVideoEnded = (currentIndex: number) => {
    const nextItem = filteredItems[currentIndex + 1];
    if (nextItem && cardRefs.current[nextItem.id]) {
      cardRefs.current[nextItem.id]?.scrollIntoView({ behavior: 'smooth' });
    } else if (filteredItems[0] && cardRefs.current[filteredItems[0].id]) {
      // Loop back to first video if reached end
      cardRefs.current[filteredItems[0].id]?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const togglePlayPause = (id: string) => {
    const videoEl = videoRefs.current[id];
    if (!videoEl) return;

    if (videoEl.paused) {
      videoEl.play().catch(() => {});
      setPlayingVideoId(id);
    } else {
      videoEl.pause();
      setPlayingVideoId(null);
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    Object.values(videoRefs.current).forEach((v) => {
      if (v) (v as HTMLVideoElement).muted = newMutedState;
    });
  };

  const isYouTubeUrl = (url?: string) => {
    return url ? url.includes('youtube.com') || url.includes('youtu.be') : false;
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] md:max-w-md mx-auto bg-black flex flex-col md:border-x md:border-white/10 overflow-hidden">
      {/* Top Overlay Categories */}
      <div className="absolute top-0 left-0 w-full z-20 pt-safe px-4 py-4 md:py-6 flex justify-between items-start pointer-events-none">
        <div className="md:hidden flex items-center">
          <span className="text-xl font-sora font-extrabold tracking-tighter text-[#00D1FF] drop-shadow-md">
            KINETIC
          </span>
        </div>
        <div className="flex-1 flex justify-center gap-4 pointer-events-auto">
          {(['Trending', 'For You', 'Local'] as SubFeedFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-xs font-mono-caps transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'text-white font-bold border-b-2 border-[#00D1FF] pb-1'
                  : 'text-[#bbc9cf] hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Video Feed Container (Vertical Scrollable Snap) */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#121127]">
            <div className="w-12 h-12 border-3 border-[#00D1FF]/30 border-t-[#00D1FF] rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-sora font-bold text-white mb-1">Loading Feed</h3>
            <p className="text-sm text-[#bbc9cf]">Fetching today's latest news reels...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#121127]">
            <span className="material-symbols-outlined text-5xl text-[#00D1FF] mb-3 animate-bounce">location_on</span>
            <h3 className="text-xl font-sora font-bold text-white mb-2">No {activeFilter} Stories Right Now</h3>
            <p className="text-sm text-[#bbc9cf] mb-6 max-w-xs">
              No specific updates found under the {activeFilter} tab. Switch back to 'For You' to watch all breaking video reels.
            </p>
            <button
              onClick={() => setActiveFilter('For You')}
              className="px-6 py-2.5 rounded-full bg-[#00D1FF] text-black font-sora font-bold text-xs hover:bg-[#00D1FF]/80 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,209,255,0.4)]"
            >
              View All Video Reels (For You)
            </button>
          </div>
        ) : (
          filteredItems.map((item, index) => {
          const videoSrc = item.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
          const isYt = isYouTubeUrl(videoSrc);

          return (
            <div
              key={item.id}
              data-id={item.id}
              ref={(el) => (cardRefs.current[item.id] = el)}
              className="w-full h-full snap-start relative group flex-shrink-0 bg-black cursor-pointer overflow-hidden"
              onClick={() => !isYt && togglePlayPause(item.id)}
            >
              {/* Seeker Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#33324a] z-30">
                <div
                  className="h-full bg-[#00D1FF] shadow-[0_0_10px_rgba(0,209,255,0.8)] transition-all duration-300"
                  style={{ width: `${((index + 1) * 20) % 100}%` }}
                ></div>
              </div>

              {/* Video Player Layer with error handling and real video stream fallbacks */}
              <div className="absolute inset-0 w-full h-full">
                <VideoPlayer
                  videoUrl={videoSrc}
                  poster={item.image_url}
                  headline={item.headline}
                  autoPlay={playingVideoId === item.id || index === 0}
                  isMuted={isMuted}
                  onEnded={() => handleVideoEnded(index)}
                  isPlaying={playingVideoId === item.id}
                  onTogglePlay={() => togglePlayPause(item.id)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-black/30 pointer-events-none"></div>
              </div>

              {/* Sound Toggle Button (Floating) */}
              <button
                onClick={toggleSound}
                className="absolute top-16 right-4 z-30 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 rounded-full border border-white/20 transition-all cursor-pointer shadow-lg"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                <span className="material-symbols-outlined text-lg">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>

              {/* Play / Pause Indicator Overlay for HTML5 video */}
              {!isYt && playingVideoId !== item.id && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-[#00D1FF]/50 text-[#00D1FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,209,255,0.4)] animate-pulse">
                    <span className="material-symbols-outlined text-3xl">play_arrow</span>
                  </div>
                </div>
              )}

              {/* Content Overlay Bottom */}
              <div className="absolute bottom-0 left-0 w-full p-4 pb-24 md:pb-6 flex flex-col justify-end z-20">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.monetized && (
                    <span className="bg-[#EA4C89]/20 border border-[#EA4C89]/50 text-[#EA4C89] text-[10px] font-mono-caps px-2 py-0.5 rounded backdrop-blur-sm">
                      MONETIZED
                    </span>
                  )}
                  <span className="bg-[#38374f]/40 text-white text-[10px] font-mono-caps px-2 py-0.5 rounded backdrop-blur-sm">
                    {item.tag}
                  </span>
                  <span className="bg-[#00D1FF]/20 text-[#00D1FF] text-[10px] font-mono-caps px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">play_circle</span>
                    {isYt ? 'Live Stream' : 'Auto Play Video'}
                  </span>
                </div>

                <h2
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(item);
                  }}
                  className="text-xl md:text-2xl font-sora font-bold text-white mb-2 max-w-[88%] leading-tight drop-shadow-lg cursor-pointer hover:text-[#00D1FF] transition-colors"
                >
                  {item.headline}
                </h2>

                <p className="text-sm font-hanken text-[#bbc9cf] max-w-[85%] line-clamp-2 mb-3">
                  {item.summary}
                </p>

                <div className="flex items-center gap-3 text-xs font-mono-caps text-[#bbc9cf]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span> {item.views}
                  </span>
                  <span>•</span>
                  <span>{item.published_at}</span>
                  <span>•</span>
                  <span className="text-[#00D1FF] font-semibold">{item.source_name}</span>
                </div>
              </div>

              {/* Social Actions Right */}
              <div className="absolute right-4 bottom-24 md:bottom-8 flex flex-col items-center gap-6 z-20">
                <button
                  onClick={(e) => onToggleLike(item.id, e)}
                  className="flex flex-col items-center gap-1 text-white hover:text-[#EA4C89] transition-colors group cursor-pointer"
                >
                  <div
                    className={`p-3 rounded-full backdrop-blur-md border border-white/12 transition-all ${
                      item.liked
                        ? 'bg-[#EA4C89]/30 border-[#EA4C89] text-[#EA4C89]'
                        : 'bg-[#1e1d34]/40 group-hover:bg-[#EA4C89]/20 group-hover:border-[#EA4C89]/50'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: item.liked ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-caps drop-shadow-md">
                    {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(0)}k` : item.likes}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(item);
                  }}
                  className="flex flex-col items-center gap-1 text-white hover:text-[#00D1FF] transition-colors group cursor-pointer"
                >
                  <div className="bg-[#1e1d34]/40 p-3 rounded-full backdrop-blur-md group-hover:bg-[#00D1FF]/20 border border-white/12 group-hover:border-[#00D1FF]/50 transition-all">
                    <span className="material-symbols-outlined text-[28px]">chat_bubble</span>
                  </div>
                  <span className="text-[11px] font-mono-caps drop-shadow-md">
                    {item.comments_count >= 1000 ? `${(item.comments_count / 1000).toFixed(0)}k` : item.comments_count}
                  </span>
                </button>

                <button
                  onClick={(e) => onToggleSave(item.id, e)}
                  className="flex flex-col items-center gap-1 text-white hover:text-[#00D1FF] transition-colors group cursor-pointer"
                >
                  <div
                    className={`p-3 rounded-full backdrop-blur-md border border-white/12 transition-all ${
                      item.saved
                        ? 'bg-[#00D1FF]/30 border-[#00D1FF] text-[#00D1FF]'
                        : 'bg-[#1e1d34]/40 group-hover:bg-[#00D1FF]/20 group-hover:border-[#00D1FF]/50'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[28px]"
                      style={{ fontVariationSettings: item.saved ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      bookmark
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-caps drop-shadow-md">
                    {item.saved ? 'Saved' : 'Save'}
                  </span>
                </button>

                <button
                  onClick={(e) => onShare(item, e)}
                  className="flex flex-col items-center gap-1 text-white hover:text-[#00D1FF] transition-colors group cursor-pointer"
                >
                  <div className="bg-[#1e1d34]/40 p-3 rounded-full backdrop-blur-md group-hover:bg-[#00D1FF]/20 border border-white/12 group-hover:border-[#00D1FF]/50 transition-all">
                    <span className="material-symbols-outlined text-[28px]">share</span>
                  </div>
                </button>

                {/* Publisher Avatar */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(item);
                  }}
                  className="mt-1 w-12 h-12 rounded-full border-2 border-[#00D1FF] overflow-hidden shadow-[0_0_15px_rgba(0,209,255,0.5)] cursor-pointer"
                >
                  <img
                    className="w-full h-full object-cover"
                    src={item.publisher_logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                    alt={item.source_name}
                  />
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};

