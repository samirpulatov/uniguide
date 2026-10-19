import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi, type JobFilters } from '../api/jobs';
import { extractErrorMessage } from '../api/errors';
import { JobCard } from '../components/JobCard';
import { useAuth } from '../context/useAuth';
import { CITIES, JOB_TYPE_LABELS, JOB_TYPES as TYPE_VALUES, formatEnumLabel } from '../constants/enumOptions';
import type { City, JobType, JobVacancyResponse } from '../types';

// Slider bounds for the minimum hourly wage. 0 = "any wage", so the bound is not sent at all.
const WAGE_MIN = 0;
const WAGE_MAX = 30;
const WAGE_STEP = 0.5;

const JOB_TYPES: { value: JobType | ''; label: string }[] = [
  { value: '', label: 'Any type' },
  ...TYPE_VALUES.map((value) => ({ value, label: JOB_TYPE_LABELS[value] })),
];

// "all" = GET /jobs with the filters, "mine" = GET /jobs/me (no filters there, login only)
type Scope = 'all' | 'mine';

interface FilterState {
  city: City | '';
  jobType: JobType | '';
  minWage: number;
}

const DEFAULT_FILTERS: FilterState = { city: '', jobType: '', minWage: WAGE_MIN };

function toQuery(f: FilterState): JobFilters {
  return {
    city: f.city || undefined,
    jobType: f.jobType || undefined,
    minSalaryPerHour: f.minWage > WAGE_MIN ? f.minWage : undefined,
  };
}

export function JobsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  // filters wait a moment before the request, so dragging the slider does not fire one request per step
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);
  const [scope, setScope] = useState<Scope>('all');
  // a logged-out visitor can only see all vacancies
  const effectiveScope: Scope = user ? scope : 'all';
  // one object per request, so the result can tell which request it belongs to
  const query = useMemo(() => ({ scope: effectiveScope, filters: applied }), [effectiveScope, applied]);
  const [result, setResult] = useState<{
    query: typeof query;
    jobs: JobVacancyResponse[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    const request = query.scope === 'mine' ? jobsApi.getMine() : jobsApi.getAll(toQuery(query.filters));
    request
      .then((jobs) => {
        if (!cancelled) setResult({ query, jobs, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ query, jobs: [], error: extractErrorMessage(err, 'Failed to load jobs.') });
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // the previous results stay on screen (dimmed) while the next request is running
  const isLoading = result?.query !== query;
  const isMine = effectiveScope === 'mine';
  const jobs = result?.jobs ?? [];
  const isDefault = filters === DEFAULT_FILTERS;
  const wagePercent = ((filters.minWage - WAGE_MIN) / (WAGE_MAX - WAGE_MIN)) * 100;

  const update = (patch: Partial<FilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="housing-page">
      <section className="housing-hero">
        <div className="housing-hero-text">
          <h1 className="housing-hero-title">Find a job</h1>
          <p className="housing-hero-subtitle">Minijobs, Werkstudent positions and internships next to your studies.</p>
          <ul className="housing-features">
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
              </span>
              <div>
                <strong>Student jobs</strong>
                <span>Made to fit a study plan</span>
              </div>
            </li>
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              </span>
              <div>
                <strong>Lohn per hour</strong>
                <span>Compare offers at a glance</span>
              </div>
            </li>
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              </span>
              <div>
                <strong>From the community</strong>
                <span>Posted by students and locals</span>
              </div>
            </li>
          </ul>
        </div>
        <blockquote className="housing-hero-quote">
          Earn, learn and find your way in Germany.
          <span className="accent-line" aria-hidden="true" />
        </blockquote>
      </section>

      <div className="housing-layout">
        <aside className={`housing-filters${isMine ? ' housing-filters--off' : ''}`} aria-label="Filters" inert={isMine}>
          <div className="hf-header">
            <h2>Filters</h2>
            <button type="button" className="hf-reset" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={isDefault}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v4h4" /></svg>
              Reset
            </button>
          </div>

          <fieldset className="hf-group">
            <legend className="hf-label">Job type</legend>
            <div className="hf-options">
              {JOB_TYPES.map((type) => (
                <label key={type.value || 'any'} className="hf-option">
                  <input
                    type="radio"
                    name="jobType"
                    checked={filters.jobType === type.value}
                    onChange={() => update({ jobType: type.value })}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="hf-group">
            <span className="hf-label">Location</span>
            <select
              className="hf-select"
              value={filters.city}
              onChange={(e) => update({ city: e.target.value as City | '' })}
            >
              <option value="">Any city</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{formatEnumLabel(city)}</option>
              ))}
            </select>
          </label>

          {/* one thumb only: the backend filters by a minimum wage, so the highlighted part runs to the right end */}
          <fieldset className="hf-group">
            <legend className="hf-label">Minimum Lohn per hour</legend>
            <div className="hf-range" style={{ '--from': `${wagePercent}%`, '--to': '100%' } as CSSProperties}>
              <input
                type="range"
                min={WAGE_MIN}
                max={WAGE_MAX}
                step={WAGE_STEP}
                value={filters.minWage}
                aria-label="Minimum Lohn per hour"
                onChange={(e) => update({ minWage: Number(e.target.value) })}
              />
            </div>
            <span className="field-hint">
              {filters.minWage === WAGE_MIN ? 'Any Lohn, unpaid included' : `From €${filters.minWage} per hour`}
            </span>
          </fieldset>
        </aside>

        <section className="housing-results" aria-busy={isLoading}>
          <div className="housing-toolbar">
            {user ? (
              <div className="segmented" role="group" aria-label="Which vacancies">
                <button type="button" aria-pressed={!isMine} onClick={() => setScope('all')}>All jobs</button>
                <button type="button" aria-pressed={isMine} onClick={() => setScope('mine')}>My vacancies</button>
              </div>
            ) : (
              <span />
            )}
            <Link to={user ? '/jobs/new' : '/login'} className="button-primary housing-post-button">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              {user ? 'Post a job' : 'Log in to post a job'}
            </Link>
          </div>

          <p className="housing-count">
            {result === null
              ? 'Loading jobs…'
              : isMine
                ? `You have ${jobs.length} ${jobs.length === 1 ? 'vacancy' : 'vacancies'}`
                : `${jobs.length} ${jobs.length === 1 ? 'job matches' : 'jobs match'} your filters`}
          </p>

          {result?.error && <p className="form-error">{result.error}</p>}
          {result && !result.error && jobs.length === 0 && (
            <div className="housing-empty">
              {isMine ? (
                <>
                  <strong>You haven't posted a job yet.</strong>
                  <span>
                    <Link to="/jobs/new">Post your first vacancy</Link> — it takes a minute.
                  </span>
                </>
              ) : (
                <>
                  <strong>No jobs match these filters.</strong>
                  <span>Try a lower minimum Lohn or another city.</span>
                </>
              )}
            </div>
          )}

          <div className={`housing-grid${isLoading ? ' housing-grid--loading' : ''}`}>
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
