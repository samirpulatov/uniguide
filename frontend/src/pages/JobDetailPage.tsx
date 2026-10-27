import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi } from '../api/jobs';
import { extractErrorMessage } from '../api/errors';
import { ArrowLeftIcon, PinIcon } from '../components/icons';
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
        <p className="message message--error">{result.error}</p>
        <Link to="/jobs" className="back-link">
        <ArrowLeftIcon />
        All jobs
      </Link>
      </div>
    );
  }

  const isOwner = user?.username === job.authorName;
  // @UpdateTimestamp is also set on insert, so only a later change counts as an edit
  const wasEdited =
    job.updatedAt !== null && new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime() > 60_000;

  return (
    <div className="page-wide housing-detail">
      <Link to="/jobs" className="back-link">
        <ArrowLeftIcon />
        All jobs
      </Link>

      <div className="housing-detail-layout">
        <div className="housing-detail-main rise">
          <div className="housing-detail-heading">
            <span className="tag tag--neutral">{JOB_TYPE_LABELS[job.jobType]}</span>
            <h1>{job.title}</h1>
            <p className="listing-meta listing-meta--strong">{job.company}</p>
            <p className="listing-meta">
              <PinIcon />
              {formatEnumLabel(job.city)}
            </p>
          </div>

          <section>
            <h2 className="housing-detail-subtitle">About this job</h2>
            <div className="housing-detail-content">{job.description}</div>
          </section>
        </div>

        <aside className="housing-detail-side">
          <div className="card glass housing-detail-card rise">
            <div className="listing-price detail-price">{formatHourlyWage(job.salaryPerHour)}</div>
            <dl className="housing-facts">
              <dt>Company</dt>
              <dd>{job.company}</dd>
              <dt>Type</dt>
              <dd>{JOB_TYPE_LABELS[job.jobType]}</dd>
              <dt>City</dt>
              <dd>{formatEnumLabel(job.city)}</dd>
            </dl>
          </div>

          <div className="card glass housing-detail-card detail-author rise">
            <span className="avatar" aria-hidden="true">{initialsOf(job.authorName)}</span>
            <div>
              <div className="listing-author-name">{job.authorName}</div>
              <div className="listing-author-date" title={formatDateTime(job.createdAt)}>
                posted {timeAgo(job.createdAt)}
                {wasEdited && ` · edited ${timeAgo(job.updatedAt!)}`}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="housing-detail-actions">
              <Link to={`/jobs/${job.id}/edit`} className="btn btn--secondary">Edit</Link>
              <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
          {actionError && <p className="message message--error">{actionError}</p>}
        </aside>
      </div>
    </div>
  );
}
