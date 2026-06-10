import { buildMetadata } from '@/lib/seo/metadata';
import { AudienceLanding, type AudienceConfig } from '@/components/landing/AudienceLanding';
import { PERSONA_CTA_MAP } from '@/lib/personas/cta-map';

export const metadata = buildMetadata({
  title: 'Partner with SwingVantage — Facilities & Ranges',
  description:
    'Facilities, ranges, and academies can use SwingVantage as a free lead magnet and a between-session support tool for members. Partner with SwingVantage.',
  path: '/partners',
  keywords: ['golf facility tool', 'driving range partner', 'academy swing analysis'],
});

const config: AudienceConfig = {
  slug: 'partners',
  name: 'Partners',
  leadSource: 'team',
  headline: 'Use SwingVantage as a lead magnet and member benefit',
  positioning:
    'Facilities, ranges, and academies can offer SwingVantage as a free between-session support tool — a helpful member benefit and a natural lead magnet for lessons and memberships.',
  benefits: [
    { title: 'Lead magnet', desc: 'Offer a free swing analysis to capture interest and drive lesson bookings.' },
    { title: 'Member value', desc: 'Give members a tool to keep improving between visits.' },
    { title: 'Zero setup', desc: 'Web-based — just share a link. Nothing to install or maintain.' },
  ],
  how: [
    'Share SwingVantage with your members as a free benefit.',
    'Members run analyses and bring priorities to lessons at your facility.',
    'You convert engaged members into lessons and memberships.',
  ],
  ctaLabel: PERSONA_CTA_MAP.partners.ctaLabel,
  captureHeading: 'Partner with SwingVantage',
  captureSub: 'Tell us about your facility and we’ll explore a partnership.',
};

export default function Page() {
  return <AudienceLanding config={config} />;
}
