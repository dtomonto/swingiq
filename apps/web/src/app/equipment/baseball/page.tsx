'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore, type BaseballBat } from '@/store';
import { scoreBat } from '@/lib/equipment/scoring';
import Link from 'next/link';
import { Plus, Trash2, ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-hidden';
const sel = `${inp} bg-white`;

const EMPTY: Omit<BaseballBat, 'id' | 'created_at'> = {
  brand: '', model: '', year: '', length_in: null, weight_oz: null, drop: null,
  barrel_diameter_in: null, material: '', piece_construction: '',
  balance: '', certification: '', composite_broken_in: null,
  condition: 'good', notes: '',
};

export default function BaseballEquipmentPage() {
  const { sportEquipment, addBaseballBat, removeBaseballBat } = useSwingIQStore();
  const bats = sportEquipment.baseball;

  const [form, setForm] = useState<Omit<BaseballBat, 'id' | 'created_at'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string | number | null | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function numOrNull(v: string) { const n = parseFloat(v); return isNaN(n) ? null : n; }

  function handleAdd() {
    if (!form.brand.trim() && !form.model.trim()) return;
    addBaseballBat(form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/equipment" className="text-sm text-red-700 hover:underline inline-flex items-center gap-1 mb-2">
            ← Equipment Center
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">⚾ Baseball Bat</h1>
          <p className="text-gray-500 text-sm mt-1">
            Log your bat specs to add equipment context to your hitting diagnosis.
          </p>
        </div>

        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-blue-800">
            <strong>Optional.</strong> You can skip this and still use all SwingIQ features. Missing specs lower confidence scores — they don&apos;t block anything.
          </p>
        </div>

        {bats.map((bat) => {
          const score = scoreBat({
            lengthIn: bat.length_in, weightOz: bat.weight_oz, drop: bat.drop,
            balance: bat.balance, playerHeightIn: null, playerWeightLbs: null,
            skillLevel: 'intermediate', sport: 'baseball',
          });
          const expanded = expandedId === bat.id;
          return (
            <Card key={bat.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{bat.brand} {bat.model} {bat.year}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {bat.length_in && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bat.length_in}&quot;</span>}
                      {bat.weight_oz && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bat.weight_oz} oz</span>}
                      {bat.drop && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Drop {bat.drop}</span>}
                      {bat.certification && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bat.certification}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        score.fitRating === 'Excellent' ? 'bg-green-100 text-green-700' :
                        score.fitRating === 'Good' ? 'bg-blue-100 text-blue-700' :
                        score.fitRating === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                        score.fitRating === 'Mismatch' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{score.fitRating} • {score.overallScore}/100</span>
                    </div>
                  </div>
                  <button onClick={() => setExpandedId(expanded ? null : bat.id)} className="p-1 text-gray-400 hover:text-gray-600">
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {expanded && (
                  <div className="space-y-3 pt-2 border-t border-gray-100 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Confidence: {Math.round(score.confidenceScore * 100)}%</p>
                      {score.evidence.map((e, i) => <p key={i} className="text-gray-600 text-xs">• {e}</p>)}
                    </div>
                    {score.missingData.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Missing data</p>
                        {score.missingData.map((m, i) => <p key={i} className="text-xs text-amber-700">• {m}</p>)}
                      </div>
                    )}
                    {score.recommendations.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-1">Recommendations</p>
                        {score.recommendations.map((r, i) => <p key={i} className="text-xs text-gray-600">• {r}</p>)}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 italic">{score.limitations[0]}</p>
                    {confirmDelete === bat.id ? (
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { removeBaseballBat(bat.id); setConfirmDelete(null); }}>Delete</Button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(bat.id)} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800">
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
            <CardHeader><CardTitle>Add Baseball Bat</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Brand</label><input className={inp} placeholder="Louisville, Marucci…" value={form.brand} onChange={(e) => set('brand', e.target.value)} /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Model</label><input className={inp} placeholder="Cat9, Omaha…" value={form.model} onChange={(e) => set('model', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Length (in)</label><input type="number" className={inp} placeholder="32" value={form.length_in ?? ''} onChange={(e) => set('length_in', numOrNull(e.target.value))} /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Weight (oz)</label><input type="number" className={inp} placeholder="29" value={form.weight_oz ?? ''} onChange={(e) => set('weight_oz', numOrNull(e.target.value))} /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Drop</label><input type="number" className={inp} placeholder="-3" value={form.drop ?? ''} onChange={(e) => set('drop', numOrNull(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Material</label>
                  <select className={sel} value={form.material} onChange={(e) => set('material', e.target.value)}>
                    <option value="">Select…</option><option value="wood">Wood</option><option value="alloy">Alloy</option><option value="composite">Composite</option><option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Balance</label>
                  <select className={sel} value={form.balance} onChange={(e) => set('balance', e.target.value)}>
                    <option value="">Select…</option><option value="balanced">Balanced</option><option value="end_loaded">End-Loaded</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Certification</label><input className={inp} placeholder="BBCOR, USSSA, USA…" value={form.certification} onChange={(e) => set('certification', e.target.value)} /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1">Condition</label>
                  <select className={sel} value={form.condition} onChange={(e) => set('condition', e.target.value as BaseballBat['condition'])}>
                    <option value="new">New</option><option value="good">Good</option><option value="fair">Fair</option><option value="worn">Worn</option>
                  </select>
                </div>
              </div>
              {form.material === 'composite' && (
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="bi" checked={form.composite_broken_in === true} onChange={(e) => set('composite_broken_in', e.target.checked)} className="w-4 h-4 rounded-sm text-red-600" />
                  <label htmlFor="bi" className="text-sm text-gray-700">Composite is broken in</label>
                </div>
              )}
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label><textarea className={inp} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setForm(EMPTY); setShowForm(false); }}>Cancel</Button>
                <Button className="flex-1" onClick={handleAdd} disabled={!form.brand.trim() && !form.model.trim()}>Save Bat</Button>
              </div>
            </CardBody>
          </Card>
        )}

        {bats.length === 0 && !showForm && (
          <div className="flex gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <AlertTriangle size={16} className="text-gray-400 mt-0.5 shrink-0" />
            No bat logged. This is optional — you can still use all SwingIQ features without it.
          </div>
        )}
      </div>
    </AppShell>
  );
}
