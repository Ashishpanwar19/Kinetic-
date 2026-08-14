import { GoogleGenAI, Type } from '@google/genai';
import { getAdminClient, isSupabaseConfigured } from './supabaseClient.js';

// ─── Types ───────────────────────────────────────────────────

interface EntityExtraction {
  entities: Array<{
    name: string;
    type: string;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    relationship: string;
  }>;
}

interface FactCheckResult {
  verification_status: 'verified' | 'partially_verified' | 'unverified' | 'conflicting';
  confidence_score: number;
  cross_source_count: number;
  conflicting_sources: string[];
  verification_notes: string;
}

interface TimelineEvent {
  event_date: string;
  event_title: string;
  event_description: string;
}

interface ArticleForProcessing {
  id: string;
  headline: string;
  summary: string;
  source_name: string;
  category: string;
  published_at: string | null;
}

export interface KnowledgeEngineResult {
  articlesProcessed: number;
  entitiesExtracted: number;
  relationshipsBuilt: number;
  factChecksRun: number;
  timelinesBuilt: number;
  duplicatesDetected: number;
  breakingNewsDetected: number;
  errors: string[];
}

// ─── Helpers ─────────────────────────────────────────────────

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function normalizeEntityName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// ─── 1. NER + Knowledge Graph Builder ────────────────────────

async function extractEntitiesAndRelations(article: ArticleForProcessing): Promise<EntityExtraction | null> {
  const ai = getAI();
  if (!ai) return null;

  try {
    const prompt = `Extract named entities and their relationships from this news article for a knowledge graph:

Headline: ${article.headline}
Summary: ${article.summary}
Source: ${article.source_name}
Category: ${article.category}

Return JSON with:
- entities: array of { name, type } where type is one of "Person", "Organization", "Location", "Policy", "Event"
- relationships: array of { source, target, relationship } where source/target match entity names,
  and relationship is a short verb like "OPERATES", "DETERMINES", "FINANCES", "HOSTS", "CONVENES", "APPROVES", "LAUNCHES"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ['name', 'type'],
              },
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relationship: { type: Type.STRING },
                },
                required: ['source', 'target', 'relationship'],
              },
            },
          },
          required: ['entities'],
        },
      },
    });

    return JSON.parse(response.text || '{"entities":[],"relationships":[]}');
  } catch (err: any) {
    console.warn(`[knowledge-engine] NER failed for "${article.headline.slice(0, 40)}": ${err.message}`);
    return null;
  }
}

async function upsertEntityNode(
  client: ReturnType<typeof getAdminClient>,
  name: string,
  type: string,
  publishedAt: string | null
): Promise<string | null> {
  const normalized = normalizeEntityName(name);

  const { data: existing } = await client
    .from('entity_nodes')
    .select('id, mention_count, first_seen_at')
    .ilike('name', normalized)
    .eq('type', type)
    .maybeSingle();

  if (existing) {
    const earlierFirstSeen = publishedAt && existing.first_seen_at && publishedAt < existing.first_seen_at
      ? publishedAt
      : existing.first_seen_at;
    await client
      .from('entity_nodes')
      .update({
        mention_count: (existing.mention_count || 1) + 1,
        first_seen_at: earlierFirstSeen,
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: newNode, error } = await client
    .from('entity_nodes')
    .insert({
      name: name.trim(),
      type,
      mention_count: 1,
      first_seen_at: publishedAt,
    })
    .select('id')
    .maybeSingle();

  if (error || !newNode) return null;
  return newNode.id;
}

async function upsertEntityRelation(
  client: ReturnType<typeof getAdminClient>,
  sourceId: string,
  targetId: string,
  relationship: string,
  koId: string
): Promise<void> {
  const { data: existing } = await client
    .from('entity_relations')
    .select('id, weight')
    .eq('source_entity_id', sourceId)
    .eq('target_entity_id', targetId)
    .eq('relationship', relationship)
    .maybeSingle();

  if (existing) {
    await client
      .from('entity_relations')
      .update({ weight: (existing.weight || 1) + 1 })
      .eq('id', existing.id);
  } else {
    await client.from('entity_relations').insert({
      source_entity_id: sourceId,
      target_entity_id: targetId,
      relationship,
      ko_id: koId,
      weight: 1,
    });
  }
}

async function linkArticleToEntity(
  client: ReturnType<typeof getAdminClient>,
  koId: string,
  entityNodeId: string
): Promise<void> {
  await client.from('ko_entities').upsert({
    ko_id: koId,
    entity_node_id: entityNodeId,
  }, { onConflict: 'ko_id,entity_node_id' });
}

async function processArticleEntities(article: ArticleForProcessing): Promise<{ entities: number; relations: number }> {
  if (!isSupabaseConfigured()) return { entities: 0, relations: 0 };

  const extraction = await extractEntitiesAndRelations(article);
  if (!extraction || !extraction.entities || extraction.entities.length === 0) {
    return { entities: 0, relations: 0 };
  }

  const client = getAdminClient();
  const entityIdMap = new Map<string, string>();

  for (const ent of extraction.entities) {
    const entityId = await upsertEntityNode(client, ent.name, ent.type, article.published_at);
    if (entityId) {
      entityIdMap.set(normalizeEntityName(ent.name), entityId);
      await linkArticleToEntity(client, article.id, entityId);
    }
  }

  let relationsBuilt = 0;
  if (extraction.relationships) {
    for (const rel of extraction.relationships) {
      const sourceId = entityIdMap.get(normalizeEntityName(rel.source));
      const targetId = entityIdMap.get(normalizeEntityName(rel.target));
      if (sourceId && targetId) {
        await upsertEntityRelation(client, sourceId, targetId, rel.relationship, article.id);
        relationsBuilt++;
      }
    }
  }

  return { entities: entityIdMap.size, relations: relationsBuilt };
}

// ─── 2. Fact Checker ─────────────────────────────────────────

async function factCheckArticle(article: ArticleForProcessing): Promise<FactCheckResult | null> {
  const ai = getAI();
  if (!ai) return null;

  try {
    const client = getAdminClient();

    const { data: relatedArticles } = await client
      .from('knowledge_objects')
      .select('headline, summary, source_name')
      .neq('id', article.id)
      .or(`headline.ilike.%${article.headline.slice(0, 30)}%,summary.ilike.%${article.headline.slice(0, 30)}%`)
      .limit(5);

    const crossSourceContext = (relatedArticles || [])
      .map((r: any) => `- ${r.source_name}: ${r.headline}`)
      .join('\n');

    const prompt = `Fact-check this news article by cross-referencing with other sources:

Article to check:
- Headline: ${article.headline}
- Summary: ${article.summary}
- Source: ${article.source_name}

Other sources covering similar topics:
${crossSourceContext || 'No cross-source articles found yet.'}

Return JSON with verification status, confidence score (0-100), count of corroborating sources,
any conflicting source names, and verification notes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verification_status: { type: Type.STRING },
            confidence_score: { type: Type.INTEGER },
            cross_source_count: { type: Type.INTEGER },
            conflicting_sources: { type: Type.ARRAY, items: { type: Type.STRING } },
            verification_notes: { type: Type.STRING },
          },
          required: ['verification_status', 'confidence_score', 'verification_notes'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}') as FactCheckResult;

    await client.from('fact_checks').upsert({
      ko_id: article.id,
      verification_status: result.verification_status || 'unverified',
      confidence_score: result.confidence_score || 0,
      cross_source_count: result.cross_source_count || (relatedArticles?.length || 0),
      conflicting_sources: result.conflicting_sources || [],
      verification_notes: result.verification_notes || '',
    }, { onConflict: 'ko_id' });

    return result;
  } catch (err: any) {
    console.warn(`[knowledge-engine] Fact check failed for "${article.headline.slice(0, 40)}": ${err.message}`);
    return null;
  }
}

