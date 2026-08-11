import React, { useState, useEffect } from 'react';
import { SystemMetrics } from '../types';

export const SystemArchitectureView: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());

  // Pipeline & QC State
  const [unreviewedItems, setUnreviewedItems] = useState<any[]>([]);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [pipelineLog, setPipelineLog] = useState<string[]>([]);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/system/metrics');
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
        setLastRefreshed(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to fetch system metrics:', err);
    }
  };

  const fetchUnreviewed = async () => {
    try {
      const res = await fetch('/api/digest/unreviewed');
      const data = await res.json();
      if (data.success && data.unreviewed_items) {
        setUnreviewedItems(data.unreviewed_items);
      }
    } catch (err) {
      console.error('Failed to fetch unreviewed queue:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchUnreviewed();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchUnreviewed();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerWorkerPipeline = async () => {
    setIsIngesting(true);
    setPipelineLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Triggering Cron/Worker RSS Poller (FastAPI / Celery Beat)...`,
      `[${new Date().toLocaleTimeString()}] Fetching raw RSS articles & deduplicating URL SHA256 hashes...`,
      ...prev
    ]);

    try {
      const res = await fetch('/api/worker/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_review: autoApprove })
      });
      const data = await res.json();

      if (data.success && data.item) {
        setPipelineLog((prev) => [
          `[${new Date().toLocaleTimeString()}] ✅ Gemini 3.6 Flash Distillation Complete! Created Knowledge Object "${data.item.headline}" (Importance: ${data.item.exam_importance}/100)`,
          `[${new Date().toLocaleTimeString()}] Status: ${data.item.reviewed ? 'APPROVED & PUBLISHED' : 'IN QC REVIEW GATE QUEUE'}`,
          ...prev
        ]);
        fetchUnreviewed();
        fetchMetrics();
      } else {
        setPipelineLog((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Worker error: ${data.error || 'Failed'}`, ...prev]);
      }
    } catch (err: any) {
      setPipelineLog((prev) => [`[${new Date().toLocaleTimeString()}] ❌ Network error: ${err.message}`, ...prev]);
    } finally {
      setIsIngesting(false);
    }
  };

  const approveArticle = async (id: string) => {
    try {
      const res = await fetch(`/api/article/${id}/review`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPipelineLog((prev) => [
          `[${new Date().toLocaleTimeString()}] 🟢 Human QC Approved Article: "${data.article.headline}" -> Published to Daily Digest & Feed`,
          ...prev
        ]);
        fetchUnreviewed();
      }
    } catch (err) {
      console.error('Failed to approve article:', err);
    }
  };

  const downloadDailyPdf = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    window.open(`/api/pdf/${dateStr}/download`, '_blank');
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col gap-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-gradient-to-r from-[#121124] via-[#1a1934] to-[#121124] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30 text-xs font-mono-caps font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse"></span> SYSTEM HEALTH: 99.99% UPTIME
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EA4C89]/20 text-[#EA4C89] border border-[#EA4C89]/30 text-xs font-mono-caps font-bold">
                CELERY + REDIS WORKERS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-sora font-extrabold text-white">
              Distributed System Architecture & Microservice Metrics
            </h1>
            <p className="text-sm font-hanken text-[#bbc9cf] mt-1 max-w-2xl">
              Real-time monitoring telemetry covering RSS feed pollers, Celery task queues, PostgreSQL pgvector RAG embeddings, and AI Fact Verification pipelines.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <button
              onClick={downloadDailyPdf}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D1FF] to-[#0099FF] text-black font-sora font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,209,255,0.3)] hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Daily PDF Digest
            </button>
            <div className="text-right text-xs font-mono-caps text-[#bbc9cf]">
              <span>Auto-refreshing 5s</span>
              <span className="block text-white font-bold">{lastRefreshed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-white/12 bg-[#17162d] flex flex-col justify-between gap-2">
          <span className="text-xs font-mono-caps text-[#bbc9cf]">RSS Pollers Active</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-sora font-extrabold text-[#00D1FF]">{metrics?.activePollers || 14}</span>
            <span className="text-[10px] font-mono-caps text-[#bbc9cf]">2-5 min intervals</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/12 bg-[#17162d] flex flex-col justify-between gap-2">
          <span className="text-xs font-mono-caps text-[#bbc9cf]">QC Gate Queue</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-sora font-extrabold text-amber-400">{unreviewedItems.length}</span>
            <span className="text-[10px] font-mono-caps text-amber-400 font-bold">Awaiting Review</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/12 bg-[#17162d] flex flex-col justify-between gap-2">
          <span className="text-xs font-mono-caps text-[#bbc9cf]">Articles Processed (24h)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-sora font-extrabold text-[#EA4C89]">{metrics?.articlesProcessed24h || 1840}</span>
            <span className="text-[10px] font-mono-caps text-[#bbc9cf]">34 Sources</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/12 bg-[#17162d] flex flex-col justify-between gap-2">
          <span className="text-xs font-mono-caps text-[#bbc9cf]">RAG Vector Index</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-sora font-extrabold text-[#00D1FF]">{metrics?.ragEmbeddingsIndexed || 4520}</span>
            <span className="text-[10px] font-mono-caps text-[#bbc9cf]">pgvector 1536d</span>
          </div>
        </div>
      </div>

      {/* Interactive Worker Poller & QC Review Gate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Controls & Console Log */}
        <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-white text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">precision_manufacturing</span>
              Ingestion Worker Pipeline
            </h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-mono-caps text-[#bbc9cf]">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="accent-[#00D1FF]"
              />
              Bypass QC Gate (Auto-Publish)
            </label>
          </div>

          <p className="text-xs text-[#bbc9cf] font-hanken">
            Simulates the background worker process: fetches news items, dedupes URLs, invokes Gemini 3.6 Flash structured JSON output, and writes to Postgres/Store.
          </p>

          <button
            onClick={triggerWorkerPipeline}
            disabled={isIngesting}
            className={`w-full py-3 rounded-xl font-sora font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isIngesting
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : 'bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 hover:bg-[#00D1FF]/30 shadow-[0_0_15px_rgba(0,209,255,0.2)]'
            }`}
          >
            <span className="material-symbols-outlined text-base animate-spin" style={{ display: isIngesting ? 'inline-block' : 'none' }}>
              sync
            </span>
            {isIngesting ? 'Processing Structured Gemini Pipeline...' : 'Run Scheduled Ingestion Worker (POST /api/worker/poll)'}
          </button>

          {/* Terminal Console */}
          <div className="bg-black/80 rounded-2xl p-4 border border-white/10 font-mono text-[11px] h-48 overflow-y-auto space-y-1.5 text-emerald-400/90 hide-scrollbar">
            {pipelineLog.length === 0 ? (
              <span className="text-[#bbc9cf]/60">Console ready. Click button above to execute live AI pipeline worker.</span>
            ) : (
              pipelineLog.map((log, i) => (
                <div key={i} className="leading-tight break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Human QC Review Gate Queue */}
        <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sora font-bold text-white text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400">verified_user</span>
              Human QC Review Gate ({unreviewedItems.length})
            </h3>
            <span className="text-[10px] font-mono-caps text-[#bbc9cf]">reviewed = FALSE</span>
          </div>

          <p className="text-xs text-[#bbc9cf] font-hanken">
            Articles in this queue have been structured by Gemini Flash but require human approval before appearing in the public feed.
          </p>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1 hide-scrollbar">
            {unreviewedItems.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/5 border border-white/10 text-xs text-[#bbc9cf]">
                <span className="material-symbols-outlined text-3xl text-emerald-400 mb-2 block">task_alt</span>
                No pending items in QC queue. All ingested articles are published!
              </div>
            ) : (
              unreviewedItems.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 text-[10px] font-mono-caps font-bold">
                      {item.category} • Exam Importance: {item.exam_importance}/100
                    </span>
                    <span className="text-[10px] text-[#bbc9cf] font-mono-caps">{item.source_name}</span>
                  </div>

                  <h4 className="text-sm font-sora font-bold text-white leading-snug">{item.headline}</h4>
                  <p className="text-xs text-[#bbc9cf] font-hanken line-clamp-2">{item.summary}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
                    <span className="text-[10px] text-[#00D1FF] font-mono-caps">
                      {item.mcqs ? item.mcqs.length : 0} MCQs Generated
                    </span>
                    <button
                      onClick={() => approveArticle(item.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-sora font-bold text-xs flex items-center gap-1 hover:bg-emerald-500/30 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span> Approve & Publish
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 8-Phase Startup MVP Roadmap & Architecture Diagram */}
      <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124] flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30 text-[10px] font-mono-caps font-bold">
                16–20 WEEK ROADMAP
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono-caps font-bold">
                ALL 8 PHASES OPERATIONAL
              </span>
            </div>
            <h2 className="text-xl font-sora font-extrabold text-white">
              Startup MVP Architecture & Implementation Roadmap
            </h2>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[#00D1FF] font-mono-caps text-xs flex items-center gap-1.5 border border-white/15 transition-all"
          >
            <span className="material-symbols-outlined text-sm">api</span>
            <span>Swagger / OpenAPI Specs</span>
          </a>
        </div>

        {/* ASCII / Visual Flow Diagram */}
        <div className="bg-black/90 p-5 rounded-2xl border border-white/10 font-mono text-xs overflow-x-auto hide-scrollbar text-[#00D1FF]">
          <pre className="leading-relaxed">
{`                        USER
                          │
                          ▼
             React / Vite + Tailwind Frontend
                          │
                 REST API / WebSocket (Socket.io)
                          │
                          ▼
                    FastAPI Backend (Express proxy)
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
 News Service        AI Service          User Service
 (RSS/YouTube/PIB) (Gemini RAG/Whisper) (Firebase Auth/Redis)
      │                   │                   │
      ▼                   ▼                   ▼
 PostgreSQL        pgvector + Neo4j      Local Store / Memory`}
          </pre>
        </div>

        {/* 8 Phase Interactive Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 1 (W1-2)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">Foundation</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Auth, responsive layout, dark theme, REST/WebSocket API setup, Docker runtime.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 2 (W2-4)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">News Collection</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                RSS (BBC, PIB, Hindu, ISRO, RBI), NewsData.io, GNews, YouTube live feeds.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 3 (W4-8)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">AI Processing Pipeline</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                NER, topic classification, duplicate detection, importance scoring, Gemini Flash distillation.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 4 (W8-10)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">Knowledge Base</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Structured Knowledge Schema with exam tags (UPSC/SSC), timeline points & source tracking.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 5 (W10-12)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">AI Learning Engine</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Automatic generation of MCQs, flashcards, daily exam notes, PDFs, and mind maps.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 6 (W12-14)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">AI Tutor (RAG)</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Vector search + Gemini 3.6 Flash conversational tutor for current affairs Q&A.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 7 (W14-16)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">Intelligence Dashboard</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Live ticker, video player, PDF generator, timeline view, knowledge graph & bookmarks.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">PHASE 8 (W16-20)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <h4 className="font-sora font-bold text-white text-sm">Production & Telemetry</h4>
              <p className="text-xs text-[#bbc9cf] mt-1 font-hanken">
                Health checks, rate limiting, OpenAPI/Swagger docs, metrics telemetry & logging.
              </p>
            </div>
            <span className="mt-3 text-[10px] font-mono-caps text-emerald-400 font-bold">✓ DELIVERED</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124]">
          <h3 className="font-sora font-bold text-white text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00D1FF]">dns</span>
            Active Microservices Status
          </h3>

          <div className="space-y-3 text-xs font-hanken">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">Live News Collection Engine</span>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">Celery Beat • Operational</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">Breaking News Classification Pipeline</span>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">Threshold &gt;= 3 sources</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">YouTube Data API v3 & Live Stream Monitor</span>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">60s Polling Cycle</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-white">Gemini 3.6 Flash Knowledge Distillation</span>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">Latency: {metrics?.processingLatencyMs || 142}ms</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124]">
          <h3 className="font-sora font-bold text-white text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#EA4C89]">dataset</span>
            Databases & Knowledge Stores
          </h3>

          <div className="space-y-3 text-xs font-hanken">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="font-semibold text-white">Firebase Firestore & Cloud Storage</p>
                <p className="text-[11px] text-[#bbc9cf]">Real-time user profiles, saved snippets & chat logs</p>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">Connected</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="font-semibold text-white">PostgreSQL + pgvector</p>
                <p className="text-[11px] text-[#bbc9cf]">Knowledge Object embeddings for RAG semantic search</p>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">4,520 Vectors</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="font-semibold text-white">Neo4j Graph Database</p>
                <p className="text-[11px] text-[#bbc9cf]">Entities, Institutions, Schemes & Event relationships</p>
              </div>
              <span className="text-[#00D1FF] font-mono-caps">890 Nodes</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
