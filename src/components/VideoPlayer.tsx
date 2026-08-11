import React, { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl?: string;
  poster?: string;
  headline?: string;
  autoPlay?: boolean;
  isMuted?: boolean;
  loop?: boolean;
  onEnded?: () => void;
  className?: string;
  showOverlayControls?: boolean;
  onTogglePlay?: () => void;
  isPlaying?: boolean;
}

// Verified, working live streams & sample video URLs for news feeds
export const RELIABLE_LIVE_STREAMS = [
  'https://www.youtube.com/embed/21X5lGlDOfg', // NASA Live Stream
  'https://www.youtube.com/embed/9Auq9mYxFEE', // Sky News Live
  'https://www.youtube.com/embed/y60wDzZt8yg', // Al Jazeera English Live
  'https://www.youtube.com/embed/S_8d4052X50', // Bloomberg Technology Live
  'https://www.youtube.com/embed/mK9Jj9YnBzA', // DW News Live
];

export const RELIABLE_MP4_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
];

// Convert any YouTube watch, short, or embed URL into a clean embed iframe src
export function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  
  if (url.includes('youtube.com/embed/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl;
  }
  
  // Matches watch?v=ID or youtu.be/ID
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }

  if (url.includes('http://') || url.includes('https://')) {
    if (url.includes('embed') || url.includes('iframe') || url.includes('player')) {
      return url;
    }
  }
  
  return null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  poster,
  headline = 'Live Stream Video',
  autoPlay = true,
  isMuted = true,
  loop = true,
  onEnded,
  className = 'w-full h-full object-cover',
  showOverlayControls = true,
  onTogglePlay,
  isPlaying: isPlayingProp,
}) => {
  const [hasError, setHasError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [muted, setMuted] = useState(isMuted);
  const [playing, setPlaying] = useState(isPlayingProp ?? autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const embedUrl = getYouTubeEmbedUrl(videoUrl) || (
    videoUrl && videoUrl.startsWith('http') && !videoUrl.endsWith('.mp4') 
      ? videoUrl 
      : RELIABLE_LIVE_STREAMS[0]
  );

  useEffect(() => {
    setHasError(false);
  }, [videoUrl]);

  useEffect(() => {
    if (isPlayingProp !== undefined) {
      setPlaying(isPlayingProp);
    }
  }, [isPlayingProp]);

  useEffect(() => {
    setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const activeMp4 = RELIABLE_MP4_VIDEOS[fallbackIndex % RELIABLE_MP4_VIDEOS.length];

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPlaying = !playing;
    setPlaying(nextPlaying);
    if (onTogglePlay) {
      onTogglePlay();
    }
    if (videoRef.current) {
      if (nextPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleSwitchStream = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFallbackIndex((prev) => prev + 1);
    setHasError(true);
  };

  const isIframeMode = Boolean(embedUrl && !hasError && !videoUrl?.endsWith('.mp4'));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center group"
    >
      {isIframeMode ? (
        <iframe
          src={`${embedUrl}?autoplay=${playing ? 1 : 0}&mute=${muted ? 1 : 0}&controls=1&rel=0&enablejsapi=1`}
          title={headline}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl || activeMp4}
          poster={poster || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80"}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          onEnded={onEnded}
          onError={() => setHasError(true)}
          className={className}
        />
      )}

      {/* Custom Overlay Controls Bar */}
      {showOverlayControls && (
        <div className="video-overlay-bar opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            {/* Play / Pause button */}
            <button
              onClick={handleTogglePlay}
              className="video-control-btn text-[#00D1FF]"
              title={playing ? 'Pause' : 'Play'}
            >
              <span className="material-symbols-outlined text-xl">
                {playing ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Mute / Unmute button */}
            <button
              onClick={handleToggleMute}
              className="video-control-btn video-control-btn-mute"
              title={muted ? 'Unmute' : 'Mute'}
            >
              <span className="material-symbols-outlined text-xl">
                {muted ? 'volume_off' : 'volume_up'}
              </span>
            </button>

            {/* Headline / status label */}
            <span className="text-xs font-mono font-medium text-white/80 line-clamp-1 max-w-[160px] sm:max-w-xs">
              {headline}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Switch Stream button for iframe mode */}
            {isIframeMode && (
              <button
                onClick={handleSwitchStream}
                className="video-control-btn text-xs font-mono-caps text-[#00D1FF] px-2.5 py-1 border border-[#00D1FF]/30 gap-1"
                title="Switch Stream"
              >
                <span className="material-symbols-outlined text-sm">sync</span>
                <span className="hidden sm:inline">Switch</span>
              </button>
            )}

            {/* Fullscreen button */}
            <button
              onClick={handleToggleFullscreen}
              className="video-control-btn video-control-btn-fullscreen"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <span className="material-symbols-outlined text-xl">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

