import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { SampleReportTemplate } from '@/components/report/SampleReportTemplate';
import { getSampleReport } from '@/content/sampleReports';

const report = getSampleReport('pickleball')!;

export const metadata = buildMetadata({
  title: report.metaTitle,
  description: report.metaDescription,
  path: '/sample-report/pickleball',
  ogType: 'article',
});

export default function Page() {
  return (
    <main className="min-h-screen bg-muted print:bg-card">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="print:hidden">
          <Breadcrumbs
            items={[
              { name: 'Home', path: '/' },
              { name: 'Sample Reports', path: '/sample-report' },
              { name: report.sportLabel, path: '/sample-report/pickleball' },
            ]}
            className="mb-5"
          />
          <h1 className="text-3xl font-bold text-foreground">{report.title}</h1>
          <p className="mt-2 text-muted-foreground">{report.intro}</p>
        </div>
        <div className="mt-6">
          <SampleReportTemplate report={report} />
        </div>
      </div>
    </main>
  );
}
