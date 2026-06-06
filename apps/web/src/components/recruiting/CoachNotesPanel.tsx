'use client';

// ============================================================
// Recruiting — CoachNotesPanel
// ------------------------------------------------------------
// Third-party credibility: notes from coaches/trainers. A "verified"
// flag marks notes the coach themselves confirmed; visibility controls
// whether a note appears on shared links.
// ============================================================

import { useState } from 'react';
import { MessageSquareQuote, Trash2, Plus } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRecruitingStore, type Visibility } from '@/lib/recruiting';

const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function CoachNotesPanel() {
  const notes = useRecruitingStore((s) => s.coachNotes);
  const addNote = useRecruitingStore((s) => s.addCoachNote);
  const removeNote = useRecruitingStore((s) => s.removeCoachNote);

  const [open, setOpen] = useState(false);
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [body, setBody] = useState('');
  const [verified, setVerified] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('link_only');

  function submit() {
    if (!author.trim() || !body.trim()) return;
    addNote({ authorName: author.trim(), authorRole: role.trim() || undefined, body: body.trim(), verified, visibility });
    setAuthor(''); setRole(''); setBody(''); setVerified(false); setOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MessageSquareQuote size={17} className="text-primary" /> Coach / trainer notes</CardTitle>
        <Button size="sm" onClick={() => setOpen((o) => !o)}><Plus size={15} /> Add note</Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {open && (
          <div className="rounded-lg border border-border p-3 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-medium text-foreground">Author</span><input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Coach name" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Role</span><input className={inputCls} value={role} onChange={(e) => setRole(e.target.value)} placeholder="HS Head Coach" /></label>
            <label className="block sm:col-span-2"><span className="text-sm font-medium text-foreground">Note</span><textarea rows={2} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Most coachable player I've had…" /></label>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Coach confirmed this note (verified)</label>
            <label className="block"><span className="text-sm font-medium text-foreground">Visibility</span>
              <select className={inputCls} value={visibility} onChange={(e) => setVisibility(e.target.value as Visibility)}>
                <option value="private">Private</option><option value="link_only">On links</option><option value="public">Public</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex gap-2"><Button onClick={submit} disabled={!author.trim() || !body.trim()}>Save note</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
          </div>
        )}

        {notes.length === 0 ? (
          <EmptyState icon={MessageSquareQuote} compact title="No notes yet" description="A coach or trainer note adds third-party credibility coaches trust." />
        ) : (
          notes.map((n) => (
            <div key={n.id} className="rounded-lg border-l-4 border-primary bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-foreground/90 italic">“{n.body}”</p>
                <button onClick={() => removeNote(n.id)} className="text-error/80 hover:text-error p-1 rounded-md hover:bg-error/10 shrink-0" aria-label="Remove note"><Trash2 size={14} /></button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="text-xs text-muted-foreground">— {n.authorName}{n.authorRole ? `, ${n.authorRole}` : ''}</span>
                {n.verified && <Badge variant="success">Verified</Badge>}
                <Badge variant="default">{n.visibility === 'link_only' ? 'On links' : n.visibility}</Badge>
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
