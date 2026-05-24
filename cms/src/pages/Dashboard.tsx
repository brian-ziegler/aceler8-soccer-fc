import { Link } from 'react-router-dom';

const sections = [
  { to: '/coaches', label: 'Coaches', description: 'Manage coaching staff profiles' },
  { to: '/players', label: 'Players', description: 'Manage player roster' },
  { to: '/teams', label: 'Teams', description: 'Manage teams and rosters' },
  { to: '/hero-slides', label: 'Hero Slides', description: 'Manage homepage carousel slides' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="page-title">Content Dashboard</h1>
      <div className="dashboard-grid">
        {sections.map(({ to, label, description }) => (
          <Link key={to} to={to} className="dashboard-card">
            <h2 className="dashboard-card-title">{label}</h2>
            <p className="dashboard-card-desc">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
