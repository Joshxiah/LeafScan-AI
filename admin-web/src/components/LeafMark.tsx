/**
 * The LeafScan AI brand mark - a single realistic leaf blade with a
 * budding stem, drawn in a clean modern line-art style.
 *
 * Inline SVG (not an emoji) so it renders identically on every OS
 * and takes its colour from the surrounding text via currentColor -
 * this same mark is used on both light (green-on-white, Sidebar/
 * LoginPage) and dark (white-on-green, LoginPage's icon badge)
 * backgrounds, so it must stay single-tone rather than a fixed
 * multi-colour graphic.
 */

export function LeafMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-11 10Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
