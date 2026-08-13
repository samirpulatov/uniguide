import { useEffect, useState } from 'react';
import { adminGuidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { StatusBadge } from '../components/StatusBadge';
import { formatEnumLabel } from '../constants/enumOptions';
import type { GuideCreationResponse } from '../types';

export function AdminGuidesPage() {
  const [guides, setGuides] = useState<GuideCreationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionDrafts, setRejectionDrafts] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    adminGuidesApi
      .getAll()
      .then(setGuides)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load guides.')))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const approve = async (id: number) => {
    setActionError(null);
    try {
      await adminGuidesApi.review(id, { action: 'APPROVED' });
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to approve the guide.'));
    }
  };

  const reject = async (id: number) => {
    const rejectionReason = rejectionDrafts[id]?.trim();
    if (!rejectionReason) {
      setActionError('A rejection reason is required.');
      return;
    }
    setActionError(null);
    try {
      await adminGuidesApi.review(id, { action: 'REJECTED', rejectionReason });
      load();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to reject the guide.'));
    }
  };

  const pending = guides.filter((g) => g.status === 'PENDING');
  const reviewed = guides.filter((g) => g.status !== 'PENDING');

  if (isLoading) return <p className="status-message">Loading...</p>;
  if (error) return <p className="form-error">{error}</p>;

  return (
    <div className="page">
      <h1>Guide moderation</h1>
      {actionError && <p className="form-error">{actionError}</p>}

      <h2>Pending review ({pending.length})</h2>
      {pending.length === 0 && <p className="status-message">Nothing to review right now.</p>}
      <div className="admin-guide-list">
        {pending.map((guide) => (
          <div key={guide.id} className="admin-guide-card">
            <h3>{guide.title}</h3>
            <p className="guide-card-meta">{formatEnumLabel(guide.category)} · by {guide.authorName}</p>
            <p className="guide-content-preview">{guide.content}</p>
            <div className="admin-guide-actions">
              <button type="button" onClick={() => approve(guide.id)}>Approve</button>
              <input
                type="text"
                placeholder="Rejection reason"
                value={rejectionDrafts[guide.id] ?? ''}
                onChange={(e) => setRejectionDrafts((prev) => ({ ...prev, [guide.id]: e.target.value }))}
              />
              <button type="button" onClick={() => reject(guide.id)}>Reject</button>
            </div>
          </div>
        ))}
      </div>

      <h2>Already reviewed ({reviewed.length})</h2>
      <div className="admin-guide-list">
        {reviewed.map((guide) => (
          <div key={guide.id} className="admin-guide-card">
            <div className="guide-card-header">
              <h3>{guide.title}</h3>
              <StatusBadge status={guide.status} />
            </div>
            <p className="guide-card-meta">{formatEnumLabel(guide.category)} · by {guide.authorName}</p>
            {guide.status === 'REJECTED' && guide.rejectionReason && (
              <p className="form-error">Reason: {guide.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
