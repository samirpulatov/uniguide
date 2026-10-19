import { useState, type CSSProperties, type FormEvent } from 'react';
import { usersApi } from '../api/users';
import { tokenStorage } from '../api/tokenStorage';
import { extractErrorMessage } from '../api/errors';
import { useAuth } from '../context/useAuth';
import { CITIES, UNIVERSITIES, formatEnumLabel, universitiesForCity } from '../constants/enumOptions';
import type { City, UpdateUserRequest, University } from '../types';
import {
  GraduationCapIcon,
  IconInput,
  IconSelect,
  MailIcon,
  MapPinIcon,
  PasswordInput,
  UserIcon,
} from '../components/AuthCard';

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

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

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

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const tokens = await usersApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      // the backend rotates the refresh token on password change, so both tokens must be replaced
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Password changed.');
    } catch (err) {
      setPasswordError(extractErrorMessage(err, 'Failed to change password.'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page-wide profile-page">
      <header className="page-head">
        <div>
          <h1>My profile</h1>
          <p className="page-lead">Manage your personal information and account settings.</p>
        </div>
      </header>

      <div className="profile-grid">
        <aside className="card glass profile-summary rise" aria-label="Your account">
          <span className="profile-avatar-ring" aria-hidden="true">
            <span className="avatar avatar--lg">
              {initials || <UserIcon />}
            </span>
          </span>
          <p className="profile-summary-name">
            {user.firstName} {user.lastName}
          </p>
          <p className="profile-summary-handle">@{user.username}</p>
          <dl className="profile-facts">
            <div>
              <dt><MailIcon /> Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt><MapPinIcon /> City</dt>
              <dd>{user.city ? formatEnumLabel(user.city) : 'Not set'}</dd>
            </div>
            <div>
              <dt><GraduationCapIcon /> University</dt>
              <dd>{user.university ? formatEnumLabel(user.university) : 'Not set'}</dd>
            </div>
          </dl>
          {!user.city && !user.university && (
            <p className="field-hint">Add your city or university to get a personal feed on the dashboard.</p>
          )}
        </aside>

        <div className="profile-forms">
          <section className="card profile-card rise" style={{ '--i': 1 } as CSSProperties} aria-labelledby="profile-info-title">
            <h2 id="profile-info-title" className="card-title">Personal information</h2>
            <p className="card-subtitle">
              Update your personal details. This information may be visible to other users.
            </p>

            <form onSubmit={handleSubmit} className="form profile-form">
              <div className="profile-field">
                <label htmlFor="profile-username">Username</label>
                <IconInput
                  id="profile-username"
                  icon={<UserIcon />}
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <div className="profile-field">
                  <label htmlFor="profile-first-name">First name</label>
                  <IconInput
                    id="profile-first-name"
                    icon={<UserIcon />}
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="profile-last-name">Last name</label>
                  <IconInput
                    id="profile-last-name"
                    icon={<UserIcon />}
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="profile-field">
                  <label htmlFor="profile-city">City</label>
                  <IconSelect
                    id="profile-city"
                    icon={<MapPinIcon />}
                    value={form.city ?? ''}
                    onChange={(e) => handleCityChange(e.target.value as City | '')}
                  >
                    <option value="">None</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{formatEnumLabel(city)}</option>
                    ))}
                  </IconSelect>
                </div>
                <div className="profile-field">
                  <label htmlFor="profile-university">University</label>
                  <IconSelect
                    id="profile-university"
                    icon={<GraduationCapIcon />}
                    value={form.university ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, university: (e.target.value || null) as University | null }))
                    }
                  >
                    <option value="">None</option>
                    {(form.city ? universitiesForCity(form.city) : UNIVERSITIES).map((university) => (
                      <option key={university} value={university}>{formatEnumLabel(university)}</option>
                    ))}
                  </IconSelect>
                </div>
              </div>
              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <IconInput
                  id="profile-email"
                  icon={<MailIcon />}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              {error && <p className="message message--error" role="alert">{error}</p>}
              {success && <p className="message message--success" role="status">{success}</p>}
              <button type="submit" className="btn btn--primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save changes'}</button>
            </form>
          </section>

          <section className="card profile-card rise" style={{ '--i': 2 } as CSSProperties} aria-labelledby="profile-password-title">
            <h2 id="profile-password-title" className="card-title">Change password</h2>
            <p className="card-subtitle">Update your password to keep your account secure.</p>

            <form onSubmit={handlePasswordSubmit} className="form profile-form">
              <div className="profile-field">
                <label htmlFor="profile-current-password">Current password</label>
                <PasswordInput
                  id="profile-current-password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-new-password">New password</label>
                <PasswordInput
                  id="profile-new-password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-field">
                <label htmlFor="profile-confirm-password">Confirm new password</label>
                <PasswordInput
                  id="profile-confirm-password"
                  autoComplete="new-password"
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              {passwordError && <p className="message message--error" role="alert">{passwordError}</p>}
              {passwordSuccess && <p className="message message--success" role="status">{passwordSuccess}</p>}
              <button type="submit" className="btn btn--primary" disabled={isChangingPassword}>
                {isChangingPassword ? 'Saving...' : 'Change password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
