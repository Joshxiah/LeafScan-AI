/**
 * The notification bell, drawn in the same clean line-art style as
 * LeafMark - a soft tinted body plus a crisp outline, with a small
 * clapper at the bottom so it reads as a bell rather than a dome.
 *
 * Inline SVG (not an emoji) so it renders identically on every OS
 * and takes its colour - including its hover colour - from the
 * surrounding text via currentColor, exactly like the button it
 * sits in (see NotificationBell.tsx).
 */

export function BellMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
