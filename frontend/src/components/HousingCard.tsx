import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { housingPhotosApi } from '../api/housingPhotos';
import { HOUSE_TYPE_LABELS, formatArea, formatEnumLabel, formatEuro, initialsOf, timeAgo } from '../constants/enumOptions';
import { PhotoCarousel } from './PhotoCarousel';
import { ArrowRightIcon, PinIcon } from './icons';
import type { HousingPhotoResponse, HousingResponse } from '../types';

// listings younger than a day get a "New today" badge
function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 86_400_000;
}

export function HousingCard({ housing, index = 0 }: { housing: HousingResponse; index?: number }) {
  // HousingResponse has no photos yet, so every card asks for its own list
  const [photos, setPhotos] = useState<HousingPhotoResponse[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    housingPhotosApi
      .getPhotos(housing.id)
      .then((data) => {
        if (!cancelled) setPhotos(data);
      })
      .catch(() => {
        // a broken photo list should not break the card — show the placeholder instead
        if (!cancelled) setPhotos([]);
      });
    return () => {
      cancelled = true;
    };
  }, [housing.id]);

  return (
    // the title link stretches over the whole card (::after), the carousel controls sit above it
    <article className="card listing-card listing-card--live rise" style={{ '--i': Math.min(index, 8) } as CSSProperties}>
      <div className="listing-media-wrap">
        <PhotoCarousel photos={photos} alt={housing.title} className="listing-media" />
        {isFresh(housing.createdAt) && <span className="listing-new">New today</span>}
        <span className="listing-price-chip">
          {formatEuro(housing.warmRent)}
          <small>/mo warm</small>
        </span>
      </div>

      <div className="listing-body">
        <div className="listing-tags">
          <span className="tag tag--neutral">{HOUSE_TYPE_LABELS[housing.houseType]}</span>
        </div>
        <h3 className="listing-title">
          <Link to={`/housing/${housing.id}`}>{housing.title}</Link>
        </h3>
        <div className="listing-meta">
          <PinIcon />
          {formatEnumLabel(housing.city)} · {formatArea(housing.area)} · {formatEuro(housing.coldRent)} cold
        </div>

        <div className="listing-footer">
          <div className="listing-author">
            <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(housing.authorName)}</span>
            <div>
              <div className="listing-author-name">{housing.authorName}</div>
              <div className="listing-author-date">{timeAgo(housing.createdAt)}</div>
            </div>
          </div>
          <span className="listing-view" aria-hidden="true">
            View
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </article>
  );
}
