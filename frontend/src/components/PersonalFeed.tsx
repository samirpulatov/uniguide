import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { forumApi } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { formatEnumLabel, timeAgo } from '../constants/enumOptions';
import { UNIVERSITY_CITY } from '../types';
import type { City, GuideCreationResponse, ForumThreadResponse, University } from '../types';

const FEED_SIZE = 4;

interface FeedQuery {
  city: City | null;
  university: University | null;
}

interface FeedItem {
  id: number;
  createdAt: string;
}

// Fetches by city and by university separately: a guide may have only one of the two set,
// and the backend combines filters with AND. Duplicates are removed, newest first.
async function fetchMerged<T extends FeedItem>(
  query: FeedQuery,
  load: (filter: { city?: City; university?: University }) => Promise<T[]>,
): Promise<T[]> {
  const requests: Promise<T[]>[] = [];
  if (query.city) requests.push(load({ city: query.city }));
  if (query.university) requests.push(load({ university: query.university }));
  const byId = new Map<number, T>();
  for (const list of await Promise.all(requests)) {
    for (const item of list) byId.set(item.id, item);
  }
  return [...byId.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, FEED_SIZE);
}

interface FeedResult {
  query: FeedQuery;
  guides: GuideCreationResponse[];
  threads: ForumThreadResponse[];
  error: string | null;
}

// Latest guides and forum threads for the user's city/university from the profile
export function PersonalFeed({ city, university }: { city: City | null; university: University | null }) {
  // a university implies its city, so a profile with only a university still gets city content
  const query = useMemo<FeedQuery>(
    () => ({ city: city ?? (university ? UNIVERSITY_CITY[university] : null), university }),
    [city, university],
  );
  const hasProfile = query.city !== null || query.university !== null;
  const [result, setResult] = useState<FeedResult | null>(null);

  useEffect(() => {
    if (!hasProfile) return;
    let cancelled = false;
    Promise.all([fetchMerged(query, guidesApi.getAll), fetchMerged(query, forumApi.getThreads)])
      .then(([guides, threads]) => {
        if (!cancelled) setResult({ query, guides, threads, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ query, guides: [], threads: [], error: extractErrorMessage(err, 'Could not load your feed.') });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, hasProfile]);

  const place = [query.university, query.city].filter(Boolean).map((v) => formatEnumLabel(v!)).join(' · ');

  return (
    <section className="card feed-card rise" style={{ '--i': 1 } as CSSProperties} aria-labelledby="feed-title">
      <header className="panel-head">
        <div>
          <h2 id="feed-title" className="card-title">For you</h2>
          <p className="card-subtitle">{hasProfile ? place : 'Personal feed'}</p>
        </div>
      </header>

      {!hasProfile ? (
        <p className="panel-empty">
          Add your city or university in your <Link to="/profile">profile</Link> to see guides and discussions
          that matter to you.
        </p>
      ) : result?.query !== query ? (
        <p className="panel-empty">Loading…</p>
      ) : result.error ? (
        <p className="message message--error">{result.error}</p>
      ) : (
        <>
          <div className="feed-section-head">
            <h3 className="t-eyebrow">Latest guides</h3>
            <Link to="/">See all</Link>
          </div>
          {result.guides.length === 0 ? (
            <p className="panel-empty">No guides for your place yet.</p>
          ) : (
            <ul className="feed-list">
              {result.guides.map((guide) => (
                <li key={guide.id}>
                  <Link to={`/guides/${guide.id}`} className="feed-item">
                    <span className="feed-item-title">{guide.title}</span>
                    <span className="feed-item-meta">
                      {formatEnumLabel(guide.category)} · {guide.authorName} · {timeAgo(guide.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="feed-section-head">
            <h3 className="t-eyebrow">Community</h3>
            <Link to="/forum">See all</Link>
          </div>
          {result.threads.length === 0 ? (
            <p className="panel-empty">
              No discussions yet. <Link to="/forum/new">Start one</Link>
            </p>
          ) : (
            <ul className="feed-list">
              {result.threads.map((thread) => (
                <li key={thread.id}>
                  <Link to={`/forum/${thread.id}`} className="feed-item">
                    <span className="feed-item-title">{thread.title}</span>
                    <span className="feed-item-meta">
                      {thread.forumCategory ? `${formatEnumLabel(thread.forumCategory)} · ` : ''}
                      {thread.authorName} · {timeAgo(thread.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
