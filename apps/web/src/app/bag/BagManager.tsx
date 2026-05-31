'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, BarChart2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { cn } from '@/lib/utils';
import { useSwingIQStore, type LocalClub } from '@/store';
import { analyzeClubGaps, type ClubGapInput, lookupLoft, analyzeLoftGapping } from '@swingiq/core';
import type { LoftSource, LoftConfidence } from '@swingiq/core';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  driver: 'Driver', wood: 'Fairway Wood', hybrid: 'Hybrid',
  iron: 'Iron', wedge: 'Wedge', putter: 'Putter', other: 'Other',
};

// Map BagManager category names to loft-autofill clubType keys
const CATEGORY_TO_CLUB_TYPE: Record<string, string> = {
  driver: 'driver',
  wood: '3_wood',
  hybrid: '3_hybrid',
  iron: '7_iron',
  wedge: 'sw',
  putter: 'putter',
  other: 'other',
};

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';
const selectClass = `${inputClass} bg-white`;

type ViewMode = 'clubs' | 'loft_gapping';

type ClubFormData = Omit<LocalClub, 'id' | 'created_at'>;

interface LoftFieldState {
  loftSource: LoftSource;
  loftConfidence: LoftConfidence;
  loftLabel: string;
  defaultLoft: number | null; // the autofilled value so we can reset to it
}

function sourceBadgeClass(source: LoftSource): string {
  switch (source) {
    case 'manufacturer_model': return 'bg-green-100 text-green-700';
    case 'generic_default': return 'bg-blue-100 text-blue-700';
    case 'user_custom': return 'bg-amber-100 text-amber-700';
    default: return 'bg-gray-100 text-gray-500';
  }
}

