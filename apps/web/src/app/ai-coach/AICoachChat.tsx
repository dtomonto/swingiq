'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CoachContext } from '@/lib/ai-coach-prompts';
import type { SportId } from '@swingiq/core';

// ── Types ─────────────────────────────────────────────────────

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isError?: boolean;
}

// ── Sport display config ──────────────────────────────────────

const SPORT_DISPLAY: Record<SportId, {
  emoji: string;
  color: string;         // Tailwind bg for badge
  textColor: string;     // Tailwind text for badge
  borderColor: string;   // Tailwind border for header
  avatarBg: string;      // Tailwind bg for bot avatar
  placeholder: string;
  greeting: string;
}> = {
  golf: {
    emoji: '⛳',
    color: 'bg-primary/15',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    avatarBg: 'bg-primary',
    placeholder: 'Ask about your swing, launch data, drills, or practice plan…',
    greeting:
      'Hello! I\'m your SwingIQ Golf Coach. I have access to your launch-monitor data, swing scores, and diagnosis history.\n\nAsk me anything about your game — carry distance, face-to-path, spin rate, your training routine, or what to work on next. I\'ll always ground my answers in your actual numbers.',
  },
  tennis: {
    emoji: '🎾',
    color: 'bg-warning/15',
    textColor: 'text-warning',
    borderColor: 'border-warning/30',
    avatarBg: 'bg-warning',
    placeholder: 'Ask about your forehand, serve, drills, or next practice focus…',
    greeting:
      'Hello! I\'m your SwingIQ Tennis Coach. I have access to your video analysis results and tennis profile.\n\nAsk me about your stroke technique, phase-by-phase observations, drill recommendations, or what to focus on in your next practice session.',
  },
  baseball: {
    emoji: '⚾',
    color: 'bg-error/15',
    textColor: 'text-error',
    borderColor: 'border-error/30',
    avatarBg: 'bg-red-600',
    placeholder: 'Ask about your swing, bat path, timing, drills, or next session focus…',
    greeting:
      'Hello! I\'m your SwingIQ Baseball Hitting Coach. I have access to your swing analysis and hitter profile.\n\nAsk me about your bat path, load and stride timing, hip-shoulder separation, contact point, or what drills to work on in your next cage session.',
  },
  softball_slow: {
    emoji: '🥎',
    color: 'bg-warning/15',
    textColor: 'text-orange-800',
    borderColor: 'border-warning/30',
    avatarBg: 'bg-warning',
    placeholder: 'Ask about your swing, arc timing, bat path, or next practice focus…',
    greeting:
      'Hello! I\'m your SwingIQ Slow Pitch Coach. I have access to your swing analysis and player profile.\n\nAsk me about timing the arc pitch, hip rotation, contact height, bat path, or what drills to work on before your next game.',
  },
  softball_fast: {
    emoji: '🥎',
    color: 'bg-accent-secondary/15',
    textColor: 'text-pink-800',
    borderColor: 'border-pink-200',
    avatarBg: 'bg-pink-500',
    placeholder: 'Ask about your swing, rise ball timing, bat path, or next practice focus…',
    greeting:
      'Hello! I\'m your SwingIQ Fast Pitch Coach. I have access to your swing analysis and hitter profile.\n\nAsk me about reacting to the rise ball, keeping your path compact, load and stride timing, or what drills to prioritize before your next game.',
  },
};

// ── Suggested questions per sport ─────────────────────────────

const SUGGESTED_QUESTIONS_BY_SPORT: Record<SportId, string[]> = {
  golf: [
    'Why am I slicing my driver?',
    'What should I practice today?',
    'Why is my 7-iron launching too high?',
    'Which club is hurting my scoring the most?',
    'Am I improving?',
    'Is this a swing issue or an equipment issue?',
    'What YouTube drill should I watch?',
    'What should I retest after practice?',
  ],
  tennis: [
    'Why do I keep hitting the net on my forehand?',
    'How do I improve my serve consistency?',
    'What is my biggest stroke weakness?',
    'How do I fix my late contact?',
    'What drills should I work on today?',
    'Am I improving session to session?',
    'How do I get more topspin on my forehand?',
    'What should I focus on in my next practice?',
  ],
  baseball: [
    'Why do I keep rolling over to the pull side?',
    'What is my biggest swing issue?',
    'How do I fix early shoulder pull?',
    'What drills should I work on today?',
    'How do I drive the ball to the opposite field?',
    'Am I improving from session to session?',
    'How do I improve my bat speed?',
    'What should I focus on in my next cage session?',
  ],
  softball_slow: [
    'How do I hit the arc pitch better?',
    'Why do I keep popping up?',
    'What is my biggest swing issue?',
    'How do I hit for more power?',
    'What drills should I work on this week?',
    'How do I drive the ball the other way?',
    'Am I getting better over time?',
    'What should I focus on before my next game?',
  ],
  softball_fast: [
    'How do I time the rise ball?',
    'Why do I keep swinging late?',
    'What is my biggest issue at the plate?',
    'How do I stay back on off-speed pitches?',
    'What drills should I work on today?',
    'How do I improve my reaction time?',
    'Am I getting better session to session?',
    'What should I focus on before my next game?',
  ],
};

