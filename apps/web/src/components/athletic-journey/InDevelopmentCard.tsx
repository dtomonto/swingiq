'use client';

// ============================================================
// SwingVantage — Athletic Journey: in-development sport card
// ------------------------------------------------------------
// Premium locked-state card for Baseball / Fast-Pitch / Slow-Pitch.
// Represents the sport honestly: explains it's in development, what
// the future journey will include, and offers interest capture. No
// stage scoring, no fake progress — ever.
// ============================================================

import { useState } from 'react';
import { Hammer, Bell, ListChecks, UserPlus, Check } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { SportAvailability, SportInterestType } from '@/lib/athletic-journey';
import { addInterest, useJourneyStoreData } from '@/lib/athletic-journey/store';

function InterestButton({
  sport,
  type,
  label,
  icon: Icon,
  joined,
}: {
  sport: SportAvailability['sport'];
  type: SportInterestType;
  label: string;
  icon: typeof Bell;
  joined: boolean;
}) {
  const done = joined;
  return (
    <Button
      variant={done ? 'secondary' : 'outline'}
      size="sm"
      disabled={done}
      onClick={() => {
        addInterest(sport, type);
        track(
          type === 'basic_profile'
            ? ANALYTICS_EVENTS.JOURNEY_BASIC_PROFILE_CREATED
            : ANALYTICS_EVENTS.JOURNEY_WAITLIST_JOINED,
          { sport, interest_type: type },
        );
      }}
    >
      {done ? <Check size={15} aria-hidden="true" /> : <Icon size={15} aria-hidden="true" />}
      {done ? 'Added' : label}
    </Button>
  );
}

export function InDevelopmentCard({ availability }: { availability: SportAvailability }) {
  const [viewedOnce] = useState(() => {
    track(ANALYTICS_EVENTS.JOURNEY_IN_DEVELOPMENT_VIEWED, { sport: availability.sport });
    return true;
  });
  void viewedOnce;

  const store = useJourneyStoreData();
  const mine = store.interests.filter((i) => i.sport === availability.sport);
  const has = (t: SportInterestType) => mine.some((i) => i.interestType === t);

  return (
    <Card className="overflow-hidden">
      {/* Banner */}
      <div className="relative px-6 py-8 bg-muted/60 border-b border-border text-center">
        <div className="text-5xl mb-2" aria-hidden="true">{availability.emoji}</div>
        <h2 className="text-xl font-bold text-foreground">{availability.displayName}</h2>
        <div className="mt-2 inline-flex items-center gap-1.5">
          <Hammer size={14} className="text-muted-foreground" aria-hidden="true" />
          <Badge variant="medium">Athletic Journey in development</Badge>
        </div>
      </div>

      <CardBody className="space-y-5">
        <p className="text-sm text-foreground leading-relaxed">{availability.userFacingMessage}</p>

        <div className="rounded-theme border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            What this journey will include
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">{availability.futurePromise}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Want it sooner? Tell us you&apos;re interested.
          </p>
          <div className="flex flex-wrap gap-2">
            {availability.waitlistEnabled && (
              <>
                <InterestButton sport={availability.sport} type="notify" label="Notify me" icon={Bell} joined={has('notify')} />
                <InterestButton sport={availability.sport} type="waitlist" label="Join waitlist" icon={ListChecks} joined={has('waitlist')} />
              </>
            )}
            {availability.basicProfileEnabled && (
              <InterestButton sport={availability.sport} type="basic_profile" label="Create basic profile" icon={UserPlus} joined={has('basic_profile')} />
            )}
          </div>
          {mine.length > 0 && (
            <p className="mt-3 text-xs text-success flex items-center gap-1.5">
              <Check size={13} aria-hidden="true" />
              You&apos;re on the list — we&apos;ll let you know the moment {availability.displayName} goes live.
            </p>
          )}
        </div>

        <p className="text-2xs text-muted-foreground">
          This sport will receive its own journey stages, swing metrics, development pathway, and
          performance intelligence as SwingVantage expands.
        </p>
      </CardBody>
    </Card>
  );
}
