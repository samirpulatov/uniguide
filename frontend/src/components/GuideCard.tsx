import { Link } from 'react-router-dom';
import type { GuideCreationResponse } from '../types';
import { StatusBadge } from './StatusBadge';

export function GuideCard({ guide, showStatus = false }: { guide: GuideCreationResponse; showStatus?: boolean }) {
  return (
    <Link to={`/guides/${guide.id}`} className="guide-card">
      <div className="guide-card-header">
        <h3>{guide.title}</h3>
        {showStatus && <StatusBadge status={guide.status} />}
      </div>
      <p className="guide-card-meta">
        {guide.category}
        {guide.city ? ` · ${guide.city}` : ''}
        {guide.university ? ` · ${guide.university}` : ''}
      </p>
      <p className="guide-card-author">by {guide.authorName}</p>
    </Link>
  );
}
