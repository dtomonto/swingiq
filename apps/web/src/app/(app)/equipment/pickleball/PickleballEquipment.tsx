'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore, type PicklePaddle } from '@/store';
import { scorePicklePaddle } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const sel = `${inp} bg-card`;

const EMPTY: Omit<PicklePaddle, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', shape: '', core_thickness_mm: null, weight_oz: null,
  face_material: '', grip_size: '', handle_length_in: null, condition: 'good', notes: '',
};

export function PickleballEquipment() {
  const { sportEquipment, addPicklePaddle, removePicklePaddle } = useSwingVantageStore();
  const paddles = sportEquipment.pickleball;

  const [form, setForm] = useState<Omit<PicklePaddle, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string | number | null) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function numOrNull(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n; }

  function handleAdd() {
    if (!form.brand.trim() && !form.model.trim()) return;
    addPicklePaddle(form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/equipment" className="text-sm text-warning hover:underline inline-flex items-center gap-1 mb-2">
          ← Equipment Center
        </Link>
        <h1 className="text-2xl font-bold text-foreground">🏓 Pickleball Paddle</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Log your paddle specs to add equipment context to your stroke analysis.
        </p>
      </div>

      <div className="flex gap-3 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-4">
        <Info className="text-accent-secondary mt-0.5 shrink-0" size={18} />
        <p className="text-sm text-foreground">
          <strong>Optional.</strong> Partial specs are fine — SwingVantage notes what is missing and lowers confidence accordingly. You can skip this entirely.
        </p>
      </div>

      {paddles.map((paddle) => {
        const score = scorePicklePaddle({
          shape: paddle.shape,
          coreThicknessMm: paddle.core_thickness_mm,
          weightOz: paddle.weight_oz,
          faceMaterial: paddle.face_material,
          gripSize: paddle.grip_size,
          skillLevel: 'intermediate',
          playStyle: 'all_court',
        });
        const expanded = expandedId === paddle.id;
        return (
          <Card key={paddle.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{paddle.brand} {paddle.model} {paddle.year}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {paddle.weight_oz && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{paddle.weight_oz} oz</span>}
                    {paddle.core_thickness_mm && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{paddle.core_thickness_mm}mm core</span>}
                    {paddle.shape && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{paddle.shape}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      score.fitRating === 'Excellent' ? 'bg-primary/15 text-primary' :
                      score.fitRating === 'Good' ? 'bg-accent-secondary/15 text-accent-secondary' :
                      score.fitRating === 'Fair' ? 'bg-warning/15 text-warning' :
                      score.fitRating === 'Mismatch' ? 'bg-error/15 text-error' :
                      'bg-muted text-muted-foreground'
                    }`}>{score.fitRating} • {score.overallScore}/100</span>
                  </div>
                </div>
                <button onClick={() => setExpandedId(expanded ? null : paddle.id)} className="p-1 text-muted-foreground hover:text-muted-foreground">
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

                  {confirmDelete === paddle.id ? (
                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                      <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { removePicklePaddle(paddle.id); setConfirmDelete(null); }}>
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(paddle.id)} className="flex items-center gap-1 text-xs text-error hover:text-error">
                      <Trash2 size={12} /> Remove this paddle
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
          <Plus size={16} /> Add Paddle
        </Button>
      ) : (
        <Card>
          <CardHeader><CardTitle>Add Paddle</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pb-brand" className="text-xs font-medium text-muted-foreground block mb-1">Brand</label><input id="pb-brand" className={inp} placeholder="Selkirk, JOOLA…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
              <div><label htmlFor="pb-model" className="text-xs font-medium text-muted-foreground block mb-1">Model</label><input id="pb-model" className={inp} placeholder="Vanguard, Perseus…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pb-shape" className="text-xs font-medium text-muted-foreground block mb-1">Shape</label>
                <select id="pb-shape" className={sel} value={form.shape} onChange={(e) => set('shape', e.target.value as PicklePaddle['shape'])}>
                  <option value="">Not sure</option><option value="standard">Standard</option><option value="elongated">Elongated</option><option value="widebody">Widebody</option>
                </select>
              </div>
              <div><label htmlFor="pb-weight" className="text-xs font-medium text-muted-foreground block mb-1">Weight (oz)</label><input id="pb-weight" type="number" step="0.1" className={inp} placeholder="7.3–8.4" value={form.weight_oz ?? ''} onChange={(e) => set('weight_oz', numOrNull(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pb-core" className="text-xs font-medium text-muted-foreground block mb-1">Core thickness (mm)</label><input id="pb-core" type="number" className={inp} placeholder="13–16" value={form.core_thickness_mm ?? ''} onChange={(e) => set('core_thickness_mm', numOrNull(e.target.value))} /></div>
              <div><label htmlFor="pb-face" className="text-xs font-medium text-muted-foreground block mb-1">Face material</label>
                <select id="pb-face" className={sel} value={form.face_material} onChange={(e) => set('face_material', e.target.value as PicklePaddle['face_material'])}>
                  <option value="">Not sure</option><option value="carbon_fiber">Carbon fiber</option><option value="graphite">Graphite</option><option value="fiberglass">Fiberglass</option><option value="composite">Composite</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="pb-grip" className="text-xs font-medium text-muted-foreground block mb-1">Grip size</label><input id="pb-grip" className={inp} placeholder="4 1/4, 4 3/8…" value={form.grip_size} onChange={(e) => set('grip_size', e.target.value)} /></div>
              <div><label htmlFor="pb-handle" className="text-xs font-medium text-muted-foreground block mb-1">Handle length (in)</label><input id="pb-handle" type="number" step="0.1" className={inp} placeholder="4.5–5.5" value={form.handle_length_in ?? ''} onChange={(e) => set('handle_length_in', numOrNull(e.target.value))} /></div>
            </div>
            <div><label htmlFor="pb-condition" className="text-xs font-medium text-muted-foreground block mb-1">Condition</label>
              <select id="pb-condition" className={sel} value={form.condition} onChange={(e) => set('condition', e.target.value as PicklePaddle['condition'])}>
                <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="worn">Worn</option>
              </select>
            </div>
            <div><label htmlFor="pb-notes" className="text-xs font-medium text-muted-foreground block mb-1">Notes <span className="text-muted-foreground">(optional)</span></label><textarea id="pb-notes" className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Paddle</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {paddles.length === 0 && !showForm && (
        <div className="flex gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-xl p-4">
          <AlertTriangle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
          No paddle logged. Equipment context is optional — you can still use all SwingVantage features without it.
        </div>
      )}
    </div>
  );
}
