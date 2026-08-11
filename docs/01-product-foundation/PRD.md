# PulseNews AI — Product Requirements Document (PRD)

## 1. Product Overview

PulseNews AI is a real-time news intelligence platform that uses AI to transform raw news into exam-ready knowledge. The product targets competitive exam candidates who need current affairs content distilled into quick takes, MCQs, and a conversational AI tutor.

---

## 2. User Personas

### Persona 1: Raj — UPSC Aspirant

- **Age**: 24
- **Location**: Delhi, India
- **Device**: Android phone (primary), laptop (secondary)
- **Study hours**: 8-10 hours daily
- **Pain point**: Spends 2 hours every morning reading The Hindu, Indian Express, and PIB. Then another hour making notes. By the time he's done, half the day is gone.
- **Goal**: Get the same knowledge in 20 minutes with quiz-ready MCQs.
- **Quote**: "I don't need every news item. I need the ones that show up in prelims."

### Persona 2: Priya — Working Professional, SSC Candidate

- **Age**: 27
- **Location**: Bangalore, India
- **Device**: iPhone (commute), desktop (office)
- **Study hours**: 2-3 hours (evenings and weekends)
- **Pain point**: Can't read newspapers during work. By evening, coaching institute PDFs are outdated.
- **Goal**: Catch up on the day's current affairs during her 45-minute commute via short video reels.
- **Quote**: "I need something I can watch on the bus that actually teaches me."

### Persona 3: Dr. Mehta — Policy Researcher

- **Age**: 41
- **Location**: Mumbai, India
- **Device**: Desktop (primary), iPad (reading)
- **Pain point**: Needs to track policy developments across 15+ sources daily. Existing tools don't verify sources.
- **Goal**: A single dashboard with source-tracked, cross-verified policy updates and a searchable knowledge base.
- **Quote**: "I need to know not just what happened, but who reported it and when."

### Persona 4: Arjun — Quiz Enthusiast

- **Age**: 19
- **Location**: Pune, India
- **Device**: Android phone
- **Pain point**: Loves trivia quizzes but general knowledge apps are static and outdated.
- **Goal**: Daily fresh quiz content based on real current events.
- **Quote**: "I want new quiz questions every day, not the same recycled ones."

---

## 3. User Stories

### Epic 1: News Consumption

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-1.1 | UPSC aspirant | See a vertical video feed of news reels | I can consume news like TikTok during my commute | Must |
| US-1.2 | UPSC aspirant | Read a 3-bullet quick take on each article | I get the key facts without reading the full article | Must |
| US-1.3 | Working professional | Filter the feed by category (Trending, For You, Local) | I see only the most relevant content | Must |
| US-1.4 | Researcher | See the source name and publication time on every article | I can verify credibility | Must |
| US-1.5 | Aspirant | See breaking news notifications in real time | I don't miss important events | Should |
| US-1.6 | Aspirant | Share articles via native share sheet or copy link | I can discuss with study group | Should |

### Epic 2: Learning & Assessment

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-2.1 | UPSC aspirant | Take MCQ quizzes on each article | I can test my understanding immediately | Must |
| US-2.2 | UPSC aspirant | See explanations for each MCQ answer | I learn from my mistakes | Must |
| US-2.3 | Aspirant | View my quiz history and accuracy trend | I can track my progress over time | Must |
| US-2.4 | Aspirant | Download a daily PDF digest with all articles and MCQs | I can study offline | Must |
| US-2.5 | Aspirant | Generate AI quick takes on any custom topic | I can study topics not in the daily feed | Should |
| US-2.6 | Aspirant | Practice with flashcards for key facts | I improve retention through active recall | Should |

### Epic 3: AI Tutor

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-3.1 | Aspirant | Ask the AI tutor questions about current affairs | I get instant answers without searching | Must |
| US-3.2 | Aspirant | Have multi-turn conversations with the tutor | I can ask follow-up questions | Must |
| US-3.3 | Aspirant | The tutor remembers my chat history | I can resume conversations | Must |
| US-3.4 | Aspirant | Get suggested questions when I'm not sure what to ask | I can discover topics easily | Should |