function ClubCard({ club, onEdit, onDelete }: { club: LocalClub; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="flex items-center gap-4">
        <ScoreRing score={club.typical_carry ? 70 : 40} size={52} strokeWidth={5} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900">{club.name}</p>
            <Badge variant="default" className="text-xs">{CATEGORY_LABELS[club.category] ?? club.category}</Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {club.brand} {club.model}{club.loft ? ` · ${club.loft}°` : ''}{club.shaft_flex ? ` · ${club.shaft_flex}` : ''}
          </p>
          {club.typical_carry && (
            <p className="text-xs text-gray-600 mt-0.5">
              Typical carry: <span className="font-semibold">{club.typical_carry} yds</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/diagnose?club=${encodeURIComponent(club.name)}`}>
            <Button variant="ghost" size="sm" className="text-green-600">
              <Target size={14} /> Analyze
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onEdit}><Edit2 size={14} /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:bg-red-50">
            <Trash2 size={14} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function ClubFormModal({
  onClose,
  onSave,
  defaultValues,
}: {
  onClose: () => void;
  onSave: (data: ClubFormData) => void;
  defaultValues?: Partial<LocalClub>;
}) {
  const [form, setForm] = useState<ClubFormData>({
    name: defaultValues?.name ?? '',
    category: defaultValues?.category ?? 'iron',
    brand: defaultValues?.brand ?? '',
    model: defaultValues?.model ?? '',
    loft: defaultValues?.loft ?? null,
    typical_carry: defaultValues?.typical_carry ?? null,
    typical_total: defaultValues?.typical_total ?? null,
    shaft_flex: defaultValues?.shaft_flex ?? '',
    notes: defaultValues?.notes ?? '',
    sort_order: defaultValues?.sort_order ?? 0,
  });

  const [loftState, setLoftState] = useState<LoftFieldState>(() => {
    // On initial open, determine source for existing loft or run a lookup
    if (defaultValues?.loft != null) {
      return {
        loftSource: 'user_custom',
        loftConfidence: 'medium',
        loftLabel: 'Manually entered',
        defaultLoft: defaultValues.loft,
      };
    }
    const clubType = CATEGORY_TO_CLUB_TYPE[defaultValues?.category ?? 'iron'] ?? 'other';
    const result = lookupLoft(clubType, defaultValues?.brand, defaultValues?.model);
    return {
      loftSource: result.source,
      loftConfidence: result.confidence,
      loftLabel: result.label,
      defaultLoft: result.loft,
    };
  });

  const set = (key: keyof ClubFormData, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // When category, brand, or model changes — re-run autofill (if loft is not user_custom)
  useEffect(() => {
    if (loftState.loftSource === 'user_custom') return; // user already edited manually
    const clubType = CATEGORY_TO_CLUB_TYPE[form.category] ?? 'other';
    const result = lookupLoft(clubType, form.brand || undefined, form.model || undefined);
    setLoftState({
      loftSource: result.source,
      loftConfidence: result.confidence,
      loftLabel: result.label,
      defaultLoft: result.loft,
    });
    if (result.loft !== null) {
      set('loft', result.loft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category, form.brand, form.model]);

  const handleLoftChange = (raw: string) => {
    const parsed = raw ? parseFloat(raw) : null;
    set('loft', parsed);
    // Mark as user_custom once manually edited
    setLoftState((prev) => ({
      ...prev,
      loftSource: 'user_custom',
      loftLabel: 'Custom (manually entered)',
    }));
  };

  const handleResetLoft = () => {
    const clubType = CATEGORY_TO_CLUB_TYPE[form.category] ?? 'other';
    const result = lookupLoft(clubType, form.brand || undefined, form.model || undefined);
    set('loft', result.loft);
    setLoftState({
      loftSource: result.source,
      loftConfidence: result.confidence,
      loftLabel: result.label,
      defaultLoft: result.loft,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{defaultValues?.id ? 'Edit Club' : 'Add Club'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Club Name *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} placeholder="7-Iron" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Category *</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value as LocalClub['category'])} className={selectClass}>
                <option value="driver">Driver</option>
                <option value="wood">Fairway Wood</option>
                <option value="hybrid">Hybrid</option>
                <option value="iron">Iron</option>
                <option value="wedge">Wedge</option>
                <option value="putter">Putter</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Brand</label>
              <input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={inputClass} placeholder="TaylorMade" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Model</label>
              <input value={form.model} onChange={(e) => set('model', e.target.value)} className={inputClass} placeholder="Stealth 2" />
            </div>

            {/* Loft field with autofill label and reset */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600">Loft (°)</label>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', sourceBadgeClass(loftState.loftSource))}>
                  {loftState.loftLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={form.loft ?? ''}
                  onChange={(e) => handleLoftChange(e.target.value)}
                  className={inputClass}
                  placeholder="10.5"
                />
                {loftState.loftSource === 'user_custom' && loftState.defaultLoft !== null && (
                  <button
                    type="button"
                    onClick={handleResetLoft}
                    className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
                  >
                    Reset to default
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Shaft Flex</label>
              <select value={form.shaft_flex} onChange={(e) => set('shaft_flex', e.target.value)} className={selectClass}>
                <option value="">Unknown</option>
                <option value="ladies">Ladies</option>
                <option value="senior">Senior</option>
                <option value="regular">Regular</option>
                <option value="stiff">Stiff</option>
                <option value="x-stiff">X-Stiff</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Typical Carry (yds)</label>
              <input type="number" value={form.typical_carry ?? ''} onChange={(e) => set('typical_carry', e.target.value ? parseInt(e.target.value) : null)} className={inputClass} placeholder="160" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Typical Total (yds)</label>
              <input type="number" value={form.typical_total ?? ''} onChange={(e) => set('typical_total', e.target.value ? parseInt(e.target.value) : null)} className={inputClass} placeholder="175" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <input value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass} placeholder="Any notes about this club..." />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save Club</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Loft Gapping View ─────────────────────────────────────────

function LoftGappingView({ clubs }: { clubs: LocalClub[] }) {
  const loftInputs = clubs.map((c) => ({ name: c.name, loft: c.loft }));
  const analysis = analyzeLoftGapping(loftInputs);

  const sortedForDisplay = [...clubs]
    .filter((c) => c.loft != null)
    .sort((a, b) => (a.loft ?? 0) - (b.loft ?? 0));

  return (
    <div className="space-y-4">
      {/* Summary recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardBody className="space-y-1 py-3">
            {analysis.recommendations.map((rec, i) => (
              <p key={i} className="text-sm text-blue-800">{rec}</p>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Missing loft data */}
      {analysis.missingLofts.length > 0 && (
        <Card className="border-gray-200">
          <CardBody className="py-3">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Missing loft data:</span> {analysis.missingLofts.join(', ')} — add loft to these clubs for full analysis.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Club-by-club loft table */}
      <Card>
        <CardHeader>
          <CardTitle>Loft Ladder</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Clubs sorted lowest to highest loft. Ideal gap between clubs is ~4°.</p>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y">
            {sortedForDisplay.map((club, idx) => {
              const gap = analysis.gaps.find((g) => g.from === club.name);
              const isLargeGap = gap && gap.gap > 6;
              const isOverlap = gap && gap.gap < 2 && gap.gap >= 0;

              return (
                <div key={club.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-gray-900">{club.name}</span>
                      <span className="ml-2 text-xs text-gray-500">{CATEGORY_LABELS[club.category] ?? club.category}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{club.loft}°</span>
                  </div>
                  {gap && (
                    <div className={cn(
                      'mt-1 flex items-center gap-2 text-xs px-2 py-1 rounded-md w-fit',
                      isLargeGap
                        ? 'bg-red-50 text-red-700'
                        : isOverlap
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-green-50 text-green-700',
                    )}>
                      <span>
                        {isLargeGap ? '⚠' : isOverlap ? '⚠' : '✓'}
                        {' '}Gap to {gap.to}: {gap.gap}°
                        {isLargeGap ? ' — too wide' : isOverlap ? ' — overlap' : ' — good'}
                      </span>
                    </div>
                  )}
                  {idx === sortedForDisplay.length - 1 && (
                    <p className="text-xs text-gray-400 mt-1">Highest loft in bag</p>
                  )}
                </div>
              );
            })}
          </div>
          {sortedForDisplay.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No clubs with loft data yet. Add loft values when editing clubs.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ── Main BagManager component ─────────────────────────────────

export function BagManager() {
  const { clubs, addClub, updateClub, removeClub } = useSwingIQStore();
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<LocalClub | null>(null);
  const [showGapAnalysis, setShowGapAnalysis] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('clubs');

  const handleSave = (data: ClubFormData) => {
    if (editingClub) {
      updateClub(editingClub.id, data);
    } else {
      addClub({ ...data, sort_order: clubs.length });
    }
  };

  // Carry gap analysis (existing)
  const gapInputs: ClubGapInput[] = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    typical_carry: c.typical_carry,
    sort_order: c.sort_order,
  }));
  const gapAnalysis = clubs.length >= 2 ? analyzeClubGaps(gapInputs) : null;

  const sortedClubs = [...clubs].sort((a, b) => (b.typical_carry ?? 0) - (a.typical_carry ?? 0));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Golf Bag</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clubs.length} clubs · Sorted by carry distance
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {clubs.length >= 2 && (
            <Button variant="outline" onClick={() => setShowGapAnalysis(!showGapAnalysis)}>
              <BarChart2 size={16} /> Gap Analysis
            </Button>
          )}
          <Button
            variant={viewMode === 'loft_gapping' ? 'primary' : 'outline'}
            onClick={() => setViewMode(viewMode === 'loft_gapping' ? 'clubs' : 'loft_gapping')}
          >
            <Layers size={16} /> Loft Gapping
          </Button>
          <Button onClick={() => { setEditingClub(null); setShowModal(true); }}>
            <Plus size={16} /> Add Club
          </Button>
        </div>
      </div>

      {/* Bag stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Clubs in Bag</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">
              {clubs.find((c) => c.category === 'driver')?.typical_carry ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Driver Carry (yds)</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className={cn('text-2xl font-bold', gapAnalysis ? (gapAnalysis.overall_grade === 'A' ? 'text-green-600' : gapAnalysis.overall_grade === 'B' ? 'text-blue-600' : 'text-orange-600') : 'text-gray-400')}>
              {gapAnalysis?.overall_grade ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Gap Grade</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{gapAnalysis?.avg_gap ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Avg Gap (yds)</p>
          </CardBody>
        </Card>
      </div>

      {/* Carry Gap Analysis Panel */}
      {showGapAnalysis && gapAnalysis && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Club Gap Analysis</CardTitle>
              <span className={cn('text-2xl font-black', gapAnalysis.overall_grade === 'A' ? 'text-green-600' : gapAnalysis.overall_grade === 'B' ? 'text-blue-600' : gapAnalysis.overall_grade === 'C' ? 'text-orange-500' : 'text-red-600')}>
                Grade: {gapAnalysis.overall_grade}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{gapAnalysis.summary}</p>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {gapAnalysis.results.map((r) => (
                <div key={r.club_id} className="flex items-start gap-3 py-2 border-b last:border-0">
                  <div className="w-28 flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{r.club_name}</p>
                    <p className="text-xs text-gray-500">{r.carry} yds</p>
                  </div>
                  <div className="flex-1">
                    {r.gap_to_next !== null && (
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', r.gap_status === 'ideal' ? 'bg-green-100 text-green-700' : r.gap_status === 'too_large' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                          {Math.round(r.gap_to_next)} yds {r.gap_status === 'ideal' ? '✓' : r.gap_status === 'too_large' ? '⚠ too wide' : '⚠ too close'}
                        </span>
                      </div>
                    )}
                    {r.recommendation && (
                      <p className="text-xs text-gray-600 mt-1">{r.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {gapAnalysis.clubs_missing_data.length > 0 && (
              <p className="text-xs text-gray-400 mt-3">
                Missing carry data for: {gapAnalysis.clubs_missing_data.join(', ')}. Add typical carry to these clubs for a complete analysis.
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Loft Gapping View */}
      {viewMode === 'loft_gapping' && (
        <div className="mb-6">
          <LoftGappingView clubs={clubs} />
        </div>
      )}

      {/* Club list (hidden when loft gapping view active) */}
      {viewMode === 'clubs' && (
        <>
          <div className="space-y-3">
            {sortedClubs.map((club) => (
              <ClubCard
                key={club.id}
                club={club}
                onEdit={() => { setEditingClub(club); setShowModal(true); }}
                onDelete={() => removeClub(club.id)}
              />
            ))}
          </div>

          {clubs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg mb-3">No clubs yet</p>
              <p className="text-gray-500 text-sm mb-4">Add your first club to start building your swing profile and gap analysis.</p>
              <Button onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add Your First Club
              </Button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <ClubFormModal
          onClose={() => { setShowModal(false); setEditingClub(null); }}
          onSave={handleSave}
          defaultValues={editingClub ?? undefined}
        />
      )}
    </div>
  );
}
