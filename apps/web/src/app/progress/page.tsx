import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScoreRing } from '@/components/ui/ScoreRing';

export const metadata = { title: 'Progress — SwingIQ' };

const TREND_DATA = [
  { period: '90 days ago', overall: 44, driver: 32, iron: 52, face: 28 },
  { period: '60 days ago', overall: 49, driver: 36, iron: 57, face: 32 },
  { period: '30 days ago', overall: 54, driver: 40, iron: 62, face: 36 },
  { period: 'Today', overall: 58, driver: 42, iron: 65, face: 38 },
];

export default function ProgressPage() {
  const latest = TREND_DATA[TREND_DATA.length - 1]!;
  const earliest = TREND_DATA[0]!;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">90-day improvement overview</p>
        </div>

        {/* Score progression */}
        <div className="grid grid-cols-4 gap-4">
          {TREND_DATA.map((snapshot) => (
            <Card key={snapshot.period} className={snapshot.period === 'Today' ? 'ring-2 ring-green-400' : ''}>
              <CardBody className="text-center py-5">
                <p className="text-xs text-gray-500 mb-3">{snapshot.period}</p>
                <ScoreRing score={snapshot.overall} size={70} strokeWidth={6} label="Overall" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-gray-500">Driver</p>
                    <p className="font-bold text-sm text-gray-900">{snapshot.driver}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Irons</p>
                    <p className="font-bold text-sm text-gray-900">{snapshot.iron}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Improvements summary */}
        <Card>
          <CardHeader><CardTitle>90-Day Improvements</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-3">
              {[
                { metric: 'Overall Score', before: earliest.overall, after: latest.overall },
                { metric: 'Driver Score', before: earliest.driver, after: latest.driver },
                { metric: 'Iron Score', before: earliest.iron, after: latest.iron },
                { metric: 'Face Control Score', before: earliest.face, after: latest.face },
              ].map(({ metric, before, after }) => {
                const change = after - before;
                return (
                  <div key={metric} className="flex items-center gap-4">
                    <p className="text-sm text-gray-700 w-40 flex-shrink-0">{metric}</p>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${after}%` }} />
                    </div>
                    <div className="flex items-center gap-2 w-24 flex-shrink-0 justify-end">
                      <span className="text-sm font-bold text-gray-900">{after}</span>
                      <span className={`text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? '+' : ''}{change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Most improved */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Most Improved Metric</p>
              <p className="text-lg font-bold text-green-600">Face Control</p>
              <p className="text-sm text-gray-600">+10 points in 90 days</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-gray-500 mb-1">Current Priority</p>
              <p className="text-lg font-bold text-red-600">Driver Score</p>
              <p className="text-sm text-gray-600">Still at 42 — face control needed</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
