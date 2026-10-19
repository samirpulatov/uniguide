import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnumLabel } from '../constants/enumOptions';
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
  if (error) return <p className="form-error">{error}</p>;
  if (!guide) return null;

  const isAuthor = user?.username === guide.authorName;

  return (
    <div className="page guide-detail">
      <div className="guide-detail-header">
        <h1>{guide.title}</h1>
        {guide.status !== 'APPROVED' && <StatusBadge status={guide.status} />}
      </div>
      <p className="guide-card-meta">
        {formatEnumLabel(guide.category)}
        {guide.city ? ` · ${formatEnumLabel(guide.city)}` : ''}
        {guide.university ? ` · ${formatEnumLabel(guide.university)}` : ''}
      </p>
      <p className="guide-card-author">by {guide.authorName}</p>

      {guide.status === 'REJECTED' && guide.rejectionReason && (
        <p className="form-error">Rejection reason: {guide.rejectionReason}</p>
      )}

      <div className="guide-content">{guide.content}</div>

      {isAuthor && (
        <div className="guide-actions">
          <Link to={`/guides/${guide.id}/edit`}>Edit</Link>
          <button type="button" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}
