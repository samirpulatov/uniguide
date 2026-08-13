import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { guidesApi } from '../api/guides';
import { extractErrorMessage } from '../api/errors';
import { CITIES, GUIDE_CATEGORIES, formatEnumLabel, universitiesForCity } from '../constants/enumOptions';
import type { City, GuideCategory, GuideCreationRequest, University } from '../types';

const emptyForm: GuideCreationRequest = {
  title: '',
  content: '',
  guideCategory: 'OTHER',
  city: null,
  university: null,
};

export function GuideFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = id !== undefined;
  const navigate = useNavigate();

  const [form, setForm] = useState<GuideCreationRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    guidesApi
      .getById(Number(id))
      .then((guide) => {
        setForm({
          title: guide.title,
          content: guide.content,
          guideCategory: guide.category,
          city: guide.city,
          university: guide.university,
        });
      })
      .catch((err) => setError(extractErrorMessage(err, 'Failed to load the guide.')))
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
        ? await guidesApi.update(Number(id), form)
        : await guidesApi.create(form);
      navigate(`/guides/${saved.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to save the guide.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p className="status-message">Loading...</p>;

  return (
    <div className="page">
      <h1>{isEditMode ? 'Edit guide' : 'New guide'}</h1>
      {isEditMode && (
        <p className="status-message">Saving will reset this guide's status to Pending for re-review.</p>
      )}
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
            rows={10}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            required
          />
        </label>
        <label>
          Category
          <select
            value={form.guideCategory}
            onChange={(e) => setForm((prev) => ({ ...prev, guideCategory: e.target.value as GuideCategory }))}
            required
          >
            {GUIDE_CATEGORIES.map((category) => (
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
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save changes' : 'Publish guide'}
        </button>
      </form>
    </div>
  );
}
