import { Link } from 'react-router-dom';
import { formatEnumLabel, initialsOf } from '../../constants/enumOptions';
import type { ForumThreadResponse } from '../../types';

// A slowly scrolling strip of the newest forum threads. Renders nothing when there are none —
// it is a teaser, not the forum itself.
export function QuestionMarquee({ threads }: { threads: ForumThreadResponse[] }) {
  if (threads.length === 0) return null;

  // the list is rendered twice so the -50% translate loops seamlessly; the copy is hidden from AT
  const pill = (thread: ForumThreadResponse, copy: boolean) => (
    <Link
      key={`${copy ? 'b' : 'a'}-${thread.id}`}
      to={`/forum/${thread.id}`}
      className="marquee-pill"
      tabIndex={copy ? -1 : undefined}
      aria-hidden={copy || undefined}
    >
      <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(thread.authorName)}</span>
      {thread.title}
      {(thread.city || thread.forumCategory) && (
        <small>{formatEnumLabel(thread.city ?? thread.forumCategory!)}</small>
      )}
    </Link>
  );

  return (
    <section className="marquee" aria-label="Latest questions in the community">
      <div className="marquee-track">
        {threads.map((t) => pill(t, false))}
        {threads.map((t) => pill(t, true))}
      </div>
    </section>
  );
}
