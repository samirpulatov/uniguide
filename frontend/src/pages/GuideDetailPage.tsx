import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnumLabel } from '../constants/enumOptions';
import type { GuideCreationResponse } from '../types';

export function GuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [guide, setGuide] = useState<GuideCreationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    guidesApi
      .getById(Number(id))
      .then((data) => {
        if (!cancelled) setGuide(data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Guide not found.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!guide || !window.confirm('Delete this guide? This cannot be undone.')) return;
    try {
      await guidesApi.remove(guide.id);
      navigate('/my-guides', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to delete the guide.'));
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
