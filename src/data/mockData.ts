import { KnowledgeObject, LiveStreamItem, Comment } from '../types';

export const INITIAL_KNOWLEDGE_OBJECTS: KnowledgeObject[] = [
  {
    id: "ko-1",
    source_url: "https://reuters.com/markets/tech-surge-2026",
    source_name: "Reuters Media",
    published_at: "2 hours ago",
    headline: "Global Markets Rally Following Unexpected Tech Sector Earnings Surge",
    summary: "Major indices hit record highs today as key technology firms reported earnings well above analyst expectations, driving widespread optimism across international equity markets.",
    category: "Economy",
    entities: ["Global Markets", "Tech Sector", "Semiconductors", "Wall Street"],
    exam_importance: 88,
    monetized: true,
    tag: "#TECH",
    views: "1.2M",
    likes: 342000,
    comments_count: 12000,
    shares: 4500,
    saved: false,
    liked: true,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDPBYRBZxksBIIKBKMiwwZQ_VxW_07ckApAGErplq4O_belJXRfS_H2TVejlcjZFzXq0UOSCxAzijHDSyk1eE06G0uonnW7SQgGnrWAGsjSGMldVC5nabbThFGSm-Ucjyyr3hZ5RMLxCA6oTbAyBTc_5e463Z940OYiZDi1rKoJdJB97w33sPT1DvpF7BeP5OLSNlGVaTHpBUZHNRhivDdRjdiVzONkhjddHPDBKMzAz_fxtgFFApCwzw",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    publisher_logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvX-a_GI1if6O-t3QpiKcnS_i5nJwG0ykFmTrR1TySvPwhkYwY43Ehfzjz4Kaf7tGnzcag2X-a-ObhrcEgcoFfyV8w3qQmIezABTOOlUE8PxWoGP5ZgoLn0VZj6Q6a7pZVFQXBH0ojhDQ0Rs6LgXKwhb29Cvhu52aiX7XHS1v9KmQVizlnKNf-fMJn-ILi_yK8QcAkXtr0ElIiMr3aorRNcE3lQz0zLEwgoOrBl14VcmR7rgxsOGbT9A",
    quick_take: [
      "Key technology firms reported Q2 earnings 24% above consensus estimates, triggering a global equities rally.",
      "Semiconductor hardware and enterprise cloud infrastructure recorded the highest revenue expansion.",
      "Central banking representatives noted sector stability as a key dampener against inflation anxiety."
    ],
    mcqs: [
      {
        id: "mcq-1-1",
        question: "What primary economic signal drove today's global market index rally?",
        options: [
          "Unexpectedly high technology sector Q2 earnings reports",
          "Widespread interest rate cuts across major central banks",
          "A sharp drop in global shipping costs",
          "Unprecedented tax relief for real estate conglomerates"
        ],
        correct_index: 0,
        explanation: "Key technology firms posted quarterly earnings significantly exceeding consensus forecasts, fueling market momentum."
      },
      {
        id: "mcq-1-2",
        question: "Which technology segment recorded the strongest enterprise expenditure in current economic quarters?",
        options: [
          "Legacy consumer electronics hardware",
          "AI Semiconductor & Custom Tensor Infrastructure",
          "Analog telecom wireline infrastructure",
          "Traditional offline retail inventory systems"
        ],
        correct_index: 1,
        explanation: "Enterprise investment in tensor processor clusters and cloud hardware continues to outpace traditional segments."
      }
    ]
  },
  {
    id: "ko-2",
    source_url: "https://techfrontier.io/news/neural-interface-q3",
    source_name: "TechFrontier News",
    published_at: "2 hours ago",
    headline: "Next-Gen Neural Interfaces Hit Consumer Market",
    summary: "Major tech conglomerate announces the first non-invasive neural interface designed for everyday consumer use, targeting Q3 release with seamless thought-pattern controls.",
    category: "Science",
    entities: ["Neural Band", "Brain-Computer Interface", "Thought-Pattern Recognition", "Biometric Scrutiny"],
    exam_importance: 92,
    monetized: true,
    tag: "#TECH",
    views: "2.4M",
    likes: 24500,
    comments_count: 1204,
    shares: 3200,
    saved: true,
    liked: true,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9LMJXBo2Xbm2o6VD1MTF7HDU0C_rssnni_Je5cHTw_H5BJGqaH_jWm6SFA7YDdJ6H5yKs6axy6dbcPKXiV5YUsw3uqJyLNCLB4EdLBOQC1bpZme7YW2WzrfjmbtGTdrEZ4vG_JLi95QxHRE5WKYkVUEEnasD4Px2-VnyCDFytYKdb7OMPNK8k0BhdLR9Uund1NbUoVbrdEdaCxsWKKaziwXRTx1g4A0VYsyUJQEdEA7Xgoa2KR2FRPg",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    publisher_logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAS2AhIWvRt2uAbcRshZS350UgY4NEN_v5dIccnyVDducLFTrbjgnOiUzwnNO5eF43JICQvzp8c5HSi2ZFRzsr0osTR-Y1BdXEcFl7_DqwaWL5elFrY28Tr-41CjDC3NI-mkrJld6UUgu0aFkR4ooJdFKp-68ZOc7QXBkVaT-gdYmSgZjTs5NmmV_H_uORNNR04dPzsko8XeAc6YDm2tNGFsN8v_DipmF9fcpYiNX6sq4LhYvDuJxMpg",
    quick_take: [
      "Major tech conglomerate announces the first non-invasive neural interface designed for everyday consumer use, targeting Q3 release.",
      "The device promises seamless interaction with smart home ecosystems and personal computing devices via thought-pattern recognition.",
      "Privacy advocates are already raising concerns about biometric data security, prompting immediate regulatory scrutiny in major markets."
    ],
    mcqs: [
      {
        id: "mcq-2-1",
        question: "How does the consumer-grade Neural Band interact with computing devices?",
        options: [
          "Through real-time thought-pattern recognition using non-invasive sensors",
          "Via physical push-buttons and micro-joysticks",
          "By measuring body temperature fluctuations",
          "Using external camera-based hand gesture recognition"
        ],
        correct_index: 0,
        explanation: "The neural interface interprets surface EEG signals to recognize user intent without requiring invasive implants."
      },
      {
        id: "mcq-2-2",
        question: "What major regulatory concern has been raised by international consumer advocates regarding BCI adoption?",
        options: [
          "Disruption to cellular telecommunications bands",
          "Biometric data privacy and thought-pattern harvesting safeguards",
          "Excessive battery heat dissipation during standby",
          "Compatibility issues with vintage television sets"
        ],
        correct_index: 1,
        explanation: "Privacy watchdogs are pushing for immediate legislation on brainwave data encryption and consumer consent frameworks."
      }
    ]
  },
  {
    id: "ko-3",
    source_url: "https://space.org/heavy-lift-maiden",
    source_name: "AeroSpace Dispatch",
    published_at: "4 hours ago",
    headline: "Next-Gen Heavy Lift Vehicle Achieves Orbit on Maiden Flight",
    summary: "A milestone launch into twilight skies succeeded as the next-generation heavy lift vehicle inserted payload cleanly into target orbit, paving the way for upcoming lunar missions.",
    category: "Science",
    entities: ["Orbital Rocket", "Space Exploration", "Heavy Lift Vehicle", "Satellite Payload"],
    exam_importance: 85,
    monetized: false,
    tag: "#SPACE",
    views: "890K",
    likes: 178000,
    comments_count: 5400,
    shares: 2300,
    saved: false,
    liked: false,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDuKVI_ygMwrYMDVGEJsT-trV1jPTSMTPY__cjc4cP0T3ArDPJIxReMXa97cN8xPwA1RMb6x7rXmNP_Ye6VkPiF0SXFF_nlwgMzhKDryynEp76x3JWwMAmDPWdWZ92FvRQEzt7i1dRF1jKk0XgeEKTbBKifBv2aEKVSFoJJfBfSEjzT5pgv-5jrdHIZZfEj6rRsEHbBd1gglcDJqsNoyOtgH4uGLi5cTR4MxzPTLyiaT2d3q5aucCa_YA",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    quick_take: [
      "Next-generation cryogenic rocket booster performed a flawless maiden flight into low-Earth orbit.",
      "Successfully validated methane-oxygen staged combustion engines under vacuum conditions.",
      "Unlocks heavy payload capacity for commercial satellite constellations and lunar cargo staging."
    ],
    mcqs: [
      {
        id: "mcq-3-1",
        question: "What significance does methane-oxygen rocket propulsion hold in modern space exploration?",
        options: [
          "It provides clean, high-efficiency thrust with lower soot formation, enabling rapid reusability",
          "It completely eliminates the need for launch pad cooling water systems",
          "It operates without any spark ignition or oxidizer components",
          "It is strictly restricted to atmospheric sounding rockets"
        ],
        correct_index: 0,
        explanation: "Methalox engines offer optimal ISP efficiency, minimal carbon fouling, and potential for in-situ resource utilization."
      }
    ]
  },
  {
    id: "ko-4",
    source_url: "https://policynow.org/debate-evening",
    source_name: "PolicyNow Briefings",
    published_at: "2 hours ago",
    headline: "Major Policy Shift Announced During Evening Legislative Session",
    summary: "Lawmakers reached a key compromise during a tense late-night debate, introducing landmark reforms to synthetic biology research and AI data transparency standards.",
    category: "Polity",
    entities: ["Parliament", "Synthetic Biology", "Data Transparency", "Regulatory Committee"],
    exam_importance: 90,
    monetized: false,
    tag: "#POLITICS",
    views: "142K",
    likes: 42000,
    comments_count: 1800,
    shares: 950,
    saved: false,
    liked: false,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpSwndp7O5WQ2-DCjyknA5WLThzE6YE1bZGhRJPRXLx3qvve8vLgK0FtdiPLntb5lG9iKAY6NoS2IxXqBi2zgCLwtk5vr71f-dmVcpWhX0AEZRG9ldJG2V3jpaK0As-towBGenttiIwPCypg7akNy8AZUwGClsVHbEBhvuX4hZHZgPNcoOqLk1pxghGc-OQb2OGOnQyCmV0fM7JxECdFfmKF8wN7_TC35A8DWuY8_N6EqMGqWVrRIi6Q",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    quick_take: [
      "Bipartisan consensus achieved on national biosecurity and algorithmic transparency guidelines.",
      "Establishes a mandatory audit clearinghouse for high-risk generative biological modeling.",
      "Requires institutional funding recipients to maintain open data provenance logs."
    ],
    mcqs: [
      {
        id: "mcq-4-1",
        question: "What core requirement was introduced in the newly approved biosecurity policy framework?",
        options: [
          "Mandatory audit clearinghouse and data provenance tracking for high-risk biological modeling",
          "Complete ban on all medical biotechnology research",
          "Immediate privatizing of public health research facilities",
          "Exemption of AI algorithms from regulatory review"
        ],
        correct_index: 0,
        explanation: "The legislative compromise enforces algorithmic audits and provenance tracking to mitigate synthetic biosecurity risks."
      }
    ]
  },
  {
    id: "ko-5",
    source_url: "https://bhaktiliving.org/festival-light-2026",
    source_name: "Spiritual Horizon",
    published_at: "2 days ago",
    headline: "Spiritual Journey: Thousands Gather for Annual Festival of Light",
    summary: "Serene mandalas and illuminated lamps transformed the riverfront as thousands gathered for mindful devotional music and peaceful communal reflection.",
    category: "Miscellaneous",
    entities: ["Festival of Light", "Devotional Art", "Mindful Practice", "Bhakti"],
    exam_importance: 70,
    monetized: false,
    tag: "#BHAKTI",
    views: "55K",
    likes: 18500,
    comments_count: 620,
    shares: 410,
    saved: true,
    liked: true,
    image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVZ_BsCvQOOR57QBnlKVfpJeopNR3tTWNySVN3IVQ6f0m0p2RJ9HMkgLRUTCII7DvJzc6Xi97s-3e3Olj9Wxc9uJk33Qb5Ck0pAXgzz3H9Nnz96InClF_hDXF5uG8ULk0Dq-BUNm6_u1xT3EAG_yu6LCo5C8vrmS6V-Ey1DOomJCIsAgJtS8MTJfyJuuzX20WRAOoLUlg3X-JpjTazr1o4SDMS4LzlZ1jg63qAqZ8c6KtRgO2xPyX7ew",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    quick_take: [
      "Annual cultural gathering brought together thousands for communal light installations and devotional recitations.",
      "Features artistic mandalas symbolizing peace, self-reflection, and spiritual unity.",
      "Highlighted the role of traditional cultural heritage in promoting urban mental wellness."
    ],
    mcqs: [
      {
        id: "mcq-5-1",
        question: "In cultural history and current affairs, what fundamental theme does the mandala motif represent?",
        options: [
          "Spiritual wholeness, cosmic order, and mindful unity",
          "High-speed architectural engineering blueprints",
          "Agricultural soil map navigation",
          "Maritime navigation coordinates"
        ],
        correct_index: 0,
        explanation: "Mandalas are traditional sacred geometric diagrams representing cosmic harmony, focus, and spiritual integration."
      }
    ]
  }
];