### Epic 4: Live Broadcasts

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-4.1 | Aspirant | Watch live news streams (NDTV, DW, NASA) in-app | I don't need to switch apps | Must |
| US-4.2 | Aspirant | See live cricket match highlights and scorecard | I stay updated on sports current affairs | Should |
| US-4.3 | Aspirant | Set reminders for upcoming broadcasts | I don't miss scheduled events | Should |

### Epic 5: Knowledge Graph

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-5.1 | Aspirant | Explore an interactive knowledge graph of entities and relationships | I understand how events connect | Should |
| US-5.2 | Researcher | Click on any entity to see its details and relationships | I can deep-dive into specific topics | Should |
| US-5.3 | Aspirant | See direct relationships from any selected entity | I can trace policy impacts | Should |

### Epic 6: Bookmarks & Profile

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-6.1 | Aspirant | Bookmark articles for later review | I can build a personal revision collection | Must |
| US-6.2 | Aspirant | View all bookmarks in my profile | I can revise before exams | Must |
| US-6.3 | Aspirant | See my activity history (quizzes taken, articles read) | I can track my study consistency | Should |
| US-6.4 | Aspirant | Reset my progress stats | I can start fresh after an exam cycle | Should |

### Epic 7: Open News Studio

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-7.1 | Researcher | Extract full article content from any URL | I can read the complete text with metadata | Should |
| US-7.2 | Researcher | Search Google News from within the app | I don't need to open a separate search | Should |
| US-7.3 | Researcher | Discover RSS feeds from any website | I can add new sources to monitor | Should |
| US-7.4 | Researcher | Batch fetch and summarize multiple URLs | I can process several articles at once | Should |

---

## 4. Acceptance Criteria

### AC-1: Short Video Feed

- Given the user opens the Feed tab
- When the page loads
- Then a vertical full-screen video feed is displayed
- And the first video auto-plays (muted)
- And scrolling snaps to the next video
- And each card shows headline, summary, source, views, and social actions (like, comment, save, share)

### AC-2: MCQ Quiz

- Given the user clicks "Take MCQs Quiz" on any article
- When the quiz modal opens
- Then all MCQs for that article are displayed one at a time
- And the user can select one option per question
- And navigation between questions is available (Previous/Next)
- And on submit, the score is calculated and displayed
- And each question shows whether the answer was correct with an explanation
- And the result is persisted to the user's profile

### AC-3: AI Tutor

- Given the user opens the AI Tutor modal
- When the user sends a message
- Then the tutor responds within 5 seconds
- And the response is grounded in the knowledge base (RAG)
- And the conversation history is preserved across sessions
- And quick-suggestion chips are displayed below the chat

### AC-4: PDF Digest Download

- Given the user clicks "Download PDF Digest"
- When the PDF is generated
- Then a PDF is downloaded with the filename format `PulseNews_Digest_YYYY-MM-DD.pdf`
- And the PDF contains all articles with headlines, summaries, quick-take bullets, and MCQs
- And the PDF is paginated with headers and footers

### AC-5: Breaking News Detection

- Given 3+ sources report the same event within 30 minutes
- When the AI pipeline processes the articles
- Then the event is flagged as breaking news
- And a push notification is sent to subscribed users
- And a WebSocket event updates the feed in real time

---

## 5. Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| Daily Active Users | 50,000 in Year 1 | Analytics dashboard |
| Average session duration | 25+ minutes | Analytics tracking |
| Quiz completion rate | 70%+ of started quizzes | Quiz submission logs |
| Average quiz accuracy | 65%+ | Score / total ratio |
| PDF downloads per month | 100,000+ | Download endpoint logs |
| AI tutor daily conversations | 20,000+ | Chat message logs |
| Breaking news detection time | < 10 minutes | Pipeline latency metrics |
| User retention (30-day) | 40%+ | Return user tracking |
| App Store / Play Store rating | 4.5+ | Store ratings |
