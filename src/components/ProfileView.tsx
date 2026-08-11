import React, { useState, useEffect } from 'react';
import { KnowledgeObject } from '../types';

interface ProfileViewProps {
  savedItems: KnowledgeObject[];
  onSelectItem: (item: KnowledgeObject) => void;
  onOpenQuiz: (item: KnowledgeObject) => void;
  userStats?: {
    quizzes_solved: number;
    accuracy: number;
    total_questions: number;
    history?: Array<{
      id: string;
      title: string;
      type: string;
      detail: string;
      timestamp: string;
    }>;
  };
  onResetProgress?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  savedItems,
  onSelectItem,
  onOpenQuiz,
  userStats,
  onResetProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history' | 'settings'>('bookmarks');
  const [profile, setProfile] = useState<any>(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
      }
    } catch (err) {
      console.warn('Could not fetch user profile from server API:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userStats]);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset your quiz solved stats and history back to 0?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/user/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.user) {
        setProfile(data.user);
        if (onResetProgress) onResetProgress();
      }
    } catch (err) {
      console.error('Failed to reset user progress:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const quizzesSolved = profile ? profile.quizzes_solved : userStats?.quizzes_solved || 0;
  const examAccuracy = profile ? profile.accuracy : userStats?.accuracy || 0;
  const historyList = profile?.history || userStats?.history || [];

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col gap-8">
      {/* Profile Header Card */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/12 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="w-24 h-24 rounded-full border-2 border-[#00D1FF] p-1 relative shadow-[0_0_20px_rgba(0,209,255,0.4)]">
          <img
            className="w-full h-full object-cover rounded-full"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
            alt="User Profile"
          />
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#00D1FF] border-2 border-[#121127]"></span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h1 className="text-2xl font-sora font-extrabold text-white">Alex Vanguard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 text-xs font-mono-caps font-bold">
              NEW CANDIDATE
            </span>
          </div>
          <p className="text-xs font-hanken text-[#bbc9cf] mt-1">
            UPSC & Civil Services Aspirant • Tech & Global Policy Specialist
          </p>

          {/* Dynamic User Stats Bar (Starts Clean at 0) */}
          <div className="flex justify-center md:justify-start gap-6 mt-4 pt-4 border-t border-white/10 text-xs font-mono-caps">
            <div>
              <span className="text-xl font-sora font-extrabold text-white block">{quizzesSolved}</span>
              <span className="text-[#bbc9cf]">Quizzes Solved</span>
            </div>
            <div>
              <span className="text-xl font-sora font-extrabold text-[#00D1FF] block">{examAccuracy}%</span>
              <span className="text-[#bbc9cf]">Exam Accuracy</span>
            </div>
            <div>
              <span className="text-xl font-sora font-extrabold text-[#EA4C89] block">{savedItems.length}</span>
              <span className="text-[#bbc9cf]">Saved Snippets</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-2 text-xs font-mono-caps transition-all cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'text-[#00D1FF] font-bold border-b-2 border-[#00D1FF]'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          Saved Snippets ({savedItems.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 text-xs font-mono-caps transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'text-[#00D1FF] font-bold border-b-2 border-[#00D1FF]'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          Recent Activity ({historyList.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 text-xs font-mono-caps transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'text-[#00D1FF] font-bold border-b-2 border-[#00D1FF]'
              : 'text-[#bbc9cf] hover:text-white'
          }`}
        >
          Preferences
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'bookmarks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedItems.length === 0 ? (
            <div className="col-span-full text-center py-12 glass-panel rounded-2xl border border-white/10">
              <span className="material-symbols-outlined text-4xl text-[#bbc9cf] mb-2">bookmark_border</span>
              <p className="text-sm font-hanken text-[#bbc9cf]">No saved snippets yet. Tap 'Save' on any article in the feed to bookmark it here!</p>
            </div>
          ) : (
            savedItems.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 border border-white/12 flex gap-4 hover:border-[#00D1FF]/50 transition-all cursor-pointer"
                onClick={() => onSelectItem(item)}
              >
                <img
                  className="w-24 h-28 object-cover rounded-xl flex-shrink-0"
                  src={item.image_url}
                  alt={item.headline}
                />
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <span className="text-[10px] font-mono-caps text-[#00D1FF]">
                      {item.tag} • {item.category}
                    </span>
                    <h3 className="text-sm font-hanken font-semibold text-white line-clamp-2 mt-1 leading-snug">
                      {item.headline}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[10px] font-mono-caps text-[#bbc9cf]">
                      {item.published_at}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQuiz(item);
                      }}
                      className="px-2.5 py-1 bg-[#00D1FF]/20 text-[#00D1FF] rounded text-[10px] font-mono-caps font-bold hover:bg-[#00D1FF] hover:text-[#003543]"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/12 flex flex-col gap-4 text-xs font-hanken text-[#bbc9cf]">
          {historyList.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-3xl text-[#bbc9cf] mb-1">history</span>
              <p className="text-xs text-[#bbc9cf]">No recent activity logged yet. Solve a quiz or watch a video feed to log your progress!</p>
            </div>
          ) : (
            historyList.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00D1FF] text-base">
                    {h.type === 'quiz' ? 'quiz' : h.type === 'watch' ? 'play_circle' : 'bookmark'}
                  </span>
                  <span className="text-white font-medium">{h.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#00D1FF] font-mono-caps font-bold">{h.detail}</span>
                  <span className="text-[10px] font-mono-caps text-[#bbc9cf]">{h.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/12 flex flex-col gap-6 text-sm font-hanken text-white">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <p className="font-semibold">Daily Exam Digest Notifications</p>
              <p className="text-xs text-[#bbc9cf]">Receive 3-bullet summaries every morning at 08:00 AM</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle cursor-pointer accent-[#00D1FF]" />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <p className="font-semibold">Gemini AI Automatic MCQ Generation</p>
              <p className="text-xs text-[#bbc9cf]">Auto-generate practice quizzes for all bookmarked news</p>
            </div>
            <input type="checkbox" defaultChecked className="toggle cursor-pointer accent-[#00D1FF]" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-[#EA4C89]">Reset User Progress & Database Store</p>
              <p className="text-xs text-[#bbc9cf]">Clear all solved quiz statistics, accuracy scores, and history back to 0</p>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-[#EA4C89]/20 hover:bg-[#EA4C89] hover:text-white text-[#EA4C89] border border-[#EA4C89]/40 px-4 py-2 rounded-xl font-mono-caps text-xs font-bold transition-all cursor-pointer"
            >
              {isResetting ? 'Resetting...' : 'Reset Stats'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
