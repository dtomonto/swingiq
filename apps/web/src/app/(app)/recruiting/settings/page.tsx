'use client';

import { GuardianConsentPanel, PrivacyControls } from '@/components/recruiting';

export default function RecruitingSettingsPage() {
  return (
    <div className="space-y-5">
      <GuardianConsentPanel />
      <PrivacyControls />
    </div>
  );
}
