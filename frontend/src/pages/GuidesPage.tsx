import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { guidesApi, type GuideFilters } from '../api/guides';
import { forumApi } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { GuideCard } from '../components/GuideCard';
import { HeroMap } from '../components/home/HeroMap';
import { QuestionMarquee } from '../components/home/QuestionMarquee';
import { Rotator } from '../components/home/Rotator';
import { ArrowRightIcon, BookIcon, ChatIcon, CheckIcon, FileIcon, HomeIcon, SearchIcon } from '../components/icons';
import { useAuth } from '../context/useAuth';
import {
  CATEGORY_TINT,
  CITIES,
  GUIDE_CATEGORIES,
  formatEnumLabel,
  timeAgo,
  universitiesForCity,
  type Tint,
} from '../constants/enumOptions';
import type { City, ForumThreadResponse, GuideCategory, GuideCreationResponse, University } from '../types';

const ROTATING = ['Anmeldung', 'a WG room', 'your first job', 'new friends'];

// the four topic tiles; the first one is the big tile
const TOPICS: { category: GuideCategory; title: string; text: string; icon: ReactNode }[] = [
  { category: 'BUREAUCRACY', title: 'Bureaucracy', text: 'Anmeldung, visa, residence permit, tax ID — in the right order.', icon: <FileIcon /> },
  { category: 'HOUSING', title: 'Housing', text: 'WG rooms, dorms, rental contracts', icon: <HomeIcon /> },
  { category: 'STUDIES', title: 'Studies', text: 'Enrolment, exams, campus life', icon: <BookIcon /> },
  { category: 'DAILY_LIFE', title: 'Daily life', text: 'Bank, phone, insurance', icon: <ChatIcon /> },
];

const tintOf = (category: GuideCategory): Tint => CATEGORY_TINT[category];

// the hero follows the mouse a little: CSS variables on the hero drive the parallax, no re-render
function handleParallax(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
}

