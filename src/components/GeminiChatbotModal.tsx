import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { saveChatMessageToFirestore, getChatMessagesFromFirestore } from '../lib/firebase';

interface Message {
  id?: string;
  role: 'user' | 'model';
  text: string;
  timestamp?: string;
}

interface GeminiChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

const DEFAULT_SUGGESTIONS = [
  "Summarize latest Global Semiconductor policy",
  "Generate 3 MCQs on Monetary Policy Committee",
  "Explain Cyber-Sovereignty and Data Localization",
  "Give me top exam tips for Science & Tech section",
];

export const GeminiChatbotModal: React.FC<GeminiChatbotModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I am your Kinetic AI Mentor powered by Gemini. Ask me any doubt about current affairs, exam strategy, geopolitical developments, or ask me to generate custom practice MCQs!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getChatMessagesFromFirestore(user.uid).then((savedMsgs) => {
        if (savedMsgs && savedMsgs.length > 0) {
          setMessages(
            savedMsgs.map((m: any) => ({
              role: m.role,
              text: m.text,
              timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }))
          );
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (initialTopic) {
      handleSendMessage(`Explain and analyze this topic for competitive exams: "${initialTopic}"`);
    }
  }, [initialTopic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    if (user) {
      saveChatMessageToFirestore(user.uid, { role: 'user', text: query });
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: Message = {
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);

        if (user) {
          saveChatMessageToFirestore(user.uid, { role: 'model', text: data.reply });
        }
      } else {
        throw new Error(data.error || 'Failed to get answer');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `Sorry, I ran into an issue connecting to Gemini AI: ${err.message || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl h-[85vh] bg-[#121124] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-white/10 bg-[#1a1932]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D1FF] to-[#EA4C89] p-0.5 flex items-center justify-center shadow-[0_0_12px_rgba(0,209,255,0.4)]">
              <div className="w-full h-full bg-[#121124] rounded-[10px] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#00D1FF] text-xl">auto_awesome</span>
              </div>
            </div>
            <div>
              <h3 className="font-sora font-bold text-white text-base flex items-center gap-2">
                Kinetic AI Mentor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30 font-mono-caps">
                  GEMINI 3.6 FLASH
                </span>
              </h3>
              <p className="text-xs text-[#bbc9cf] font-hanken">Multi-turn Exam Preparation & News Analysis Chatbot</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 hide-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 text-sm font-hanken leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#00D1FF]/20 to-[#00D1FF]/10 border border-[#00D1FF]/40 text-white rounded-br-none'
                    : 'bg-[#1e1d38] border border-white/10 text-slate-100 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              <span className="text-[10px] font-mono-caps text-[#bbc9cf] px-1">
                {msg.role === 'user' ? 'You' : 'Kinetic Mentor'} • {msg.timestamp}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col items-start gap-1">
              <div className="bg-[#1e1d38] border border-white/10 rounded-2xl p-4 text-sm text-[#00D1FF] flex items-center gap-3">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                <span className="font-mono-caps text-xs">Analyzing and generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-4 py-2 bg-[#17162d] border-t border-white/5 flex gap-2 overflow-x-auto hide-scrollbar">
          {DEFAULT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(sug)}
              className="px-3 py-1 bg-white/5 hover:bg-[#00D1FF]/20 text-[#bbc9cf] hover:text-[#00D1FF] border border-white/10 hover:border-[#00D1FF]/40 text-xs rounded-full whitespace-nowrap transition-all cursor-pointer flex-shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#17162d] border-t border-white/10 flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Kinetic AI Mentor any question or request MCQs..."
            className="flex-1 bg-[#23223e] border border-white/15 focus:border-[#00D1FF] text-white text-sm rounded-xl px-4 py-3 outline-none transition-all placeholder:text-[#bbc9cf]/60"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
            className="bg-gradient-to-r from-[#00D1FF] to-[#00a3cc] hover:brightness-110 disabled:opacity-50 text-black font-bold p-3 px-5 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-[0_0_15px_rgba(0,209,255,0.4)]"
          >
            <span className="material-symbols-outlined text-xl">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