// ─── 3. Timeline Builder ─────────────────────────────────────

async function buildTimelineForTopic(topic: string, articles: ArticleForProcessing[]): Promise<TimelineEvent[]> {
  const ai = getAI();
  if (!ai || articles.length === 0) return [];

  try {
    const articleSummaries = articles
      .slice(0, 10)
      .map((a, i) => `${i + 1}. [${a.published_at?.slice(0, 10) || 'N/A'}] ${a.headline}: ${a.summary}`)
      .join('\n');

    const prompt = `Build a chronological timeline of events for the topic "${topic}" from these articles:

${articleSummaries}

Return a JSON array of timeline events, ordered by date (earliest first). Each event should have:
- event_date (YYYY-MM-DD format)
- event_title (short title)
- event_description (1-2 sentence description)`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              event_date: { type: Type.STRING },
              event_title: { type: Type.STRING },
              event_description: { type: Type.STRING },
            },
            required: ['event_date', 'event_title', 'event_description'],
          },
        },
      },
    });

    const events = JSON.parse(response.text || '[]') as TimelineEvent[];

    if (isSupabaseConfigured() && events.length > 0) {
      const client = getAdminClient();
      await client.from('timelines').delete().eq('topic', topic);
      await client.from('timelines').insert(
        events.map(e => ({
          topic,
          event_date: e.event_date,
          event_title: e.event_title,
          event_description: e.event_description,
          ko_id: articles[0]?.id || null,
        }))
      );
    }

    return events;
  } catch (err: any) {
    console.warn(`[knowledge-engine] Timeline build failed for "${topic}": ${err.message}`);
    return [];
  }
}

