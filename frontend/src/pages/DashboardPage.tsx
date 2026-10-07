import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { todosApi } from '../api/todos';
import { extractErrorMessage } from '../api/errors';
import { PageDecor } from '../components/AuthCard';
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

  return (
    <div className="page">
      <PageDecor />
      <section className="glass-card todo-card">
        <header className="todo-header">
          <div>
            <span className="accent-line" aria-hidden="true" />
            <h1 className="todo-title">To-do</h1>
            <p className="todo-date">{today}</p>
          </div>
          <button
            type="button"
            className="todo-add-button"
            onClick={() => setIsAdding(true)}
            aria-label="Add a task"
            title="Add a task"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </header>

        {error && <p className="form-error">{error}</p>}

        {isLoading ? (
          <p className="todo-empty">Loading…</p>
        ) : (
          <ul className="todo-list">
            {tasks.length === 0 && !isAdding && (
              <li className="todo-empty">No tasks yet. Press + to add your first one.</li>
            )}

            {tasks.map((task) => {
              const busy = busyIds.has(task.id);

              if (editingId === task.id) {
                return (
                  <li key={task.id} className="todo-row todo-row--new">
                    <form onSubmit={(e) => handleEditSave(e, task)} className="todo-new-form">
                      <input
                        autoFocus
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        maxLength={MAX_CONTENT_LENGTH}
                        aria-label="Edit task"
                        disabled={busy}
                      />
                      <button type="submit" disabled={busy || !editContent.trim()}>
                        Save
                      </button>
                      <button type="button" className="todo-cancel" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </form>
                  </li>
                );
              }

              return (
                <li key={task.id} className="todo-row">
                  <button
                    type="button"
                    className={`task-checkbox ${task.completed ? 'task-checkbox--done' : ''}`}
                    onClick={() => handleToggle(task)}
                    disabled={busy}
                    aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
                  >
                    {task.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`todo-content ${task.completed ? 'todo-content--done' : ''}`}
                    onDoubleClick={() => startEditing(task)}
                    title="Double-click to edit"
                  >
                    {task.content}
                  </span>
                  <span className="todo-created">{formatCreatedAt(task.createdAt)}</span>
                  <button
                    type="button"
                    className="todo-icon-button"
                    onClick={() => startEditing(task)}
                    disabled={busy}
                    aria-label={`Edit "${task.content}"`}
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="todo-icon-button todo-icon-button--danger"
                    onClick={() => handleDelete(task.id)}
                    disabled={busy}
                    aria-label={`Delete "${task.content}"`}
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                    </svg>
                  </button>
                </li>
              );
            })}

            {isAdding && (
              <li className="todo-row todo-row--new">
                <form onSubmit={handleCreate} className="todo-new-form">
                  <input
                    ref={inputRef}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    maxLength={MAX_CONTENT_LENGTH}
                    placeholder="What do you need to do?"
                    aria-label="New task"
                    disabled={isSaving}
                  />
                  <button type="submit" disabled={isSaving || !newContent.trim()}>
                    Add
                  </button>
                  <button type="button" className="todo-cancel" onClick={closeAddRow}>
                    Cancel
                  </button>
                </form>
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
