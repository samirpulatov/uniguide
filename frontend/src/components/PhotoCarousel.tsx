import { useState, type MouseEvent } from 'react';
import { AuthImage } from './AuthImage';
import type { HousingPhotoResponse } from '../types';

interface PhotoCarouselProps {
  // null = list still loading
  photos: HousingPhotoResponse[] | null;
  alt: string;
  className?: string;
}

// One photo at a time with prev/next arrows and dots. Only the visible photo is fetched.
export function PhotoCarousel({ photos, alt, className = '' }: PhotoCarouselProps) {
  const [current, setCurrent] = useState(0);
  const count = photos?.length ?? 0;
  // a photo may have been deleted in the meantime, so never point past the end
  const index = count > 0 ? Math.min(current, count - 1) : 0;
  const photo = photos?.[index];

  // the carousel sits inside a clickable card: a control click must not open the listing
  const go = (e: MouseEvent, next: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((next + count) % count);
  };

  return (
    <div className={`photo-carousel ${className}`}>
      {photo ? (
        <AuthImage photoId={photo.id} alt={`${alt} — photo ${index + 1} of ${count}`} className="photo-carousel-img" />
      ) : (
        <div className="photo-carousel-img photo-carousel-empty">{photos ? 'No photos yet' : ''}</div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            className="photo-carousel-arrow photo-carousel-arrow--prev"
            aria-label="Previous photo"
            onClick={(e) => go(e, index - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            className="photo-carousel-arrow photo-carousel-arrow--next"
            aria-label="Next photo"
            onClick={(e) => go(e, index + 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <div className="photo-carousel-dots">
            {photos!.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`photo-carousel-dot${i === index ? ' photo-carousel-dot--active' : ''}`}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index}
                onClick={(e) => go(e, i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
