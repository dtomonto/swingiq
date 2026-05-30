'use client';

import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Upload, ChevronRight, Trash2, Calendar, Activity } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { format } from 'date-fns';
import { useState } from 'react';

export default function SessionsPage() {
  const { sessions, removeSession } = useSwingIQStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <Link href="/sessions/import">
            <Button><Upload size={16} /> Import Session</Button>
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <Activity size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium mb-2">No sessions yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Import your first CSV from your launch monitor to start building your swing profile.
            </p>
            <Link href="/sessions/import">
              <Button><Upload size={16} /> Import Your First Session</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardBody className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-gray-900">{session.name}</p>
                      <Badge variant="info">{session.shot_count} shots</Badge>
                      <Badge variant="default">{session.club_name}</Badge>
                      {session.diagnoses.length > 0 && (
                        <Badge variant="warning">
                          ⚠ {session.diagnoses[0]?.rule?.name ?? 'Diagnosed'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} />
                      {format(new Date(session.created_at), 'MMM d, yyyy')}
                      {session.launch_monitor && session.launch_monitor !== 'manual' && (
                        <span className="ml-2 capitalize">· {session.launch_monitor}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {session.swing_score !== null && (
                      <ScoreRing score={session.swing_score} size={44} strokeWidth={4} />
                    )}
                    <Link href={`/sessions/${session.id}`}>
                      <Button variant="ghost" size="sm">
                        View <ChevronRight size={14} />
                      </Button>
                    </Link>
                    {confirmDeleteId === session.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
                          onClick={() => { removeSession(session.id); setConfirmDeleteId(null); }}
                        >
                          Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setConfirmDeleteId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDeleteId(session.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
