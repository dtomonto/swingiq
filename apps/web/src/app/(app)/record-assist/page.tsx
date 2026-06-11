import type { Metadata } from 'next';
import { RecordAssistGate } from '@/components/record-assist/RecordAssistGate';

export const metadata: Metadata = {
  title: 'RecordAssist — Guided Self-Recording | SwingVantage',
  description:
    'Place your phone on the floor and step back. RecordAssist uses on-device body tracking with live visual and voice guidance to help you frame a usable swing clip solo — for golf, tennis, baseball, softball, pickleball, and padel.',
};

export default function RecordAssistPage() {
  // Gated by the `record_assist.enabled` operator flag (admin → Feature Flags).
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Record with guidance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We’ll help you get in frame — no second person needed.
        </p>
      </header>
      <RecordAssistGate />
    </div>
  );
}
