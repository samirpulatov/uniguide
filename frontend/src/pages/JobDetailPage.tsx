import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../api/jobs';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import {
  JOB_TYPE_LABELS,
  formatDateTime,
  formatEnumLabel,
  formatHourlyWage,
  initialsOf,
  timeAgo,
} from '../constants/enumOptions';
import type { JobVacancyResponse } from '../types';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // `id` the result belongs to, so switching vacancies shows "Loading" instead of the old one
  const [result, setResult] = useState<{
    id: string;
    job: JobVacancyResponse | null;
    error: string | null;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    jobsApi
      .getById(Number(id))
      .then((job) => {
        if (!cancelled) setResult({ id, job, error: null });
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, job: null, error: extractErrorMessage(err, 'Job not found.') });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Delete this vacancy? This cannot be undone.')) return;
    setActionError(null);
    setIsDeleting(true);
    try {
      await jobsApi.remove(Number(id));
      navigate('/jobs', { replace: true });
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete the vacancy.'));
      setIsDeleting(false);
    }
  };

  if (!result || result.id !== id) return <p className="status-message">Loading...</p>;

  const job = result.job;
  if (!job) {
    return (
      <div className="page">
        <p className="form-error">{result.error}</p>
        <Link to="/jobs" className="back-link">← Back to jobs</Link>
      </div>
    );
  }

  const isOwner = user?.username === job.authorName;
  // @UpdateTimestamp is also set on insert, so only a later change counts as an edit
  const wasEdited =
    job.updatedAt !== null && new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime() > 60_000;

  return (
    <div className="page-wide housing-detail">
      <Link to="/jobs" className="back-link">← Back to jobs</Link>

      <div className="housing-detail-layout">
        <div className="housing-detail-main">
          <div className="housing-detail-heading">
            <span className="housing-tag">{JOB_TYPE_LABELS[job.jobType]}</span>
            <h1>{job.title}</h1>
            <p className="job-company job-company--large">{job.company}</p>
            <p className="housing-meta">
              <svg className="housing-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              {formatEnumLabel(job.city)}
            </p>
          </div>

          <section>
            <h2 className="housing-detail-subtitle">About this job</h2>
            <div className="housing-detail-content">{job.description}</div>
          </section>
        </div>

        <aside className="housing-detail-side">
          <div className="housing-detail-card">
            <div className="housing-price">{formatHourlyWage(job.salaryPerHour)}</div>
            <dl className="housing-facts">
              <dt>Company</dt>
              <dd>{job.company}</dd>
              <dt>Type</dt>
              <dd>{JOB_TYPE_LABELS[job.jobType]}</dd>
              <dt>City</dt>
              <dd>{formatEnumLabel(job.city)}</dd>
            </dl>
          </div>

          <div className="housing-detail-card housing-author">
            <span className="housing-avatar" aria-hidden="true">{initialsOf(job.authorName)}</span>
            <div>
              <div className="housing-author-name">{job.authorName}</div>
              <div className="housing-author-date" title={formatDateTime(job.createdAt)}>
                posted {timeAgo(job.createdAt)}
                {wasEdited && ` · edited ${timeAgo(job.updatedAt!)}`}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="housing-detail-actions">
              <Link to={`/jobs/${job.id}/edit`} className="button-ghost">Edit</Link>
              <button type="button" className="button-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
          {actionError && <p className="form-error">{actionError}</p>}
        </aside>
      </div>
    </div>
  );
}
