/*
# Seed sample data: sources, knowledge_objects, mcqs, entities, youtube_channels, live_streams

## Purpose
Inserts sample data into the database for development and testing.
This provides realistic content that the frontend can display and the
backend can serve during development.

## Data Inserted

### Sources (4)
- Reuters (RSS, international)
- UN News (RSS, international)
- PIB India (government, national)
- TechFrontier (RSS, technology)

### Knowledge Objects (3)
- Global Markets Rally (Economy, importance 88)
- Cyber-Sovereignty Summit (International, importance 95)
- Neural Interfaces (Science, importance 92)

### MCQs (3)
- One MCQ per knowledge object

### Entities (9)
- 3 entities per knowledge object

### YouTube Channels (4)
- NDTV 24x7, DW News, NASA TV, Sky News

### Live Streams (4)
- One live stream per channel

## Notes
1. All knowledge_objects are marked reviewed=true so they're visible to public SELECT.
2. published_at is set to recent timestamps for proper feed ordering.
3. quick_take is stored as JSONB array of 3 strings.
4. This migration is idempotent — uses ON CONFLICT DO NOTHING to avoid duplicates.
5. youtube_channel IDs are placeholder YouTube channel IDs for embedding.
*/

-- ──────────────────────────────────────────────────────────────
-- SOURCES
-- ──────────────────────────────────────────────────────────────
INSERT INTO sources (name, url, feed_url, type, is_active, category, country)
VALUES
  ('Reuters Media', 'https://reuters.com', 'https://reuters.com/rssFeed/worldNews', 'rss', true, 'Economy', 'US'),
  ('UN News Agency', 'https://un.org/news', 'https://news.un.org/feed', 'rss', true, 'International', 'INTL'),
  ('PIB India', 'https://pib.gov.in', NULL, 'government', true, 'Polity', 'IN'),
  ('TechFrontier News', 'https://techfrontier.io', 'https://techfrontier.io/rss', 'rss', true, 'Science', 'US')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- KNOWLEDGE OBJECTS
-- ──────────────────────────────────────────────────────────────
-- We need source_ids for the FK. Use subqueries to get them.
INSERT INTO knowledge_objects (
  source_id, source_url, source_name, headline, summary, category,
  exam_importance, quick_take, entities, image_url, tag,
  views, likes, comments_count, shares,
  is_breaking, is_live, reviewed, monetized,
  published_at
)
SELECT
  s.id,
  'https://reuters.com/markets/tech-surge-2026',
  'Reuters Media',
  'Global Markets Rally Following Unexpected Tech Sector Earnings Surge',
  'Major global indices surged to record highs today as key technology firms reported earnings substantially above analyst expectations. Revenue growth was propelled by enterprise demand for custom AI server clusters and next-generation semiconductors.',
  'Economy',
  88,
  '["Key technology firms reported Q2 earnings 24% above analyst consensus, driving broad index gains.","Semiconductor capital expenditures increased sharply due to high demand for custom tensor hardware.","Central banks noted the tech sector strength as a stabilizing factor for international financial liquidity."]'::jsonb,
  ARRAY['Global Markets', 'Tech Sector', 'Wall Street', 'AI Chips'],
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a4?w=800',
  '#TECH',
  '1.2M', 342000, 12000, 4500,
  false, false, true, true,
  NOW() - INTERVAL '2 hours'
FROM sources s WHERE s.name = 'Reuters Media'
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_objects (
  source_id, source_url, source_name, headline, summary, category,
  exam_importance, quick_take, entities, image_url, tag,
  views, likes, comments_count, shares,
  is_breaking, is_live, reviewed, monetized,
  published_at
)
SELECT
  s.id,
  'https://un.org/news/cyber-sovereignty-2026',
  'UN News Agency',
  'Cyber-Sovereignty Summit: Global Leaders Clash Over Data Rights',
  'Tensions escalated at the UN Cyber Summit in Geneva as delegates from major tech powers debated the new international framework for AI governance, biometric data protection, and cross-border data transfer limits.',
  'International',
  95,
  '["Global delegates assembled in Geneva to establish binding regulations on sovereign data borders.","Disagreements center on mandatory localized data storage vs borderless cloud processing.","A unanimous declaration on ethical AI safeguards is scheduled for a final vote tomorrow."]'::jsonb,
  ARRAY['United Nations', 'Geneva Summit', 'Cyber Sovereignty', 'Data Privacy'],
  'https://images.unsplash.com/photo-1521737604896-dff3783c30c3?w=800',
  '#GLOBAL',
  '124.5K', 89000, 3400, 1800,
  true, true, true, false,
  NOW() - INTERVAL '3 hours'
