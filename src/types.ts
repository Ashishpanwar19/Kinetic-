export interface MCQ {
  id: string;
  knowledge_object_id?: string;
  question: string;
  options: [string, string, string, string] | string[];
  correct_index: number;
  explanation: string;
}

export interface FactVerification {
  confidence_score: number; // 0 to 100
  source_agreement: number; // 0 to 100
  verification_status: 'CONFIRMED' | 'CROSS-VERIFIED' | 'DEVELOPING';
  verified_sources: string[];
}

export interface KnowledgeObject {
  id: string;
  source_url: string;
  source_name: string;
  published_at: string;
  headline: string;
  summary: string;
  category: 'Polity' | 'Economy' | 'Science' | 'Environment' | 'International' | 'Sports' | 'Awards' | 'Defence' | 'Miscellaneous' | string;
  entities: string[];
  exam_importance: number; // 1 to 100
  monetized?: boolean;
  tag: string;
  views: string;
  likes: number;
  comments_count: number;
  shares: number;
  saved?: boolean;
  liked?: boolean;
  is_live?: boolean;
  is_breaking?: boolean;
  is_local?: boolean;
  image_url: string;
  video_url?: string;
  publisher_logo?: string;
  quick_take: string[];
  mcqs: MCQ[];
  fact_verification?: FactVerification;
  rag_embedding_id?: string;
}

export interface LiveStreamItem {
  id: string;
  title: string;
  category: string;
  tag: string;
  viewers: string;
  image_url: string;
  video_url?: string;
  is_live: boolean;
  scheduled_time?: string;
  description?: string;
  publisher: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  liked?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Person' | 'Organization' | 'Country' | 'Policy' | 'Event' | 'Scheme';
  val: number; // node size weight
  details?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relationship: string;
}

export interface SystemMetrics {
  rssWorkerStatus: 'HEALTHY' | 'DEGRADED';
  activePollers: number;
  celeryQueueDepth: number;
  articlesProcessed24h: number;
  breakingNewsDetected: number;
  ragEmbeddingsIndexed: number;
  neo4jNodesCount: number;
  factVerificationRate: number;
  systemUptime: string;
  processingLatencyMs: number;
}

export type TabType = 'feed' | 'discover' | 'live' | 'profile' | 'snippet' | 'exam' | 'graph' | 'system' | 'open-news';

export type SubFeedFilter = 'Trending' | 'For You' | 'Local';

export interface ExtractedArticle {
  url: string;
  title: string;
  text: string;
  authors: string[];
  publish_date: string | null;
  top_image: string | null;
  images: string[];
  videos: string[];
  source: string;
  meta: {
    description?: string;
    site_name?: string;
    keywords?: string;
    json_ld?: any;
  };
  summary?: string;
}

export interface OpenNewsLiveItem {
  title: string;
  url: string;
  source: string;
  published: string;
  description: string;
  top_image?: string;
  category?: string;
  country?: string;
}

export interface BatchSummarizeResult {
  url: string;
  status: 'success' | 'failed';
  title?: string;
  summary?: string;
  text?: string;
  images?: string[];
  videos?: string[];
  top_image?: string;
  error?: string;
}

export interface OpenNewsCategoryCountryInfo {
  categories: string[];
  countries: Array<{ code: string; name: string; flag: string }>;
}

export interface SportsEvent {
  id: string;
  sport: 'Cricket' | 'Football' | 'Tennis' | 'Olympics' | 'F1' | 'Badminton' | 'Kabaddi' | string;
  event_name: string;
  match_title: string;
  teams_or_players: string;
  score_or_status: string;
  status_badge: string;
  venue: string;
  date_time: string;
  summary: string;
  video_url?: string;
  image_url: string;
}

