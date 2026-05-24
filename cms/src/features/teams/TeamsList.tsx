import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listItems } from '../../lib/api';

interface Team {
  id: string;
  name: string;
  ageGroup: string;
  season: string;
  playerSlugs?: string[];
}

export default function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listItems('teams')
      .then(data => setTeams(data as Team[]))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Teams</h1>
        <Link to="/teams/new" className="btn-primary">New Team</Link>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age Group</th>
              <th>Season</th>
              <th>Players</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id}>
                <td>{team.name}</td>
                <td>{team.ageGroup}</td>
                <td>{team.season}</td>
                <td>{team.playerSlugs?.length ?? 0}</td>
                <td className="table-actions">
                  <Link to={`/teams/${team.id}`} className="btn-ghost btn-sm">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
