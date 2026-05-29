'use client';

import { useState } from 'react';
import { Star, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { FeedbackRating } from '@swingiq/core';

interface FeedbackPanelProps {
  analysisId: string;
  onSubmit?: (feedback: {
    overall_rating: FeedbackRating;
    most_useful_insight: string | null;
    least_useful_insight: string | null;
    free_text: string | null;
  }) => Promise<void>;
  className?: string;
}

export function FeedbackPanel({ analysisId: _analysisId, onSubmit, className }: FeedbackPanelProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [mostUseful, setMostUseful] = useState('');
  const [leastUseful, setLeastUseful] = useState('');
  const [freeText, setFreeText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        overall_rating: rating,
        most_useful_insight: mostUseful.trim() || null,
        least_useful_insight: leastUseful.trim() || null,
        free_text: freeText.trim() || null,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn('rounded-xl border border-green-200 bg-green-50 p-6 text-center', className)}>
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-green-800">Thanks for your feedback!</p>
        <p className="text-xs text-green-700 mt-1">
          Your responses help us personalise future recommendations for you.
        </p>
      </div>
    );
  }

  const displayRating = hoveredRating ?? rating ?? 0;

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 space-y-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Rate this analysis</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Your feedback improves your personalised coaching profile.
        </p>
      </div>

      {/* Star rating */}
      <div>
        <p className="text-xs text-gray-600 mb-2">Overall usefulness</p>
        <div className="flex gap-1">
          {([1, 2, 3, 4, 5] as FeedbackRating[]).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={cn(
                  'w-7 h-7 transition-colors',
                  star <= displayRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Optional text fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">
            Most useful insight (optional)
          </label>
          <input
            value={mostUseful}
            onChange={(e) => setMostUseful(e.target.value)}
            placeholder="e.g. The early extension explanation"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">
            Least useful (optional)
          </label>
          <input
            value={leastUseful}
            onChange={(e) => setLeastUseful(e.target.value)}
            placeholder="e.g. The phase timeline wasn't accurate"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            maxLength={200}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">
            Other comments (optional)
          </label>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Any other feedback…"
            rows={2}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            maxLength={500}
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        loading={submitting}
        disabled={!rating}
        className="w-full"
      >
        <Send className="w-4 h-4" />
        Submit feedback
      </Button>
    </div>
  );
}
