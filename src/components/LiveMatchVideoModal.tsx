import React, { useState, useEffect } from 'react';
import { SportsEvent, KnowledgeObject } from '../types';

interface LiveMatchVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSport: string;
  initialEvent?: SportsEvent | null;
  allEvents: SportsEvent[];
  onCaptureHighlight: (highlightArticle: Partial<KnowledgeObject>) => void;
}

export const LiveMatchVideoModal: React.FC<LiveMatchVideoModalProps> = ({
  isOpen,
  onClose,
  selectedSport,
  initialEvent,
  allEvents,
  onCaptureHighlight,
}) => {
  if (!isOpen) return null;

  // Filter coming/live matches based on selected sport
  const sportMatches = allEvents.filter(
    (e) => e.sport.toLowerCase() === selectedSport.toLowerCase() || selectedSport === 'All'
  );

  // Default active match
  const [activeMatch, setActiveMatch] = useState<SportsEvent>(() => {
    if (initialEvent) return initialEvent;
    if (sportMatches.length > 0) return sportMatches[0];
    return {
      id: 'default-live-cricket',
      sport: selectedSport || 'Cricket',
      event_name: `${selectedSport || 'Cricket'} World Cup Live Stream`,
      match_title: 'India vs Australia',
      teams_or_players: 'IND 186/4 (20.0) vs AUS 178/9 (20.0)',
      score_or_status: 'IND won by 8 runs (Live Highlights)',
      status_badge: 'LIVE 2ND INNINGS',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      date_time: 'LIVE NOW',
      summary: 'Thrilling final over finish with India defending 8 runs to claim the World Trophy.',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
    };
  });

  useEffect(() => {
    if (initialEvent) {
      setActiveMatch(initialEvent);
    } else {
      const match = allEvents.find(
        (e) => e.sport.toLowerCase() === selectedSport.toLowerCase()
      );
      if (match) setActiveMatch(match);
    }
  }, [initialEvent, selectedSport, allEvents]);

  // Live video stream state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasCaptured, setHasCaptured] = useState(false);

  // Coming & Live Matches Feed Schedule
  const upcomingMatchesSchedule = [
    {
      id: 'up-1',
      sport: 'Cricket',
      title: 'India vs England - T20 World Series',
      time: 'Today • 19:30 IST',
      status: 'LIVE IN 20 MINS',
      badge: 'LIVE SOON',
      teams: 'IND vs ENG',
    },
    {
      id: 'up-2',
      sport: 'Cricket',
      title: 'Australia vs South Africa - Semi Final 2',
      time: 'Tomorrow • 14:30 IST',
      status: 'UPCOMING',
      badge: 'COMING UP',
      teams: 'AUS vs SA',
    },
    {
      id: 'up-3',
      sport: 'Football',
      title: 'Real Madrid vs FC Barcelona - El Clasico',
      time: 'Sunday • 21:00 CEST',
      status: 'UPCOMING',
      badge: 'COMING UP',
      teams: 'RMA vs BAR',
    },
    {
      id: 'up-4',
      sport: 'Tennis',
      title: 'Wimbledon Men\'s Singles Final',
      time: 'Sunday • 15:00 BST',
      status: 'UPCOMING',
      badge: 'COMING UP',
      teams: 'Alcaraz vs Sinner',
    },
    {
      id: 'up-5',
      sport: 'F1',
      title: 'Monaco Grand Prix - Race Day',
      time: 'Sunday • 15:00 CEST',
      status: 'UPCOMING',
      badge: 'COMING UP',
      teams: 'Ferrari vs McLaren vs Red Bull',
    },
  ];

  const filteredUpcoming = upcomingMatchesSchedule.filter(
    (m) => m.sport.toLowerCase() === selectedSport.toLowerCase() || selectedSport === 'All'
  );

  // Commentary Feed Mock
  const commentaryFeed = [
    { time: '19.6', text: 'SIX! Smashed over deep mid-wicket! Unbelievable finish!' },
    { time: '19.5', text: 'DOT BALL! Excellent yorker outside off stump.' },
    { time: '19.4', text: 'WICKET! Caught at long-on! Huge breakthrough!' },
    { time: '19.3', text: 'TWO RUNS! Driven through extra cover with elegance.' },
  ];

  const handleCaptureClick = () => {
    setHasCaptured(true);
    onCaptureHighlight({
      headline: `[Captured Video] ${activeMatch.match_title} - ${activeMatch.teams_or_players}`,
      summary: activeMatch.summary,
      category: 'Sports',
      tag: '#SPORTS',
      sourceName: 'Live Sports Capture AI',
      imageUrl: activeMatch.image_url,
      videoUrl: activeMatch.video_url,
    });
    setTimeout(() => setHasCaptured(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#121127] border border-[#00D1FF]/40 rounded-2xl shadow-[0_0_50px_rgba(0,209,255,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1936] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30">
              <span className="material-symbols-outlined text-xl">videocam</span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00D1FF]/20 text-[#00D1FF] font-mono-caps text-[10px] font-bold px-2 py-0.5 rounded border border-[#00D1FF]/30">
                  LIVE MATCH FEED • {activeMatch.sport.toUpperCase()}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">STREAMING ACTIVE</span>
              </div>
              <h3 className="text-lg font-sora font-bold text-white mt-0.5">
                {activeMatch.match_title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#bbc9cf] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body: Grid with Video Stream & Coming Live Matches Feed */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Main Live Video Player Box & Match Stats */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10 group shadow-2xl">
                {/* Embedded HTML5 Video Stream or Sample Stream */}
                <video
                  src={
                    activeMatch.video_url && activeMatch.video_url.endsWith('.mp4')
                      ? activeMatch.video_url
                      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
                  }
                  autoPlay
                  loop
                  muted={isMuted}
                  controls
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Live Score Badge */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white font-mono text-xs flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="font-bold text-[#00D1FF]">LIVE:</span>
                  <span>{activeMatch.teams_or_players}</span>
                </div>

                <div className="absolute top-3 right-3 bg-emerald-500/80 text-black font-sora font-extrabold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {activeMatch.status_badge || 'LIVE MATCH'}
                </div>
              </div>

              {/* Match Summary & Score Details */}
              <div className="bg-[#18172e] p-4 rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00D1FF] font-bold">
                    📍 {activeMatch.venue || 'Narendra Modi Stadium'}
                  </span>
                  <span className="text-xs font-mono text-[#bbc9cf]">
                    {activeMatch.date_time || 'Today'}
                  </span>
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-hanken">
                  {activeMatch.summary}
                </p>

                {/* Live Commentary Wire */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <p className="text-[11px] font-mono-caps text-[#00D1FF] font-bold">
                    ⚡ LIVE BALL-BY-BALL HIGHLIGHTS:
                  </p>
                  <div className="space-y-1.5">
                    {commentaryFeed.map((c, i) => (
                      <div key={i} className="flex gap-2 text-xs font-mono bg-white/5 p-2 rounded-lg">
                        <span className="text-[#FFB800] font-bold">{c.time}</span>
                        <span className="text-[#bbc9cf]">{c.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Capture Video Reel Trigger Button */}
              <button
                onClick={handleCaptureClick}
                disabled={hasCaptured}
                className="w-full py-3 bg-gradient-to-r from-[#00D1FF] to-[#0088FF] text-black font-sora font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,209,255,0.4)] hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
                <span>{hasCaptured ? '✓ Highlight Video Captured to Main Feed!' : `Capture ${activeMatch.sport} Reel to Feed`}</span>
              </button>
            </div>

            {/* Right Col: Coming & Live Matches Feed */}
            <div className="space-y-4">
              <div className="bg-[#18172e] p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono-caps text-white font-bold">
                    <span className="material-symbols-outlined text-sm text-[#00D1FF]">sports_score</span>
                    <span>LIVE & COMING MATCHES</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00D1FF] bg-[#00D1FF]/10 px-2 py-0.5 rounded">
                    SCHEDULE
                  </span>
                </div>

                {/* Available Matches List Switcher */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {sportMatches.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => setActiveMatch(ev)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeMatch.id === ev.id
                          ? 'bg-[#00D1FF]/15 border-[#00D1FF] shadow-[0_0_10px_rgba(0,209,255,0.2)]'
                          : 'bg-white/5 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-[#00D1FF] font-bold">
                          {ev.sport}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          {ev.status_badge}
                        </span>
                      </div>
                      <p className="text-xs font-sora font-bold text-white line-clamp-1">
                        {ev.match_title}
                      </p>
                      <p className="text-[11px] font-mono text-[#bbc9cf] truncate">
                        {ev.teams_or_players}
                      </p>
                    </div>
                  ))}

                  {/* Upcoming / Coming Matches Stream */}
                  {filteredUpcoming.map((up) => (
                    <div
                      key={up.id}
                      className="p-3 rounded-xl border border-white/5 bg-white/5 space-y-1 opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-[#FFB800] font-bold">
                          {up.badge}
                        </span>
                        <span className="text-[10px] font-mono text-[#bbc9cf]">{up.time}</span>
                      </div>
                      <p className="text-xs font-sora font-semibold text-white">{up.title}</p>
                      <p className="text-[10px] font-mono text-[#bbc9cf]">Fixture: {up.teams}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
