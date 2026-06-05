'use client';

import { Card, CardBody } from '@/components/ui/Card';
import Link from 'next/link';
import { useSport } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';
import { ChevronRight, Info } from 'lucide-react';

const SPORT_EQUIPMENT_ROUTES = [
  { sportId: 'golf', label: 'Golf — Clubs', sublabel: 'Driver, irons, wedges, putter', href: '/equipment/golf', emoji: '⛳' },
  { sportId: 'tennis', label: 'Tennis — Racket', sublabel: 'Frame, strings, tension, grip size', href: '/equipment/tennis', emoji: '🎾' },
  { sportId: 'baseball', label: 'Baseball — Bat', sublabel: 'Length, weight, drop, certification', href: '/equipment/baseball', emoji: '⚾' },
  { sportId: 'softball_slow', label: 'Slow Pitch Softball — Bat', sublabel: 'End load, compression, stamps', href: '/equipment/softball-slow', emoji: '🥎' },
  { sportId: 'softball_fast', label: 'Fast Pitch Softball — Bat', sublabel: 'Drop, length, balance, certification', href: '/equipment/softball-fast', emoji: '🥎' },
];

export default function EquipmentHubPage() {
  const { activeSport } = useSport();
  const { clubs, sportEquipment } = useSwingVantageStore();

  const counts: Record<string, number> = {
    golf: clubs.length,
    tennis: sportEquipment.tennis.length,
    baseball: sportEquipment.baseball.length,
    softball_slow: sportEquipment.softball_slow.length,
    softball_fast: sportEquipment.softball_fast.length,
  };

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipment Center</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your equipment to add context to your swing diagnoses. This is optional — SwingVantage works without it.
          </p>
        </div>

        {/* Optional notice */}
        <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
          <Info className="text-accent-secondary mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-foreground">
            Equipment setup is <strong>optional</strong>. Entering your equipment improves the accuracy of coaching recommendations but is not required to run diagnostics or get drills.
          </p>
        </div>

        {/* Sport routes */}
        <Card>
          <CardBody className="p-0 divide-y divide-border">
            {SPORT_EQUIPMENT_ROUTES.map((route) => {
              const count = counts[route.sportId] ?? 0;
              const isActive = activeSport === route.sportId;
              return (
                <Link
                  key={route.sportId}
                  href={route.href}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors"
                >
                  <span className="text-2xl">{route.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{route.label}</p>
                      {isActive && (
                        <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">Active sport</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{route.sublabel}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {count} logged
                      </span>
                    )}
                    {count === 0 && (
                      <span className="text-xs text-muted-foreground">Not set up</span>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Equipment scores are estimates based on general guidelines. Always test changes before purchasing new gear.
        </p>
      </div>
    </>
  );
}
