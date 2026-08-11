import React from 'react';
import { TabType } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSearch: () => void;
  onToggleMenu: () => void;
  onOpenChatbot?: () => void;
  title?: string;
  isSocketConnected?: boolean;
}

export const Navigation: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onToggleMenu,
  onOpenChatbot,
  title = "KINETIC",
  isSocketConnected = false
}) => {
  const { user, loginWithGoogle, logout } = useAuth();

  return (
    <>
      {/* Top Navigation Bar - Desktop & Header */}
      <header className="bg-[#121127]/80 backdrop-blur-xl border-b border-white/10 shadow-md sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 h-16 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMenu}
              className="text-[#00D1FF] hover:bg-white/10 transition-all rounded-full p-2 active:scale-95 duration-150 flex items-center justify-center cursor-pointer"
              title="Toggle Navigation Drawer"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>

            <div className="flex items-center gap-2">
              <div
                onClick={() => onTabChange('feed')}
                className="text-2xl font-sora font-extrabold tracking-tighter text-[#00D1FF] neon-glow cursor-pointer select-none"
              >
                {title}
              </div>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono-caps font-bold border transition-all ${
                  isSocketConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
                title={isSocketConnected ? 'Socket.io persistent connection active' : 'Socket.io connecting...'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="hidden sm:inline">{isSocketConnected ? 'SOCKET LIVE' : 'CONNECTING'}</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onTabChange('feed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'feed'
                  ? 'text-[#a4e6ff] font-bold bg-white/10'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentTab === 'feed' ? "'FILL' 1" : "'FILL' 0" }}>
                play_circle
              </span>
              <span>Feed</span>
            </button>

            <button
              onClick={() => onTabChange('discover')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'discover'
                  ? 'text-[#a4e6ff] font-bold bg-white/10'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentTab === 'discover' ? "'FILL' 1" : "'FILL' 0" }}>
                explore
              </span>
              <span>Discover</span>
            </button>

            <button
              onClick={() => onTabChange('live')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'live'
                  ? 'text-[#a4e6ff] font-bold bg-white/10'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentTab === 'live' ? "'FILL' 1" : "'FILL' 0" }}>
                live_tv
              </span>
              <span>Live</span>
            </button>

            <button
              onClick={() => onTabChange('open-news')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'open-news'
                  ? 'text-[#00D1FF] font-bold bg-[#00D1FF]/10 border border-[#00D1FF]/40 shadow-[0_0_10px_rgba(0,209,255,0.2)]'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentTab === 'open-news' ? "'FILL' 1" : "'FILL' 0" }}>
                rss_feed
              </span>
              <span>Open News Studio</span>
            </button>

            <button
              onClick={() => onTabChange('exam')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'exam'
                  ? 'text-[#00D1FF] font-bold bg-[#00D1FF]/10 border border-[#00D1FF]/30'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg">quiz</span>
              <span>AI Digest & Exam</span>
            </button>

            <button
              onClick={() => onTabChange('profile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono-caps text-xs transition-all cursor-pointer ${
                currentTab === 'profile'
                  ? 'text-[#a4e6ff] font-bold bg-white/10'
                  : 'text-[#bbc9cf] hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: currentTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>
                person
              </span>
              <span>Profile</span>
            </button>
          </nav>

          {/* Right Action Icons: AI Chatbot, Search & Firebase Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Gemini AI Mentor Chatbot Button */}
            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#00D1FF]/20 to-[#EA4C89]/20 hover:from-[#00D1FF]/30 hover:to-[#EA4C89]/30 text-[#00D1FF] border border-[#00D1FF]/40 px-3 py-1.5 rounded-full font-mono-caps text-xs font-bold transition-all shadow-[0_0_12px_rgba(0,209,255,0.3)] cursor-pointer"
                title="Launch Gemini AI Mentor Chatbot"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                <span className="hidden sm:inline">AI Mentor</span>
              </button>
            )}

            <button
              onClick={onOpenSearch}
              className="text-[#00D1FF] hover:bg-white/10 transition-all rounded-full p-2 active:scale-95 duration-150 flex items-center justify-center cursor-pointer"
              title="Search"
            >
              <span className="material-symbols-outlined text-2xl">search</span>
            </button>

            {/* Firebase Auth Google Sign In Button / User Avatar */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTabChange('profile')}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/15 p-1 px-2 rounded-full border border-white/15 transition-all cursor-pointer"
                  title={`Logged in as ${user.displayName || user.email}`}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User Avatar" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#00D1FF] text-black font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-mono-caps text-white max-w-[100px] truncate">
                    {user.displayName?.split(' ')[0] || 'Profile'}
                  </span>
                </button>
                <button
                  onClick={() => logout()}
                  className="text-xs text-[#bbc9cf] hover:text-[#EA4C89] font-mono-caps px-1 py-1 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="bg-[#00D1FF] hover:bg-[#00a3cc] text-black font-mono-caps font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-[0_0_10px_rgba(0,209,255,0.4)] cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="md:hidden bg-[#121127]/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] fixed bottom-0 left-0 w-full z-50 rounded-t-xl flex justify-around items-center h-20 pb-safe px-2">
        <button
          onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
            currentTab === 'feed' || currentTab === 'snippet'
              ? 'text-[#00D1FF] bg-[#33324a]/50 rounded-xl px-3 py-1 scale-105'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'feed' || currentTab === 'snippet' ? "'FILL' 1" : "'FILL' 0" }}>
            play_circle
          </span>
          <span className="text-[10px] font-mono-caps tracking-widest mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
            currentTab === 'discover'
              ? 'text-[#00D1FF] bg-[#33324a]/50 rounded-xl px-3 py-1 scale-105'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'discover' ? "'FILL' 1" : "'FILL' 0" }}>
            explore
          </span>
          <span className="text-[10px] font-mono-caps tracking-widest mt-0.5">Discover</span>
        </button>

        <button
          onClick={() => onTabChange('live')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
            currentTab === 'live'
              ? 'text-[#00D1FF] bg-[#33324a]/50 rounded-xl px-3 py-1 scale-105'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'live' ? "'FILL' 1" : "'FILL' 0" }}>
            live_tv
          </span>
          <span className="text-[10px] font-mono-caps tracking-widest mt-0.5">Live</span>
        </button>

        <button
          onClick={() => onTabChange('exam')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
            currentTab === 'exam'
              ? 'text-[#00D1FF] bg-[#33324a]/50 rounded-xl px-3 py-1 scale-105'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'exam' ? "'FILL' 1" : "'FILL' 0" }}>
            quiz
          </span>
          <span className="text-[10px] font-mono-caps tracking-widest mt-0.5">AI Exam</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center transition-all cursor-pointer active:scale-90 ${
            currentTab === 'profile'
              ? 'text-[#00D1FF] bg-[#33324a]/50 rounded-xl px-3 py-1 scale-105'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}>
            person
          </span>
          <span className="text-[10px] font-mono-caps tracking-widest mt-0.5">Profile</span>
        </button>
      </nav>
    </>
  );
};
