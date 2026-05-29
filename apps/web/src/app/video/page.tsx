import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody } from '@/components/ui/Card';
import { Video, Upload, Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = { title: 'Video Analysis — SwingIQ' };

export default function VideoPage() {
  return (
    <AppShell>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Analysis</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload swing videos to compare with your launch-monitor data.
          </p>
        </div>

        {/* Coming soon notice */}
        <Card className="border-2 border-blue-100 bg-blue-50">
          <CardBody className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Info size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Video Analysis — Coming in MVP 3</h3>
              <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                This feature will let you upload face-on and down-the-line swing videos
                and automatically sync them with your launch-monitor session data.
                The system will annotate key swing positions (address, backswing, transition,
                impact, follow-through) and highlight areas that match your data diagnosis.
              </p>
            </div>
          </CardBody>
        </Card>

        {/* What's planned */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">What Video Analysis Will Include</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Upload,
                title: 'Upload Your Swing',
                description: 'Upload MP4 or MOV files from your phone, GoPro, or any camera. Face-on and down-the-line angles supported.',
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                icon: Play,
                title: 'Frame-by-Frame Playback',
                description: 'Step through your swing one frame at a time with slow-motion controls. Compare across multiple sessions.',
                color: 'text-purple-600',
                bg: 'bg-purple-50',
              },
              {
                icon: Video,
                title: 'Data Overlay',
                description: 'See your launch-monitor numbers (face angle, club path, attack angle) displayed alongside the matching video frame.',
                color: 'text-orange-600',
                bg: 'bg-orange-50',
              },
              {
                icon: Info,
                title: 'Swing Phase Grading',
                description: 'Address, backswing, transition, impact zone, and follow-through each get a score correlated with your data.',
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
            ].map((item) => (
              <Card key={item.title} className="border border-gray-200">
                <CardBody className="flex gap-3">
                  <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                    <item.icon size={18} className={item.color} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Placeholder upload zone */}
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardBody className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <Video size={28} className="text-gray-400" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">Video upload not yet available</p>
              <p className="text-sm text-gray-400 mt-1">
                This feature is planned for MVP 3. Check back after your data analysis is set up.
              </p>
            </div>
            <Button variant="outline" disabled>
              <Upload size={16} />
              Upload Video (Coming Soon)
            </Button>
          </CardBody>
        </Card>

        {/* Tip */}
        <p className="text-xs text-gray-400 text-center">
          In the meantime, use the <strong>Diagnose</strong> page for data-only swing analysis,
          and <strong>YouTube Drills</strong> in your training routine for visual instruction.
        </p>
      </div>
    </AppShell>
  );
}
