import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_TINT, formatEnumLabel, initialsOf, timeAgo } from '../constants/enumOptions';
import { useTilt } from '../hooks/useTilt';
import type { GuideCreationResponse } from '../types';
import { StatusBadge } from './StatusBadge';
import { CapIcon, PinIcon } from './icons';

interface GuideCardProps {
  guide: GuideCreationResponse;
  showStatus?: boolean;
  // position in the list: staggers the entrance animation
  index?: number;
}

export function GuideCard({ guide, showStatus = false, index = 0 }: GuideCardProps) {
  const tilt = useTilt();

  return (
    <Link
      to={`/guides/${guide.id}`}
      className={`card guide-card tilt rise tint-${CATEGORY_TINT[guide.category]}`}
      style={{ '--i': Math.min(index, 8) } as CSSProperties}
      {...tilt}
    >
      <span className="guide-card-stripe" aria-hidden="true" />
      <div className="guide-card-top">
        <span className="tag">{formatEnumLabel(guide.category)}</span>
        {showStatus && <StatusBadge status={guide.status} />}
      </div>
      <h3 className="guide-card-title">{guide.title}</h3>
      {(guide.city || guide.university) && (
        <div className="guide-card-meta">
          {guide.city && (
            <span>
              <PinIcon />
              {formatEnumLabel(guide.city)}
            </span>
          )}
          {guide.university && (
            <span>
              <CapIcon />
              {formatEnumLabel(guide.university)}
            </span>
          )}
        </div>
      )}
      <div className="guide-card-author">
        <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(guide.authorName)}</span>
        <span>
          {guide.authorName} · {timeAgo(guide.createdAt)}
        </span>
      </div>
    </Link>
  );
}
