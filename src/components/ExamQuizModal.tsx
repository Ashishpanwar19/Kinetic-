import React, { useState } from 'react';
import { KnowledgeObject, MCQ } from '../types';

interface ExamQuizModalProps {
  item: KnowledgeObject;
  onClose: () => void;
  onCompleteQuiz?: (score: number, total: number) => void;
}

export const ExamQuizModal: React.FC<ExamQuizModalProps> = ({
  item,
  onClose,
  onCompleteQuiz,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    explanations: string[];
  } | null>(null);

  const mcqs: MCQ[] = item.mcqs || [];
  const currentMcq = mcqs[currentQuestionIdx];

  const handleSelectOption = (optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optIdx,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < mcqs.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    let score = 0;
    const explanations: string[] = [];

    mcqs.forEach((mcq, idx) => {
      const userAns = selectedAnswers[idx];
      if (userAns === mcq.correct_index) {
        score++;
      }
      explanations.push(
        `Q${idx + 1}: Correct answer is option ${String.fromCharCode(65 + mcq.correct_index)}. ${mcq.explanation}`
      );
    });

    setSubmitted(true);
    setResults({
      score,
      total: mcqs.length,
      explanations,
    });

    if (onCompleteQuiz) {
      onCompleteQuiz(score, mcqs.length);
    }

    // Call server endpoint to record quiz submission
    try {
      await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: item.id,
          answers: selectedAnswers,
        }),
      });
    } catch (err) {
      console.error('Failed to submit quiz to server:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-white/12 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#00D1FF]/20 text-[#00D1FF] text-[10px] font-mono-caps rounded border border-[#00D1FF]/30">
                EXAM PRACTICE
              </span>
              <span className="text-[#bbc9cf] text-xs font-mono-caps">
                Importance: {item.exam_importance}/100
              </span>
            </div>
            <h2 className="text-xl font-sora font-bold text-white mt-1">
              MCQ Quiz: {item.headline}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#bbc9cf] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-8 text-[#bbc9cf]">
            <span className="material-symbols-outlined text-4xl mb-2">quiz</span>
            <p>No MCQs generated for this snippet yet.</p>
          </div>
        ) : !submitted ? (
          /* MCQ Question Card */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between text-xs font-mono-caps text-[#00D1FF]">
              <span>
                Question {currentQuestionIdx + 1} of {mcqs.length}
              </span>
              <span>Select the best answer</span>
            </div>

            <h3 className="text-lg font-hanken font-semibold text-white leading-relaxed">
              {currentMcq.question}
            </h3>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentMcq.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left font-hanken text-sm transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#00D1FF]/20 border-[#00D1FF] text-white font-semibold shadow-[0_0_15px_rgba(0,209,255,0.2)]'
                        : 'bg-[#1e1d34]/50 border-white/10 text-[#e3dffe] hover:bg-white/10'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono-caps font-bold ${
                        isSelected
                          ? 'bg-[#00D1FF] text-[#003543]'
                          : 'bg-[#29283f] text-[#bbc9cf]'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Pagination / Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentQuestionIdx === 0}
                className={`px-4 py-2 rounded-lg font-mono-caps text-xs flex items-center gap-1 ${
                  currentQuestionIdx === 0
                    ? 'opacity-40 cursor-not-allowed text-[#bbc9cf]'
                    : 'bg-[#33324a] text-white hover:bg-white/10 cursor-pointer'
                }`}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Previous</span>
              </button>

              {currentQuestionIdx < mcqs.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-5 py-2 bg-[#00D1FF] text-[#003543] rounded-lg font-mono-caps text-xs font-bold hover:bg-[#a4e6ff] flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Question</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="px-6 py-2 bg-[#EA4C89] text-white rounded-lg font-mono-caps text-xs font-bold hover:bg-[#EA4C89]/80 cursor-pointer shadow-[0_0_15px_rgba(234,76,137,0.4)]"
                >
                  Submit Exam Answers
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Results Summary Card */
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-[#00D1FF]/20 border-2 border-[#00D1FF] flex items-center justify-center mb-3">
                <span className="text-3xl font-sora font-extrabold text-[#00D1FF]">
                  {Math.round((results!.score / results!.total) * 100)}%
                </span>
              </div>
              <h3 className="text-2xl font-sora font-bold text-white">
                Exam Quiz Complete!
              </h3>
              <p className="text-sm font-hanken text-[#bbc9cf]">
                You scored {results!.score} out of {results!.total} correct.
              </p>
            </div>

            <div className="flex flex-col gap-4 bg-[#1e1d34]/60 p-4 rounded-xl border border-white/10">
              <h4 className="text-sm font-mono-caps font-bold text-[#00D1FF]">
                Explanations & Analysis
              </h4>
              {mcqs.map((mcq, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === mcq.correct_index;
                return (
                  <div key={idx} className="p-3 bg-[#121127] rounded-lg border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-mono-caps font-bold px-2 py-0.5 rounded ${
                          isCorrect
                            ? 'bg-[#00D1FF]/20 text-[#00D1FF]'
                            : 'bg-[#B40B07]/20 text-[#B40B07]'
                        }`}
                      >
                        {isCorrect ? 'CORRECT' : 'INCORRECT'}
                      </span>
                      <span className="text-xs font-mono-caps text-white font-semibold">
                        Q{idx + 1}: {mcq.question}
                      </span>
                    </div>
                    <p className="text-xs font-hanken text-[#bbc9cf] mt-1 pl-2 border-l-2 border-[#00D1FF]">
                      {mcq.explanation}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#00D1FF] text-[#003543] rounded-xl font-mono-caps font-bold hover:bg-[#a4e6ff] transition-all cursor-pointer"
            >
              Done Reviewing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
