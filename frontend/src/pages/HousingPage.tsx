import { useEffect, useState, type CSSProperties } from 'react';
import { housingApi, type HousingFilters } from '../api/housing';
import { extractErrorMessage } from '../api/errors';
import { HousingCard } from '../components/HousingCard';
import { CITIES, formatEnumLabel } from '../constants/enumOptions';
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
  { value: 'WG_ROOM', label: 'WG room' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'DORM', label: 'Dorm' },
];

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
  const [result, setResult] = useState<{
    filters: FilterState;
    housings: HousingResponse[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    housingApi
      .getAll(toQuery(applied))
      .then((housings) => {
        if (!cancelled) setResult({ filters: applied, housings, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({ filters: applied, housings: [], error: extractErrorMessage(err, 'Failed to load housing.') });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applied]);

  // the previous results stay on screen (dimmed) while the next request is running
  const isLoading = result?.filters !== applied;
  const housings = result?.housings ?? [];
  const isDefault = filters === DEFAULT_FILTERS;

  const update = (patch: Partial<FilterState>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <div className="housing-page">
      <section className="housing-hero">
        <div className="housing-hero-text">
          <h1 className="housing-hero-title">Find housing</h1>
          <p className="housing-hero-subtitle">Rooms, apartments and dorm places from students for students.</p>
          <ul className="housing-features">
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              </span>
              <div>
                <strong>Student friendly</strong>
                <span>Real people, real offers</span>
              </div>
            </li>
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              </span>
              <div>
                <strong>Members only</strong>
                <span>Addresses stay inside UniGuide</span>
              </div>
            </li>
            <li>
              <span className="housing-feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>
              </span>
              <div>
                <strong>Find your place</strong>
                <span>Live, study, connect</span>
              </div>
            </li>
          </ul>
        </div>
        <blockquote className="housing-hero-quote">
          More than just a place to live — a place to belong.
          <span className="accent-line" aria-hidden="true" />
        </blockquote>
      </section>

      <div className="housing-layout">
        <aside className="housing-filters" aria-label="Filters">
          <div className="hf-header">
            <h2>Filters</h2>
            <button type="button" className="hf-reset" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={isDefault}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v4h4" /></svg>
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

        <section className="housing-results" aria-busy={isLoading}>
          <p className="housing-count">
            {result === null
              ? 'Loading places…'
              : `${housings.length} ${housings.length === 1 ? 'place matches' : 'places match'} your filters`}
          </p>

          {result?.error && <p className="form-error">{result.error}</p>}
          {result && !result.error && housings.length === 0 && (
            <div className="housing-empty">
              <strong>No places match these filters.</strong>
              <span>Try a wider price range or another city.</span>
            </div>
          )}

          <div className={`housing-grid${isLoading ? ' housing-grid--loading' : ''}`}>
            {housings.map((housing) => (
              <HousingCard key={housing.id} housing={housing} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
