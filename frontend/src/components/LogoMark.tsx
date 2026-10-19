import { useId } from 'react';

// The UniGuide "U" mark: a gradient U whose right stroke folds over the bottom like a ribbon.
// The same shape (in white) is used for public/favicon.svg.
export function LogoMark({ className }: { className?: string }) {
  // useId keeps the gradient ids unique when the mark is rendered more than once on a page
  const id = useId();
  const body = `${id}-body`;
  const ribbon = `${id}-ribbon`;

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={body} x1="10" y1="4" x2="50" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#b6a3ff" />
          <stop offset="0.55" stopColor="#7454f2" />
          <stop offset="1" stopColor="#4a2fc4" />
        </linearGradient>
        <linearGradient id={ribbon} x1="54" y1="22" x2="24" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d8cdff" />
          <stop offset="1" stopColor="#8d6dff" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${body})`}
        d="M10 5l16 3v26c0 7.2 2.8 11 7 11s7-3.8 7-11V13c0-4.6 5-8 14-9v30c0 14.4-9.4 24-22 24S10 48.4 10 34Z"
      />
      <path
        fill={`url(#${ribbon})`}
        opacity="0.9"
        d="M54 26v8c0 14.4-9.4 24-22 24-3.6 0-7-.8-10-2.3C35.5 55 47.5 45 54 26Z"
      />
    </svg>
  );
}
