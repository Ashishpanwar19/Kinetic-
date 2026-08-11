import React, { useState } from 'react';
import { KnowledgeObject } from '../types';
import { downloadExamDigestPDF } from '../services/pdfDigestService';

interface ExamDigestViewProps {
  items: KnowledgeObject[];
  onOpenQuiz: (item: KnowledgeObject) => void;
}

export const ExamDigestView: React.FC<ExamDigestViewProps> = ({
  items,
  onOpenQuiz,
}) => {
  const [customTopic, setCustomTopic] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Polity', 'Economy', 'Science', 'International', 'Environment', 'Sports'];

  const filteredItems = items.filter((item) =>
    selectedCategory === 'All' ? true : item.category === selectedCategory
  );

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadExamDigestPDF(items);
    } catch (err) {
      console.error('Failed to download PDF digest:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleGenerateDigest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setLoadingAi(true);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/quick-take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: customTopic.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiResult(data.data);
      }
    } catch (err) {
      console.error('Failed to generate AI Quick Take:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col gap-8">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-white/12 relative overflow-hidden bg-gradient-to-r from-[#1e1d34] to-[#121127]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D1FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-[#00D1FF]/20 text-[#00D1FF] text-xs font-mono-caps rounded-full border border-[#00D1FF]/40 mb-3 inline-block">
              COMPETITIVE EXAM CURRENT AFFAIRS PIPELINE
            </span>
            <h1 className="text-3xl md:text-4xl font-sora font-extrabold text-white mb-2 leading-tight">
              Daily Knowledge Digest & MCQ Engine
            </h1>
            <p className="text-sm font-hanken text-[#bbc9cf]">
              Curated 3-bullet Quick Takes and structured exam questions powered by Gemini 3.6 Flash for Indian Civil Services, UPSC, SSC, and international current affairs tests.
            </p>
          </div>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex-shrink-0 bg-[#00D1FF] text-[#003543] hover:bg-[#a4e6ff] px-5 py-3 rounded-xl font-mono-caps text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,209,255,0.3)] cursor-pointer flex items-center gap-2 self-start md:self-center"
          >
            {isDownloadingPdf ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>Download PDF Digest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Topic Quick Take Generator Section */}
      <div className="glass-card rounded-2xl p-6 border border-white/12">
        <h2 className="text-xl font-sora font-bold text-[#00D1FF] mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined">auto_awesome</span>
          Generate AI Exam Digest on Any Topic
        </h2>
        <p className="text-xs font-hanken text-[#bbc9cf] mb-4">
          Type any current affairs topic, breaking news, or government policy to generate instant exam-relevant facts, importance rating, and MCQs.
        </p>

        <form onSubmit={handleGenerateDigest} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g. Semiconductor Mission India 2026 or RBI Monetary Policy..."
            className="flex-1 bg-[#1e1d34] text-white border border-white/15 rounded-xl px-4 py-3 text-sm focus:border-[#00D1FF] outline-none"
          />
          <button
            type="submit"
            disabled={loadingAi}
            className="bg-[#00D1FF] text-[#003543] px-6 py-3 rounded-xl font-mono-caps text-xs font-bold hover:bg-[#a4e6ff] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loadingAi ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">psychology</span>
                <span>Generate Quick Take</span>
              </>
            )}
          </button>
        </form>

        {/* AI Result Card */}
        {aiResult && (
          <div className="mt-6 p-6 bg-[#121127] rounded-xl border border-[#00D1FF]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="px-2 py-0.5 bg-[#EA4C89]/20 text-[#EA4C89] text-[10px] font-mono-caps rounded">
                CATEGORY: {aiResult.category || 'CURRENT AFFAIRS'}
              </span>
              <span className="text-xs font-mono-caps text-[#00D1FF]">
                Exam Importance: {aiResult.exam_importance}/100
              </span>
            </div>

            <h3 className="text-lg font-sora font-bold text-white">
              {aiResult.headline}
            </h3>

            <p className="text-sm font-hanken text-[#bbc9cf]">
              {aiResult.summary}
            </p>

            <div className="bg-[#1e1d34]/80 p-4 rounded-lg">
              <h4 className="text-xs font-mono-caps text-[#00D1FF] font-bold mb-2">
                QUICK TAKE BULLETS
              </h4>
              <ul className="flex flex-col gap-2 text-xs font-hanken text-white">
                {aiResult.quick_take?.map((qt: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#B40B07] text-sm">•</span>
                    <span>{qt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {aiResult.mcqs && aiResult.mcqs.length > 0 && (
              <button
                onClick={() =>
                  onOpenQuiz({
                    id: `ai-${Date.now()}`,
                    source_url: 'https://ais.studio',
                    source_name: 'Gemini AI Pipeline',
                    published_at: 'Just now',
                    headline: aiResult.headline,
                    summary: aiResult.summary,
                    category: aiResult.category || 'General',
                    entities: aiResult.entities || [],
                    exam_importance: aiResult.exam_importance || 85,
                    tag: '#AI_DIGEST',
                    views: '1',
                    likes: 1,
                    comments_count: 0,
                    shares: 0,
                    image_url:
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                    quick_take: aiResult.quick_take || [],
                    mcqs: aiResult.mcqs.map((m: any, idx: number) => ({
                      id: `ai-mcq-${idx}`,
                      question: m.question,
                      options: m.options,
                      correct_index: m.correct_index,
                      explanation: m.explanation,
                    })),
                  })
                }
                className="w-full py-3 bg-[#00D1FF] text-[#003543] rounded-xl font-mono-caps text-xs font-bold hover:bg-[#a4e6ff] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">quiz</span>
                <span>Take Generated MCQs Quiz ({aiResult.mcqs.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-mono-caps transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#00D1FF] text-[#003543] font-bold shadow-[0_0_10px_rgba(0,209,255,0.4)]'
                : 'bg-[#29283f] text-[#bbc9cf] hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Daily Digest Knowledge Objects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-2xl p-6 border border-white/12 flex flex-col justify-between gap-4 hover:border-[#00D1FF]/50 transition-all"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-[#38374f] text-white text-[10px] font-mono-caps rounded">
                  {item.category}
                </span>
                <span className="text-xs font-mono-caps text-[#00D1FF]">
                  Exam Score: {item.exam_importance}/100
                </span>
              </div>

              <h3 className="text-lg font-sora font-bold text-white leading-snug">
                {item.headline}
              </h3>

              <p className="text-xs font-hanken text-[#bbc9cf] line-clamp-3">
                {item.summary}
              </p>

              <div className="bg-[#1e1d34]/60 p-3 rounded-lg flex flex-col gap-1.5 border border-white/5">
                <span className="text-[10px] font-mono-caps text-[#00D1FF] font-bold">
                  QUICK TAKE FACTS
                </span>
                {item.quick_take.slice(0, 2).map((qt, i) => (
                  <p key={i} className="text-xs font-hanken text-[#e3dffe] line-clamp-2">
                    • {qt}
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-[10px] font-mono-caps text-[#bbc9cf]">
                {item.source_name} • {item.mcqs.length} MCQs
              </span>

              <button
                onClick={() => onOpenQuiz(item)}
                className="px-4 py-2 bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/40 rounded-lg font-mono-caps text-xs font-bold hover:bg-[#00D1FF] hover:text-[#003543] transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">quiz</span>
                <span>Practice MCQs</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};
