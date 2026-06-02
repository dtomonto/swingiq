import { buildMetadata } from '@/lib/seo/metadata';
import { EquipmentDiagnosticTool } from './EquipmentDiagnosticTool';

export const metadata = buildMetadata({
  title: 'Free Equipment Diagnostic (Clubs, Rackets, Bats)',
  description:
    'Spot possible equipment fit-risk flags for golf clubs, tennis rackets, and baseball/softball bats, plus the questions to validate with a fitter. Free.',
  path: '/tools/equipment-diagnostic',
  keywords: ['equipment fitting', 'club fit', 'racket fit', 'bat fit', 'equipment diagnostic'],
});

export default function Page() {
  return <EquipmentDiagnosticTool />;
}