export function GuidesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<GuideFilters>({});
  // remembers which filters the result belongs to: while it differs from `filters`, a request is running
  const [result, setResult] = useState<{
    filters: GuideFilters;
    guides: GuideCreationResponse[];
    error: string | null;
  } | null>(null);

  const [search, setSearch] = useState('');
  // newest guide and threads for the hero stickers and the question strip, loaded once
  const [featured, setFeatured] = useState<GuideCreationResponse | null>(null);
  const [threads, setThreads] = useState<ForumThreadResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    guidesApi
      .getAll({})
      .then((all) => {
        const newest = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
        if (!cancelled) setFeatured(newest);
      })
      .catch(() => undefined);
    forumApi
      .getThreads()
      .then((data) => {
        const newest = [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
        if (!cancelled) setThreads(newest);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    guidesApi
      .getAll(filters)
      .then((guides) => {
        if (!cancelled) setResult({ filters, guides, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ filters, guides: [], error: extractErrorMessage(err, 'Failed to load guides.') });
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const isLoading = result?.filters !== filters;
  const term = search.trim().toLowerCase();
  const loaded = result?.guides;
  // the backend has no text search yet, so the search box narrows the loaded list by title
  const guides = useMemo(
    () => (loaded ?? []).filter((g) => !term || g.title.toLowerCase().includes(term)),
    [loaded, term],
  );
  const error = result?.error ?? null;

  const handleCityChange = (city: City | '') => {
    setFilters((prev) => ({
      ...prev,
      city: city || undefined,
      // Changing the city invalidates a previously selected university from a different city.
      university: undefined,
    }));
  };

  const scrollToGuides = () => document.getElementById('guides')?.scrollIntoView({ behavior: 'smooth' });

  const showTopic = (category: GuideCategory) => {
    setFilters((prev) => ({ ...prev, category }));
    scrollToGuides();
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    scrollToGuides();
  };

  const newestThread = threads[0] ?? null;

  return (
    <div className="guides-page">
      <section className="hero" onPointerMove={handleParallax}>
        <div className="hero-main">
          <span className="hero-eyebrow glass">
            <span className="live-dot" aria-hidden="true" />
            Written by students in NRW, for students
          </span>
          <h1 className="hero-title">
            Find your way to <Rotator words={ROTATING} />
          </h1>
          <p className="hero-subtitle">
            Practical guides from students who did it before you — bureaucracy, housing, jobs and daily life in Germany.
          </p>

          <form className="hero-search" role="search" onSubmit={handleSearch}>
            <SearchIcon />
            <label htmlFor="guide-search" className="visually-hidden">Search guides</label>
            <input
              id="guide-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try “Anmeldung” or “WG room”"
              autoComplete="off"
            />
            <button type="submit" className="btn btn--primary btn-pop">Search</button>
          </form>

          <div className="hero-actions">
            <a href="#guides" className="btn btn--primary btn-pop">
              Browse guides
              <ArrowRightIcon />
            </a>
            <Link to="/forum" className="btn btn--secondary">Ask the community</Link>
          </div>
        </div>

        <div className="hero-stage" aria-hidden="true">
          <div className="hero-map">
            <HeroMap home={user?.city ?? null} />
          </div>

          <div className="sticker sticker--guide">
            <div className="sticker-inner">
              {featured ? (
                <>
                  <span className="tag">{formatEnumLabel(featured.category)}</span>
                  <strong className="sticker-title">{featured.title}</strong>
                  <span className="sticker-meta">by {featured.authorName} · {timeAgo(featured.createdAt)}</span>
                </>
              ) : (
                <>
                  <span className="tag">New guide</span>
                  <strong className="sticker-title">Your first guide could be here</strong>
                </>
              )}
            </div>
          </div>

          <div className="sticker sticker--room">
            <div className="sticker-inner">
              <div className="sticker-photo"><HomeIcon /></div>
              <div className="sticker-body">
                <span className="sticker-meta">WG rooms · dorms · flats</span>
                <strong className="sticker-title">Find your room</strong>
              </div>
            </div>
          </div>

          {newestThread && (
            <div className="sticker sticker--chat">
              <div className="sticker-inner">
                <span className="sticker-meta sticker-live">
                  <span className="live-dot" />
                  New in Community
                </span>
                <strong className="sticker-title">“{newestThread.title}”</strong>
              </div>
            </div>
          )}

          <div className="sticker sticker--todo">
            <div className="sticker-inner">
              <span className="sticker-kicker">Your to-do</span>
              <span className="sticker-task">
                <span className="sticker-check"><CheckIcon /></span>
                <span className="sticker-strike">Book Anmeldung</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <QuestionMarquee threads={threads} />

      <section className="home-section" aria-labelledby="topics-title">
        <div className="section-head">
          <div>
            <p className="section-kicker">Start here</p>
            <h2 id="topics-title" className="section-title">What do you need right now?</h2>
          </div>
        </div>
        <div className="bento">
          {TOPICS.map((topic, i) => (
            <button
              key={topic.category}
              type="button"
              className={`bento-tile tint-${tintOf(topic.category)} rise${i === 0 ? ' bento-tile--big' : i === 1 ? ' bento-tile--wide' : ''}`}
              style={{ '--i': i } as CSSProperties}
              onClick={() => showTopic(topic.category)}
            >
              {i === 0 && (
                <>
                  <span className="bento-orbit" aria-hidden="true" />
                  <span className="bento-stamp" aria-hidden="true">Genehmigt</span>
                </>
              )}
              <span className="bento-icon">{topic.icon}</span>
              <span>
                <span className="bento-title">{topic.title}</span>
                {i < 2 && <span className="bento-text">{topic.text}</span>}
              </span>
              <span className="bento-arrow" aria-hidden="true"><ArrowRightIcon /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="home-section guides-section" aria-labelledby="guides">
        <div className="section-head">
          <div>
            <p className="section-kicker">Fresh from students</p>
            <h2 id="guides" className="section-title">Guides</h2>
            <p className="section-subtitle">
              {isLoading
                ? 'Loading guides…'
                : `${guides.length} ${guides.length === 1 ? 'guide' : 'guides'}${term ? ` for “${search.trim()}”` : ''}`}
            </p>
          </div>
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
          </div>
        </div>

        <div className="chip-row" role="group" aria-label="Category">
          <button
            type="button"
            className="chip"
            aria-pressed={!filters.category}
            onClick={() => setFilters((prev) => ({ ...prev, category: undefined }))}
          >
            All
          </button>
          {GUIDE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className="chip"
              aria-pressed={filters.category === category}
              onClick={() => setFilters((prev) => ({ ...prev, category }))}
            >
              {formatEnumLabel(category)}
            </button>
          ))}
        </div>

        {error && <p className="message message--error">{error}</p>}
        {!isLoading && !error && guides.length === 0 && (
          <div className="empty">
            <strong>{term ? `No guides with “${search.trim()}” in the title.` : 'No guides match these filters yet.'}</strong>
            <span>
              Try another word, city or category — or{' '}
              <Link to={user ? '/guides/new' : '/register'}>write the first one</Link>.
            </span>
          </div>
        )}

        <div className={`card-grid${isLoading ? ' is-loading' : ''}`}>
          {guides.map((guide, i) => (
            <GuideCard key={guide.id} guide={guide} index={i} />
          ))}
        </div>
      </section>

      <section className="home-section journey card" aria-labelledby="journey-title">
        <p className="section-kicker">Your first semester</p>
        <h2 id="journey-title" className="section-title">From arrival to feeling at home</h2>
        <ol className="journey-steps">
          <li className="journey-step">
            <span className="journey-num">1</span>
            <h3>Arrive</h3>
            <p>Register your address, open a bank account, get insured.</p>
            <div className="journey-links">
              <button type="button" className="tag journey-tag" onClick={() => showTopic('BUREAUCRACY')}>Bureaucracy</button>
              <button type="button" className="tag tag--neutral journey-tag" onClick={() => showTopic('DAILY_LIFE')}>Daily life</button>
            </div>
          </li>
          <li className="journey-step">
            <span className="journey-num">2</span>
            <h3>Settle</h3>
            <p>Find a room, a job next to your studies and your way around campus.</p>
            <div className="journey-links">
              <Link to="/housing" className="tag journey-tag">Housing</Link>
              <Link to="/jobs" className="tag tag--neutral journey-tag">Jobs</Link>
            </div>
          </li>
          <li className="journey-step">
            <span className="journey-num">3</span>
            <h3>Belong</h3>
            <p>Ask questions, meet people at your university, share what worked.</p>
            <div className="journey-links">
              <Link to="/forum" className="tag journey-tag">Community</Link>
            </div>
          </li>
        </ol>
      </section>

      <section className="cta-band">
        <span className="cta-rings" aria-hidden="true" />
        <div className="cta-text">
          <h2>You figured something out? Save the next student a week.</h2>
          <p>Write a guide in your own words — it goes live after a short review.</p>
        </div>
        <Link to={user ? '/guides/new' : '/register'} className="btn cta-button btn-pop">
          {user ? 'Write a guide' : 'Create an account'}
          <ArrowRightIcon />
        </Link>
      </section>
    </div>
  );
}
