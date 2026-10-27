import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { forumApi } from '../api/forum';
import { extractErrorMessage } from '../api/errors';
import { CITIES, FORUM_CATEGORIES, formatEnumLabel, universitiesForCity } from '../constants/enumOptions';
import type { City, ForumCategory, ForumThreadRequest, University } from '../types';

const emptyForm: ForumThreadRequest = {
  title: '',
  content: '',
  forumCategory: null,
  city: null,
  university: null,
};

export function ForumThreadFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState<ForumThreadRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    forumApi
      .getThread(Number(id))
      .then((thread) => {
        setForm({
          title: thread.title,
          content: thread.content,
          forumCategory: thread.forumCategory,
          city: thread.city,
          university: thread.university,
        });
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load the thread.')))
      .finally(() => setIsLoading(false));
  }, [id, isEditMode]);

  const handleCityChange = (city: City | '') => {
    setForm((prev) => ({ ...prev, city: city || null, university: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const saved = isEditMode
        ? await forumApi.updateThread(Number(id), form)
        : await forumApi.createThread(form);
      navigate(`/forum/${saved.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save the thread.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="status-message">Loading...</p>;

  return (
    <div className="page">
      <h1>{isEditMode ? 'Edit thread' : 'New thread'}</h1>
      <p className="status-message">Leaving both category and city empty posts it as a general announcement.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Title
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
        </label>
        <label>
          Content
          <textarea
            rows={8}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            required
          />
        </label>
        <label>
          Category (optional)
          <select
            value={form.forumCategory ?? ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, forumCategory: (e.target.value || null) as ForumCategory | null }))
            }
          >
            <option value="">None</option>
            {FORUM_CATEGORIES.map((category) => (
              <option key={category} value={category}>{formatEnumLabel(category)}</option>
            ))}
          </select>
        </label>
        <label>
          City (optional)
          <select value={form.city ?? ''} onChange={(e) => handleCityChange(e.target.value as City | '')}>
            <option value="">None</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{formatEnumLabel(city)}</option>
            ))}
          </select>
        </label>
        <label>
          University (optional)
          <select
            value={form.university ?? ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, university: (e.target.value || null) as University | null }))
            }
          >
            <option value="">None</option>
            {universitiesForCity(form.city).map((university) => (
              <option key={university} value={university}>{formatEnumLabel(university)}</option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Post thread'}
        </button>
      </form>
    </div>
  );
}
