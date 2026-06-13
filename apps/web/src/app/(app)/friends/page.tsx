'use client';

import { Users } from 'lucide-react';
import { FriendsView } from '@/components/friends/FriendsView';
import { MyHandleCard } from '@/components/friends/MyHandleCard';

export default function FriendsPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Users className="text-foreground" size={22} aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Friends</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect with other athletes by their handle. Friends can see your player card based on
          your privacy settings — and, if you allow it, upload swings for you.
        </p>
      </div>
      <MyHandleCard />
      <FriendsView />
    </div>
  );
}
