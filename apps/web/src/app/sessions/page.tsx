import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Upload, ChevronRight } from 'lucide-react';

export const metadata = { title: 'Sessions — SwingIQ' };

const SAMPLE_SESSIONS = [
  { id: '1', name: 'Range Session — Driver', date: 'May 25, 2026', shots: 30, clubs: ['Driver'], diagnosis: 'Open Face / Slice Pattern', score: 42 },
  { id: '2', name: 'Iron Practice — 7i & 8i', date: 'May 22, 2026', shots: 45, clubs: ['7-Iron', '8-Iron'], diagnosis: 'High Spin Rate', score: 61 },
  { id: '3', name: 'Wedge Matrix Session', date: 'May 18, 2026', shots: 60, clubs: ['PW', '52°', '58°'], diagnosis: 'Inconsistent Carry', score: 55 },
];

export default function SessionsPage() {
  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="text-sm text-gray-500 mt-1">{SAMPLE_SESSIONS.length} sessions recorded</p>
          </div>
          <Link href="/sessions/import">
            <Button>
              <Upload size={16} />
              Import Session
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {SAMPLE_SESSIONS.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardBody className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{session.name}</p>
                    <Badge variant="info">{session.shots} shots</Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {session.date} · {session.clubs.join(', ')}
                  </p>
                  {session.diagnosis && (
                    <p className="text-xs text-red-600 mt-1">⚠ {session.diagnosis}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{session.score}</p>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                  <Link href={`/sessions/${session.id}`}>
                    <Button variant="ghost" size="sm">
                      View <ChevronRight size={14} />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
