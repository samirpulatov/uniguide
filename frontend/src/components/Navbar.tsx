import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase() || '?';
}

// links that make sense without an account (the backend serves them publicly)
const PUBLIC_LINKS = ['/', '/forum'];

const NAV_LINKS = [
  { to: '/', label: 'Guides', match: (path: string) => path === '/' || path.startsWith('/guides') },
  { to: '/dashboard', label: 'Dashboard', match: (path: string) => path === '/dashboard' },
  { to: '/my-guides', label: 'My Guides', match: (path: string) => path === '/my-guides' },
  { to: '/documents', label: 'Documents', match: (path: string) => path === '/documents' },
  { to: '/housing', label: 'Housing', match: (path: string) => path.startsWith('/housing') },
  { to: '/courses', label: 'Courses', match: (path: string) => path === '/courses' },
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
        <span className="navbar-brand-mark">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l9 5-9 5-9-5 9-5Z" />
            <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
          </svg>
        </span>
        UniGuide
      </Link>
      <div className="navbar-links">
        {NAV_LINKS.filter((link) => user || PUBLIC_LINKS.includes(link.to)).map((link) => (
          <Link key={link.to} to={link.to} aria-current={link.match(location.pathname) ? 'page' : undefined}>
            {link.label}
          </Link>
        ))}
        {user?.role === 'ADMIN' && (
          <Link to="/admin" aria-current={location.pathname === '/admin' ? 'page' : undefined}>Admin</Link>
        )}
        {user ? (
          <>
            <Link to="/profile" className="navbar-avatar">{initials(user.firstName, user.lastName)}</Link>
            <button type="button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
