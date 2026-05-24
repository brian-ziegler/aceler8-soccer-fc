import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listItems, deleteItem } from '../../lib/api';

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
}

export default function PlayersList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await listItems('players') as Player[];
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete player "${name}"?`)) return;
    try {
      await deleteItem('players', id);
      setPlayers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Players</h1>
        <Link to="/players/new" className="btn-primary">New Player</Link>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Position</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map(player => (
              <tr key={player.id}>
                <td>{player.number}</td>
                <td>{player.name}</td>
                <td>{player.position}</td>
                <td className="table-actions">
                  <Link to={`/players/${player.id}`} className="btn-ghost btn-sm">Edit</Link>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(player.id, player.name)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
