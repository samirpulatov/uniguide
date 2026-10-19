// Fixed decorative layer behind every page: slowly drifting colour blobs plus
// a dot grid (home) or flowing contour lines (inner pages). Pure CSS animation,
// no state; prefers-reduced-motion freezes it (see styles/motion.css).
export function LivingBackground({ variant }: { variant: 'home' | 'page' }) {
  return (
    <div className={`living-bg living-bg--${variant}`} aria-hidden="true">
      <span className="living-blob living-blob--a" />
      <span className="living-blob living-blob--b" />
      <span className="living-blob living-blob--c" />
      {variant === 'home' ? (
        <span className="living-dots" />
      ) : (
        <svg className="living-contours" viewBox="0 0 1440 360" preserveAspectRatio="none">
          <path d="M0 80 C 240 40, 420 140, 720 90 S 1200 30, 1440 100" />
          <path d="M0 130 C 260 90, 460 190, 740 140 S 1180 80, 1440 150" />
          <path d="M0 180 C 280 140, 480 240, 760 190 S 1160 130, 1440 200" />
          <path d="M0 230 C 300 190, 500 290, 780 240 S 1140 180, 1440 250" />
          <path d="M0 280 C 320 240, 520 340, 800 290 S 1120 230, 1440 300" />
        </svg>
      )}
    </div>
  );
}