export const LIVE_STREAMS: LiveStreamItem[] = [
  {
    id: "live-cricket",
    title: "Cricket World Cup T20: Live Feed & Active Match Highlights",
    category: "Cricket",
    tag: "#CRICKET_LIVE",
    viewers: "1.4M",
    is_live: true,
    publisher: "Live Cricket HD Network",
    description: "India vs Australia T20 World Cup Final active match highlights, live scorecard ticker, ball-by-ball video feed, and key wicket reels.",
    image_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1000&auto=format&fit=crop&q=80",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
  {
    id: "live-1",
    title: "NDTV 24x7: Live Breaking News & Global Current Affairs",
    category: "International",
    tag: "#BREAKING",
    viewers: "284.5K",
    is_live: true,
    publisher: "NDTV 24x7 Official",
    description: "Live 24x7 official broadcast covering global breaking news, Indian economy, parliamentary debates, and international geopolitical updates.",
    image_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1000&auto=format&fit=crop&q=80",
    video_url: "https://www.youtube.com/embed/S_8d4052X50?autoplay=1&mute=1"
  },
  {
    id: "live-2",
    title: "DW News Live: Global Headlines & Geopolitics Today",
    category: "International",
    tag: "#GLOBAL",
    viewers: "142.2K",
    is_live: true,
    publisher: "DW News Official",
    description: "Live European and international news broadcast covering climate policy, monetary decisions, and diplomatic summits.",
    image_url: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=1000&auto=format&fit=crop&q=80",
    video_url: "https://www.youtube.com/embed/mK9Jj9YnBzA?autoplay=1&mute=1"
  },
  {
    id: "live-3",
    title: "NASA TV Live: Earth Views & Space Station Missions",
    category: "Science",
    tag: "#SPACE",
    viewers: "98.1K",
    is_live: true,
    publisher: "NASA Official",
    description: "Live continuous feed from the International Space Station, rocket launches, and space agency research briefings.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80",
    video_url: "https://www.youtube.com/embed/21X5lGlDOfg?autoplay=1&mute=1"
  },
  {
    id: "live-4",
    title: "Sky News Live: Breaking World News & Financial Analysis",
    category: "Economy",
    tag: "#MARKETS",
    viewers: "210K",
    is_live: true,
    publisher: "Sky News Live",
    description: "24/7 world news coverage, stock exchange updates, central bank briefings, and live press conferences.",
    image_url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1000&auto=format&fit=crop&q=80",
    video_url: "https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1"
  }
];

export const UPCOMING_BROADCASTS = [
  {
    id: "up-1",
    time: "14:00",
    timezone: "EST",
    category: "INTERVIEW",
    title: "Exclusive: The Architect Behind the Mars Colony Design",
    notified: false
  },
  {
    id: "up-2",
    time: "16:30",
    timezone: "EST",
    category: "POLITICS",
    title: "Parliamentary Vote on Synthetic Biology Regulations",
    notified: true
  },
  {
    id: "up-3",
    time: "19:00",
    timezone: "EST",
    category: "CULTURE",
    title: "Opening Night: The Immersive Digital Arts Festival",
    notified: false
  }
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    user: "Astra_Dev",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    text: "The speed of non-invasive BCI progress is insane! Q3 consumer release will change smart home controls forever.",
    timestamp: "12m ago",
    likes: 342,
    liked: true
  },
  {
    id: "c2",
    user: "PolicyAnalyst_09",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    text: "Quick take highlights the real bottleneck: privacy regulations need to keep up before mass deployment.",
    timestamp: "28m ago",
    likes: 189,
    liked: false
  },
  {
    id: "c3",
    user: "Quantum_Kid",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    text: "Loving these 3-bullet summaries for quick exam review during transit!",
    timestamp: "45m ago",
    likes: 95,
    liked: false
  }
];
