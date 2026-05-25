import { FormEvent, useEffect, useState } from 'react';
import { listUsers, createUser, deleteUser, updateUserRole, type CmsUser } from '../../lib/api';
import { getCurrentUserEmail } from '../../lib/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor'>('editor');
  const currentEmail = getCurrentUserEmail();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createUser(newEmail, newRole, newName || undefined);
      setAddingUser(false);
      setNewEmail('');
      setNewName('');
      setNewRole('editor');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(user: CmsUser, role: 'admin' | 'editor') {
    try {
      await updateUserRole(user.username, role);
      setUsers(prev => prev.map(u => u.username === user.username ? { ...u, role } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  }

  async function handleDelete(user: CmsUser) {
    if (!confirm(`Delete user "${user.email ?? user.username}"? This cannot be undone.`)) return;
    try {
      await deleteUser(user.username);
      setUsers(prev => prev.filter(u => u.username !== user.username));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button type="button" className="btn-primary" onClick={() => setAddingUser(true)} disabled={addingUser}>
          Add User
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {addingUser && (
        <div className="add-user-card">
          <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#e6edf3' }}>Invite New User</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Full name (optional)"
                />
              </div>
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label>Role *</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'editor')}>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Sending invite…' : 'Send Invite'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setAddingUser(false); setNewEmail(''); setNewName(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : (
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.username}>
                  <td>
                    {user.email ?? user.username}
                    {user.email === currentEmail && (
                      <span className="current-user-tag"> (you)</span>
                    )}
                  </td>
                  <td style={{ color: user.name ? '#e6edf3' : '#484f58' }}>
                    {user.name ?? '—'}
                  </td>
                  <td>
                    <select
                      className="role-select"
                      value={user.role ?? ''}
                      onChange={e => handleRoleChange(user, e.target.value as 'admin' | 'editor')}
                      disabled={user.email === currentEmail}
                    >
                      <option value="" disabled>No role</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-badge status-badge--${user.status === 'CONFIRMED' ? 'active' : 'invited'}`}>
                      {user.status === 'CONFIRMED' ? 'Active' : 'Invited'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => handleDelete(user)}
                      disabled={user.email === currentEmail}
                      title={user.email === currentEmail ? "You can't delete your own account" : undefined}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
