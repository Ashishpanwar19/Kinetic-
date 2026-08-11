import React from 'react';
import { TabType } from '../types';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      ></div>

      {/* Drawer Container */}
      <div className="relative w-80 max-w-[80vw] bg-[#121127] border-r border-white/12 h-full p-6 flex flex-col justify-between z-10 shadow-2xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-sora font-extrabold text-[#00D1FF] neon-glow">
                KINETIC
              </span>
              <span className="text-[10px] font-mono-caps px-2 py-0.5 rounded bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30">
                PULSE
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-[#bbc9cf] hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                onTabChange('feed');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'feed'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">play_circle</span>
              <span>Short Video Feed</span>
            </button>

            <button
              onClick={() => {
                onTabChange('discover');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'discover'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">explore</span>
              <span>Discover & Topics</span>
            </button>

            <button
              onClick={() => {
                onTabChange('live');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'live'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">live_tv</span>
              <span>Live Broadcast Hub</span>
            </button>

            <button
              onClick={() => {
                onTabChange('open-news');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'open-news'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40 shadow-[0_0_12px_rgba(0,209,255,0.2)]'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">rss_feed</span>
              <span>Open News Studio & Extractor</span>
            </button>

            <button
              onClick={() => {
                onTabChange('exam');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'exam'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">quiz</span>
              <span>AI Exam & MCQs</span>
            </button>

            <button
              onClick={() => {
                onTabChange('graph');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'graph'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">hub</span>
              <span>Knowledge Graph (Neo4j)</span>
            </button>

            <button
              onClick={() => {
                onTabChange('system');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'system'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">dns</span>
              <span>System Telemetry & Architecture</span>
            </button>

            <button
              onClick={() => {
                onTabChange('profile');
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-mono-caps text-xs transition-all text-left cursor-pointer ${
                currentTab === 'profile'
                  ? 'bg-[#00D1FF]/20 text-[#00D1FF] font-bold border border-[#00D1FF]/40'
                  : 'text-[#e3dffe] hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined">person</span>
              <span>User Profile & Saved</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 flex flex-col gap-2 text-xs font-mono-caps text-[#bbc9cf]">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-[#00D1FF]"></span>
            <span>Gemini 3.6 Flash Active</span>
          </div>
          <p className="text-[10px] text-[#bbc9cf]">
            Kinetic Pulse v2.4 • High-Velocity AI Current Affairs
          </p>
        </div>
      </div>
    </div>
  );
};
