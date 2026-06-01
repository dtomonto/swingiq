'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import Link from 'next/link';
import { useSport } from '@/contexts/SportContext';
import { useSwingIQStore } from '@/store';
import { ChevronRight, Info } from 'lucide-react';

const SPORT_EQUIPMENT_ROUTES = [
  { sportId: 'golf', label: 'Golf — Clubs', sublabel: 'Driver, irons, wedges, putter', href: '/bag', emoji: '⛳' },
  { sportId: 'tennis', label: 'Tennis — Racket', sublabel: 'Frame, strings, tension, grip size', href: '/equipment/tennis', emoji: '🎾' },
  { sportId: 'baseball', label: 'Baseball — Bat', sublabel: 'Length, weight, drop, certification', href: '/equipment/baseball', emoji: '⚾' },
  { sportId: 'softball_slow', label: 'Slow Pitch Softball — Bat', sublabel: 'End load, compression, stamps', href: '/equipment/softball-slow', emoji: '🥎' },
  { sportId: 'softball_fast', label: 'Fast Pitch Softball — Bat', sublabel: 'Drop, length, balance, certification', href: '/equipment/softball-fast', emoji: '🥎' },
];

export default function EquipmentHubPage() {
  const { activeSport } = useSport();
  const { clubs, sportEquipment } = useSwingIQStore();

  const counts: Record<string, number> = {
    golf: clubs.length,
    tennis: sportEquipment.tennis.length,
    baseball: sportEquipment.baseball.length,
    softball_slow: sportEquipment.softball_slow.length,
    softball_fast: sportEquipment.softball_fast.length,
  };

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Center</h1>
          <p className="text-gray-500 text-sm mt-1">
            Log your equipment to add context to your swing diagnoses. This is optional — SwingIQ works without it.
          </p>
        </div>

        {/* Optional notice */}
        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-blue-800">
            Equipment setup is <strong>optional</strong>. Entering your equipment improves the accuracy of coaching recommendations but is not required to run diagnostics or get drills.
          </p>
        </div>

        {/* Sport routes */}
        <Card>
          <CardBody className="p-0 divide-y divide-gray-100">
            {SPORT_EQUIPMENT_ROUTES.map((route) => {
              const count = counts[route.sportId] ?? 0;
              const isActive = activeSport === route.sportId;
              return (
                <Link
                  key={route.sportId}
                  href={route.href}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{route.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{route.label}</p>
                      {isActive && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active sport</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{route.sublabel}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {count > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {count} logged
                      </span>
                    )}
                    {count === 0 && (
                      <span className="text-xs text-gray-400">Not set up</span>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </CardBody>
        </Card>

        <p className="text-xs text-gray-400 text-center">
          Equipment scores are estimates based on general guidelines. Always test changes before purchasing new gear.
        </p>
      </div>
    </AppShell>
  );
}
