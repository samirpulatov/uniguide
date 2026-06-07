import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { GuideCard } from '../components/GuideCard';
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
    <div className="page">
      <div className="page-header">
        <h1>My guides</h1>
        <Link to="/guides/new" className="button-link">+ New guide</Link>
      </div>

      {isLoading && <p className="status-message">Loading...</p>}
      {error && <p className="form-error">{error}</p>}
      {!isLoading && !error && guides.length === 0 && (
        <p className="status-message">You haven't published any guides yet.</p>
      )}

      <div className="guide-list">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} showStatus />
        ))}
      </div>
    </div>
  );
}
