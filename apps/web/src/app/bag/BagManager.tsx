'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronRight, Target } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClubSchema, type ClubInput } from '@swingiq/core';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { cn, clubCategoryLabel } from '@/lib/utils';

// Sample clubs — replace with Supabase query
const SAMPLE_CLUBS = [
  { id: '1', club_name: 'Driver', club_category: 'driver', brand: 'TaylorMade', model: 'Stealth 2', loft: 10.5, shaft_flex: 'stiff', typical_carry: 235, confidence_score: 42, current_primary_miss: 'Push-fade' },
  { id: '2', club_name: '3-Wood', club_category: 'fairway_wood', brand: 'TaylorMade', model: 'Stealth 2', loft: 15, shaft_flex: 'stiff', typical_carry: 210, confidence_score: 65, current_primary_miss: null },
  { id: '3', club_name: '5-Iron', club_category: 'long_iron', brand: 'Callaway', model: 'Apex Pro', loft: 27, shaft_flex: 'stiff', typical_carry: 178, confidence_score: 71, current_primary_miss: null },
  { id: '4', club_name: '7-Iron', club_category: 'mid_iron', brand: 'Callaway', model: 'Apex Pro', loft: 34, shaft_flex: 'stiff', typical_carry: 160, confidence_score: 69, current_primary_miss: 'High ball flight' },
  { id: '5', club_name: '9-Iron', club_category: 'short_iron', brand: 'Callaway', model: 'Apex Pro', loft: 41, shaft_flex: 'stiff', typical_carry: 140, confidence_score: 74, current_primary_miss: null },
  { id: '6', club_name: 'PW', club_category: 'wedge', brand: 'Callaway', model: 'Apex Pro', loft: 45, shaft_flex: 'stiff', typical_carry: 128, confidence_score: 55, current_primary_miss: 'Inconsistent carry' },
  { id: '7', club_name: '52° GW', club_category: 'wedge', brand: 'Cleveland', model: 'RTX Full-Face', loft: 52, shaft_flex: 'stiff', typical_carry: 108, confidence_score: 68, current_primary_miss: null },
  { id: '8', club_name: '58° LW', club_category: 'wedge', brand: 'Cleveland', model: 'RTX Full-Face', loft: 58, shaft_flex: 'stiff', typical_carry: 78, confidence_score: 72, current_primary_miss: null },
];

type Club = (typeof SAMPLE_CLUBS)[0];

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';
const selectClass = `${inputClass} bg-white`;

function ClubCard({ club, onEdit, onDelete }: { club: Club; onEdit: () => void; onDelete: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="flex items-center gap-4">
        <ScoreRing score={club.confidence_score} size={52} strokeWidth={5} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-900">{club.club_name}</p>
            <Badge variant="default" className="text-xs">{clubCategoryLabel(club.club_category)}</Badge>
            {club.current_primary_miss && (
              <Badge variant="warning" className="text-xs">{club.current_primary_miss}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {club.brand} {club.model} · {club.loft}° · {club.shaft_flex} shaft
          </p>
          <p className="text-xs text-gray-600 mt-0.5">
            Typical carry: <span className="font-semibold">{club.typical_carry} yds</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`/sessions?club=${club.club_name}`}>
            <Button variant="ghost" size="sm" className="text-green-600">
              <Target size={14} />
              Analyze
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 size={14} />
          </Button>
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
  defaultValues,
}: {
  onClose: () => void;
  defaultValues?: Partial<ClubInput>;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClubInput>({
    resolver: zodResolver(ClubSchema),
    defaultValues: {
      sort_order: 0,
      ...defaultValues,
    },
  });

  const onSubmit = async (data: ClubInput) => {
    console.log('Club data:', data);
    await new Promise((r) => setTimeout(r, 500));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            {defaultValues ? 'Edit Club' : 'Add Club'}
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Club Name *</label>
              <input {...register('club_name')} className={inputClass} placeholder="7-Iron" />
              {errors.club_name && <p className="text-xs text-red-600 mt-0.5">{errors.club_name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Category *</label>
              <select {...register('club_category')} className={selectClass}>
                <option value="driver">Driver</option>
                <option value="fairway_wood">Fairway Wood</option>
                <option value="hybrid">Hybrid</option>
                <option value="long_iron">Long Iron (2–4)</option>
                <option value="mid_iron">Mid Iron (5–7)</option>
                <option value="short_iron">Short Iron (8–9)</option>
                <option value="wedge">Wedge</option>
                <option value="putter">Putter</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Brand</label>
              <input {...register('brand')} className={inputClass} placeholder="TaylorMade" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Model</label>
              <input {...register('model')} className={inputClass} placeholder="Stealth 2" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Loft (°)</label>
              <input {...register('loft', { valueAsNumber: true })} type="number" step="0.5" className={inputClass} placeholder="10.5" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Shaft Flex</label>
              <select {...register('shaft_flex')} className={selectClass}>
                <option value="">Unknown</option>
                <option value="ladies">Ladies</option>
                <option value="senior">Senior</option>
                <option value="regular">Regular</option>
                <option value="stiff">Stiff</option>
                <option value="x_stiff">X-Stiff</option>
                <option value="tour_x">Tour X</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Typical Carry (yds)</label>
              <input {...register('typical_carry', { valueAsNumber: true })} type="number" className={inputClass} placeholder="160" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Typical Total (yds)</label>
              <input {...register('typical_total', { valueAsNumber: true })} type="number" className={inputClass} placeholder="175" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Shaft</label>
              <input {...register('shaft')} className={inputClass} placeholder="Project X 6.0" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600">Grip</label>
              <input {...register('grip')} className={inputClass} placeholder="Golf Pride MCC" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">Save Club</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BagManager() {
  const [clubs, setClubs] = useState(SAMPLE_CLUBS);
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const handleDelete = (id: string) => {
    setClubs((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Golf Bag</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clubs.length} clubs · Sorted by typical distance. Click &ldquo;Analyze&rdquo; to see each club&rsquo;s swing profile.
          </p>
        </div>
        <Button onClick={() => { setEditingClub(null); setShowModal(true); }}>
          <Plus size={16} /> Add Club
        </Button>
      </div>

      {/* Bag overview stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">{clubs.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Clubs in Bag</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">
              {Math.round(clubs.reduce((s, c) => s + c.confidence_score, 0) / clubs.length)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Avg Confidence Score</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-red-600">
              {clubs.filter((c) => c.confidence_score < 55).length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Clubs Needing Work</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center py-4">
            <p className="text-2xl font-bold text-gray-900">
              {clubs.find((c) => c.club_category === 'driver')?.typical_carry ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Driver Carry (yds)</p>
          </CardBody>
        </Card>
      </div>

      {/* Club list */}
      <div className="space-y-3">
        {clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onEdit={() => { setEditingClub(club); setShowModal(true); }}
            onDelete={() => handleDelete(club.id)}
          />
        ))}
      </div>

      {clubs.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg mb-3">No clubs yet</p>
          <p className="text-gray-500 text-sm mb-4">Add your first club to start building your swing profile.</p>
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Your First Club
          </Button>
        </div>
      )}

      {showModal && (
        <ClubFormModal
          onClose={() => { setShowModal(false); setEditingClub(null); }}
          defaultValues={editingClub ?? undefined}
        />
      )}
    </div>
  );
}
