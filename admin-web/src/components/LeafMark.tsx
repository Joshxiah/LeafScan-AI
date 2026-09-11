/**
 * The LeafScan AI brand mark - a single clean leaf with a midrib.
 *
 * Inline SVG (not an emoji) so it renders identically on every OS
 * and takes its colour from the surrounding text via currentColor.
 */

export function LeafMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 20C4 11.5 9.5 5 20 4c0 10.5-5.5 16-16 16Z"
        fill="currentColor"
        fillOpacity="0.16"
      />
      <path
        d="M20 4C9.5 5 4 11.5 4 20c10.5 0 16-5.5 16-16Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 5.5C13 8.5 8.5 13 6 19.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
