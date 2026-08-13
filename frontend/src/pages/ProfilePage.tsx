import { useState, type FormEvent } from 'react';
import { usersApi } from '../api/users';
import { tokenStorage } from '../api/tokenStorage';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/AuthContext';
import { CITIES, UNIVERSITIES, formatEnumLabel, universitiesForCity } from '../constants/enumOptions';
import type { City, UpdateUserRequest, University } from '../types';

export function ProfilePage() {
  const { user, setUser } = useAuth();

  // `user` is guaranteed to be non-null here because ProfilePage only renders
  // behind ProtectedRoute — but hooks must run unconditionally, so the null
  // check has to come after all of them, with safe fallbacks for the initial state.
  const [form, setForm] = useState<UpdateUserRequest>({
    username: user?.username ?? '',
    email: user?.email ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    city: user?.city ?? null,
    university: user?.university ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleCityChange = (city: City | '') => {
    setForm((prev) => ({ ...prev, city: city || null, university: null }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const response = await usersApi.updateMe(form);
      // username is the JWT subject — the access token must be replaced immediately,
      // otherwise the next request would be rejected as carrying a token for a user that no longer exists.
      tokenStorage.setAccessToken(response.accessToken);
      setUser(response.user);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to update profile.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page auth-page">
      <h1>My profile</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
        </label>
        <label>
          First name
          <input
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </label>
        <label>
          Last name
          <input
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </label>
        <label>
          City
          <select value={form.city ?? ''} onChange={(e) => handleCityChange(e.target.value as City | '')}>
            <option value="">None</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{formatEnumLabel(city)}</option>
            ))}
          </select>
        </label>
        <label>
          University
          <select
            value={form.university ?? ''}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, university: (e.target.value || null) as University | null }))
            }
          >
            <option value="">None</option>
            {(form.city ? universitiesForCity(form.city) : UNIVERSITIES).map((university) => (
              <option key={university} value={university}>{formatEnumLabel(university)}</option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );
}