// ─── 4. Duplicate Detector ───────────────────────────────────

function fuzzyTitleSimilarity(a: string, b: string): number {
  const wordsA = a.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const wordsB = b.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;

  return union > 0 ? intersection / union : 0;
}

async function detectDuplicates(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const client = getAdminClient();

  const { data: recentArticles } = await client
    .from('knowledge_objects')
    .select('id, headline, source_name, published_at, exam_importance')
    .order('published_at', { ascending: false })
    .limit(100);

  if (!recentArticles || recentArticles.length < 2) return 0;

  let duplicatesFound = 0;
  const SIMILARITY_THRESHOLD = 0.65;
  const processed = new Set<string>();

  for (let i = 0; i < recentArticles.length; i++) {
    if (processed.has(recentArticles[i].id)) continue;

    const primary = recentArticles[i];
    const duplicates: string[] = [];

    for (let j = i + 1; j < recentArticles.length; j++) {
      if (processed.has(recentArticles[j].id)) continue;

      const similarity = fuzzyTitleSimilarity(primary.headline, recentArticles[j].headline);
      if (similarity >= SIMILARITY_THRESHOLD) {
        duplicates.push(recentArticles[j].id);
        processed.add(recentArticles[j].id);
      }
    }

    if (duplicates.length > 0) {
      processed.add(primary.id);
      duplicatesFound += duplicates.length;

      const { data: existing } = await client
        .from('duplicate_groups')
        .select('id')
        .eq('primary_ko_id', primary.id)
        .maybeSingle();

      if (!existing) {
        await client.from('duplicate_groups').insert({
          primary_ko_id: primary.id,
          duplicate_ko_ids: duplicates,
          similarity_score: SIMILARITY_THRESHOLD,
          detection_method: 'fuzzy_title',
        });
      }
    }
  }

  return duplicatesFound;
}

// ─── 5. Breaking News Detector ───────────────────────────────

async function detectBreakingNews(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const client = getAdminClient();

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: recentKos } = await client
    .from('knowledge_objects')
    .select('id, headline, source_name, published_at, entities')
    .gte('published_at', thirtyMinAgo)
    .order('published_at', { ascending: false })
    .limit(50);

  if (!recentKos || recentKos.length === 0) return 0;

  const BREAKING_KEYWORDS = ['breaking', 'urgent', 'alert', 'just in', 'developing'];
  const entityGroups = new Map<string, string[]>();

  for (const ko of recentKos) {
    const headlineLower = ko.headline.toLowerCase();
    const hasBreakingKeyword = BREAKING_KEYWORDS.some(kw => headlineLower.includes(kw));

    const entities = ko.entities || [];
    if (entities.length > 0) {
      const primaryEntity = entities[0].toLowerCase();
      if (!entityGroups.has(primaryEntity)) {
        entityGroups.set(primaryEntity, []);
      }
      entityGroups.get(primaryEntity)!.push(ko.id);
    }

    if (hasBreakingKeyword) {
      await client
        .from('knowledge_objects')
        .update({ is_breaking: true, updated_at: new Date().toISOString() })
        .eq('id', ko.id);
    }
  }

  let breakingDetected = 0;
  for (const [, koIds] of entityGroups) {
    if (koIds.length >= 3) {
      const { data: updated } = await client
        .from('knowledge_objects')
        .update({ is_breaking: true, updated_at: new Date().toISOString() })
        .in('id', koIds)
        .select('id');

      breakingDetected += updated?.length || 0;
    }
  }

  return breakingDetected;
}

// ─── 6. Main Pipeline Orchestrator ───────────────────────────

