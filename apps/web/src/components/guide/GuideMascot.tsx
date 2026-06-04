// ============================================================
// SwingIQ — Guide Mascot ("the genie")
// ------------------------------------------------------------
// A small, friendly SVG character for the floating guide. Pure
// inline SVG (no image assets), themed with the brand green and a
// little magic sparkle so it reads as a helpful companion.
// Decorative only — the surrounding button carries the label.
// ============================================================

interface GuideMascotProps {
  size?: number;
  className?: string;
}

export function GuideMascot({ size = 44, className }: GuideMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="sq-guide-body" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4ade80" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>

      {/* Floating wisps (genie smoke), fading downward */}
      <circle cx="24" cy="41" r="2" fill="#16a34a" opacity="0.25" />
      <circle cx="24" cy="38" r="2.6" fill="#16a34a" opacity="0.4" />

      {/* Body */}
      <circle cx="24" cy="22" r="16" fill="url(#sq-guide-body)" />
      {/* Soft top highlight */}
      <ellipse cx="19" cy="15" rx="6" ry="4" fill="#ffffff" opacity="0.18" />

      {/* Eyes */}
      <circle cx="18.5" cy="21" r="3.2" fill="#ffffff" />
      <circle cx="29.5" cy="21" r="3.2" fill="#ffffff" />
      <circle cx="19.3" cy="21.4" r="1.5" fill="#052e16" />
      <circle cx="30.3" cy="21.4" r="1.5" fill="#052e16" />

      {/* Smile */}
      <path
        d="M18 28 Q24 32 30 28"
        stroke="#052e16"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheeks */}
      <circle cx="15" cy="26" r="1.6" fill="#ffffff" opacity="0.25" />
      <circle cx="33" cy="26" r="1.6" fill="#ffffff" opacity="0.25" />

      {/* Magic sparkle */}
      <path
        d="M37 9 L38.1 12 L41 13.1 L38.1 14.2 L37 17 L35.9 14.2 L33 13.1 L35.9 12 Z"
        fill="#facc15"
      />
    </svg>
  );
}
