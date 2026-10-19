import { Link } from 'react-router-dom';
import { JOB_TYPE_LABELS, formatEnumLabel, formatHourlyWage, initialsOf, timeAgo } from '../constants/enumOptions';
import type { JobVacancyResponse } from '../types';

export function JobCard({ job }: { job: JobVacancyResponse }) {
  return (
    // same pattern as HousingCard: the title link stretches over the whole card (::after)
    <article className="housing-card job-card">
      <div className="housing-body">
        <div className="housing-tags">
          <span className="housing-tag">{JOB_TYPE_LABELS[job.jobType]}</span>
        </div>
        <h3 className="housing-title">
          <Link to={`/jobs/${job.id}`} className="housing-card-link">{job.title}</Link>
        </h3>
        <div className="job-company">{job.company}</div>
        <div className="housing-meta">
          <svg className="housing-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </svg>
          {formatEnumLabel(job.city)}
        </div>
        <p className="job-snippet">{job.description}</p>

        <div className="housing-footer">
          <div className="housing-price">{formatHourlyWage(job.salaryPerHour)}</div>
          <div className="housing-author">
            <span className="housing-avatar" aria-hidden="true">{initialsOf(job.authorName)}</span>
            <div>
              <div className="housing-author-name">{job.authorName}</div>
              <div className="housing-author-date">{timeAgo(job.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
