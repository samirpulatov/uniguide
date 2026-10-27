import { useEffect, useState } from 'react';

// Cycles through words in place: the current one slides in from below, the previous one leaves upward.
// Screen readers get the whole list once instead of a live-changing word.
export function Rotator({ words, interval = 2600 }: { words: string[]; interval?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(timer);
  }, [words.length, interval]);

  return (
    <span className="rotator">
      <span className="visually-hidden">{words.join(', ')}</span>
      <span className="rotator-window" aria-hidden="true">
        {words.map((word, i) => {
          const state = i === index ? 'in' : i === (index + words.length - 1) % words.length ? 'out' : 'next';
          return (
            <span key={word} className={`rotator-word rotator-word--${state}`}>
              {word}
            </span>
          );
        })}
      </span>
      <span className="rotator-underline" key={index} aria-hidden="true" />
    </span>
  );
}
