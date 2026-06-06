'use client';

// ============================================================
// SwingVantage — ReferralOS: the invite hub UI
// ------------------------------------------------------------
// Your invite link, one-tap sharing, honest progress, and the
// reward ladder. Honest-first: only shows what we can measure.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  Gift, Copy, Check, Share2, Mail, MessageCircle, AtSign, Link2,
  Users, Sparkles, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useReferral, tiersByThreshold, pendingTierCelebrations } from '@/lib/referral';
import { ACTIVATION_DEFINITION } from '@/lib/referral';
import type { ShareChannel } from '@/lib/referral';

const CHANNELS: { id: ShareChannel; label: string; icon: React.ReactNode }[] = [
  { id: 'native', label: 'Share', icon: <Share2 size={16} /> },
  { id: 'sms', label: 'Text', icon: <MessageCircle size={16} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
  { id: 'x', label: 'X', icon: <AtSign size={16} /> },
  { id: 'facebook', label: 'Facebook', icon: <Link2 size={16} /> },
];

export function ReferralHub() {
  const { state, stats, inviteUrl, code, share, copyLink, acknowledgeTiers } = useReferral();
  const [copied, setCopied] = useState(false);
  const [hasNativeShare, setHasNativeShare] = useState(false);

  useEffect(() => {
    setHasNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Celebrate any newly-unlocked tiers, then acknowledge them.
  const celebrations = useMemo(() => pendingTierCelebrations(state), [state]);
  useEffect(() => {
    if (!celebrations.length) return undefined;
    const ids = celebrations.map((t) => t.id);
    const timer = setTimeout(() => acknowledgeTiers(ids), 6000);
    return () => clearTimeout(timer);
  }, [celebrations, acknowledgeTiers]);

  const onCopy = async () => {
    const ok = await copyLink();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const channels = CHANNELS.filter((c) => c.id !== 'native' || hasNativeShare);
  const tiers = tiersByThreshold();

  return (
    <div className="space-y-6">
      {/* Celebration banner */}
      {celebrations.length > 0 && (
        <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-center">
          <div className="text-2xl">{celebrations[celebrations.length - 1].icon}</div>
          <p className="mt-1 font-semibold text-foreground">
            Unlocked: {celebrations[celebrations.length - 1].title}
          </p>
          <p className="text-sm text-muted-foreground">
            {celebrations[celebrations.length - 1].description} (+{celebrations[celebrations.length - 1].xp} XP)
          </p>
        </div>
      )}

      {/* Hero: your link */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-primary">
          <Gift size={18} aria-hidden="true" />
          <h2 className="font-semibold">Invite a friend, grow together</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your link. When a friend joins and runs their first swing check, you both move forward —
          and you climb the reward ladder below.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2">
          <code className="flex-1 truncate px-2 text-sm text-foreground" aria-label="Your invite link">
            {inviteUrl}
          </code>
          <Button size="sm" variant={copied ? 'secondary' : 'primary'} onClick={onCopy}>
            {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Your code: <span className="font-mono font-medium text-foreground">{code}</span>
        </p>

        {/* Share channels */}
        <div className="mt-4 flex flex-wrap gap-2">
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => share(c.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Honest stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Links shared" value={stats.shareCount} icon={<Share2 size={15} />} />
        <Stat label="Friends joined" value={stats.signupCount} icon={<Users size={15} />} />
        <Stat label="Got started" value={stats.activatedCount} icon={<Sparkles size={15} />} />
      </div>

      {/* Reward ladder */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-warning" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">Reward ladder</h3>
        </div>

        {stats.nextTier && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Next: <span className="font-medium text-foreground">{stats.nextTier.title}</span>
              </span>
              <span className="text-muted-foreground">
                {stats.signupCount}/{stats.nextTier.threshold} friends
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${stats.progressToNext}%` }}
              />
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-2">
          {tiers.map((t) => {
            const unlocked = stats.signupCount >= t.threshold;
            return (
              <li
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  unlocked ? 'border-success/40 bg-success/5' : 'border-border bg-card'
                }`}
              >
                <span className={`text-xl ${unlocked ? '' : 'opacity-40 grayscale'}`}>{t.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {t.title} <span className="text-muted-foreground">· {t.threshold} friend{t.threshold > 1 ? 's' : ''}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <span className={`text-xs font-semibold ${unlocked ? 'text-success' : 'text-muted-foreground'}`}>
                  {unlocked ? 'Unlocked' : `+${t.xp} XP`}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          How crediting works: {ACTIVATION_DEFINITION} We only count signups we can actually attribute to
          your link — no inflated numbers.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
