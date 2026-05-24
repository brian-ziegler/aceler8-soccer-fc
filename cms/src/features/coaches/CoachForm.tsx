import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getItem, putItem } from '../../lib/api';

interface CoachData {
  name: string;
  slug: string;
  role: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  summary: string;
  bio: string[];
  credentials: string[];
  order: number;
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const empty: CoachData = {
  name: '',
  slug: '',
  role: '',
  title: '',
  imageSrc: '',
  imageAlt: '',
  summary: '',
  bio: [''],
  credentials: [],
  order: 0,
};

export default function CoachForm() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [data, setData] = useState<CoachData>(empty);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && id) {
      getItem('coaches', id)
        .then(raw => {
          const r = raw as Record<string, unknown>;
          setData({
            name: (r.name as string) || '',
            slug: (r.id as string) || id,
            role: (r.role as string) || '',
            title: (r.title as string) || '',
            imageSrc: (r.imageSrc as string) || '',
            imageAlt: (r.imageAlt as string) || '',
            summary: (r.summary as string) || '',
            bio: Array.isArray(r.bio) ? r.bio as string[] : [''],
            credentials: Array.isArray(r.credentials) ? r.credentials as string[] : [],
            order: typeof r.order === 'number' ? r.order : 0,
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
      await putItem('coaches', slug, rest);
      navigate('/coaches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function updateBio(idx: number, val: string) {
    setData(prev => {
      const bio = [...prev.bio];
      bio[idx] = val;
      return { ...prev, bio };
    });
  }

  function addBio() {
    setData(prev => ({ ...prev, bio: [...prev.bio, ''] }));
  }

  function removeBio(idx: number) {
    setData(prev => ({ ...prev, bio: prev.bio.filter((_, i) => i !== idx) }));
  }

  function updateCredential(idx: number, val: string) {
    setData(prev => {
      const credentials = [...prev.credentials];
      credentials[idx] = val;
      return { ...prev, credentials };
    });
  }

  function addCredential() {
    setData(prev => ({ ...prev, credentials: [...prev.credentials, ''] }));
  }

  function removeCredential(idx: number) {
    setData(prev => ({ ...prev, credentials: prev.credentials.filter((_, i) => i !== idx) }));
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'New Coach' : 'Edit Coach'}</h1>
        <Link to="/coaches" className="btn-ghost">Back to Coaches</Link>
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
            <label>Role</label>
            <input
              type="text"
              value={data.role}
              onChange={e => setData(prev => ({ ...prev, role: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Image Src</label>
            <input
              type="text"
              value={data.imageSrc}
              placeholder="/coaches/name.jpg"
              onChange={e => setData(prev => ({ ...prev, imageSrc: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Image Alt</label>
            <input
              type="text"
              value={data.imageAlt}
              onChange={e => setData(prev => ({ ...prev, imageAlt: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Summary</label>
          <textarea
            value={data.summary}
            onChange={e => setData(prev => ({ ...prev, summary: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Order</label>
          <input
            type="number"
            value={data.order}
            onChange={e => setData(prev => ({ ...prev, order: Number(e.target.value) }))}
          />
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <label>Bio Paragraphs</label>
            <button type="button" className="btn-ghost btn-sm" onClick={addBio}>Add Paragraph</button>
          </div>
          {data.bio.map((para, idx) => (
            <div key={idx} className="array-item">
              <textarea
                value={para}
                onChange={e => updateBio(idx, e.target.value)}
                rows={3}
              />
              <button type="button" className="btn-danger btn-sm" onClick={() => removeBio(idx)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <label>Credentials</label>
            <button type="button" className="btn-ghost btn-sm" onClick={addCredential}>Add Credential</button>
          </div>
          {data.credentials.map((cred, idx) => (
            <div key={idx} className="array-item">
              <input
                type="text"
                value={cred}
                onChange={e => updateCredential(idx, e.target.value)}
              />
              <button type="button" className="btn-danger btn-sm" onClick={() => removeCredential(idx)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Coach'}
          </button>
        </div>
      </form>
    </div>
  );
}
