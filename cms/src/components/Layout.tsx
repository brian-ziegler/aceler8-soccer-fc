import { NavLink, useNavigate } from 'react-router-dom';
import { logout, getUserRole } from '../lib/auth';
import PublishBar from './PublishBar';

interface LayoutProps {
  children: React.ReactNode;
}

const baseNavLinks = [
  { to: '/', label: 'Dashboard', exact: true },
  { to: '/coaches', label: 'Coaches', exact: false },
  { to: '/players', label: 'Players', exact: false },
  { to: '/teams', label: 'Teams', exact: false },
  { to: '/hero-slides', label: 'Hero Slides', exact: false },
  { to: '/media', label: 'Media', exact: false },
];

const adminNavLinks = [
  { to: '/users', label: 'Users', exact: false },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const role = getUserRole();
  const navLinks = role === 'admin' ? [...baseNavLinks, ...adminNavLinks] : baseNavLinks;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Aceler8 CMS</div>
        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">Aceler8 FC</span>
          <PublishBar />
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
