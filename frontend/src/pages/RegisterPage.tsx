import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/errors';
import type { RegisterRequest } from '../types';
import { AuthCard, IconInput, MailIcon, PasswordInput, UserIcon } from '../components/AuthCard';

const initialForm: RegisterRequest = {
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterRequest>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof RegisterRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Registration failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Register"
      subtitle="Join UniGuide"
      helper="Create an account to write guides and take part in the community."
    >
      <form onSubmit={handleSubmit} className="form auth-form">
        <label>
          Username
          <IconInput
            icon={<UserIcon />}
            value={form.username}
            onChange={updateField('username')}
            placeholder="Choose a username"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Email
          <IconInput
            icon={<MailIcon />}
            type="email"
            value={form.email}
            onChange={updateField('email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <div className="form-row">
          <label>
            First name
            <IconInput
              icon={<UserIcon />}
              value={form.firstName}
              onChange={updateField('firstName')}
              placeholder="First name"
              autoComplete="given-name"
              required
            />
          </label>
          <label>
            Last name
            <IconInput
              icon={<UserIcon />}
              value={form.lastName}
              onChange={updateField('lastName')}
              placeholder="Last name"
              autoComplete="family-name"
              required
            />
          </label>
        </div>
        <label>
          Password
          <PasswordInput
            minLength={8}
            value={form.password}
            onChange={updateField('password')}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Register'}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
    </AuthCard>
  );
}
