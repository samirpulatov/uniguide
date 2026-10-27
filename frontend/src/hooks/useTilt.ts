import type { PointerEvent } from 'react';

// Pointer handlers for a `.tilt` element: they write CSS variables straight onto the element
// (rotation + spotlight position), so moving the mouse never re-renders React.
// Touch pointers and users who prefer reduced motion get no tilt.
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useTilt(maxDeg = 5) {
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || prefersReducedMotion()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
    el.style.setProperty('--rx', `${((0.5 - y) * maxDeg * 1.6).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * maxDeg * 2).toFixed(2)}deg`);
  };

  const onPointerLeave = (e: PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
  };

  return { onPointerMove, onPointerLeave };
}
