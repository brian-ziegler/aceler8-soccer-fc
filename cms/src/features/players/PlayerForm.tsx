import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getItem, putItem } from '../../lib/api';
import { ImageField } from '../../components/ImagePicker';

interface PlayerData {
  name: string;
  slug: string;
  number: string;
  position: string;
  order: number;
  imageSrc: string;
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const empty: PlayerData = { name: '', slug: '', number: '', position: '', order: 0, imageSrc: '' };

export default function PlayerForm() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [data, setData] = useState<PlayerData>(empty);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && id) {
      getItem('players', id)
        .then(raw => {
          const r = raw as Record<string, unknown>;
          setData({
            name: (r.name as string) || '',
            slug: (r.id as string) || id,
            number: (r.number as string) || '',
            position: (r.position as string) || '',
            order: typeof r.order === 'number' ? r.order : 0,
            imageSrc: (r.imageSrc as string) || '',
          });
          setSlugManual(true);
        })
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  function handleNameChange(name: string) {
    setData(prev => ({
      ...prev,
      name,
      slug: slugManual ? prev.slug : toKebab(name),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { slug, ...rest } = data;
      await putItem('players', slug, rest);
      navigate('/players');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'New Player' : 'Edit Player'}</h1>
        <Link to="/players" className="btn-ghost">Back to Players</Link>
      </div>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} className="cms-form">
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={data.name}
              onChange={e => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug *</label>
            <input
              type="text"
              value={data.slug}
              onChange={e => { setSlugManual(true); setData(prev => ({ ...prev, slug: e.target.value })); }}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Number</label>
            <input
              type="text"
              value={data.number}
              onChange={e => setData(prev => ({ ...prev, number: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Position</label>
            <input
              type="text"
              value={data.position}
              onChange={e => setData(prev => ({ ...prev, position: e.target.value }))}
            />
          </div>
        </div>
        <ImageField
          label="Profile Image"
          value={data.imageSrc}
          onChange={url => setData(prev => ({ ...prev, imageSrc: url }))}
          placeholder="/players/name.png"
        />
        <div className="form-group">
          <label>Order</label>
          <input
            type="number"
            value={data.order}
            onChange={e => setData(prev => ({ ...prev, order: Number(e.target.value) }))}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Player'}
          </button>
        </div>
      </form>
    </div>
  );
}