FROM sources s WHERE s.name = 'UN News Agency'
ON CONFLICT DO NOTHING;

INSERT INTO knowledge_objects (
  source_id, source_url, source_name, headline, summary, category,
  exam_importance, quick_take, entities, image_url, tag,
  views, likes, comments_count, shares,
  is_breaking, is_live, reviewed, monetized,
  published_at
)
SELECT
  s.id,
  'https://techfrontier.io/news/neural-interface-q3',
  'TechFrontier News',
  'Next-Gen Neural Interfaces Hit Consumer Market',
  'Major tech conglomerate announces the first non-invasive neural band designed for everyday consumer use, targeting a Q3 release. The band promises sub-millisecond thought-pattern recognition to control smart home and spatial devices.',
  'Science',
  92,
  '["First consumer-grade non-invasive BCI headband announced for Q3 release.","Promises hands-free control of spatial headsets and smart devices via EEG pattern translation.","Privacy advocacy groups have called for strict regulatory oversight regarding neural data harvesting."]'::jsonb,
  ARRAY['Neural Band', 'Brain-Computer Interface', 'Thought Controls', 'Biometric Scrutiny'],
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800',
  '#TECH',
  '2.4M', 384000, 14200, 9800,
  false, false, true, true,
  NOW() - INTERVAL '1 hour'
FROM sources s WHERE s.name = 'TechFrontier News'
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- MCQS (insert using subquery for ko_id)
-- ──────────────────────────────────────────────────────────────
INSERT INTO mcqs (ko_id, question, options, correct_index, explanation)
SELECT
  ko.id,
  'What primary factor drove the recent surge in global market indices?',
  '["Unexpected surge in tech sector earnings driven by AI hardware demand","Unilateral rate cuts by central banks across Asia and Europe","Record high crude oil prices due to supply bottlenecks","A major decline in international trade tariffs"]'::jsonb,
  0,
  'Key technology firms reported earnings well above analyst expectations, fueled by enterprise adoption of AI chips and infrastructure.'
FROM knowledge_objects ko
WHERE ko.headline = 'Global Markets Rally Following Unexpected Tech Sector Earnings Surge'
AND NOT EXISTS (SELECT 1 FROM mcqs WHERE ko_id = ko.id AND question LIKE 'What primary factor drove%');

INSERT INTO mcqs (ko_id, question, options, correct_index, explanation)
SELECT
  ko.id,
  'Where is the global Cyber-Sovereignty Summit on AI Governance taking place?',
  '["New York, USA","Geneva, Switzerland","Tokyo, Japan","Brussels, Belgium"]'::jsonb,
  1,
  'The summit convened at the UN Headquarters in Geneva to establish global norms on cross-border data flows.'
FROM knowledge_objects ko
WHERE ko.headline = 'Cyber-Sovereignty Summit: Global Leaders Clash Over Data Rights'
AND NOT EXISTS (SELECT 1 FROM mcqs WHERE ko_id = ko.id AND question LIKE 'Where is the global Cyber-Sovereignty%');

INSERT INTO mcqs (ko_id, question, options, correct_index, explanation)
SELECT
  ko.id,
  'How does the consumer Neural Band detect user intent without surgical implantation?',
  '["Using non-invasive EEG and EMG surface sensor arrays","Through high-frequency optical eye tracking only","Via physical voice resonance sensors","Using external thermal radiation mapping"]'::jsonb,
  0,
  'The device relies on advanced non-invasive surface bio-sensors that read neural micro-currents and muscle signals.'
