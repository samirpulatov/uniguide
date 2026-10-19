import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { todosApi } from '../api/todos';
import { extractErrorMessage } from '../api/errors';
import { CheckIcon, EditIcon, PlusIcon, TrashIcon } from '../components/icons';
import { PersonalFeed } from '../components/PersonalFeed';
import { useAuth } from '../context/useAuth';
import type { TodoTaskResponse } from '../types';

// matches @Size(max = 100) in TodoTaskCreationRequest on the backend
const MAX_CONTENT_LENGTH = 100;

// Backend sends LocalDateTime without a zone, so it is parsed as local time
function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TodoTaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // the "+" button opens an input row at the bottom of the list
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // inline editing of one task at a time
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // ids of tasks with a request in flight, so their buttons can't be clicked twice
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    todosApi
      .getTodos()
      .then(setTasks)
      .catch((err) => setError(extractErrorMessage(err, 'Could not load your tasks.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const setBusy = (id: number, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const closeAddRow = () => {
    setIsAdding(false);
    setNewContent('');
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content) return;
    setError(null);
    setIsSaving(true);
    try {
      const created = await todosApi.createTodo({ content });
      // append: the list is oldest first, same order as the backend returns it
      setTasks((prev) => [...prev, created]);
      setNewContent('');
      inputRef.current?.focus();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not add the task.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') closeAddRow();
  };

  const handleToggle = async (task: TodoTaskResponse) => {
    setError(null);
    setBusy(task.id, true);
    try {
      const updated = await todosApi.updateTodo(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update the task.'));
    } finally {
      setBusy(task.id, false);
    }
  };

  const startEditing = (task: TodoTaskResponse) => {
    setEditingId(task.id);
    setEditContent(task.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleEditSave = async (e: FormEvent, task: TodoTaskResponse) => {
    e.preventDefault();
    const content = editContent.trim();
    // nothing changed: just close, no request
    if (content === task.content) {
      cancelEditing();
      return;
    }
    // the backend rejects blank content with 400 anyway; don't send it
    if (!content) return;
    setError(null);
    setBusy(task.id, true);
    try {
      // PATCH only content, so completed stays as it is
      const updated = await todosApi.updateTodo(task.id, { content });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      cancelEditing();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not save the task.'));
    } finally {
      setBusy(task.id, false);
    }
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') cancelEditing();
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setBusy(id, true);
    try {
      await todosApi.deleteTodo(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not delete the task.'));
    } finally {
      setBusy(id, false);
    }
  };

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="page-wide dashboard">
      <header className="page-head">
        <div>
          <p className="t-eyebrow page-eyebrow">{today}</p>
          <h1>
            {greeting}
            {user ? `, ${user.firstName}` : ''}
          </h1>
          <p className="page-lead">Your tasks and what's new around your university.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <section className="card todo-card rise" aria-labelledby="todo-title">
          <header className="panel-head">
            <div>
              <h2 id="todo-title" className="card-title">To-do</h2>
              <p className="card-subtitle">
                {tasks.length === 0 ? 'Nothing planned yet' : `${doneCount} of ${tasks.length} done`}
              </p>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setIsAdding(true)}
              title="Add a task"
            >
              <PlusIcon />
              Add task
            </button>
          </header>

          {tasks.length > 0 && (
            <div
              className="todo-progress"
              role="progressbar"
              aria-label="Tasks done"
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-valuenow={doneCount}
            >
              <span style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
          )}

          {error && <p className="message message--error">{error}</p>}

          {isLoading ? (
            <p className="panel-empty">Loading…</p>
          ) : (
            <ul className="todo-list">
              {tasks.length === 0 && !isAdding && (
                <li className="panel-empty">No tasks yet. Add your first one — for example "Book Anmeldung appointment".</li>
              )}

              {tasks.map((task) => {
                const busy = busyIds.has(task.id);

                if (editingId === task.id) {
                  return (
                    <li key={task.id} className="todo-item todo-item--editing">
                      <form onSubmit={(e) => handleEditSave(e, task)} className="todo-form">
                        <input
                          autoFocus
                          className="input"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          maxLength={MAX_CONTENT_LENGTH}
                          aria-label="Edit task"
                          disabled={busy}
                        />
                        <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !editContent.trim()}>
                          Save
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </form>
                    </li>
                  );
                }

                return (
                  <li key={task.id} className="todo-item">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={task.completed}
                      className="checkbox"
                      onClick={() => handleToggle(task)}
                      disabled={busy}
                      aria-label={task.content}
                    >
                      {task.completed && <CheckIcon />}
                    </button>
                    <span
                      className={`todo-item-text${task.completed ? ' todo-item-text--done' : ''}`}
                      onDoubleClick={() => startEditing(task)}
                      title="Double-click to edit"
                    >
                      {task.content}
                    </span>
                    <span className="todo-item-date">{formatCreatedAt(task.createdAt)}</span>
                    <span className="todo-item-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon btn--sm"
                        onClick={() => startEditing(task)}
                        disabled={busy}
                        aria-label={`Edit "${task.content}"`}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon btn--sm btn--danger-hover"
                        onClick={() => handleDelete(task.id)}
                        disabled={busy}
                        aria-label={`Delete "${task.content}"`}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </span>
                  </li>
                );
              })}

              {isAdding && (
                <li className="todo-item todo-item--editing">
                  <form onSubmit={handleCreate} className="todo-form">
                    <input
                      ref={inputRef}
                      className="input"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      onKeyDown={handleAddKeyDown}
                      maxLength={MAX_CONTENT_LENGTH}
                      placeholder="What do you need to do?"
                      aria-label="New task"
                      disabled={isSaving}
                    />
                    <button type="submit" className="btn btn--primary btn--sm" disabled={isSaving || !newContent.trim()}>
                      Add
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={closeAddRow}>
                      Cancel
                    </button>
                  </form>
                </li>
              )}
            </ul>
          )}
        </section>
        <PersonalFeed city={user?.city ?? null} university={user?.university ?? null} />
      </div>
    </div>
  );
}
