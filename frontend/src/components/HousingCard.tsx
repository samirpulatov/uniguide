import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { housingPhotosApi } from '../api/housingPhotos';
import { HOUSE_TYPE_LABELS, formatArea, formatEnumLabel, formatEuro, initialsOf, timeAgo } from '../constants/enumOptions';
import { PhotoCarousel } from './PhotoCarousel';
import type { HousingPhotoResponse, HousingResponse } from '../types';

export function HousingCard({ housing }: { housing: HousingResponse }) {
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
    <article className="housing-card">
      <PhotoCarousel photos={photos} alt={housing.title} className="housing-media" />

      <div className="housing-body">
        <h3 className="housing-title">
          <Link to={`/housing/${housing.id}`} className="housing-card-link">{housing.title}</Link>
        </h3>
        <div className="housing-meta">
          <svg className="housing-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          {formatEnumLabel(housing.city)} · {formatArea(housing.area)}
        </div>
        <div className="housing-tags">
          <span className="housing-tag">{HOUSE_TYPE_LABELS[housing.houseType]}</span>
        </div>

        <div className="housing-footer">
          <div>
            <div className="housing-price">
              {formatEuro(housing.warmRent)}
              <span className="housing-price-unit">/mo</span>
            </div>
            <div className="housing-price-note">warm · {formatEuro(housing.coldRent)} cold</div>
          </div>
          <div className="housing-author">
            <span className="housing-avatar" aria-hidden="true">{initialsOf(housing.authorName)}</span>
            <div>
              <div className="housing-author-name">{housing.authorName}</div>
              <div className="housing-author-date">{timeAgo(housing.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
