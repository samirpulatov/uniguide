import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { housingApi, type HousingFilters } from '../api/housing';
import { extractErrorMessage } from '../api/errors';
import { HousingCard } from '../components/HousingCard';
import { HomeIcon, LockIcon, PlusIcon, ResetIcon, UsersIcon } from '../components/icons';
import { CITIES, HOUSE_TYPE_LABELS, HOUSE_TYPES as TYPE_VALUES, formatEnumLabel } from '../constants/enumOptions';
import type { City, HouseType, HousingResponse } from '../types';

// Slider bounds. A thumb at the outer end means "no limit", so that bound is not sent at all.
const PRICE_MIN = 0;
const PRICE_MAX = 1500;
const PRICE_STEP = 10;
const AREA_MIN = 0;
const AREA_MAX = 150;
const AREA_STEP = 5;

const HOUSE_TYPES: { value: HouseType | ''; label: string }[] = [
  { value: '', label: 'Any type' },
  ...TYPE_VALUES.map((value) => ({ value, label: HOUSE_TYPE_LABELS[value] })),
];

// "all" = GET /housing with the filters, "mine" = GET /housing/me (the backend has no filters there)
type Scope = 'all' | 'mine';

interface FilterState {
  city: City | '';
  houseType: HouseType | '';
  price: [number, number];
  area: [number, number];
}

const DEFAULT_FILTERS: FilterState = {
  city: '',
  houseType: '',
  price: [PRICE_MIN, PRICE_MAX],
  area: [AREA_MIN, AREA_MAX],
};

function toQuery(f: FilterState): HousingFilters {
  return {
    city: f.city || undefined,
    houseType: f.houseType || undefined,
    minWarmRent: f.price[0] > PRICE_MIN ? f.price[0] : undefined,
    maxWarmRent: f.price[1] < PRICE_MAX ? f.price[1] : undefined,
    minArea: f.area[0] > AREA_MIN ? f.area[0] : undefined,
    maxArea: f.area[1] < AREA_MAX ? f.area[1] : undefined,
  };
}

interface RangeFieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  prefix?: string;
  suffix?: string;
  onChange: (value: [number, number]) => void;
}

// Two sliders on one track plus two number inputs; the lower bound can never pass the upper one
function RangeField({ label, min, max, step, value, prefix = '', suffix = '', onChange }: RangeFieldProps) {
  const [low, high] = value;
  const percent = (v: number) => ((v - min) / (max - min)) * 100;
  const clamp = (v: number) => Math.min(max, Math.max(min, Number.isNaN(v) ? min : v));

  return (
    <fieldset className="hf-group">
      <legend className="hf-label">{label}</legend>
      <div
        className="hf-range"
        style={{ '--from': `${percent(low)}%`, '--to': `${percent(high)}%` } as CSSProperties}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          aria-label={`${label} minimum`}
          onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          aria-label={`${label} maximum`}
          onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
        />
      </div>
      <div className="hf-inputs">
        <label className="hf-number">
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={low}
            aria-label={`${label} minimum`}
            onChange={(e) => onChange([Math.min(clamp(e.target.valueAsNumber), high), high])}
          />
          {suffix && <span>{suffix}</span>}
        </label>
        <label className="hf-number">
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={high}
            aria-label={`${label} maximum`}
            onChange={(e) => onChange([low, Math.max(clamp(e.target.valueAsNumber), low)])}
          />
          {suffix && <span>{suffix}</span>}
          {high === max && <span className="hf-plus">+</span>}
        </label>
      </div>
    </fieldset>
  );
}

