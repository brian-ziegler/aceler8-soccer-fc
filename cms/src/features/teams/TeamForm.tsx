import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getItem, putItem, listItems } from '../../lib/api';
import { ImageField, ImagePicker } from '../../components/ImagePicker';

interface TeamData {
  name: string;
  slug: string;
  ageGroup: string;
  season: string;
  playerSlugs: string[];
  galleryImages: string[];
  order: number;
}

interface Player {
  id: string;
  name: string;
  number: string;
}

function toKebab(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const empty: TeamData = {
  name: '',
  slug: '',
  ageGroup: '',
  season: '',
  playerSlugs: [],
  galleryImages: [],
  order: 0,
};

export default function TeamForm() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [data, setData] = useState<TeamData>(empty);
  const [slugManual, setSlugManual] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [galleryPickerOpen, setGalleryPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = listItems('players').then(data => setAllPlayers(data as Player[]));
    const fetchTeam = isNew || !id
      ? Promise.resolve()
      : getItem('teams', id).then(raw => {
          const r = raw as Record<string, unknown>;
          setData({
            name: (r.name as string) || '',
            slug: (r.id as string) || id,
            ageGroup: (r.ageGroup as string) || '',
            season: (r.season as string) || '',
            playerSlugs: Array.isArray(r.playerSlugs) ? r.playerSlugs as string[] : [],
            galleryImages: Array.isArray(r.galleryImages) ? r.galleryImages as string[] : [],
            order: typeof r.order === 'number' ? r.order : 0,
          });
          setSlugManual(true);
        });

    Promise.all([fetchPlayers, fetchTeam])
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function handleNameChange(name: string) {
    setData(prev => ({
      ...prev,
      name,
      slug: slugManual ? prev.slug : toKebab(name),
    }));
  }

  function togglePlayer(slug: string) {
    setData(prev => ({
      ...prev,
      playerSlugs: prev.playerSlugs.includes(slug)
        ? prev.playerSlugs.filter(s => s !== slug)
        : [...prev.playerSlugs, slug],
    }));
  }

  function updateGalleryImage(idx: number, val: string) {
    setData(prev => {
      const galleryImages = [...prev.galleryImages];
      galleryImages[idx] = val;
      return { ...prev, galleryImages };
    });
  }

  function addGalleryImage() {
    setData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, ''] }));
  }

  function removeGalleryImage(idx: number) {
    setData(prev => ({ ...prev, galleryImages: prev.galleryImages.filter((_, i) => i !== idx) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { slug, ...rest } = data;
      await putItem('teams', slug, rest);
      navigate('/teams');
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
        <h1 className="page-title">{isNew ? 'New Team' : 'Edit Team'}</h1>
        <Link to="/teams" className="btn-ghost">Back to Teams</Link>
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
            <label>Age Group</label>
            <input
              type="text"
              value={data.ageGroup}
              onChange={e => setData(prev => ({ ...prev, ageGroup: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Season</label>
            <input
              type="text"
              value={data.season}
              onChange={e => setData(prev => ({ ...prev, season: e.target.value }))}
            />
          </div>
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
          <label>Players</label>
          <div className="player-checklist">
            {allPlayers.map(player => (
              <label key={player.id} className="checklist-item">
                <input
                  type="checkbox"
                  checked={data.playerSlugs.includes(player.id)}
                  onChange={() => togglePlayer(player.id)}
                />
                <span>#{player.number} {player.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <label>Gallery Images</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setGalleryPickerOpen(true)}>
                Browse & Add
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={addGalleryImage}>
                Add URL
              </button>
            </div>
          </div>
          {data.galleryImages.map((img, idx) => (
            <ImageField
              key={idx}
              label={`Image ${idx + 1}`}
              value={img}
              onChange={url => updateGalleryImage(idx, url)}
              placeholder="/images/photo.jpg"
            />
          ))}
          {data.galleryImages.length > 0 && (
            <button type="button" className="btn-danger btn-sm" style={{ alignSelf: 'flex-start' }}
              onClick={() => removeGalleryImage(data.galleryImages.length - 1)}>
              Remove Last
            </button>
          )}
          {galleryPickerOpen && (
            <ImagePicker
              onSelect={url => {
                setData(prev => ({ ...prev, galleryImages: [...prev.galleryImages, url] }));
                setGalleryPickerOpen(false);
              }}
              onClose={() => setGalleryPickerOpen(false)}
            />
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Team'}
          </button>
        </div>
      </form>
    </div>
  );
}
