import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { GuideCard } from '../components/GuideCard';
import { PlusIcon } from '../components/icons';
import type { GuideCreationResponse } from '../types';

export function MyGuidesPage() {
  const [guides, setGuides] = useState<GuideCreationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    guidesApi
      .getMine()
      .then(setGuides)
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load your guides.')))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page-wide">
      <header className="page-head">
        <div>
          <h1>My guides</h1>
          <p className="page-lead">Everything you've written, with its review status.</p>
        </div>
        <Link to="/guides/new" className="btn btn--primary">
          <PlusIcon />
          New guide
        </Link>
      </header>

      {isLoading && <p className="status-message">Loading...</p>}
      {error && <p className="message message--error">{error}</p>}
      {!isLoading && !error && guides.length === 0 && (
        <div className="empty">
          <strong>You haven't written a guide yet.</strong>
          <span>Share what you learned — <Link to="/guides/new">write your first guide</Link>.</span>
        </div>
      )}

      <div className="card-grid">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} showStatus />
        ))}
      </div>
    </div>
  );
}
