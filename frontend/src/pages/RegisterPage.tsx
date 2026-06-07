import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/errors';
import type { RegisterRequest } from '../types';

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
    <div className="auth-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input value={form.username} onChange={updateField('username')} required />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={updateField('email')} required />
        </label>
        <label>
          First name
          <input value={form.firstName} onChange={updateField('firstName')} required />
        </label>
        <label>
          Last name
          <input value={form.lastName} onChange={updateField('lastName')} required />
        </label>
        <label>
          Password
          <input type="password" minLength={8} value={form.password} onChange={updateField('password')} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account...' : 'Register'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
