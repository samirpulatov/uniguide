import { useEffect, useState } from 'react';
import { housingPhotosApi } from '../api/housingPhotos';
import { formatEnumLabel } from '../constants/enumOptions';
import { AuthImage } from './AuthImage';
import type { HouseType, HousingPhotoResponse, HousingResponse } from '../types';

const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  WG_ROOM: 'WG room',
  APARTMENT: 'Apartment',
  DORM: 'Dorm',
};

const euro = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const squareMeters = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

// "today", "1 day ago", "5 days ago", then a plain date for older listings
function timeAgo(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(isoDate).toLocaleDateString();
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export function HousingCard({ housing }: { housing: HousingResponse }) {
  // HousingResponse has no photos yet, so every card asks for its own list
  const [photos, setPhotos] = useState<HousingPhotoResponse[] | null>(null);
  const [current, setCurrent] = useState(0);

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

  const photo = photos?.[current];

  return (
    <article className="housing-card">
      <div className="housing-media">
        {photo ? (
          <AuthImage photoId={photo.id} alt={housing.title} className="housing-media-img" />
        ) : (
          <div className="housing-media-img housing-media-empty">{photos ? 'No photos yet' : ''}</div>
        )}
        {photos && photos.length > 1 && (
          <div className="housing-dots">
            {photos.map((p, index) => (
              <button
                key={p.id}
                type="button"
                className={`housing-dot${index === current ? ' housing-dot--active' : ''}`}
                aria-label={`Show photo ${index + 1} of ${photos.length}`}
                onClick={() => setCurrent(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="housing-body">
        <h3 className="housing-title">{housing.title}</h3>
        <div className="housing-meta">
          <svg className="housing-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          {formatEnumLabel(housing.city)} · {squareMeters.format(housing.area)} m²
        </div>
        <div className="housing-tags">
          <span className="housing-tag">{HOUSE_TYPE_LABELS[housing.houseType]}</span>
        </div>

        <div className="housing-footer">
          <div>
            <div className="housing-price">
              €{euro.format(housing.warmRent)}
              <span className="housing-price-unit">/mo</span>
            </div>
            <div className="housing-price-note">warm · €{euro.format(housing.coldRent)} cold</div>
          </div>
          <div className="housing-author">
            <span className="housing-avatar" aria-hidden="true">{initials(housing.authorName)}</span>
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
