import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../api/jobs';
import { extractErrorMessage } from '../api/errors';
import { CITIES, JOB_TYPE_LABELS, JOB_TYPES, formatEnumLabel } from '../constants/enumOptions';
import type { City, JobType, JobVacancyRequest, JobVacancyResponse } from '../types';

// Mirrors JobVacancyRequest on the backend
const TITLE_MIN = 10;
const TEXT_MAX = 100;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;
// @Digits(integer = 3, fraction = 2); a comma is accepted as the decimal separator too
const WAGE_PATTERN = /^\d{1,3}([.,]\d{1,2})?$/;

// Inputs keep strings, so a half-typed "12," is not turned into a number while typing
interface FormState {
  title: string;
  company: string;
  city: City | '';
  jobType: JobType | '';
  salaryPerHour: string;
  description: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  title: '',
  company: '',
  city: '',
  jobType: '',
  salaryPerHour: '',
  description: '',
};

function toFormState(job: JobVacancyResponse): FormState {
  return {
    title: job.title,
    company: job.company,
    city: job.city,
    jobType: job.jobType,
    salaryPerHour: String(job.salaryPerHour),
    description: job.description,
  };
}

const toNumber = (value: string) => Number(value.trim().replace(',', '.'));

function lengthError(value: string, min: number, max: number, label: string): string | undefined {
  const length = value.trim().length;
  if (length === 0) return `${label} is required.`;
  if (length < min) return `At least ${min} characters.`;
  if (length > max) return `At most ${max} characters.`;
  return undefined;
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {
    title: lengthError(form.title, TITLE_MIN, TEXT_MAX, 'Title'),
    company: lengthError(form.company, 1, TEXT_MAX, 'Company'),
    description: lengthError(form.description, DESCRIPTION_MIN, DESCRIPTION_MAX, 'Description'),
  };
  if (!form.jobType) errors.jobType = 'Choose a type.';
  if (!form.city) errors.city = 'Choose a city.';

  const wage = form.salaryPerHour.trim();
  if (!wage) errors.salaryPerHour = 'Required — enter 0 for an unpaid internship.';
  else if (!WAGE_PATTERN.test(wage)) errors.salaryPerHour = 'A number up to 999.99 with at most 2 decimals.';

  // drop the undefined entries, so Object.keys() counts real errors only
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors;
}

// only called after validate() passed, so the enums are set and the wage parses
function toRequest(form: FormState): JobVacancyRequest {
  return {
    title: form.title.trim(),
    company: form.company.trim(),
    city: form.city as City,
    jobType: form.jobType as JobType,
    salaryPerHour: toNumber(form.salaryPerHour),
    description: form.description.trim(),
  };
}

export function JobFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    jobsApi
      .getById(Number(id))
      .then((job) => {
        if (!cancelled) setForm(toFormState(job));
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err, 'Failed to load the vacancy.'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEditMode]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // the message disappears as soon as the user touches the field again
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const request = toRequest(form);
      const saved = isEditMode ? await jobsApi.update(Number(id), request) : await jobsApi.create(request);
      navigate(`/jobs/${saved.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save the vacancy.'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="status-message">Loading...</p>;

  const fieldError = (field: keyof FormState) =>
    fieldErrors[field] && <span className="field-error">{fieldErrors[field]}</span>;

  return (
    <div className="page housing-form-page">
      <Link to={isEditMode ? `/jobs/${id}` : '/jobs'} className="back-link">
        ← {isEditMode ? 'Back to the vacancy' : 'Back to jobs'}
      </Link>
      <h1>{isEditMode ? 'Edit vacancy' : 'Post a job'}</h1>

      <form onSubmit={handleSubmit} className="form housing-form" noValidate>
        <div className="form-row">
          <label>
            Type
            <select value={form.jobType} onChange={(e) => setField('jobType', e.target.value as JobType | '')}>
              <option value="">Choose…</option>
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>{JOB_TYPE_LABELS[type]}</option>
              ))}
            </select>
            {fieldError('jobType')}
          </label>
          <label>
            City
            <select value={form.city} onChange={(e) => setField('city', e.target.value as City | '')}>
              <option value="">Choose…</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{formatEnumLabel(city)}</option>
              ))}
            </select>
            {fieldError('city')}
          </label>
        </div>

        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            maxLength={TEXT_MAX}
            placeholder="e.g. Werkstudent in IT support"
          />
          {fieldError('title')}
        </label>

        <div className="form-row">
          <label>
            Company
            <input value={form.company} onChange={(e) => setField('company', e.target.value)} maxLength={TEXT_MAX} />
            {fieldError('company')}
          </label>
          <label>
            Lohn (€ / hour)
            <input
              value={form.salaryPerHour}
              onChange={(e) => setField('salaryPerHour', e.target.value)}
              inputMode="decimal"
              placeholder="12.82"
            />
            {fieldError('salaryPerHour')}
          </label>
        </div>
        <span className="field-hint">Enter 0 for an unpaid internship (Pflichtpraktikum).</span>

        <label>
          Description
          <textarea
            rows={8}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            maxLength={DESCRIPTION_MAX}
            placeholder="Tasks, hours per week, language requirements, how to apply…"
          />
          <span className="field-hint">{form.description.length} / {DESCRIPTION_MAX}</span>
          {fieldError('description')}
        </label>

        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Publish job'}
        </button>
      </form>
    </div>
  );
}
