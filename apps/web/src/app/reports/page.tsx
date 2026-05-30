'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileText, ChevronRight, Activity, Upload } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { format } from 'date-fns';

const REPORT_TYPES = [
  {
    title: 'Session Report',
    description:
      'Full breakdown of a single practice session: shot table, dispersion chart, diagnosis, and training plan.',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    href: '/sessions',
    cta: 'View Sessions',
  },
  {
    title: 'Progress Report',
    description:
      'See how your scores and key metrics have changed across all sessions.',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    href: '/progress',
    cta: 'View Progress',
  },
  {
    title: 'Swing Diagnosis',
    description:
      'Deep analysis of your primary swing faults — causes, evidence, and drills.',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    href: '/diagnose',
    cta: 'Run Diagnosis',
  },
  {
    title: 'AI Coach Summary',
    description:
      'Ask your AI Coach for a plain-English summary of your game, designed to share with a coach or club fitter.',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    href: '/ai-coach',
    cta: 'Ask AI Coach',
  },
] as const;

export default function ReportsPage() {
  const { sessions } = useSwingIQStore();

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Detailed views of your data — share with your coach, club fitter, or training
            partner.
          </p>
        </div>

        {/* Report types */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REPORT_TYPES.map((report) => (
            <Card key={report.title} className={`border-2 ${report.color}`}>
              <CardBody className="space-y-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}
                >
                  <FileText size={22} className={report.iconColor} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {report.description}
                  </p>
                </div>
                <Link href={report.href}>
                  <Button size="sm" variant="outline" className="mt-1">
                    {report.cta} <ChevronRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Recent sessions as "reports" */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardBody>
            {sorted.length === 0 ? (
              <div className="text-center py-8">
                <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm mb-4">
                  No sessions yet. Import a CSV to generate your first report.
                </p>
                <Link href="/sessions/import">
                  <Button size="sm">
                    <Upload size={14} /> Import Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {sorted.slice(0, 8).map((s) => (
                  <Link
                    key={s.id}
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between py-2.5 px-2 border-b last:border-0 hover:bg-gray-50 rounded transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-xs text-gray-400">
                          {format(new Date(s.created_at), 'MMM d, yyyy')} · {s.shot_count} shots
                        </p>
                        <Badge variant="default" className="text-xs">
                          {s.club_name}
                        </Badge>
                        {s.diagnoses.length > 0 && (
                          <Badge variant="warning" className="text-xs">
                            ⚠ {s.diagnoses[0]?.rule?.name ?? 'Diagnosed'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {s.swing_score !== null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{s.swing_score}</p>
                          <p className="text-xs text-gray-400">Score</p>
                        </div>
                      )}
                      <ChevronRight
                        size={16}
                        className="text-gray-300 group-hover:text-gray-500 transition-colors"
                      />
                    </div>
                  </Link>
                ))}
                {sorted.length > 8 && (
                  <div className="pt-2 text-center">
                    <Link href="/sessions">
                      <Button variant="ghost" size="sm">
                        View all {sorted.length} sessions
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Export note */}
        <Card className="border-dashed border-gray-300">
          <CardBody className="text-center py-6">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">PDF export & share links</span>{' '}
              — coming in a future update. For now, use your browser's Print → Save as PDF
              on any session detail page.
            </p>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
