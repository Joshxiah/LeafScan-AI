/**
 * Scan tab - a placeholder with no screen of its own.
 *
 * The raised Scan button in the tab bar opens the camera directly (see the
 * tabPress listener in (tabs)/_layout.tsx), and the camera screen has the
 * gallery button next to the shutter, so there is nothing to show here. The
 * file only exists so the navigator has a "scan" tab to draw the button for.
 *
 * Everywhere else in the app that starts a scan goes straight to /camera.
 */

export default function ScanTabPlaceholder() {
  return null;
}
