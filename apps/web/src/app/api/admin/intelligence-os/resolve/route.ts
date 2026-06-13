// POST /api/admin/intelligence-os/resolve
// Routes a request through the first-party intelligence stack. When a provider
// is configured the gateway adapter handles the third-party fallback; otherwise
// the decision flags needsThirdParty so the caller renders an honest placeholder.
import { NextResponse } from 'next/server';
import { resolveWithFirstPartyIntelligence, type IntelligenceRequestInput } from '@/lib/intelligence-os/router';
import { gatewayCallThirdParty } from '@/lib/intelligence-os/provider-adapter';
import { SOURCE_SYSTEMS, SPORTS } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body extends Partial<IntelligenceRequestInput> {
  useProvider?: boolean;
  system?: string;
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;

  const body = await readJson<Body>(req);
  if (!body.request || typeof body.request !== 'string') {
    return NextResponse.json({ error: 'request-required' }, { status: 400 });
  }
  const sourceSystem = SOURCE_SYSTEMS.includes(body.sourceSystem as never) ? body.sourceSystem! : 'manual-admin-entry';
  const sport = SPORTS.includes(body.sport as never) ? body.sport! : 'none';

  const input: IntelligenceRequestInput = {
    sourceSystem,
    feature: body.feature || 'admin-console',
    sport,
    audience: body.audience,
    request: body.request,
    answerFormat: body.answerFormat,
    userIdHash: body.userIdHash ?? null,
  };

  const decision = await resolveWithFirstPartyIntelligence(
    input,
    body.useProvider
      ? { callThirdParty: gatewayCallThirdParty({ spendLabel: `io-${input.feature}`, system: body.system || 'You are a helpful SwingVantage assistant.' }) }
      : {},
  );
  return NextResponse.json({ ok: true, decision });
}
