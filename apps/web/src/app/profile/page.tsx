import { AppShell } from '@/components/layout/AppShell';
import { ProfileForm } from './ProfileForm';

export const metadata = { title: 'Golfer Profile — SwingIQ' };

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Golfer Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your profile helps SwingIQ personalize every diagnosis, routine, and recommendation.
            Take 3 minutes to fill this out accurately.
          </p>
        </div>
        <ProfileForm />
      </div>
    </AppShell>
  );
}
