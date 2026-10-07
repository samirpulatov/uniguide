import { useState } from 'react';
import { docGroups as initialDocGroups, type DocGroup, type DocStatus } from '../mock/studentHub';

const STATUS_LABEL: Record<DocStatus, string> = {
  done: 'Done',
  progress: 'In progress',
  todo: 'To do',
};

export function DocumentsPage() {
  const [groups, setGroups] = useState<DocGroup[]>(initialDocGroups);

  const toggleItem = (groupTitle: string, itemId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.title !== groupTitle
          ? group
          : {
              ...group,
              items: group.items.map((item) =>
                item.id === itemId ? { ...item, status: item.status === 'done' ? 'todo' : 'done' } : item
              ),
            }
      )
    );
  };

  const allItems = groups.flatMap((g) => g.items);
  const doneCount = allItems.filter((i) => i.status === 'done').length;
  const progressPct = Math.round((doneCount / allItems.length) * 100);

  return (
    <div className="page-docs">
      <h1>Documents & Visa Guide</h1>
      <p className="status-message" style={{ display: 'block', margin: '0 0 1.5rem' }}>
        Everything you need to arrive, register and enroll — one step at a time.
      </p>

      <div className="doc-progress">
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="doc-progress-label">{doneCount} of {allItems.length} steps complete</span>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="doc-group">
          <h3 style={{ marginBottom: '0.75rem', opacity: 0.85 }}>{group.title}</h3>
          <div className="task-list">
            {group.items.map((item) => (
              <div key={item.id} className="doc-item">
                <button
                  type="button"
                  className={`task-checkbox ${item.status === 'done' ? 'task-checkbox--done' : ''}`}
                  onClick={() => toggleItem(group.title, item.id)}
                  aria-label={item.status === 'done' ? 'Mark as not done' : 'Mark as done'}
                >
                  {item.status === 'done' && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="doc-item-body">
                  <div className="doc-item-title">{item.title}</div>
                  <div className="doc-item-desc">{item.desc}</div>
                </div>
                <span className={`doc-status-pill doc-status-pill--${item.status}`}>{STATUS_LABEL[item.status]}</span>
                <span className="doc-due">{item.due}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
