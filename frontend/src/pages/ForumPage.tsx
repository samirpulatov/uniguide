import { useEffect, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { forumApi, type ForumFilters } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { PlusIcon } from '../components/icons';
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
      <header className="page-head">
        <div>
          <h1>Community</h1>
          <p className="page-lead">Ask questions, share what worked, meet people at your university.</p>
        </div>
        {user ? (
          <Link to="/forum/new" className="btn btn--primary">
            <PlusIcon />
            New thread
          </Link>
        ) : (
          <Link to="/login" state={{ from: { pathname: '/forum' } }} className="btn btn--secondary">
            Log in to post
          </Link>
        )}
      </header>

      <div className="forum-toolbar">
        {user && (
          <div className="segmented" role="group" aria-label="Which threads">
            <button type="button" aria-pressed={!onlyMine} onClick={() => setOnlyMine(false)}>All threads</button>
            <button type="button" aria-pressed={onlyMine} onClick={() => setOnlyMine(true)}>My threads</button>
          </div>
        )}
        {!showMine && (
          <div className="filter-selects">
            <select
              className="select"
              aria-label="City"
              value={filters.city ?? ''}
              onChange={(e) => handleCityChange(e.target.value as City | '')}
            >
              <option value="">All cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{formatEnumLabel(city)}</option>
              ))}
            </select>
            <select
              className="select"
              aria-label="University"
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
              className="select"
              aria-label="Category"
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
          </div>
        )}
      </div>

      {isLoading && <p className="status-message">Loading threads…</p>}
      {error && <p className="message message--error">{error}</p>}
      {!isLoading && !error && threads.length === 0 && (
        <div className="empty">
          <strong>{showMine ? "You haven't started any threads yet." : 'No threads match these filters yet.'}</strong>
          {user && (
            <span>
              <Link to="/forum/new">Start a thread</Link> — someone has probably wondered the same.
            </span>
          )}
        </div>
      )}

      <div className="thread-list">
        {threads.map((thread, i) => (
          <Link
            key={thread.id}
            to={`/forum/${thread.id}`}
            className="card thread-row thread-row--live rise"
            style={{ '--i': Math.min(i, 8) } as CSSProperties}
          >
            <span className="avatar" aria-hidden="true">{initialsOf(thread.authorName)}</span>
            <div className="thread-row-main">
              <h3 className="thread-row-title">{thread.title}</h3>
              <p className="thread-row-excerpt">{thread.content}</p>
              <div className="thread-row-tags">
                {thread.forumCategory && <span className="tag">{formatEnumLabel(thread.forumCategory)}</span>}
                {thread.city && <span className="tag tag--outline">{formatEnumLabel(thread.city)}</span>}
                {thread.university && <span className="tag tag--outline">{formatEnumLabel(thread.university)}</span>}
                {!thread.forumCategory && !thread.city && <span className="tag tag--neutral">Announcement</span>}
              </div>
            </div>
            <div className="thread-row-side">
              <strong>{thread.authorName}</strong>
              {formatDateTime(thread.createdAt)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
