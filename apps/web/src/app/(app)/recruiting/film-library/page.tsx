'use client';

import { useRecruitingStore } from '@/lib/recruiting';
import { FilmLibrary } from '@/components/recruiting';

export default function FilmLibraryPage() {
  const sport = useRecruitingStore((s) => s.profile?.primarySport ?? 'golf');
  return <FilmLibrary sport={sport} />;
}
