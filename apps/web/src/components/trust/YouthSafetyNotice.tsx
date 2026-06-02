import Link from 'next/link';
import { Users } from 'lucide-react';

/**
 * Conservative youth-safety language. Use on parent/youth/team
 * pages and anywhere a minor might upload a video.
 */
export function YouthSafetyNotice({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-accent-secondary/25 bg-accent-secondary/10 p-4 ${className}`}
      role="note"
    >
      <Users size={18} className="mt-0.5 shrink-0 text-accent-secondary" aria-hidden="true" />
      <div className="text-sm text-foreground">
        <p className="font-semibold">For young athletes</p>
        <p className="mt-1 text-muted-foreground">
          SwingIQ is a general-audience improvement tool, and young athletes are welcome with a parent
          or guardian involved — anyone under 13 should use SwingIQ through a parent or guardian. Please
          only upload a young athlete&apos;s video if you are their parent or guardian, or have
          permission. Youth data is never made public by default.{' '}
          <Link href="/parents" className="font-semibold underline">
            See our guidance for parents
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
