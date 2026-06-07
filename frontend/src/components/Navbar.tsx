import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">UniGuide</Link>
      <div className="navbar-links">
        <Link to="/">Guides</Link>
        {user && <Link to="/my-guides">My Guides</Link>}
        {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
        {user ? (
          <>
            <Link to="/profile">{user.username}</Link>
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
