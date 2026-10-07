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
    <div className={depth > 0 && depth <= MAX_INDENT_DEPTH ? 'forum-reply-children' : undefined}>
      <div className={`forum-reply${reply.deleted ? ' forum-reply--deleted' : ''}`}>
        <div className="forum-avatar" style={{ width: 30, height: 30 }}>
          {reply.deleted ? '–' : initialsOf(reply.authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="forum-post-meta">
            <strong>{reply.deleted ? 'Deleted reply' : reply.authorName}</strong>{' '}
            <span style={{ opacity: 0.5 }}>· {formatDateTime(reply.createdAt)}</span>
          </div>
          <div className="forum-post-body">
            {reply.deleted ? 'This reply was deleted.' : reply.content}
          </div>
          {currentUsername && !reply.deleted && (
            <div className="forum-reply-actions">
              <button type="button" onClick={() => setIsReplying((prev) => !prev)}>
                {isReplying ? 'Cancel' : 'Reply'}
              </button>
              {isAuthor && (
                <button type="button" className="forum-reply-actions-danger" onClick={() => onDelete(reply.id)}>
                  Delete
                </button>
              )}
            </div>
          )}
          {isReplying && (
            <div className="forum-reply-box forum-reply-box--inline">
              <textarea
                placeholder={`Reply to ${reply.authorName}...`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button type="button" className="button-outline" onClick={submit} disabled={isSubmitting || !draft.trim()}>
                {isSubmitting ? 'Posting...' : 'Post reply'}
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
