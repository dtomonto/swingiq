import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-wrap justify-between items-center gap-4 text-xs">
        <span>&copy; {new Date().getFullYear()} SwingIQ. All rights reserved.</span>
        <nav className="flex gap-4 flex-wrap">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link href="/parents" className="hover:text-white transition-colors">Parents</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/updates" className="hover:text-white text-green-400 transition-colors">Updates</Link>
        </nav>
      </div>
    </footer>
  );
}
