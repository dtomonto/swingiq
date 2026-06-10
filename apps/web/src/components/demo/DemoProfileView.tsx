// Sample athlete profile for /demo — a filled-in, read-only showcase of the
// profile a registered athlete builds (drives every analysis + recommendation).

import Link from 'next/link';
import { User, Target, Crosshair, ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import type { DemoReport } from '@/lib/demo/demoReport';

export function DemoProfileView({ report }: { report: DemoReport }) {
  const { sport, profile } = report;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{sport.emoji}</span>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.level}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={18} className="text-primary" />
              <CardTitle>Goals</CardTitle>
            </div>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-link">Primary goal</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.goal}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Crosshair size={12} /> Current miss
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{profile.miss}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User size={18} className="text-muted-foreground" />
              <CardTitle>Athlete Details</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {profile.fields.map((f) => (
                <div key={f.label}>
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-semibold text-foreground">{f.value}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card className="bg-primary/5">
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Your profile personalizes every analysis, routine, and benchmark — so coaching fits
            <span className="text-foreground"> your </span> level and goals.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/demo/${sport.slug}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/60"
            >
              See the report <ChevronRight size={14} />
            </Link>
            <Link
              href="/start"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90"
            >
              Build mine <ArrowRight size={14} />
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