FROM knowledge_objects ko
WHERE ko.headline = 'Next-Gen Neural Interfaces Hit Consumer Market'
AND NOT EXISTS (SELECT 1 FROM mcqs WHERE ko_id = ko.id AND question LIKE 'How does the consumer Neural Band%');

-- ──────────────────────────────────────────────────────────────
-- ENTITIES (insert using subquery for ko_id)
-- ──────────────────────────────────────────────────────────────
INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Global Markets', 'Organization'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Global Markets Rally%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Global Markets');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Wall Street', 'Location'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Global Markets Rally%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Wall Street');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'AI Chips', 'Policy'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Global Markets Rally%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'AI Chips');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'United Nations', 'Organization'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Cyber-Sovereignty%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'United Nations');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Geneva Summit', 'Event'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Cyber-Sovereignty%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Geneva Summit');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Data Privacy', 'Policy'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Cyber-Sovereignty%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Data Privacy');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Neural Band', 'Organization'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Next-Gen Neural Interfaces%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Neural Band');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Brain-Computer Interface', 'Policy'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Next-Gen Neural Interfaces%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Brain-Computer Interface');

INSERT INTO entities (ko_id, name, type)
SELECT ko.id, 'Biometric Scrutiny', 'Policy'
FROM knowledge_objects ko WHERE ko.headline LIKE 'Next-Gen Neural Interfaces%'
AND NOT EXISTS (SELECT 1 FROM entities WHERE ko_id = ko.id AND name = 'Biometric Scrutiny');

-- ──────────────────────────────────────────────────────────────
-- YOUTUBE CHANNELS
-- ──────────────────────────────────────────────────────────────
INSERT INTO youtube_channels (channel_id, name, description, category, is_monitored)
VALUES
  ('UCndbp5xBpW5JF3GCRtTf3BA', 'NDTV 24x7', 'India leading English news channel', 'News', true),
  ('UCknX5EyqWaBfUboKnsumRwQ', 'DW News', 'German international broadcaster', 'News', true),
  ('UCryGec9PdUCLjpJW2mgCuLw', 'NASA TV', 'NASA live missions and earth views', 'Science', true),
  ('UCSiVik9lA0eRLlJjW2qW2Yg', 'Sky News', 'UK breaking world news', 'News', true)
ON CONFLICT (channel_id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- LIVE STREAMS
-- ──────────────────────────────────────────────────────────────
INSERT INTO live_streams (channel_id, title, is_live, viewer_count, video_id, stream_started_at)
SELECT yc.id, 'NDTV 24x7: Live Breaking News & Global Current Affairs', true, '284.5K', '21X5lGlDOfg', NOW() - INTERVAL '4 hours'
FROM youtube_channels yc WHERE yc.name = 'NDTV 24x7'
AND NOT EXISTS (SELECT 1 FROM live_streams ls WHERE ls.channel_id = yc.id);

INSERT INTO live_streams (channel_id, title, is_live, viewer_count, video_id, stream_started_at)
SELECT yc.id, 'DW News Live: Global Headlines & Geopolitics Today', true, '142.2K', 'o6enhaQyGkI', NOW() - INTERVAL '6 hours'
FROM youtube_channels yc WHERE yc.name = 'DW News'
AND NOT EXISTS (SELECT 1 FROM live_streams ls WHERE ls.channel_id = yc.id);

INSERT INTO live_streams (channel_id, title, is_live, viewer_count, video_id, stream_started_at)
SELECT yc.id, 'NASA TV Live: Earth Views & Space Station Missions', true, '98.1K', '21X5lGlDOfg', NOW() - INTERVAL '12 hours'
FROM youtube_channels yc WHERE yc.name = 'NASA TV'
AND NOT EXISTS (SELECT 1 FROM live_streams ls WHERE ls.channel_id = yc.id);

INSERT INTO live_streams (channel_id, title, is_live, viewer_count, video_id, stream_started_at)
SELECT yc.id, 'Sky News Live: Breaking World News & Financial Analysis', true, '210K', 'YDvsBbKfLPA', NOW() - INTERVAL '8 hours'
FROM youtube_channels yc WHERE yc.name = 'Sky News'
AND NOT EXISTS (SELECT 1 FROM live_streams ls WHERE ls.channel_id = yc.id);
