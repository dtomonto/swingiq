'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore, type SoftballBat } from '@/store';
import { scoreBat } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const sel = `${inp} bg-card`;

const EMPTY: Omit<SoftballBat, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', length_in: null, weight_oz: null, end_load_oz: null,
  balance: '', barrel_length_in: null, compression_rating: null,
  material: '', certification_stamps: '', break_in_status: '', condition: 'good', notes: '',
};

export function SlowPitchEquipment() {
  const { sportEquipment, addSoftballBat, removeSoftballBat } = useSwingVantageStore();
  const bats = sportEquipment.softball_slow;

  const [form, setForm] = useState<Omit<SoftballBat, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string | number | null) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function numOrNull(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n; }

  function handleAdd() {
    if (!form.brand.trim() && !form.model.trim()) return;
    addSoftballBat('softball_slow', form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/equipment" className="text-sm text-warning hover:underline inline-flex items-center gap-1 mb-2">
            ← Equipment Center
          </Link>
          <h1 className="text-2xl font-bold text-foreground">🥎 Slow Pitch Softball Bat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your bat specs. Slow pitch analysis includes end load fit, association stamp compliance, and timing suitability.
          </p>
        </div>

        <div className="flex gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4">
          <AlertTriangle className="text-warning mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-warning">
            <strong>Association compliance reminder:</strong> USSSA, USA/ASA, ISA, NSA, and SSUSA each maintain their own approved bat lists. SwingVantage cannot verify current stamp approval — always check your association&apos;s official list before play.
          </p>
        </div>

        {bats.map((bat) => {
          const score = scoreBat({
            lengthIn: bat.length_in, weightOz: bat.weight_oz,
            drop: bat.weight_oz && bat.length_in ? -(bat.length_in - bat.weight_oz) : null,
            balance: bat.balance as 'balanced' | 'end_loaded' | '',
            playerHeightIn: null, playerWeightLbs: null,
            skillLevel: 'intermediate', sport: 'softball_slow',
          });
          const expanded = expandedId === bat.id;
          return (
            <Card key={bat.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{bat.brand} {bat.model} {bat.year}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {bat.length_in && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{bat.length_in}&quot;</span>}
                      {bat.weight_oz && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{bat.weight_oz} oz</span>}
                      {bat.balance && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize">{bat.balance.replace('_', ' ')}</span>}
                      {bat.certification_stamps && <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full">{bat.certification_stamps}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        score.fitRating === 'Excellent' ? 'bg-primary/15 text-primary' :
                        score.fitRating === 'Good' ? 'bg-accent-secondary/15 text-accent-secondary' :
                        score.fitRating === 'Fair' ? 'bg-warning/15 text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>{score.fitRating} • {score.overallScore}/100</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expanded ? null : bat.id)} className="p-1 text-muted-foreground hover:text-muted-foreground">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expanded && (
                  <div className="space-y-3 pt-2 border-t border-border text-sm">
                    <div>
                      <p className="font-medium text-foreground mb-1">Confidence: {Math.round(score.confidenceScore * 100)}%</p>
                      {score.evidence.map((e, i) => <p key={i} className="text-muted-foreground text-xs">• {e}</p>)}
                    </div>
                    {score.missingData.length > 0 && (
                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-warning mb-1">Missing data</p>
                        {score.missingData.map((m, i) => <p key={i} className="text-xs text-warning">• {m}</p>)}
                      </div>
                    )}
                    {score.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-foreground mb-1">Recommendations</p>
                        {score.recommendations.map((r, i) => <p key={i} className="text-xs text-muted-foreground">• {r}</p>)}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground italic">{score.limitations[0]}</p>
                    {confirmDelete === bat.id ? (
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { removeSoftballBat('softball_slow', bat.id); setConfirmDelete(null); }}>Delete</Button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(bat.id)} className="flex items-center gap-1 text-xs text-error hover:text-error">
                        <Trash2 size={12} /> Remove this bat
                      </button>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}

        {!showForm ? (
          <Button variant="outline" className="w-full" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Bat
          </Button>
        ) : (
          <Card>
            <CardHeader><CardTitle>Add Slow Pitch Bat</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="sbs-brand" className="text-xs font-medium text-muted-foreground block mb-1">Brand</label><input id="sbs-brand" className={inp} placeholder="Easton, Louisville…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
                <div><label htmlFor="sbs-model" className="text-xs font-medium text-muted-foreground block mb-1">Model</label><input id="sbs-model" className={inp} placeholder="Fire Flex, Omaha…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label htmlFor="sbs-length" className="text-xs font-medium text-muted-foreground block mb-1">Length (in)</label><input id="sbs-length" type="number" className={inp} placeholder="34" value={form.length_in ?? ''} onChange={(e) => set('length_in', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="sbs-weight" className="text-xs font-medium text-muted-foreground block mb-1">Weight (oz)</label><input id="sbs-weight" type="number" className={inp} placeholder="26" value={form.weight_oz ?? ''} onChange={(e) => set('weight_oz', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="sbs-endload" className="text-xs font-medium text-muted-foreground block mb-1">End load (oz)</label><input id="sbs-endload" type="number" className={inp} placeholder="0.5–1.5" step="0.1" value={form.end_load_oz ?? ''} onChange={(e) => set('end_load_oz', numOrNull(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="sbs-balance" className="text-xs font-medium text-muted-foreground block mb-1">Balance</label>
                  <select id="sbs-balance" className={sel} value={form.balance} onChange={(e) => set('balance', e.target.value)}>
                    <option value="">Select…</option><option value="balanced">Balanced</option><option value="end_loaded">End-Loaded</option>
                  </select>
                </div>
                <div><label htmlFor="sbs-material" className="text-xs font-medium text-muted-foreground block mb-1">Material</label>
                  <select id="sbs-material" className={sel} value={form.material} onChange={(e) => set('material', e.target.value)}>
                    <option value="">Select…</option><option value="alloy">Alloy</option><option value="composite">Composite</option><option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="sbs-compression" className="text-xs font-medium text-muted-foreground block mb-1">Compression rating</label><input id="sbs-compression" type="number" className={inp} placeholder="220–275 PSI" value={form.compression_rating ?? ''} onChange={(e) => set('compression_rating', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="sbs-breakin" className="text-xs font-medium text-muted-foreground block mb-1">Break-in status</label>
                  <select id="sbs-breakin" className={sel} value={form.break_in_status} onChange={(e) => set('break_in_status', e.target.value)}>
                    <option value="">Select…</option><option value="new">New</option><option value="partially_broken_in">Partially broken in</option><option value="fully_broken_in">Fully broken in</option>
                  </select>
                </div>
              </div>
              <div><label htmlFor="sbs-certification" className="text-xs font-medium text-muted-foreground block mb-1">Certification stamps (USSSA, USA/ASA, ISA, NSA, SSUSA…)</label><input id="sbs-certification" className={inp} placeholder="USSSA, USA/ASA" value={form.certification_stamps} onChange={(e) => set('certification_stamps', e.target.value)} /></div>
              <div><label htmlFor="sbs-notes" className="text-xs font-medium text-muted-foreground block mb-1">Notes</label><textarea id="sbs-notes" className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Bat</Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
