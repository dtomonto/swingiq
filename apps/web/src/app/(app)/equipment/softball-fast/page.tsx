'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore, type SoftballBat } from '@/store';
import { scoreBat } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const sel = `${inp} bg-card`;

const EMPTY: Omit<SoftballBat, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', length_in: null, weight_oz: null, end_load_oz: null,
  balance: '', barrel_length_in: null, compression_rating: null,
  material: '', certification_stamps: '', break_in_status: '', condition: 'good', notes: '',
};

export default function FastPitchEquipmentPage() {
  const { sportEquipment, addSoftballBat, removeSoftballBat } = useSwingIQStore();
  const bats = sportEquipment.softball_fast;

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
    addSoftballBat('softball_fast', form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/equipment" className="text-sm text-accent-secondary hover:underline inline-flex items-center gap-1 mb-2">
            ← Equipment Center
          </Link>
          <h1 className="text-2xl font-bold text-foreground">🥎 Fast Pitch Softball Bat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log your bat. Fast pitch analysis emphasizes drop weight, compact swing fit, and timing pressure.
          </p>
        </div>

        <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
          <Info className="text-accent-secondary mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-foreground">
            <strong>Optional.</strong> Fast pitch analysis focuses on bat speed and compact swing fit. A bat that is too heavy or too long is the most common equipment issue flagged in fast pitch.
          </p>
        </div>

        {bats.map((bat) => {
          const score = scoreBat({
            lengthIn: bat.length_in, weightOz: bat.weight_oz,
            drop: bat.weight_oz && bat.length_in ? -(bat.length_in - bat.weight_oz) : null,
            balance: bat.balance as 'balanced' | 'end_loaded' | '',
            playerHeightIn: null, playerWeightLbs: null,
            skillLevel: 'intermediate', sport: 'softball_fast',
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
                      {bat.certification_stamps && <span className="text-xs bg-accent-secondary/15 text-accent-secondary px-2 py-0.5 rounded-full">{bat.certification_stamps}</span>}
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
                        <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { removeSoftballBat('softball_fast', bat.id); setConfirmDelete(null); }}>Delete</Button>
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
            <CardHeader><CardTitle>Add Fast Pitch Bat</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="sbf-brand" className="text-xs font-medium text-muted-foreground block mb-1">Brand</label><input id="sbf-brand" className={inp} placeholder="DeMarini, Easton…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
                <div><label htmlFor="sbf-model" className="text-xs font-medium text-muted-foreground block mb-1">Model</label><input id="sbf-model" className={inp} placeholder="CF, Ghost…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label htmlFor="sbf-length" className="text-xs font-medium text-muted-foreground block mb-1">Length (in)</label><input id="sbf-length" type="number" className={inp} placeholder="32" value={form.length_in ?? ''} onChange={(e) => set('length_in', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="sbf-weight" className="text-xs font-medium text-muted-foreground block mb-1">Weight (oz)</label><input id="sbf-weight" type="number" className={inp} placeholder="22" value={form.weight_oz ?? ''} onChange={(e) => set('weight_oz', numOrNull(e.target.value))} /></div>
                <div><label htmlFor="sbf-drop" className="text-xs font-medium text-muted-foreground block mb-1">Drop</label><input id="sbf-drop" type="number" className={inp} placeholder="-12" value={form.end_load_oz ?? ''} onChange={(e) => set('end_load_oz', numOrNull(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label htmlFor="sbf-material" className="text-xs font-medium text-muted-foreground block mb-1">Material</label>
                  <select id="sbf-material" className={sel} value={form.material} onChange={(e) => set('material', e.target.value)}>
                    <option value="">Select…</option><option value="alloy">Alloy</option><option value="composite">Composite</option><option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div><label htmlFor="sbf-balance" className="text-xs font-medium text-muted-foreground block mb-1">Balance</label>
                  <select id="sbf-balance" className={sel} value={form.balance} onChange={(e) => set('balance', e.target.value)}>
                    <option value="">Select…</option><option value="balanced">Balanced</option><option value="end_loaded">End-Loaded</option>
                  </select>
                </div>
              </div>
              <div><label htmlFor="sbf-certification" className="text-xs font-medium text-muted-foreground block mb-1">Certification stamps</label><input id="sbf-certification" className={inp} placeholder="USA Softball, NFHS, NCAA…" value={form.certification_stamps} onChange={(e) => set('certification_stamps', e.target.value)} /></div>
              <div><label htmlFor="sbf-notes" className="text-xs font-medium text-muted-foreground block mb-1">Notes</label><textarea id="sbf-notes" className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Bat</Button>
              </div>
            </CardBody>
          </Card>
        )}

        {bats.length === 0 && !showForm && (
          <div className="flex gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-xl p-4">
            <AlertTriangle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
            No bat logged. Optional — all SwingIQ features work without equipment setup.
          </div>
        )}
      </div>
    </>
  );
}
