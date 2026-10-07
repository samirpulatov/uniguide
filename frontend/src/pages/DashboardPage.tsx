import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardTasks, type DashboardTask } from '../mock/studentHub';

const QUICK_LINKS = [
  { to: '/documents', title: 'Documents', desc: 'Visa & paperwork checklist' },
  { to: '/housing', title: 'Housing', desc: 'Find your next home' },
  { to: '/courses', title: 'Courses', desc: 'Your weekly schedule' },
  { to: '/forum', title: 'Community', desc: 'Ask & connect with peers' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DashboardTask[]>(dashboardTasks);

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const doneCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="page-wide">
      <h1>Welcome back, {user?.firstName ?? 'there'}</h1>
      <p className="status-message" style={{ display: 'block', margin: '0 0 2.25rem' }}>
        You have {tasks.length - doneCount} tasks left to finish this month. You're doing fine.
      </p>

      <div className="dashboard-grid">
        <div>
          <h3 style={{ marginBottom: '0.9rem', opacity: 0.85 }}>Pending tasks</h3>
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-row">
                <button
                  type="button"
                  className={`task-checkbox ${task.done ? 'task-checkbox--done' : ''}`}
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {task.done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className={`task-title ${task.done ? 'task-title--done' : ''}`}>{task.title}</span>
                <span className="task-tag">{task.category}</span>
                <span className="task-due">{task.due}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="progress-card">
            <h3 style={{ marginBottom: '0.75rem', opacity: 0.85 }}>Overall progress</h3>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="progress-label">{doneCount} of {tasks.length} tasks complete</div>
          </div>

          <div>
            <h3 style={{ marginBottom: '0.9rem', opacity: 0.85 }}>Quick links</h3>
            <div className="quick-links">
              {QUICK_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="quick-link-card">
                  <div className="quick-link-title">{link.title}</div>
                  <div className="quick-link-desc">{link.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
