import React, { useState } from 'react';
import { KnowledgeObject, Comment } from '../types';
import { MOCK_COMMENTS } from '../data/mockData';
import { VideoPlayer } from './VideoPlayer';

interface SnippetDetailViewProps {
  item: KnowledgeObject;
  onBack: () => void;
  onToggleLike: (id: string) => void;
  onToggleSave: (id: string) => void;
  onShare: (item: KnowledgeObject) => void;
  onOpenQuiz: (item: KnowledgeObject) => void;
}

export const SnippetDetailView: React.FC<SnippetDetailViewProps> = ({
  item,
  onBack,
  onToggleLike,
  onToggleSave,
  onShare,
  onOpenQuiz,
}) => {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [following, setFollowing] = useState(false);

  const isCricketOrLiveStream = Boolean(
    item.category?.toLowerCase() === 'cricket' ||
    item.category?.toLowerCase() === 'live' ||
    item.tag?.toLowerCase().includes('cricket') ||
    item.tag?.toLowerCase().includes('live') ||
    item.headline?.toLowerCase().includes('cricket') ||
    item.headline?.toLowerCase().includes('live') ||
    item.id?.toLowerCase().includes('cricket') ||
    item.id?.toLowerCase().includes('live') ||
    item.video_url
  );

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const added: Comment = {
      id: `c-${Date.now()}`,
      user: 'You',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: newComment.trim(),
      timestamp: 'Just now',
      likes: 0,
      liked: false,
    };
    setComments([added, ...comments]);
    setNewComment('');
  };

  const handleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isLiked = !c.liked;
          return {
            ...c,
            liked: isLiked,
            likes: isLiked ? c.likes + 1 : c.likes - 1,
          };
        }
        return c;
      })
    );
  };

  return (
    <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col md:flex-row gap-8">
      {/* Primary Article & Snippet Container */}
      <article className="w-full md:w-2/3 flex flex-col gap-6">
        {/* Top Header Controls for Mobile Back Button */}
        <div className="flex items-center justify-between md:hidden pb-2 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-[#00D1FF] p-2 hover:bg-white/10 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="font-sora font-extrabold text-[#00D1FF] neon-glow">
            KINETIC
          </span>
          <button
            onClick={() => onShare(item)}
            className="text-[#00D1FF] p-2 hover:bg-white/10 rounded-full flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        {/* Video Player / Headline Hero Banner */}
        <div className="relative w-full aspect-[4/5] md:aspect-video rounded-xl overflow-hidden bg-black group border border-white/12 shadow-2xl">
          {isCricketOrLiveStream ? (
            <>
              <VideoPlayer
                videoUrl={item.video_url || 'https://www.youtube.com/embed/21X5lGlDOfg'}
                poster={item.image_url}
                headline={item.headline}
                autoPlay={true}
                isMuted={false}
                loop={true}
                showOverlayControls={false}
              />

              {/* Video Tag Indicator */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className="px-2.5 py-1 bg-black/70 backdrop-blur-md text-[#00D1FF] text-[10px] font-mono-caps rounded-md border border-[#00D1FF]/40 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">play_circle</span> Real-Time Live Feed
                </span>
              </div>
            </>
          ) : (
            <img
              src={item.image_url || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80"}
              alt={item.headline}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Source Info Bar */}
        <div className="flex items-center justify-between glass-panel p-4 rounded-lg border border-white/12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#38374f] border border-white/12 relative">
              <img
                className="w-full h-full object-cover"
                src={item.publisher_logo || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"}
                alt={item.source_name}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-hanken font-semibold text-white">{item.source_name}</span>
              <span className="text-[10px] font-mono-caps text-[#bbc9cf] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span> Official Source
              </span>
            </div>
          </div>

          <button
            onClick={() => setFollowing(!following)}
            className={`px-6 py-2 rounded-full text-xs font-mono-caps font-bold transition-all cursor-pointer ${
              following
                ? 'bg-[#33324a] text-white border border-white/20'
                : 'bg-[#00D1FF] text-[#003543] hover:bg-[#a4e6ff] shadow-[0_0_15px_rgba(0,209,255,0.2)]'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Quick Take Bullet Points - Matching Screenshot 4 */}
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 relative overflow-hidden border border-white/12">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D1FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-sora font-semibold text-[#00D1FF]">Quick Take</h2>
            <button
              onClick={() => onOpenQuiz(item)}
              className="flex items-center gap-1 px-3 py-1 bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 rounded-lg text-xs font-mono-caps hover:bg-[#00D1FF] hover:text-[#003543] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">quiz</span>
              <span>Take MCQs Quiz ({item.mcqs.length})</span>
            </button>
          </div>

          <ul className="flex flex-col gap-4 text-base font-hanken text-[#e3dffe]">
            {item.quick_take.map((bullet, idx) => (
              <li key={idx} className="flex gap-3 items-start">
                <span
                  className="material-symbols-outlined text-[#B40B07] mt-0.5 text-lg flex-shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  double_arrow
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-6 py-3 border-t border-white/10">
          <button
            onClick={() => onToggleLike(item.id)}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              item.liked ? 'text-[#EA4C89]' : 'text-[#bbc9cf] hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: item.liked ? "'FILL' 1" : "'FILL' 0" }}
            >
              thumb_up
            </span>
            <span className="text-xs font-mono-caps font-bold">
              {item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}
            </span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-[#bbc9cf] hover:text-[#00D1FF] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">chat_bubble</span>
            <span className="text-xs font-mono-caps font-bold">{comments.length}</span>
          </button>

          <button
            onClick={() => onToggleSave(item.id)}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              item.saved ? 'text-[#00D1FF]' : 'text-[#bbc9cf] hover:text-white'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: item.saved ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            <span className="text-xs font-mono-caps font-bold">
              {item.saved ? 'Saved' : 'Save'}
            </span>
          </button>

          <div className="flex-grow"></div>

          <button
            onClick={() => onShare(item)}
            className="flex items-center gap-2 text-[#bbc9cf] hover:text-[#00D1FF] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">share</span>
            <span className="text-xs font-mono-caps font-bold">Share</span>
          </button>
        </div>

        {/* Interactive Comments Drawer Section */}
        {showComments && (
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-4 border border-white/12">
            <h3 className="text-base font-sora font-semibold text-white">
              Discussion ({comments.length})
            </h3>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add your insight or question..."
                className="flex-1 bg-[#1e1d34] text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#00D1FF] outline-none"
              />
              <button
                type="submit"
                className="bg-[#00D1FF] text-[#003543] px-4 py-2 rounded-lg font-mono-caps text-xs font-bold hover:bg-[#a4e6ff] cursor-pointer"
              >
                Post
              </button>
            </form>

            <div className="flex flex-col gap-3 mt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3 bg-[#1e1d34]/40 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <img className="w-6 h-6 rounded-full" src={c.avatar} alt={c.user} />
                      <span className="text-xs font-mono-caps text-[#00D1FF]">{c.user}</span>
                      <span className="text-[10px] font-mono-caps text-[#bbc9cf]">{c.timestamp}</span>
                    </div>
                    <button
                      onClick={() => handleLikeComment(c.id)}
                      className={`flex items-center gap-1 text-xs cursor-pointer ${
                        c.liked ? 'text-[#EA4C89]' : 'text-[#bbc9cf]'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: c.liked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span>{c.likes}</span>
                    </button>
                  </div>
                  <p className="text-xs font-hanken text-[#e3dffe] pl-8">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Sidebar / Related Feed */}
      <aside className="w-full md:w-1/3 flex flex-col gap-6">
        <h3 className="text-xl font-sora font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00D1FF]">dynamic_feed</span>
          Related Feed
        </h3>

        <div className="flex flex-col gap-4">
          <div
            onClick={onBack}
            className="group flex gap-4 cursor-pointer glass-panel p-2 rounded-lg hover:bg-white/10 transition-all border border-white/12"
          >
            <div className="w-24 h-32 rounded-md overflow-hidden relative flex-shrink-0">
              <img
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpOoSrmrVcllRv2Fm0lz6XkfzdeqDzE-3xLWA4LQkjF6RLnSEGhLSPU6r6HaNW1YeArJmmpYycUV_d9lAfhhsq-B25bGXUMgYuOzKsygKn6i1LCPL3AlAkAR35bMNejSdqPtMjUP7fuEoWWKjljk_2qDDZD0Zu3EnVV4mw6b79l6h82AWeLiWyjJs3pS7r3LfsWxwedYgsywe3vfZdZk1Z2bXOm3GYXg5cpHapwRMTdoUqXGvnOMy9CQ"
                alt="Neural Band prototype"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-mono-caps text-white backdrop-blur-sm">
                0:45
              </div>
            </div>
            <div className="flex flex-col justify-between py-1">
              <h4 className="text-sm font-hanken font-semibold text-white line-clamp-3 group-hover:text-[#00D1FF] transition-colors leading-snug">
                Hands-on with the new Neural Band prototype. Does it actually work?
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono-caps text-[#bbc9cf]">TechFrontier</span>
                <span className="w-1 h-1 rounded-full bg-[#bbc9cf]"></span>
                <span className="text-[10px] font-mono-caps text-[#bbc9cf]">2h ago</span>
              </div>
            </div>
          </div>

          <div
            onClick={onBack}
            className="group flex gap-4 cursor-pointer glass-panel p-2 rounded-lg hover:bg-white/10 transition-all border border-white/12"
          >
            <div className="w-24 h-32 rounded-md overflow-hidden relative flex-shrink-0">
              <img
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAf_khDif7oA6lUsyHswOey7XTrPKWZfoWXw1WqUvnqrf27I8APCe-3NrmhlEjMg8V-DnqdcMub6cc6ICvFqUd2j1w1kQFUib17y_vNNkDjr0Kz-zQlWOxJ2b00LdNfZvGfF9fth6eOlJIAi0mHxqYR-c6cPJaSU2lxBtp0rN9nGTRej4jWtglfcxux2NBLKjUvlwPgtrjUtwbwBnYhq73uLZcmEVam7DIdiatseBBCxaupVCR267tXvg"
                alt="Senate committee"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-mono-caps text-white backdrop-blur-sm">
                1:12
              </div>
            </div>
            <div className="flex flex-col justify-between py-1">
              <h4 className="text-sm font-hanken font-semibold text-white line-clamp-3 group-hover:text-[#00D1FF] transition-colors leading-snug">
                Senate committee calls for emergency hearing on biometric data security.
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono-caps text-[#bbc9cf]">PolicyNow</span>
                <span className="w-1 h-1 rounded-full bg-[#bbc9cf]"></span>
                <span className="text-[10px] font-mono-caps text-[#bbc9cf]">4h ago</span>
              </div>
            </div>
          </div>

          <div
            onClick={onBack}
            className="group flex gap-4 cursor-pointer glass-panel p-2 rounded-lg hover:bg-white/10 transition-all border-l-2 border-l-[#B40B07] border border-white/12"
          >
            <div className="w-24 h-32 rounded-md overflow-hidden relative flex-shrink-0">
              <img
                className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6MeVPWAa02LHL2oAEh_5X26-0kOrX7v-TyJZIOZfoU-T9w9SJbGkQPlan8L7xTJOIQkHU-LB62bW4HbjZhDPXzn1IWJzahLK5tmliv_7Hv_fHu53oxyEOIkobFapHJgtqmTni_6bFR7mal7WwEgv7b04hAC6wYP53cXhqc8w4hV6-TEQWOQ_N5l3Fd5MOc966jLqts4CMhognrK34k6S9tz3wKP_Hyl4-6NWFksu3VSdW0CxBFS0SnA"
                alt="Live Keynote"
              />
              <div className="absolute top-1 left-1 flex items-center gap-1 bg-[#B40B07]/90 px-1.5 py-0.5 rounded text-[9px] font-mono-caps text-white backdrop-blur-sm animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE
              </div>
            </div>
            <div className="flex flex-col justify-between py-1">
              <h4 className="text-sm font-hanken font-semibold text-white line-clamp-3 group-hover:text-[#00D1FF] transition-colors leading-snug">
                Live Stream: TechCon 2026 Keynote - The Future of Neural Interfaces.
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-mono-caps text-[#bbc9cf]">LiveNews</span>
                <span className="w-1 h-1 rounded-full bg-[#bbc9cf]"></span>
                <span className="text-[10px] font-mono-caps text-[#B40B07] font-bold">12k watching</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
};