// ── Context-switch message ────────────────────────────────────

function makeSwitchMessage(sport: SportId, sportName: string, id: number): Message {
  const d = SPORT_DISPLAY[sport];
  return {
    id,
    role: 'system',
    content: `${d.emoji} Switched to **${sportName}** context. My next answers will be about your ${sportName.toLowerCase()} game.`,
  };
}

// ── Props ─────────────────────────────────────────────────────

interface AICoachChatProps {
  coachContext?: Partial<CoachContext>;
  sport?: SportId;
  sportName?: string;
}

// ── Component ─────────────────────────────────────────────────

export function AICoachChat({
  coachContext,
  sport = 'golf',
  sportName = 'Golf',
}: AICoachChatProps) {
  const display = SPORT_DISPLAY[sport] ?? SPORT_DISPLAY.golf;
  const suggestedQuestions = SUGGESTED_QUESTIONS_BY_SPORT[sport] ?? SUGGESTED_QUESTIONS_BY_SPORT.golf;

  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: display.greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Track previous sport so we can detect a change
  const prevSportRef = useRef<SportId>(sport);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Inject a visible system notice when the user switches sports mid-session
  useEffect(() => {
    if (prevSportRef.current !== sport) {
      prevSportRef.current = sport;
      setMessages((prev) => [
        ...prev,
        makeSwitchMessage(sport, sportName, prev.length),
      ]);
    }
  }, [sport, sportName]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: messages.length, role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const requestBody: CoachContext = {
        ...(coachContext ?? {}),
        user_question: trimmed,
      };

      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json() as { message?: string; error?: string };

      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length,
            role: 'assistant',
            content: data.error ?? 'Something went wrong. Please try again.',
            isError: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: prev.length, role: 'assistant', content: data.message ?? 'No response received.' },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: 'assistant',
          content: 'Could not reach the AI service. Check your internet connection and try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    const freshDisplay = SPORT_DISPLAY[sport] ?? SPORT_DISPLAY.golf;
    prevSportRef.current = sport;
    setMessages([{ id: 0, role: 'assistant', content: freshDisplay.greeting }]);
    setInput('');
  };

  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-screen max-h-screen p-4 lg:p-6 max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className={`mb-4 shrink-0 pb-4 border-b-2 ${display.borderColor}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Sport badge — the primary visual indicator */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${display.color} ${display.textColor} border ${display.borderColor}`}
              >
                <span className="text-base leading-none">{display.emoji}</span>
                {sportName} Mode
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">AI Coach</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Answering{' '}
              <span className={`font-semibold ${display.textColor}`}>
                {sportName.toLowerCase()}
              </span>{' '}
              questions — switch sports in the sidebar to change context.
            </p>
          </div>

          {/* Reset / New conversation button */}
          <button
            onClick={resetChat}
            title="Start a new conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors shrink-0 mt-1"
          >
            <RefreshCw size={12} />
            New chat
          </button>
        </div>
      </div>

      {/* ── Message area ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.map((msg) => {

          // System context-switch notice — centred pill
          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border ${display.color} ${display.textColor} ${display.borderColor}`}>
                  <span>{display.emoji}</span>
                  <span>
                    Switched to <strong>{sportName}</strong> — questions now about your{' '}
                    {sportName.toLowerCase()} game
                  </span>
                </div>
              </div>
            );
          }

          // Regular user / assistant message
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 mt-1 ${display.avatarBg}`}
                >
                  {msg.isError ? (
                    <AlertCircle size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-white" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[85%] lg:max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? `${display.avatarBg} text-white`
                    : msg.isError
                    ? 'bg-error/10 border border-error/30 text-error'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 shrink-0 ${display.avatarBg}`}>
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-card border border-border px-4 py-3 rounded-xl">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested questions ──────────────────────────────── */}
      {!hasUserMessages && (
        <div className="mb-3 shrink-0 flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className={`px-3 py-1.5 ${display.color} hover:opacity-80 ${display.textColor} rounded-full text-xs border ${display.borderColor} transition-colors disabled:opacity-50`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────── */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder={display.placeholder}
          className={`flex-1 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:border-transparent outline-hidden disabled:bg-muted focus:ring-${sport === 'golf' ? 'green' : sport === 'tennis' ? 'yellow' : sport === 'baseball' ? 'red' : sport === 'softball_slow' ? 'orange' : 'pink'}-500`}
          disabled={loading}
          maxLength={1000}
          aria-label={`Ask your ${sportName} question`}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          className={display.avatarBg}
        >
          <Send size={16} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center shrink-0">
        Answers are AI-generated guidance built from the data you&apos;ve saved.{' '}
        {sport === 'golf'
          ? 'Diagnoses are confident, pattern-based reads of your data that sharpen as you add more.'
          : 'Video observations are heuristic estimates — confident starting points that sharpen as you add data.'}{' '}
        Pair them with a coach for injury concerns or advanced technique work.
      </p>
    </div>
  );
}
