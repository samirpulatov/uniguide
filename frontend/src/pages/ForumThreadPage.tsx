import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forumApi } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { ForumReplyItem } from '../components/ForumReplyItem';
import { ArrowLeftIcon, EditIcon, TrashIcon } from '../components/icons';
import { formatDateTime, formatEnumLabel, initialsOf } from '../constants/enumOptions';
import type { ForumReplyResponse, ForumThreadResponse } from '../types';

// counts every node in the reply tree, not only the root replies
function countReplies(replies: ForumReplyResponse[] | null): number {
  return (replies ?? []).reduce((sum, reply) => sum + 1 + countReplies(reply.replies), 0);
}

export function ForumThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [thread, setThread] = useState<ForumThreadResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // which thread id the current state belongs to — loading is derived from it instead of a separate flag
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Re-fetch the whole thread after each change: the backend builds the reply tree,
  // so this is simpler and safer than patching the nested structure by hand.
  const loadThread = useCallback(() => {
    return forumApi
      .getThread(Number(id))
      .then((data) => {
        setThread(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, 'Thread not found.')))
      .finally(() => setLoadedId(id ?? null));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadThread();
  }, [id, loadThread]);

  const isLoading = loadedId !== id;

  const postReply = async (content: string, parentReplyId: number | null) => {
    setActionError(null);
    try {
      await forumApi.createReply(Number(id), { content, parentReplyId });
      await loadThread();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to post the reply.'));
      throw err;
    }
  };

  const handleRootReply = async () => {
    const content = draft.trim();
    if (!content) return;
    setIsPosting(true);
    try {
      await postReply(content, null);
      setDraft('');
    } catch {
      // error already shown via actionError
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!window.confirm('Delete this reply?')) return;
    setActionError(null);
    try {
      await forumApi.deleteReply(replyId);
      await loadThread();
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete the reply.'));
    }
  };

  const handleDeleteThread = async () => {
    if (!thread || !window.confirm('Delete this thread and all its replies? This cannot be undone.')) return;
    setActionError(null);
    try {
      await forumApi.deleteThread(thread.id);
      navigate('/forum', { replace: true });
    } catch (err) {
      setActionError(extractErrorMessage(err, 'Failed to delete the thread.'));
    }
  };

  if (isLoading) return <p className="status-message page-thread">Loading…</p>;
  if (loadError) return <p className="message message--error page-thread">{loadError}</p>;
  if (!thread) return null;

  const isAuthor = user?.username === thread.authorName;
  const replyCount = countReplies(thread.replies);
  const wasEdited = thread.updatedAt && thread.updatedAt !== thread.createdAt;

  return (
    <div className="page-thread">
      <Link to="/forum" className="back-link">
        <ArrowLeftIcon />
        All threads
      </Link>

      <article className="card reading-card rise">
        <div className="guide-detail-top">
          {thread.forumCategory && <span className="tag">{formatEnumLabel(thread.forumCategory)}</span>}
          {thread.city && <span className="tag tag--outline">{formatEnumLabel(thread.city)}</span>}
          {thread.university && <span className="tag tag--outline">{formatEnumLabel(thread.university)}</span>}
          {!thread.forumCategory && !thread.city && <span className="tag tag--neutral">Announcement</span>}
        </div>
        <h1 className="reading-title">{thread.title}</h1>
        <div className="byline">
          <span className="avatar avatar--sm" aria-hidden="true">{initialsOf(thread.authorName)}</span>
          <span>
            <strong>{thread.authorName}</strong> · {formatDateTime(thread.createdAt)}
            {wasEdited ? ' (edited)' : ''}
          </span>
        </div>
        <div className="post-body">{thread.content}</div>
        {isAuthor && (
          <div className="reading-actions">
            <Link to={`/forum/${thread.id}/edit`} className="btn btn--secondary btn--sm">
              <EditIcon />
              Edit
            </Link>
            <button type="button" className="btn btn--danger btn--sm" onClick={handleDeleteThread}>
              <TrashIcon />
              Delete
            </button>
          </div>
        )}
      </article>

      {actionError && <p className="message message--error">{actionError}</p>}

      <h2 className="replies-title">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </h2>
      <div className="reply-list">
        {(thread.replies ?? []).map((reply) => (
          <ForumReplyItem
            key={reply.id}
            reply={reply}
            depth={0}
            currentUsername={user?.username ?? null}
            onReply={(parentReplyId, content) => postReply(content, parentReplyId)}
            onDelete={handleDeleteReply}
          />
        ))}
      </div>

      {user ? (
        <div className="card glass reply-composer">
          <label className="field">
            <span className="field-label">Write a reply</span>
            <textarea
              className="textarea"
              placeholder="Share what you know — someone else is probably wondering the same thing."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <button type="button" className="btn btn--primary" onClick={handleRootReply} disabled={isPosting || !draft.trim()}>
            {isPosting ? 'Posting…' : 'Post reply'}
          </button>
        </div>
      ) : (
        <div className="empty">
          <span>
            <Link to="/login" state={{ from: { pathname: `/forum/${thread.id}` } }}>Log in</Link> to join the discussion.
          </span>
        </div>
      )}
    </div>
  );
}
