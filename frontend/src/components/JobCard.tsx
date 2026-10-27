import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { JOB_TYPE_LABELS, formatEnumLabel, formatHourlyWage, initialsOf, timeAgo } from '../constants/enumOptions';
import { ArrowRightIcon, BriefcaseIcon, PinIcon } from './icons';
import type { JobVacancyResponse } from '../types';

function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 86_400_000;
}

export function JobCard({ job, index = 0 }: { job: JobVacancyResponse; index?: number }) {
  return (
    // same pattern as HousingCard: the title link stretches over the whole card (::after)
    <article className="card listing-card listing-card--live job-card rise" style={{ '--i': Math.min(index, 8) } as CSSProperties}>
      <div className="job-card-head">
        <span className="job-card-icon" aria-hidden="true"><BriefcaseIcon /></span>
        <span className="tag tag--neutral">{JOB_TYPE_LABELS[job.jobType]}</span>
        {isFresh(job.createdAt) && <span className="listing-new listing-new--inline">New today</span>}
        <span className="job-wage">{formatHourlyWage(job.salaryPerHour)}</span>
      </div>
      <div className="listing-body">
        <h3 className="listing-title">
          <Link to={`/jobs/${job.id}`}>{job.title}</Link>
        </h3>
        <div className="listing-meta listing-meta--strong">{job.company}</div>
        <div className="listing-meta">
          <PinIcon />
          {formatEnumLabel(job.city)}
        </div>
        <p className="listing-snippet">{job.description}</p>

        <div className="listing-footer">
          <div className="listing-author">
            <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(job.authorName)}</span>
            <div>
              <div className="listing-author-name">{job.authorName}</div>
              <div className="listing-author-date">{timeAgo(job.createdAt)}</div>
            </div>
          </div>
          <span className="listing-view" aria-hidden="true">
            View
            <ArrowRightIcon />
          </span>
        </div>
      </div>
    </article>
  );
}