export async function runKnowledgeEnginePipeline(
  options?: { maxArticles?: number; skipFactCheck?: boolean }
): Promise<KnowledgeEngineResult> {
  if (!isSupabaseConfigured()) {
    return {
      articlesProcessed: 0,
      entitiesExtracted: 0,
      relationshipsBuilt: 0,
      factChecksRun: 0,
      timelinesBuilt: 0,
      duplicatesDetected: 0,
      breakingNewsDetected: 0,
      errors: ['Supabase not configured'],
    };
  }

  const maxArticles = options?.maxArticles ?? 10;
  const skipFactCheck = options?.skipFactCheck ?? false;

  console.log(`[knowledge-engine] Starting pipeline (max ${maxArticles} articles)...`);

  const client = getAdminClient();

  const { data: unprocessed } = await client
    .from('knowledge_objects')
    .select('id, headline, summary, source_name, category, published_at')
    .not('id', 'in', `(
      SELECT DISTINCT ko_id FROM ko_entities
    )`)
    .order('published_at', { ascending: false })
    .limit(maxArticles);

  const articles: ArticleForProcessing[] = (unprocessed || []).map((r: any) => ({
    id: r.id,
    headline: r.headline,
    summary: r.summary,
    source_name: r.source_name,
    category: r.category,
    published_at: r.published_at,
  }));

  console.log(`[knowledge-engine] Found ${articles.length} articles needing processing`);

  let entitiesExtracted = 0;
  let relationshipsBuilt = 0;
  let factChecksRun = 0;
  const errors: string[] = [];

  for (const article of articles) {
    try {
      const entResult = await processArticleEntities(article);
      entitiesExtracted += entResult.entities;
      relationshipsBuilt += entResult.relations;

      if (!skipFactCheck) {
        const fcResult = await factCheckArticle(article);
        if (fcResult) factChecksRun++;
      }
    } catch (err: any) {
      errors.push(`${article.headline.slice(0, 30)}: ${err.message}`);
    }
  }

  const { data: topicArticles } = await client
    .from('knowledge_objects')
    .select('id, headline, summary, source_name, category, published_at')
    .order('published_at', { ascending: false })
    .limit(30);

  const topCategories = new Set<string>();
  for (const r of (topicArticles || [])) {
    if (r.category && r.category !== 'Miscellaneous' && r.category !== 'news') {
      topCategories.add(r.category);
    }
  }

  let timelinesBuilt = 0;
  for (const category of topCategories) {
    const categoryArticles: ArticleForProcessing[] = (topicArticles || [])
      .filter((r: any) => r.category === category)
      .map((r: any) => ({
        id: r.id,
        headline: r.headline,
        summary: r.summary,
        source_name: r.source_name,
        category: r.category,
        published_at: r.published_at,
      }));

    if (categoryArticles.length >= 2) {
      const events = await buildTimelineForTopic(category, categoryArticles);
      if (events.length > 0) timelinesBuilt++;
    }
  }

  const duplicatesDetected = await detectDuplicates();
  const breakingNewsDetected = await detectBreakingNews();

  console.log(`[knowledge-engine] Pipeline complete: ${articles.length} processed, ${entitiesExtracted} entities, ${relationshipsBuilt} relations, ${factChecksRun} fact-checks, ${timelinesBuilt} timelines, ${duplicatesDetected} duplicates, ${breakingNewsDetected} breaking`);

  return {
    articlesProcessed: articles.length,
    entitiesExtracted,
    relationshipsBuilt,
    factChecksRun,
    timelinesBuilt,
    duplicatesDetected,
    breakingNewsDetected,
    errors,
  };
}

// ─── Query Functions for API ─────────────────────────────────

export async function fetchKnowledgeGraphData(limit: number = 50) {
  if (!isSupabaseConfigured()) return { nodes: [], links: [] };

  const client = getAdminClient();

  const { data: nodes } = await client
    .from('entity_nodes')
    .select('id, name, type, mention_count')
    .order('mention_count', { ascending: false })
    .limit(limit);

  const nodeIds = (nodes || []).map((n: any) => n.id);

  let links: any[] = [];
  if (nodeIds.length > 0) {
    const { data: relations } = await client
      .from('entity_relations')
      .select('source_entity_id, target_entity_id, relationship, weight')
      .in('source_entity_id', nodeIds)
      .in('target_entity_id', nodeIds);

    links = (relations || []).map((r: any) => ({
      source: r.source_entity_id,
      target: r.target_entity_id,
      relationship: r.relationship,
      weight: r.weight,
    }));
  }

  return {
    nodes: (nodes || []).map((n: any) => ({
      id: n.id,
      label: n.name,
      type: n.type,
      val: n.mention_count || 1,
    })),
    links,
  };
}

export async function fetchTimeline(topic: string) {
  if (!isSupabaseConfigured()) return [];

  const client = getAdminClient();
  const { data, error } = await client
    .from('timelines')
    .select('*')
    .eq('topic', topic)
    .order('event_date', { ascending: true });

  if (error || !data) return [];
  return data;
}

export async function fetchFactCheck(koId: string) {
  if (!isSupabaseConfigured()) return null;

  const client = getAdminClient();
  const { data, error } = await client
    .from('fact_checks')
    .select('*')
    .eq('ko_id', koId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function fetchDuplicateGroups(limit: number = 20) {
  if (!isSupabaseConfigured()) return [];

  const client = getAdminClient();
  const { data, error } = await client
    .from('duplicate_groups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

export async function fetchTimelineTopics() {
  if (!isSupabaseConfigured()) return [];

  const client = getAdminClient();
  const { data, error } = await client
    .from('timelines')
    .select('topic')
    .order('topic');

  if (error || !data) return [];
  const topics = new Set(data.map((r: any) => r.topic));
  return [...topics];
}
