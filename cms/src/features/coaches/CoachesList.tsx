import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listItems, deleteItem } from '../../lib/api';

interface Coach {
  id: string;
  name: string;
  role: string;
  order?: number;
}

export default function CoachesList() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await listItems('coaches') as Coach[];
      setCoaches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete coach "${name}"?`)) return;
    try {
      await deleteItem('coaches', id);
      setCoaches(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Coaches</h1>
        <Link to="/coaches/new" className="btn-primary">New Coach</Link>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map((coach, idx) => (
              <tr key={coach.id}>
                <td>{coach.order ?? idx}</td>
                <td>{coach.name}</td>
                <td>{coach.role}</td>
                <td className="table-actions">
                  <Link to={`/coaches/${coach.id}`} className="btn-ghost btn-sm">Edit</Link>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(coach.id, coach.name)}
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
