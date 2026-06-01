import { buildMetadata } from '@/lib/seo/metadata';
import { LineDriveGuideTool } from './LineDriveGuideTool';

export const metadata = buildMetadata({
  title: 'Slow-Pitch Softball Line-Drive Guide',
  description:
    'Stop hitting pop-ups and grounders in slow-pitch softball. Find your likely swing-path issue, a line-drive checkpoint, a tee drill, and a timing cue. Free.',
  path: '/tools/slow-pitch-line-drive-guide',
  keywords: ['slow pitch line drives', 'stop popping up softball', 'slow pitch softball hitting'],
});

export default function Page() {
  return <LineDriveGuideTool />;
}
