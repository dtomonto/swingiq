'use client';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useState, useMemo } from 'react';
import { ExternalLink, Search, Sparkles, Dumbbell } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ALL_SPORTS_INCLUDING_GOLF,
  TENNIS_DRILLS,
  BASEBALL_DRILLS,
  SLOW_PITCH_DRILLS,
  FAST_PITCH_DRILLS,
  getRoutineForDiagnosis,
  type DiagnosisCategory,
} from '@swingiq/core';
import type { SportId } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { useSwingVantageStore, useLatestDiagnosedSession } from '@/store';
import { useSport } from '@/contexts/SportContext';

// Golf drills live in the training routines — we surface a curated list here
const GOLF_DRILLS = [
  { id: 'g1', name: 'Gate Drill', goal: 'Groove a square face at impact', difficulty: 'beginner' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+gate+drill+face+control', issue_id: null, phase: 'downswing', reps_or_duration: '20 reps', equipment_needed: '2 tees', safety_note: null },
  { id: 'g2', name: 'Pause at P3 Drill', goal: 'Check club face angle mid-backswing', difficulty: 'beginner' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+P3+pause+drill+face+angle', issue_id: null, phase: 'backswing', reps_or_duration: '15 reps', equipment_needed: 'Club', safety_note: null },
  { id: 'g3', name: 'Hip Clearance Drill', goal: 'Learn proper hip rotation through impact', difficulty: 'intermediate' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+hip+rotation+drill+clearance+impact', issue_id: null, phase: 'downswing', reps_or_duration: '10 slow, 10 full', equipment_needed: 'Club', safety_note: null },
  { id: 'g4', name: 'High Tee Driver Drill', goal: 'Train positive attack angle to reduce spin', difficulty: 'intermediate' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+high+tee+drill+driver+attack+angle+low+spin', issue_id: null, phase: 'impact', reps_or_duration: '15 reps', equipment_needed: 'Driver, high tees', safety_note: null },
  { id: 'g5', name: 'Alignment Stick Path Drill', goal: 'Visualize and improve club path direction', difficulty: 'beginner' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+alignment+stick+path+drill+outside+in', issue_id: null, phase: 'setup', reps_or_duration: '20 reps', equipment_needed: '2 alignment sticks', safety_note: null },
  { id: 'g6', name: 'Impact Bag Drill', goal: 'Build a strong impact position with forward shaft lean', difficulty: 'beginner' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+impact+bag+drill+shaft+lean+position', issue_id: null, phase: 'impact', reps_or_duration: '30 reps', equipment_needed: 'Impact bag or cushion', safety_note: 'Do not swing at full speed into the bag.' },
  { id: 'g7', name: 'Step Drill', goal: 'Improve weight transfer and sequencing', difficulty: 'intermediate' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+step+drill+weight+transfer+sequence', issue_id: null, phase: 'downswing', reps_or_duration: '20 reps', equipment_needed: 'Iron', safety_note: null },
  { id: 'g8', name: 'Pump Drill', goal: 'Shallow the club on the downswing', difficulty: 'advanced' as const, sport_id: 'golf' as SportId, youtube_search_url: 'https://www.youtube.com/results?search_query=golf+pump+drill+shallow+downswing+lag', issue_id: null, phase: 'transition', reps_or_duration: '20 slow reps', equipment_needed: 'Iron', safety_note: null },
];

const ALL_DRILLS = [
  ...GOLF_DRILLS,
  ...TENNIS_DRILLS,
  ...BASEBALL_DRILLS,
  ...SLOW_PITCH_DRILLS,
  ...FAST_PITCH_DRILLS,
];

const DIFFICULTY_COLORS = {
  beginner: 'bg-primary/15 text-primary',
  intermediate: 'bg-accent-secondary/15 text-accent-secondary',
  advanced: 'bg-accent-secondary/15 text-accent-secondary',
};

export default function DrillsPage() {
  const { activeSport, sportEmoji, sportName } = useSport();
  const [search, setSearch] = useState('');
  // Default to the active sport so the page immediately shows relevant drills
  const [sportFilter, setSportFilter] = useState<SportId | 'all'>(activeSport);
  const [diffFilter, setDiffFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const { training } = useSwingVantageStore();
  const latestDiagnosed = useLatestDiagnosedSession();

  // Recommended drills from active diagnosis
  const recommendedDrills = useMemo(() => {
    const diagId = (training.active_diagnosis_id ?? latestDiagnosed?.diagnoses[0]?.rule?.id) as DiagnosisCategory | undefined;
    if (!diagId) return [];
    const routine = getRoutineForDiagnosis(diagId, 'beginner');
    return routine?.drill_recommendations ?? [];
  }, [training.active_diagnosis_id, latestDiagnosed]);

  const filtered = ALL_DRILLS.filter((d) => {
    const matchSport = sportFilter === 'all' || d.sport_id === sportFilter;
    const matchDiff = diffFilter === 'all' || d.difficulty === diffFilter;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.goal.toLowerCase().includes(search.toLowerCase());
    return matchSport && matchDiff && matchSearch;
  });

  const getSportEmoji = (id: string) => ALL_SPORTS_INCLUDING_GOLF.find((s) => s.id === id)?.emoji ?? '🏌️';

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} {sportName} Drill Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ALL_DRILLS.filter((d) => d.sport_id === activeSport).length} {sportName} drills · {ALL_DRILLS.length} total across all sports. Use the sport filter to explore others.
          </p>
        </div>

        {/* Recommended for your swing */}
        {recommendedDrills.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <CardTitle className="text-primary">Recommended for Your Swing</CardTitle>
              </div>
              <p className="text-xs text-primary mt-0.5">
                Based on your active diagnosis: <strong>{latestDiagnosed?.diagnoses[0]?.rule?.name ?? training.active_diagnosis_id}</strong>
              </p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendedDrills.map((drill) => (
                  <div key={drill.id} className="bg-card rounded-lg border border-primary/30 p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{drill.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{drill.why_this_matches}</p>
                      {drill.warning && (
                        <p className="text-xs text-warning mt-1">⚠ {drill.warning}</p>
                      )}
                    </div>
                    <a
                      href={drill.youtube_search_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-sm text-xs hover:bg-red-700"
                    >
                      <ExternalLink size={10} /> YT
                    </a>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drills..."
              className="w-full border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden"
            />
          </div>
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value as SportId | 'all')}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
          >
            <option value="all">All Sports</option>
            {ALL_SPORTS_INCLUDING_GOLF.map((s) => (
              <option key={s.id} value={s.id}>{s.emoji} {s.short_name}</option>
            ))}
          </select>
          <select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value as typeof diffFilter)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-card focus:ring-2 focus:ring-ring outline-hidden"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <p className="text-xs text-muted-foreground mb-4">{filtered.length} drill{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Drill grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((drill) => (
            <Card key={drill.id} className="hover:shadow-md transition-shadow">
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getSportEmoji(drill.sport_id)}</span>
                    <h3 className="font-bold text-foreground text-sm">{drill.name}</h3>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', DIFFICULTY_COLORS[drill.difficulty])}>
                    {drill.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{drill.goal}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {drill.reps_or_duration && <span>🔄 {drill.reps_or_duration}</span>}
                  {drill.equipment_needed && <span>🎯 {drill.equipment_needed}</span>}
                </div>
                {drill.safety_note && (
                  <p className="text-xs text-warning bg-warning/10 px-2 py-1 rounded-sm">⚠ {drill.safety_note}</p>
                )}
                <a
                  href={drill.youtube_search_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 w-fit mt-1"
                >
                  <ExternalLink size={11} /> Find on YouTube
                </a>
              </CardBody>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            icon={Dumbbell}
            title="No drills match your filters"
            description="Try clearing a filter to see more drills."
          />
        )}
      </div>
    </>
  );
}
