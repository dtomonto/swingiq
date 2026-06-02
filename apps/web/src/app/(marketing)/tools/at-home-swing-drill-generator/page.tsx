import { buildMetadata } from '@/lib/seo/metadata';
import { AtHomeDrillTool } from './AtHomeDrillTool';

export const metadata = buildMetadata({
  title: 'Free At-Home Swing Drill Generator',
  description:
    'Generate a safe at-home practice session tailored to your sport, space, equipment, and time — warm-up, three drills, structure, and progression. Free.',
  path: '/tools/at-home-swing-drill-generator',
  keywords: ['at home swing drills', 'home practice', 'indoor swing drills', 'swing drill generator'],
});

export default function Page() {
  return <AtHomeDrillTool />;
}
