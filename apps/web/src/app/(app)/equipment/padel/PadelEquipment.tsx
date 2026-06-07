'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore, type PadelRacket } from '@/store';
import { scorePadelRacket } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const sel = `${inp} bg-card`;

const EMPTY: Omit<PadelRacket, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', shape: '', weight_g: null, balance: '',
  core_foam: '', face_material: '', grip_size: '', condition: 'good', notes: '',
};

export function PadelEquipment() {
  const { sportEquipment, addPadelRacket, removePadelRacket } = useSwingVantageStore();
  const rackets = sportEquipment.padel;

  const [form, setForm] = useState<Omit<PadelRacket, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string | number | null) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function numOrNull(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n; }

  function handleAdd() {
    if (!form.brand.trim() && !form.model.trim()) return;
    addPadelRacket(form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/equipment" className="text-sm text-warning hover:underline inline-flex items-center gap-1 mb-2">
          ← Equipment Center
        </Link>
        <h1 className="text-2xl font-bold text-foreground">🎾 Padel Racket</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Log your racket specs to add equipment context to your stroke analysis.
        </p>
      </div>

      <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
        <Info className="text-accent-secondary mt-0.5 shrink-0" size={18} />
        <p className="text-sm text-foreground">
          <strong>Optional.</strong> Partial specs are fine — SwingVantage notes what is missing and lowers confidence accordingly. You can skip this entirely.
        </p>
      </div>

      {rackets.map((racket) => {
        const score = scorePadelRacket({
          shape: racket.shape,
          weightG: racket.weight_g,
          balance: racket.balance,
          coreFoam: racket.core_foam,
          faceMaterial: racket.face_material,
          gripSize: racket.grip_size,
          skillLevel: 'intermediate',
        });
        const expanded = expandedId === racket.id;
        return (
          <Card key={racket.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{racket.brand} {racket.model} {racket.year}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {racket.shape && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{racket.shape}</span>}
                    {racket.weight_g && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{racket.weight_g} g</span>}
                    {racket.balance && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{racket.balance} balance</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      score.fitRating === 'Excellent' ? 'bg-primary/15 text-primary' :
                      score.fitRating === 'Good' ? 'bg-accent-secondary/15 text-accent-secondary' :
                      score.fitRating === 'Fair' ? 'bg-warning/15 text-warning' :
                      score.fitRating === 'Mismatch' ? 'bg-error/15 text-error' :
                      'bg-muted text-muted-foreground'
                    }`}>{score.fitRating} • {score.overallScore}/100</span>
                  </div>
                </div>
                <button onClick={() => setExpandedId(expanded ? null : racket.id)} className="p-1 text-muted-foreground hover:text-muted-foreground">
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
                      <p className="text-xs font-semibold text-warning mb-1">Missing data (would improve accuracy)</p>
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

                  {confirmDelete === racket.id ? (
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                      <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { removePadelRacket(racket.id); setConfirmDelete(null); }}>
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(racket.id)} className="flex items-center gap-1 text-xs text-error hover:text-error">
                      <Trash2 size={12} /> Remove this racket
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
          <Plus size={16} /> Add Racket
        </Button>
      ) : (
        <Card>
          <CardHeader><CardTitle>Add Racket</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pd-brand" className="text-xs font-medium text-muted-foreground block mb-1">Brand</label><input id="pd-brand" className={inp} placeholder="Bullpadel, Adidas…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
              <div><label htmlFor="pd-model" className="text-xs font-medium text-muted-foreground block mb-1">Model</label><input id="pd-model" className={inp} placeholder="Vertex, Metalbone…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pd-shape" className="text-xs font-medium text-muted-foreground block mb-1">Shape</label>
                <select id="pd-shape" className={sel} value={form.shape} onChange={(e) => set('shape', e.target.value as PadelRacket['shape'])}>
                  <option value="">Not sure</option><option value="round">Round (control)</option><option value="teardrop">Teardrop (all-court)</option><option value="diamond">Diamond (power)</option>
                </select>
              </div>
              <div><label htmlFor="pd-weight" className="text-xs font-medium text-muted-foreground block mb-1">Weight (g)</label><input id="pd-weight" type="number" className={inp} placeholder="350–375" value={form.weight_g ?? ''} onChange={(e) => set('weight_g', numOrNull(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pd-balance" className="text-xs font-medium text-muted-foreground block mb-1">Balance</label>
                <select id="pd-balance" className={sel} value={form.balance} onChange={(e) => set('balance', e.target.value as PadelRacket['balance'])}>
                  <option value="">Not sure</option><option value="low">Low (head-light)</option><option value="medium">Medium</option><option value="high">High (head-heavy)</option>
                </select>
              </div>
              <div><label htmlFor="pd-core" className="text-xs font-medium text-muted-foreground block mb-1">Core foam</label>
                <select id="pd-core" className={sel} value={form.core_foam} onChange={(e) => set('core_foam', e.target.value as PadelRacket['core_foam'])}>
                  <option value="">Not sure</option><option value="soft_eva">Soft EVA</option><option value="medium_eva">Medium EVA</option><option value="hard_eva">Hard EVA</option><option value="foam">Foam</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pd-face" className="text-xs font-medium text-muted-foreground block mb-1">Face material</label>
                <select id="pd-face" className={sel} value={form.face_material} onChange={(e) => set('face_material', e.target.value as PadelRacket['face_material'])}>
                  <option value="">Not sure</option><option value="carbon">Carbon</option><option value="fiberglass">Fiberglass</option><option value="composite">Composite</option>
                </select>
              </div>
              <div><label htmlFor="pd-grip" className="text-xs font-medium text-muted-foreground block mb-1">Grip size</label><input id="pd-grip" className={inp} placeholder="e.g. standard + overgrip" value={form.grip_size} onChange={(e) => set('grip_size', e.target.value)} /></div>
            </div>
            <div><label htmlFor="pd-condition" className="text-xs font-medium text-muted-foreground block mb-1">Condition</label>
              <select id="pd-condition" className={sel} value={form.condition} onChange={(e) => set('condition', e.target.value as PadelRacket['condition'])}>
                <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="worn">Worn</option>
              </select>
            </div>
            <div><label htmlFor="pd-notes" className="text-xs font-medium text-muted-foreground block mb-1">Notes <span className="text-muted-foreground">(optional)</span></label><textarea id="pd-notes" className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Racket</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {rackets.length === 0 && !showForm && (
        <div className="flex gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-xl p-4">
          <AlertTriangle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          No racket logged. Equipment context is optional — you can still use all SwingVantage features without it.
        </div>
      )}
    </div>
  );
}
