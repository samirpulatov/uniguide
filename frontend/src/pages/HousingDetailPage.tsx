import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { housingApi } from '../api/housing';
import { housingPhotosApi } from '../api/housingPhotos';
import { extractErrorMessage } from '../api/errors';
import { PhotoCarousel } from '../components/PhotoCarousel';
import { useAuth } from '../context/useAuth';
import {
  HOUSE_TYPE_LABELS,
  formatArea,
  formatDateTime,
  formatEnumLabel,
  formatEuro,
  initialsOf,
  timeAgo,
} from '../constants/enumOptions';
import type { HousingPhotoResponse, HousingResponse } from '../types';

export function HousingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // `id` the result belongs to, so switching listings shows "Loading" instead of the old one
  const [result, setResult] = useState<{
    id: string;
    housing: HousingResponse | null;
    error: string | null;
  } | null>(null);
  const [photoResult, setPhotoResult] = useState<{ id: string; photos: HousingPhotoResponse[] } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    housingApi
      .getById(Number(id))
      .then((housing) => {
        if (!cancelled) setResult({ id, housing, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, housing: null, error: extractErrorMessage(err, 'Listing not found.') });
      });
    housingPhotosApi
      .getPhotos(Number(id))
      .then((data) => {
        if (!cancelled) setPhotoResult({ id, photos: data });
      })
      .catch(() => {
        if (!cancelled) setPhotoResult({ id, photos: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this listing and all its photos? This cannot be undone.')) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await housingApi.remove(Number(id));
      navigate('/housing', { replace: true });
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete the listing.'));
      setIsDeleting(false);
    }
  };

  if (!result || result.id !== id) return <p className="status-message">Loading...</p>;

  const housing = result.housing;
  if (!housing) {
    return (
      <div className="page">
        <p className="form-error">{result.error}</p>
        <Link to="/housing" className="back-link">← Back to housing</Link>
      </div>
    );
  }

  const isOwner = user?.username === housing.authorName;
  const photos = photoResult && photoResult.id === id ? photoResult.photos : null;
  // @UpdateTimestamp is also set on insert, so only a later change counts as an edit
  const wasEdited =
    housing.updatedAt !== null &&
    new Date(housing.updatedAt).getTime() - new Date(housing.createdAt).getTime() > 60_000;

  return (
    <div className="page-wide housing-detail">
      <Link to="/housing" className="back-link">← Back to housing</Link>

      <div className="housing-detail-layout">
        <div className="housing-detail-main">
          <PhotoCarousel photos={photos} alt={housing.title} className="housing-detail-media" />

          <div className="housing-detail-heading">
            <span className="housing-tag">{HOUSE_TYPE_LABELS[housing.houseType]}</span>
            <h1>{housing.title}</h1>
            <p className="housing-meta">
              <svg className="housing-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {housing.street}, {housing.postCode} {formatEnumLabel(housing.city)}
            </p>
          </div>

          <section>
            <h2 className="housing-detail-subtitle">About this place</h2>
            <div className="housing-detail-content">{housing.content}</div>
          </section>
        </div>

        <aside className="housing-detail-side">
          <div className="housing-detail-card">
            <div className="housing-price">
              {formatEuro(housing.warmRent)}
              <span className="housing-price-unit">/mo warm</span>
            </div>
            <dl className="housing-facts">
              <dt>Cold rent</dt>
              <dd>{formatEuro(housing.coldRent)}</dd>
              <dt>Deposit</dt>
              <dd>{housing.deposit === null ? '—' : formatEuro(housing.deposit)}</dd>
              <dt>Size</dt>
              <dd>{formatArea(housing.area)}</dd>
              <dt>Type</dt>
              <dd>{HOUSE_TYPE_LABELS[housing.houseType]}</dd>
              <dt>City</dt>
              <dd>{formatEnumLabel(housing.city)}</dd>
            </dl>
          </div>

          <div className="housing-detail-card housing-author">
            <span className="housing-avatar" aria-hidden="true">{initialsOf(housing.authorName)}</span>
            <div>
              <div className="housing-author-name">{housing.authorName}</div>
              <div className="housing-author-date" title={formatDateTime(housing.createdAt)}>
                posted {timeAgo(housing.createdAt)}
                {wasEdited && ` · edited ${timeAgo(housing.updatedAt!)}`}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="housing-detail-actions">
              <Link to={`/housing/${housing.id}/edit`} className="button-ghost">Edit</Link>
              <button type="button" className="button-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
          {actionError && <p className="form-error">{actionError}</p>}
        </aside>
      </div>
    </div>
  );
}
