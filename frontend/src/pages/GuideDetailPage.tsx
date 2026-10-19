import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateTime, formatEnumLabel, initialsOf } from '../constants/enumOptions';
import { ArrowLeftIcon, EditIcon, TrashIcon } from '../components/icons';
import type { GuideCreationResponse } from '../types';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // `id` the result belongs to, so a new id shows "Loading" instead of the previous guide
  const [result, setResult] = useState<{
    id: string;
    guide: GuideCreationResponse | null;
    error: string | null;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    guidesApi
      .getById(Number(id))
      .then((guide) => {
        if (!cancelled) setResult({ id, guide, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, guide: null, error: extractErrorMessage(err, 'Guide not found.') });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isLoading = result?.id !== id;
  const guide = result?.guide ?? null;
  const error = result?.error ?? actionError;

  const handleDelete = async () => {
    if (!guide || !window.confirm('Delete this guide? This cannot be undone.')) return;
    try {
      await guidesApi.remove(guide.id);
      navigate('/my-guides', { replace: true });
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete the guide.'));
    }
  };

  if (isLoading) return <p className="status-message">Loading...</p>;
  if (error) return <p className="message message--error page-reading">{error}</p>;
  if (!guide) return null;

  const isAuthor = user?.username === guide.authorName;

  return (
    <div className="page-reading guide-detail">
      <Link to="/" className="back-link">
        <ArrowLeftIcon />
        All guides
      </Link>

      <article className="card reading-card rise">
        <div className="guide-detail-top">
          <span className="tag">{formatEnumLabel(guide.category)}</span>
          {guide.city && <span className="tag tag--outline">{formatEnumLabel(guide.city)}</span>}
          {guide.university && <span className="tag tag--outline">{formatEnumLabel(guide.university)}</span>}
          {guide.status !== 'APPROVED' && <StatusBadge status={guide.status} />}
        </div>
        <h1 className="reading-title">{guide.title}</h1>
        <div className="byline">
          <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(guide.authorName)}</span>
          <span>
            <strong>{guide.authorName}</strong> · {formatDateTime(guide.createdAt)}
          </span>
        </div>

        {guide.status === 'REJECTED' && guide.rejectionReason && (
          <p className="message message--error">Rejection reason: {guide.rejectionReason}</p>
        )}

        <div className="guide-content">{guide.content}</div>

        {isAuthor && (
          <div className="reading-actions">
            <Link to={`/guides/${guide.id}/edit`} className="btn btn--secondary btn--sm">
              <EditIcon />
              Edit
            </Link>
            <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete}>
              <TrashIcon />
              Delete
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
