import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Share2, Printer } from 'lucide-react';

export const metadata = { title: 'Reports — SwingIQ' };

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            Generate and export reports to share with your coach, club fitter, or training partner.
          </p>
        </div>

        {/* Report types */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              title: 'Session Report',
              description: 'Full breakdown of a single practice session. Includes shot table, charts, diagnosis, and training plan.',
              icon: FileText,
              color: 'bg-blue-50 border-blue-200',
              iconColor: 'text-blue-600',
            },
            {
              title: 'Progress Report',
              description: 'Shows how your scores and key metrics have changed over 30, 60, or 90 days.',
              icon: FileText,
              color: 'bg-green-50 border-green-200',
              iconColor: 'text-green-600',
            },
            {
              title: 'Club Profile Report',
              description: 'Deep analysis of a single club — carry stats, dispersion, miss patterns, and drill recommendations.',
              icon: FileText,
              color: 'bg-purple-50 border-purple-200',
              iconColor: 'text-purple-600',
            },
            {
              title: 'Coach Summary Report',
              description: 'Designed to share with a coach or club fitter. Includes Player DNA, session comparison, and training prescription.',
              icon: FileText,
              color: 'bg-orange-50 border-orange-200',
              iconColor: 'text-orange-600',
            },
          ].map((report) => (
            <Card key={report.title} className={`border-2 ${report.color}`}>
              <CardBody className="space-y-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                  <report.icon size={22} className={report.iconColor} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{report.description}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline">
                    <Download size={14} /> PDF
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 size={14} /> Share Link
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Printer size={14} /> Print
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Recent reports */}
        <Card>
          <CardHeader><CardTitle>Recent Reports</CardTitle></CardHeader>
          <CardBody>
            <div className="space-y-2">
              {[
                { name: 'Driver Session Report — May 25', type: 'Session', date: 'Today' },
                { name: '30-Day Progress Report', type: 'Progress', date: 'May 20' },
                { name: '7-Iron Profile Report', type: 'Club Profile', date: 'May 15' },
              ].map((r) => (
                <div key={r.name} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.type} · {r.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost"><Download size={14} /></Button>
                    <Button size="sm" variant="ghost"><Share2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
