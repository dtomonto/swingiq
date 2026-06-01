import Link from 'next/link';
import { Users } from 'lucide-react';

/**
 * Conservative youth-safety language. Use on parent/youth/team
 * pages and anywhere a minor might upload a video.
 */
export function YouthSafetyNotice({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 ${className}`}
      role="note"
    >
      <Users size={18} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
      <div className="text-sm text-blue-900">
        <p className="font-semibold">For young athletes</p>
        <p className="mt-1 text-blue-800">
          SwingIQ is not directed at children under 13. Athletes under 18 should use SwingIQ with a
          parent or guardian, especially when uploading video. Youth data is never made public by
          default.{' '}
          <Link href="/parents" className="font-semibold underline">
            See our guidance for parents
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
