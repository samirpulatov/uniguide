import { useState } from 'react';
import { formatDateTime, initialsOf } from '../constants/enumOptions';
import type { ForumReplyResponse } from '../types';

interface ForumReplyItemProps {
  reply: ForumReplyResponse;
  depth: number;
  currentUsername: string | null;
  onReply: (parentReplyId: number, content: string) => Promise<void>;
  onDelete: (replyId: number) => Promise<void>;
}

// Visual indent stops growing after a few levels so deep trees stay readable on narrow screens.
const MAX_INDENT_DEPTH = 5;

// Renders one reply and, recursively, its whole subtree (the backend already nests children in `replies`).
export function ForumReplyItem({ reply, depth, currentUsername, onReply, onDelete }: ForumReplyItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthor = currentUsername !== null && currentUsername === reply.authorName;

  const submit = async () => {
    const content = draft.trim();
    if (!content) return;
    setIsSubmitting(true);
    try {
      await onReply(reply.id, content);
      setDraft('');
      setIsReplying(false);
    } catch {
      // the page shows the error message; keep the draft so the user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={depth > 0 && depth <= MAX_INDENT_DEPTH ? 'reply-children' : undefined}>
      <div className={`reply rise${reply.deleted ? ' reply--deleted' : ''}`}>
        <span className="avatar avatar--sm" aria-hidden="true">
          {reply.authorName === null ? '–' : initialsOf(reply.authorName)}
        </span>
        <div className="reply-main">
          <div className="reply-meta">
            <strong>{reply.deleted ? 'Deleted reply' : reply.authorName}</strong> · {formatDateTime(reply.createdAt)}
          </div>
          <div className="post-body">{reply.deleted ? 'This reply was deleted.' : reply.content}</div>
          {currentUsername && !reply.deleted && (
            <div className="reply-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setIsReplying((prev) => !prev)}>
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
              {isAuthor && (
                <button type="button" className="btn btn--ghost btn--sm btn--danger-hover" onClick={() => onDelete(reply.id)}>
                  Delete
                </button>
              )}
            </div>
          )}
          {isReplying && (
            <div className="reply-inline">
              <textarea
                className="textarea"
                aria-label={`Reply to ${reply.authorName}`}
                placeholder={`Reply to ${reply.authorName}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="button" className="btn btn--primary btn--sm" onClick={submit} disabled={isSubmitting || !draft.trim()}>
                {isSubmitting ? 'Posting…' : 'Post reply'}
              </button>
            </div>
          )}
        </div>
      </div>

      {(reply.replies ?? []).map((child) => (
        <ForumReplyItem
          key={child.id}
          reply={child}
          depth={depth + 1}
          currentUsername={currentUsername}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