export function HousingPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  // filters wait a moment before the request, so dragging a slider does not fire one request per step
  const [applied, setApplied] = useState<FilterState>(DEFAULT_FILTERS);
  const [scope, setScope] = useState<Scope>('all');
  // one object per request, so the result can tell which request it belongs to
  const query = useMemo(() => ({ scope, filters: applied }), [scope, applied]);
  const [result, setResult] = useState<{
    query: typeof query;
    housings: HousingResponse[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    const request = query.scope === 'mine' ? housingApi.getMine() : housingApi.getAll(toQuery(query.filters));
    request
      .then((housings) => {
        if (!cancelled) setResult({ query, housings, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ query, housings: [], error: extractErrorMessage(err, 'Failed to load housing.') });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  // the previous results stay on screen (dimmed) while the next request is running
  const isLoading = result?.query !== query;
  const isMine = scope === 'mine';
  const housings = result?.housings ?? [];
  const isDefault = filters === DEFAULT_FILTERS;

  const update = (patch: Partial<FilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="page-wide listings-page">
      <header className="page-head">
        <div>
          <h1>Find housing</h1>
          <p className="page-lead">Rooms, apartments and dorm places — from students, for students.</p>
          <ul className="feature-row">
            <li>
              <UsersIcon />
              <span><strong>Student friendly</strong> · real people, real offers</span>
            </li>
            <li>
              <LockIcon />
              <span><strong>Members only</strong> · addresses stay inside UniGuide</span>
            </li>
            <li>
              <HomeIcon />
              <span><strong>WG, dorm or flat</strong> · filter by warm rent and size</span>
            </li>
          </ul>
        </div>
        <Link to="/housing/new" className="btn btn--primary btn-pop btn-pop--spin">
          <PlusIcon />
          Post listing
        </Link>
      </header>
      <div className="listings-layout">
        <aside className={`card glass filters-panel${isMine ? ' filters-panel--off' : ''}`} aria-label="Filters" inert={isMine}>
          <div className="hf-header">
            <h2>Filters</h2>
            <button type="button" className="btn btn--ghost btn--sm hf-reset" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={isDefault}>
              <ResetIcon />
              Reset
            </button>
          </div>

          <RangeField
            label="Warm rent per month"
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={filters.price}
            prefix="€"
            onChange={(price) => update({ price })}
          />

          <fieldset className="hf-group">
            <legend className="hf-label">Room type</legend>
            <div className="hf-options">
              {HOUSE_TYPES.map((type) => (
                <label key={type.value || 'any'} className="hf-option">
                  <input
                    type="radio"
                    name="houseType"
                    checked={filters.houseType === type.value}
                    onChange={() => update({ houseType: type.value })}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="hf-group">
            <span className="hf-label">Location</span>
            <select
              className="select"
              value={filters.city}
              onChange={(e) => update({ city: e.target.value as City | '' })}
            >
              <option value="">Any city</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{formatEnumLabel(city)}</option>
              ))}
            </select>
          </label>

          <RangeField
            label="Size"
            min={AREA_MIN}
            max={AREA_MAX}
            step={AREA_STEP}
            value={filters.area}
            suffix="m²"
            onChange={(area) => update({ area })}
          />
        </aside>

        <section className="listings-results" aria-busy={isLoading}>
          <div className="listings-toolbar">
            <div className="segmented" role="group" aria-label="Which listings">
              <button type="button" aria-pressed={!isMine} onClick={() => setScope('all')}>All listings</button>
              <button type="button" aria-pressed={isMine} onClick={() => setScope('mine')}>My listings</button>
            </div>
            <p className="housing-count">
              {result === null
                ? 'Loading places…'
                : isMine
                  ? `You have ${housings.length} ${housings.length === 1 ? 'listing' : 'listings'}`
                  : `${housings.length} ${housings.length === 1 ? 'place matches' : 'places match'} your filters`}
            </p>
          </div>

          {result?.error && <p className="message message--error">{result.error}</p>}
          {result && !result.error && housings.length === 0 && (
            <div className="empty">
              {isMine ? (
                <>
                  <strong>You haven't posted anything yet.</strong>
                  <span>
                    <Link to="/housing/new">Post your first listing</Link> — it takes a minute.
                  </span>
                </>
              ) : (
                <>
                  <strong>No places match these filters.</strong>
                  <span>Try a wider price range or another city.</span>
                </>
              )}
            </div>
          )}

          <div className={`listing-grid${isLoading ? ' is-loading' : ''}`}>
            {housings.map((housing, i) => (
              <HousingCard key={housing.id} housing={housing} index={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
