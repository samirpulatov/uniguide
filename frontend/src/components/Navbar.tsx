import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogoMark } from './LogoMark';
import { ThemeToggle } from './ThemeToggle';

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
}

// links that make sense without an account (the backend serves them publicly)
const PUBLIC_LINKS = ['/', '/jobs', '/forum'];

const NAV_LINKS = [
  { to: '/', label: 'Guides', match: (path: string) => path === '/' || path.startsWith('/guides') },
  { to: '/dashboard', label: 'Dashboard', match: (path: string) => path === '/dashboard' },
  { to: '/my-guides', label: 'My Guides', match: (path: string) => path === '/my-guides' },
  { to: '/housing', label: 'Housing', match: (path: string) => path.startsWith('/housing') },
  { to: '/jobs', label: 'Jobs', match: (path: string) => path.startsWith('/jobs') },
  { to: '/forum', label: 'Community', match: (path: string) => path.startsWith('/forum') },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <LogoMark className="navbar-brand-mark" />
        <span>
          Uni<span className="navbar-brand-accent">Guide</span>
        </span>
      </Link>
      <div className="navbar-links">
        {NAV_LINKS.filter((link) => user || PUBLIC_LINKS.includes(link.to)).map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="navbar-link"
            aria-current={link.match(location.pathname) ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
        {user?.role === 'ADMIN' && (
          <Link to="/admin" className="navbar-link" aria-current={location.pathname === '/admin' ? 'page' : undefined}>
            Admin
          </Link>
        )}
      </div>
      <div className="navbar-actions">
        <ThemeToggle />
        {user ? (
          <>
            <Link
              to="/profile"
              className="avatar"
              aria-label="My profile"
              title="My profile"
              aria-current={location.pathname === '/profile' ? 'page' : undefined}
            >
              {initials(user.firstName, user.lastName)}
            </Link>
            <button type="button" className="btn btn--secondary btn--sm" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
            <Link to="/register" className="btn btn--primary btn--sm">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
