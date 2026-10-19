import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { forumApi, type ForumFilters } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import {
  CITIES,
  FORUM_CATEGORIES,
  formatDateTime,
  formatEnumLabel,
  initialsOf,
  universitiesForCity,
} from '../constants/enumOptions';
import type { City, ForumCategory, ForumThreadResponse, University } from '../types';

export function ForumPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ForumFilters>({});
  // "mine" uses GET /forum/threads/me, which has no filters on the backend
  const [onlyMine, setOnlyMine] = useState(false);
  // the request key the current result belongs to; while it differs from the active key, we're loading
  const [result, setResult] = useState<{ key: string; threads: ForumThreadResponse[]; error: string | null } | null>(null);

  const showMine = onlyMine && user !== null;
  const requestKey = JSON.stringify({ filters, showMine });

  useEffect(() => {
    let cancelled = false;
    const request = showMine ? forumApi.getMyThreads() : forumApi.getThreads(filters);
    request
      .then((data) => {
        // the backend returns threads unordered — newest first reads best for a forum
        const sorted = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (!cancelled) setResult({ key: requestKey, threads: sorted, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, threads: [], error: extractErrorMessage(err, 'Failed to load threads.') });
      });
    return () => {
      cancelled = true;
    };
  }, [filters, showMine, requestKey]);

  const isLoading = result?.key !== requestKey;
  const threads = isLoading ? [] : result.threads;
  const error = isLoading ? null : result.error;

  const handleCityChange = (city: City | '') => {
    setFilters((prev) => ({ ...prev, city: city || undefined, university: undefined }));
  };

  return (
    <div className="page-forum">
      <div className="page-header" style={{ marginBottom: '0.4rem' }}>
        <h1>Community forum</h1>
        {user && (
          <Link to="/forum/new" className="button-outline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New thread
          </Link>
        )}
      </div>
      <p className="status-message" style={{ display: 'block', margin: '0 0 1.5rem' }}>
        Ask questions, share what worked, meet people at your university.
      </p>

      <div className="filters">
        {user && (
          <select value={onlyMine ? 'mine' : 'all'} onChange={(e) => setOnlyMine(e.target.value === 'mine')}>
            <option value="all">All threads</option>
            <option value="mine">My threads</option>
          </select>
        )}
        {!showMine && (
          <>
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
                setFilters((prev) => ({ ...prev, category: (e.target.value || undefined) as ForumCategory | undefined }))
              }
            >
              <option value="">All categories</option>
              {FORUM_CATEGORIES.map((category) => (
                <option key={category} value={category}>{formatEnumLabel(category)}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {isLoading && <p className="status-message">Loading threads...</p>}
      {error && <p className="form-error">{error}</p>}
      {!isLoading && !error && threads.length === 0 && (
        <p className="status-message">
          {showMine ? "You haven't started any threads yet." : 'No threads match these filters yet.'}
        </p>
      )}

      <div className="forum-thread-list">
        {threads.map((thread) => (
          <Link key={thread.id} to={`/forum/${thread.id}`} className="forum-thread-row">
            <div className="forum-avatar">{initialsOf(thread.authorName)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="forum-thread-title">{thread.title}</div>
              <div className="forum-thread-excerpt">{thread.content}</div>
              <div className="forum-thread-tags">
                {thread.forumCategory && <span className="forum-tag">{formatEnumLabel(thread.forumCategory)}</span>}
                {thread.city && <span className="forum-tag forum-tag--outline">{formatEnumLabel(thread.city)}</span>}
                {thread.university && (
                  <span className="forum-tag forum-tag--outline">{formatEnumLabel(thread.university)}</span>
                )}
                {!thread.forumCategory && !thread.city && <span className="forum-tag">Announcement</span>}
              </div>
            </div>
            <div className="forum-thread-stats">
              <div className="forum-thread-replies">{thread.authorName}</div>
              <div className="forum-thread-time">{formatDateTime(thread.createdAt)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
