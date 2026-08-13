import React, { useState, useEffect } from 'react';
import { TabType, KnowledgeObject, LiveStreamItem } from './types';
import { Navigation } from './components/Navigation';
import { FeedView } from './components/FeedView';
import { DiscoverView } from './components/DiscoverView';
import { LiveHubView } from './components/LiveHubView';
import { SnippetDetailView } from './components/SnippetDetailView';
import { ExamDigestView } from './components/ExamDigestView';
import { ProfileView } from './components/ProfileView';
import { ExamQuizModal } from './components/ExamQuizModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { GeminiChatbotModal } from './components/GeminiChatbotModal';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { SystemArchitectureView } from './components/SystemArchitectureView';
import { OpenNewsStudioView } from './components/OpenNewsStudioView';
import { RssNewsTicker } from './components/RssNewsTicker';
import { AuthProvider } from './context/AuthContext';
import { useSocket, NewsUpdatePayload } from './hooks/useSocket';
import { api } from './services/api';

function MainContent() {
  const [currentTab, setCurrentTab] = useState<TabType>('feed');
  const [knowledgeObjects, setKnowledgeObjects] = useState<KnowledgeObject[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [selectedItem, setSelectedItem] = useState<KnowledgeObject | null>(null);
  const [activeQuizItem, setActiveQuizItem] = useState<KnowledgeObject | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotTopic, setChatbotTopic] = useState<string | undefined>(undefined);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const [userStats, setUserStats] = useState<{
    quizzes_solved: number;
    accuracy: number;
    total_questions: number;
    history?: any[];
  }>({ quizzes_solved: 0, accuracy: 0, total_questions: 0, history: [] });

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  // Dedicated Socket.io persistent connection hook handling news_update & stream_status
  const { isConnected: isSocketConnected, streamStatuses } = useSocket({
    onNewsUpdate: (data: NewsUpdatePayload) => {
      if (data && data.article) {
        setKnowledgeObjects((prev) => {
          const exists = prev.some((item) => item.id === data.article!.id);
          if (exists) {
            return prev.map((item) => (item.id === data.article!.id ? data.article! : item));
          }
          return [data.article!, ...prev];
        });
        showToast(`⚡ Live Socket Event: "${data.article.headline}"`);
      } else if (data && data.message) {
        showToast(`⚡ Socket event: ${data.message}`);
      }
    },
    onStreamStatus: (data) => {
      if (data.streams && data.streams.length > 0) {
        console.log('⚡ Dynamic stream status update applied via Socket.io');
      }
    },
  });

  // Fetch initial profile & today's digest from server on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.fetchTodayDigest();
        if (!cancelled && data.knowledge_objects && data.knowledge_objects.length > 0) {
          setKnowledgeObjects(data.knowledge_objects);
        }
      } catch (err) {
        console.warn('Could not fetch digest from server:', err);
      } finally {
        if (!cancelled) setIsLoadingFeed(false);
      }
    })();

    (async () => {
      try {
        const data = await api.fetchProfile();
        if (!cancelled && data.success && data.user) {
          setUserStats({
            quizzes_solved: data.user.quizzes_solved,
            accuracy: data.user.accuracy,
            total_questions: data.user.total_questions,
            history: data.user.history,
          });
        }
      } catch (err) {
        console.warn('Could not fetch initial user profile:', err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const refreshUserProfile = async () => {
    try {
      const data = await api.fetchProfile();
      if (data.success && data.user) {
        setUserStats({
          quizzes_solved: data.user.quizzes_solved,
          accuracy: data.user.accuracy,
          total_questions: data.user.total_questions,
          history: data.user.history,
        });
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const handleToggleSave = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let updatedIsSaved = false;
    setKnowledgeObjects((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          updatedIsSaved = !item.saved;
          showToast(updatedIsSaved ? 'Snippet saved to Profile bookmarks!' : 'Removed from bookmarks');
          return { ...item, saved: updatedIsSaved };
        }
        return item;
      })
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, saved: !prev.saved } : null));
    }

    try {
      await api.toggleBookmark(id);
      refreshUserProfile();
    } catch (err) {
      console.error('Failed to update bookmark on backend store:', err);
    }
  };

  const handleToggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setKnowledgeObjects((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isLiked = !item.liked;
          return {
            ...item,
            liked: isLiked,
            likes: isLiked ? item.likes + 1 : item.likes - 1,
          };
        }
        return item;
      })
    );
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              liked: !prev.liked,
              likes: !prev.liked ? prev.likes + 1 : prev.likes - 1,
            }
          : null
      );
    }
  };

  const handleShare = (item: KnowledgeObject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (navigator.share) {
      navigator
        .share({
          title: item.headline,
          text: item.summary,
          url: item.source_url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(item.source_url);
      showToast('Article URL copied to clipboard!');
    }
  };

  const handleSelectItem = (item: KnowledgeObject) => {
    setSelectedItem(item);
    setCurrentTab('snippet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStream = (stream: LiveStreamItem) => {
    const isCricket =
      stream.category.toLowerCase() === 'cricket' ||
      stream.id.toLowerCase().includes('cricket') ||
      Boolean(stream.tag?.toLowerCase().includes('cricket')) ||
      Boolean(stream.title.toLowerCase().includes('cricket'));

    // Convert LiveStream to KnowledgeObject view or snippet with video_url
    const streamKo: KnowledgeObject = {
      id: stream.id,
      source_url: isCricket ? 'https://pulsenews.app/cricket-live' : 'https://un.org/live',
      source_name: stream.publisher,
      published_at: 'LIVE NOW',
      headline: isCricket
        ? `[LIVE CRICKET] ${stream.title}`
        : stream.title,
      summary: isCricket
        ? 'IND 186/4 (20.0) vs AUS 178/9 (20.0) • India defended 8 runs in the final over to claim the T20 World Cup Trophy! Active match highlights video reel & ball-by-ball commentary.'
        : stream.description || 'Live stream broadcast covering critical events.',
      category: isCricket ? 'Cricket' : stream.category,
      entities: isCricket
        ? ['Cricket', 'World Cup T20', 'India vs Australia', 'Active Highlights']
        : [stream.publisher, stream.tag],
      exam_importance: 95,
      tag: isCricket ? '#CRICKET_LIVE' : stream.tag,
      views: stream.viewers,
      likes: 124500,
      comments_count: 3400,
      shares: 1800,
      image_url: stream.image_url,
      video_url: stream.video_url || 'https://www.youtube.com/embed/21X5lGlDOfg',
      quick_take: isCricket
        ? [
            'Active Match Scorecard: IND 186/4 (20.0) vs AUS 178/9 (20.0) — India won by 8 runs.',
            'High-voltage T20 World Cup active match highlights featuring key wickets & boundary reels.',
            'Real-time live commentary feed updated with ball-by-ball coverage.'
          ]
        : [
            'Live stream broadcast active with global viewer participation.',
            'High relevance for political, economic, and technological exam modules.',
            'Real-time debate monitored by international press agencies.'
          ],
      mcqs: isCricket
        ? [
            {
              id: 'cricket-live-mcq-1',
              question: 'What was the result of the India vs Australia active match highlights featured in the live stream?',
              options: [
                'India defended 8 runs in the final over to win',
                'Australia won by 6 wickets',
                'Match abandoned due to rain',
                'Match tied and went to a Super Over'
              ],
              correct_index: 0,
              explanation: 'India successfully defended 186/4 by holding Australia to 178/9 in the final over of the World Cup match.'
            }
          ]
        : [
            {
              id: `live-mcq-1`,
              question: `Which key topic is being broadcast live by ${stream.publisher}?`,
              options: [
                stream.title,
                'Routine infrastructure maintenance',
                'Local weather forecasting',
                'Archival documentary replay'
              ],
              correct_index: 0,
              explanation: `The live broadcast features '${stream.title}' with ongoing real-time updates.`
            }
          ]
    };
    setSelectedItem(streamKo);
    setCurrentTab('snippet');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savedItems = knowledgeObjects.filter((ko) => ko.saved);

  return (
    <div className="min-h-screen bg-[#121127] text-[#e3dffe] font-hanken relative flex flex-col selection:bg-[#00D1FF] selection:text-[#003543]">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-4 z-50 bg-[#00D1FF] text-[#003543] font-mono-caps text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        isSocketConnected={isSocketConnected}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => {
          setCurrentTab('discover');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onToggleMenu={() => setIsDrawerOpen(true)}
        onOpenChatbot={() => {
          setChatbotTopic(undefined);
          setIsChatbotOpen(true);
        }}
      />

      {/* Real-time News Video Reel & Ticker Banner */}
      <RssNewsTicker
        onArticleClick={(article) => {
          showToast(`Opening Headline: ${article.title}`);
        }}
      />

      {/* Navigation Drawer Menu */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Body Screen Router */}
      <div className="flex-1 w-full">
        {currentTab === 'feed' && (
          <FeedView
            items={knowledgeObjects}
            isLoading={isLoadingFeed}
            onSelectItem={handleSelectItem}
            onToggleSave={handleToggleSave}
            onToggleLike={handleToggleLike}
            onShare={handleShare}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverView
            items={knowledgeObjects}
            onSelectItem={handleSelectItem}
            onCategorySelect={(cat) => {
              showToast(`Filtered feed for category: ${cat}`);
            }}
          />
        )}

        {currentTab === 'live' && (
          <LiveHubView
            onSelectStream={handleSelectStream}
            streamStatuses={streamStatuses}
          />
        )}

        {currentTab === 'snippet' && selectedItem && (
          <SnippetDetailView
            item={selectedItem}
            onBack={() => setCurrentTab('feed')}
            onToggleLike={(id) => handleToggleLike(id)}
            onToggleSave={(id) => handleToggleSave(id)}
            onShare={(item) => handleShare(item)}
            onOpenQuiz={(item) => setActiveQuizItem(item)}
          />
        )}

        {currentTab === 'exam' && (
          <ExamDigestView
            items={knowledgeObjects}
            onOpenQuiz={(item) => setActiveQuizItem(item)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            savedItems={savedItems}
            userStats={userStats}
            onSelectItem={handleSelectItem}
            onOpenQuiz={(item) => setActiveQuizItem(item)}
            onResetProgress={() => refreshUserProfile()}
          />
        )}

        {currentTab === 'graph' && (
          <KnowledgeGraphView />
        )}

        {currentTab === 'open-news' && (
          <OpenNewsStudioView />
        )}

        {currentTab === 'system' && (
          <SystemArchitectureView />
        )}
      </div>

      {/* MCQ Quiz Practice Modal */}
      {activeQuizItem && (
        <ExamQuizModal
          item={activeQuizItem}
          onClose={() => setActiveQuizItem(null)}
          onCompleteQuiz={(score, total) => {
            showToast(`Quiz Completed! You scored ${score}/${total}`);
            refreshUserProfile();
          }}
        />
      )}

      {/* Gemini AI Mentor Multi-turn Chatbot Modal */}
      <GeminiChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialTopic={chatbotTopic}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
