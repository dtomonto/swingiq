import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { ShareableReportCard, type ReportData } from '@/components/report/ShareableReportCard';

export const metadata = buildMetadata({
  title: 'Sample Swing Report',
  description:
    'See exactly what a SwingIQ report looks like: your top priority issue, three drills, and a practice plan — shareable and print-friendly.',
  path: '/report/sample',
});

const SAMPLE: ReportData = {
  sport: 'Golf',
  topIssue: 'Out-to-in club path producing a slice',
  confidence: 'Illustrative example (not your data)',
  drills: ['Headcover gate drill (path)', 'Split-hand release drill (face)', 'Transition drop rehearsal (sequence)'],
  planSummary: '7 days: slow path work → add release → build speed → retest on day 7.',
};

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-muted print:bg-card">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="print:hidden">
          <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Sample Report', path: '/report/sample' }]} className="mb-5" />
          <h1 className="text-3xl font-bold text-foreground">Sample Swing Report</h1>
          <p className="mt-2 text-muted-foreground">
            This is an example using sample data so you can see what you&apos;ll get. Your real report is built from your own swing.
          </p>
        </div>

        <div className="mt-6">
          <ShareableReportCard data={SAMPLE} />
        </div>

        <div className="mt-6 text-center print:hidden">
          <Link href="/start" className="inline-block rounded-xl bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary">
            Get My Real Report Free
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">No account required · Private by default</p>
        </div>
      </div>
    </main>
  );
}
