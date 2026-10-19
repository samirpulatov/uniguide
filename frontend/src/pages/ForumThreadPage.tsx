import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { forumApi } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { ForumReplyItem } from '../components/ForumReplyItem';
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

  if (isLoading) return <p className="status-message">Loading...</p>;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!thread) return null;

  const isAuthor = user?.username === thread.authorName;
  const replyCount = countReplies(thread.replies);

  return (
    <div className="page-thread">
      <Link to="/forum" className="forum-back-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to forum
      </Link>

      <h1 style={{ fontSize: '1.6rem', marginBottom: '0.9rem' }}>{thread.title}</h1>
      <div className="forum-thread-tags" style={{ marginBottom: '1.5rem' }}>
        {thread.forumCategory && <span className="forum-tag">{formatEnumLabel(thread.forumCategory)}</span>}
        {thread.city && <span className="forum-tag forum-tag--outline">{formatEnumLabel(thread.city)}</span>}
        {thread.university && <span className="forum-tag forum-tag--outline">{formatEnumLabel(thread.university)}</span>}
        {!thread.forumCategory && !thread.city && <span className="forum-tag">Announcement</span>}
      </div>

      <div className="forum-post">
        <div className="forum-avatar">{initialsOf(thread.authorName)}</div>
        <div style={{ flex: 1 }}>
          <div className="forum-post-meta">
            <strong>{thread.authorName}</strong>{' '}
            <span style={{ opacity: 0.5 }}>
              · {formatDateTime(thread.createdAt)}
              {thread.updatedAt && thread.updatedAt !== thread.createdAt ? ' (edited)' : ''}
            </span>
          </div>
          <div className="forum-post-body">{thread.content}</div>
          {isAuthor && (
            <div className="guide-actions">
              <Link to={`/forum/${thread.id}/edit`}>Edit</Link>
              <button type="button" onClick={handleDeleteThread}>Delete</button>
            </div>
          )}
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}

      <h3 style={{ marginBottom: '1rem', opacity: 0.8 }}>
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </h3>
      <div style={{ marginBottom: '2rem' }}>
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
        <div className="forum-reply-box">
          <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.4rem' }}>
            Write a reply
          </label>
          <textarea
            placeholder="Share what you know — someone else is probably wondering the same thing."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="button" className="button-outline" onClick={handleRootReply} disabled={isPosting || !draft.trim()}>
            {isPosting ? 'Posting...' : 'Post reply'}
          </button>
        </div>
      ) : (
        <p className="status-message">
          <Link to="/login" state={{ from: { pathname: `/forum/${thread.id}` } }}>Log in</Link> to join the discussion.
        </p>
      )}
    </div>
  );
}
