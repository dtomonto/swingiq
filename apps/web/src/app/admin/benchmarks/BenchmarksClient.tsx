'use client';

// ============================================================
// /admin/benchmarks — edit the profile × dimension grading benchmarks
// (Phase 10). Edits are an operator override saved on THIS device for
// preview; "Copy as JSON" exports the table to commit for global rollout
// (there is no benchmark backend — honest about the boundary).
// ============================================================

import { useEffect, useState } from 'react';
import { Save, RotateCcw, Copy, Check } from 'lucide-react';
import {
  GOLF_PROFILES, GRADE_DIMENSIONS, DIMENSION_LABELS,
  type BenchmarkTable, type GolfProfileId, type GradeDimension,
} from '@/lib/grading/profiles';
import { activeBenchmarks, saveBenchmarkOverride, resetBenchmarkOverride } from '@/lib/grading/benchmark-store';

export function BenchmarksClient() {
  const [table, setTable] = useState<BenchmarkTable | null>(null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setTable(activeBenchmarks()); }, []);

  if (!table) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const setCell = (profile: GolfProfileId, dim: GradeDimension, value: number) => {
    setTable((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [profile]: { ...prev[profile], [dim]: Math.max(0, Math.min(100, value)) } };
      return next;
    });
    setDirty(true);
    setSavedAt(false);
  };

  const save = () => { if (table) { saveBenchmarkOverride(table); setDirty(false); setSavedAt(true); } };
  const reset = () => { resetBenchmarkOverride(); setTable(activeBenchmarks()); setDirty(false); setSavedAt(false); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(table, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={save} disabled={!dirty} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
          <Save size={14} /> {savedAt ? 'Saved' : 'Save override'}
        </button>
        <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          <RotateCcw size={14} /> Reset to defaults
        </button>
        <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy as JSON'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left font-semibold text-foreground">Profile</th>
              {GRADE_DIMENSIONS.map((d) => (
                <th key={d} className="px-2 py-2 text-center font-medium text-muted-foreground">{DIMENSION_LABELS[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GOLF_PROFILES.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium text-foreground">{p.label}</span>
                  <span className="ml-1 text-xs text-muted-foreground">hcp {p.handicapRange[0]}–{p.handicapRange[1]}</span>
                </td>
                {GRADE_DIMENSIONS.map((d) => (
                  <td key={d} className="px-2 py-1.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={table[p.id][d]}
                      onChange={(e) => setCell(p.id, d, parseInt(e.target.value || '0', 10))}
                      aria-label={`${p.label} ${DIMENSION_LABELS[d]} benchmark`}
                      className="w-14 rounded border border-border bg-card px-1.5 py-1 text-center text-foreground"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Each cell is the 0–100 score a typical player at that level is expected to reach on that dimension.
        Meeting it grades a solid B; clearing it by ~10+ grades an A.
      </p>
    </div>
  );
}
