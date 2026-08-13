import { useEffect, useState } from 'react';
import { guidesApi, type GuideFilters } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { GuideCard } from '../components/GuideCard';
import { CITIES, GUIDE_CATEGORIES, formatEnumLabel, universitiesForCity } from '../constants/enumOptions';
import type { City, GuideCategory, GuideCreationResponse, University } from '../types';

export function GuidesPage() {
  const [filters, setFilters] = useState<GuideFilters>({});
  const [guides, setGuides] = useState<GuideCreationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    guidesApi
      .getAll(filters)
      .then((data) => {
        if (!cancelled) setGuides(data);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load guides.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const handleCityChange = (city: City | '') => {
    setFilters((prev) => ({
      ...prev,
      city: city || undefined,
      // Changing the city invalidates a previously selected university from a different city.
      university: undefined,
    }));
  };

  return (
    <div className="page">
      <h1>Guides</h1>
      <div className="filters">
        <select value={filters.city ?? ''} onChange={(e) => handleCityChange(e.target.value as City | '')}>
          <option value="">All cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>{formatEnumLabel(city)}</option>
          ))}
        </select>

        <select
          value={filters.university ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, university: (e.target.value || undefined) as University | undefined }))
          }
        >
          <option value="">All universities</option>
          {universitiesForCity(filters.city).map((university) => (
            <option key={university} value={university}>{formatEnumLabel(university)}</option>
          ))}
        </select>

        <select
          value={filters.category ?? ''}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, category: (e.target.value || undefined) as GuideCategory | undefined }))
          }
        >
          <option value="">All categories</option>
          {GUIDE_CATEGORIES.map((category) => (
            <option key={category} value={category}>{formatEnumLabel(category)}</option>
          ))}
        </select>
      </div>

      {isLoading && <p className="status-message">Loading guides...</p>}
      {error && <p className="form-error">{error}</p>}
      {!isLoading && !error && guides.length === 0 && <p className="status-message">No guides match these filters yet.</p>}

      <div className="guide-list">
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}
