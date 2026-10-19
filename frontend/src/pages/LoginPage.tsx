import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { extractErrorMessage } from '../api/errors';
import { AuthCard, IconInput, PasswordInput, UserIcon } from '../components/AuthCard';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/';

  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ login: loginField, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed. Check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Log in"
      subtitle="Welcome back to UniGuide"
      helper="Log in to access guides, join the community and more."
    >
      <form onSubmit={handleSubmit} className="form auth-form">
        <label>
          Username or email
          <IconInput
            icon={<UserIcon />}
            value={loginField}
            onChange={(e) => setLoginField(e.target.value)}
            placeholder="Enter your username or email"
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="auth-switch">No account yet? <Link to="/register">Register</Link></p>
    </AuthCard>
  );
}
