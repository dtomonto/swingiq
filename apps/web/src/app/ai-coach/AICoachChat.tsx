'use client';

import { useState } from 'react';
import { Send, Bot } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'Why am I slicing my driver?',
  'What should I practice today?',
  'Why is my 7-iron launching too high?',
  'Which club is hurting my scoring the most?',
  'Am I improving?',
  'Is this a swing issue or equipment issue?',
  'What YouTube drill should I watch?',
  'What should I retest after practice?',
];

const SAMPLE_RESPONSE = `Based on your last 30 driver shots, here is what the data shows:

**Your Current Pattern:**
- Face-to-path: +4.8° (open face relative to path)
- Average lateral miss: 26 yards right
- Spin axis: +9° (right-tilted spin → slice)
- Club path: -1.2° (slightly outside-in)

**The Diagnosis:**
Your face is arriving significantly open relative to your club path at impact. This is the primary cause of the push-fade / slice pattern. Your path is actually acceptable (-1.2° is only slightly outside-in), but the face is not matching it.

**What to Work On First:**
Face control, not path. If you move the path first, the open face will still cause a slice — it will just be a different shape of slice.

**Recommended Drill:**
Face Control Block Practice — 40 balls at 60-80% speed, focusing on the face angle at impact.

**YouTube Search:** "golf face control drill open clubface slice fix"

**Retest:** After 2-3 practice sessions, look for face-to-path to drop below +2.5° and lateral miss to reduce below 15 yards right.

*This analysis is based on your launch monitor data. The diagnosis is a pattern-based interpretation, not a guaranteed diagnosis of your exact swing mechanics.*`;

export function AICoachChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: 'Hello! I am your SwingIQ AI Coach. I have access to your launch-monitor data and swing profile. Ask me anything about your game — I will always ground my answers in your actual numbers.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: messages.length, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulate AI response (replace with actual OpenAI/Claude API call)
    await new Promise((r) => setTimeout(r, 1200));
    const assistantMsg: Message = {
      id: messages.length + 1,
      role: 'assistant',
      content: SAMPLE_RESPONSE,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ask any question about your game. Answers are grounded in your actual data.
        </p>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-green-50 hover:text-green-700 text-gray-600 rounded-full text-xs border border-gray-200 hover:border-green-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about your swing, data, drills, or practice plan..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          disabled={loading}
        />
        <Button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
          <Send size={16} />
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        AI Coach uses your actual launch-monitor data. Diagnoses are pattern-based interpretations, not guaranteed mechanical analyses.
      </p>
    </div>
  );
}
