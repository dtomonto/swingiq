'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CoachContext } from '@/lib/ai-coach-prompts';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Why am I slicing my driver?',
  'What should I practice today?',
  'Why is my 7-iron launching too high?',
  'Which club is hurting my scoring the most?',
  'Am I improving?',
  'Is this a swing issue or an equipment issue?',
  'What YouTube drill should I watch?',
  'What should I retest after practice?',
];

interface AICoachChatProps {
  /** Pre-built coaching context from the diagnostic engine — never passes raw secrets */
  coachContext?: Partial<CoachContext>;
}

export function AICoachChat({ coachContext }: AICoachChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content:
        'Hello! I am your SwingIQ AI Coach. I have access to your launch-monitor data and swing profile. ' +
        'Ask me anything about your game — I will always ground my answers in your actual numbers.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: messages.length, role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build the full context for this request
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
          {
            id: prev.length,
            role: 'assistant',
            content: data.message ?? 'No response received.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length,
          role: 'assistant',
          content:
            'Could not reach the AI service. Check your internet connection and try again.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] lg:h-screen max-h-screen p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask any question about your game. Answers are grounded in your actual data.
        </p>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
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
                  ? 'bg-green-600 text-white'
                  : msg.isError
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2 flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions — shown only before first user message */}
      {messages.filter((m) => m.role === 'user').length === 0 && (
        <div className="mb-3 flex-shrink-0 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="px-3 py-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 rounded-full text-xs border border-gray-200 hover:border-green-300 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 flex-shrink-0">
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
          placeholder="Ask about your swing, data, drills, or practice plan..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-50"
          disabled={loading}
          maxLength={1000}
          aria-label="Type your golf question"
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center flex-shrink-0">
        Diagnoses are pattern-based data interpretations — not guaranteed mechanical analyses.
      </p>
    </div>
  );
}
