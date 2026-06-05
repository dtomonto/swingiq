'use client';

// ============================================================
// SwingVantage — Floating AI Coach Button
// A persistent floating button that opens the AI Coach from
// any page. Context-aware: passes current page to the coach.
// ============================================================

import { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwingVantageStore, useLatestDiagnosedSession } from '@/store';
import { usePathname } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  '/dashboard': ['What should I work on today?', 'How am I improving?', 'What\'s my biggest weakness?'],
  '/sessions': ['How did my last session compare to previous ones?', 'Which club needs the most work?'],
  '/diagnose': ['What does face-to-path mean?', 'How does spin axis cause a slice?'],
  '/training': ['Am I doing these drills correctly?', 'How long until I see results?'],
  '/video': ['What should I look for in my video?', 'How do I film myself properly?'],
  '/bag': ['Do I have a gap problem in my bag?', 'What club should I add?'],
  '/progress': ['Am I improving fast enough?', 'What should I focus on next?'],
  default: ['What should I practice today?', 'Explain my primary diagnosis.', 'Give me a quick tip.'],
};

export function FloatingCoach() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const pathname = usePathname();
  const { profile } = useSwingVantageStore();
  const latestSession = useLatestDiagnosedSession();

  // Don't show on dedicated AI coach page or auth pages
  const hidden = pathname === '/ai-coach' || pathname === '/login' || pathname === '/signup';
  if (hidden) return null;

  const suggestions = PAGE_SUGGESTIONS[pathname] ?? PAGE_SUGGESTIONS.default!;

  const diagnosisName = latestSession?.diagnoses[0]?.rule?.name;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const coachContext = {
        user_name: profile?.name ?? 'Golfer',
        primary_diagnosis_name: diagnosisName,
        primary_diagnosis_confidence: latestSession?.diagnoses[0]?.confidence,
        current_page: pathname,
        user_question: trimmed,
      };

      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coachContext),
      });

      const data = await res.json() as { message?: string; error?: string };

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message ?? data.error ?? 'No response.',
          isError: !!data.error,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not reach the AI service.', isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const noMessages = messages.length === 0;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 lg:right-6 z-50 w-80 bg-card rounded-2xl shadow-2xl border border-border flex flex-col max-h-96 no-print">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-golf-dark rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Bot size={13} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">SwingVantage Coach</p>
                <p className="text-primary-foreground/90 text-xs">Ask anything about your game</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {noMessages && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left text-xs px-3 py-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg border border-primary/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={cn(
                  'max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed',
                  msg.role === 'user' ? 'bg-primary text-white' :
                  msg.isError ? 'bg-error/10 border border-error/30 text-error' :
                  'bg-muted text-foreground'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((delay, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${delay}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about your swing..."
              className="flex-1 border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-ring outline-hidden"
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 bg-primary hover:bg-primary disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
            >
              <Send size={13} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-4 lg:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all no-print',
          open ? 'bg-secondary hover:bg-muted' : 'bg-golf-dark hover:bg-primary',
        )}
        aria-label="Open AI Coach"
      >
        {open ? <X size={20} className="text-white" /> : <MessageSquare size={20} className="text-white" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-white text-xs flex items-center justify-center font-bold">
            AI
          </span>
        )}
      </button>
    </>
  );
}
