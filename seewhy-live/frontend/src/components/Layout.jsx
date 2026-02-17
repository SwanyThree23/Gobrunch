import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left">
          <Link to="/" className="logo">
            SeeWhy <span className="logo-live">LIVE</span>
          </Link>
          <Link to="/" className="nav-link">Feed</Link>
          <Link to="/live" className="nav-link">Live Rooms</Link>
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <Link to="/upload" className="btn btn-primary btn-sm">Upload</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to={`/user/${user.username}`} className="nav-link nav-user">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar-placeholder">{(user.display_name || user.username)[0].toUpperCase()}</div>
                )}
                {user.display_name || user.username}
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
