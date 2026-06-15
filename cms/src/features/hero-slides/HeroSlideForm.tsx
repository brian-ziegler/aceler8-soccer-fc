import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getItem, putItem, listItems } from '../../lib/api';
import { ImageField } from '../../components/ImagePicker';

interface Button {
  label: string;
  href: string;
}

interface SlideData {
  slideId: string;
  src: string;
  width: number;
  height: number;
  heading: string;
  title: string;
  description: string;
  buttons: Button[];
  order: number;
}

const empty: SlideData = {
  slideId: '',
  src: '',
  width: 1620,
  height: 1080,
  heading: '',
  title: '',
  description: '',
  buttons: [],
  order: 0,
};

export default function HeroSlideForm() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const [data, setData] = useState<SlideData>({ ...empty, slideId: isNew ? Date.now().toString(36) : '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew && id) {
      getItem('hero_slides', id)
        .then(raw => {
          const r = raw as Record<string, unknown>;
          setData({
            slideId: (r.id as string) || id,
            src: (r.src as string) || '',
            width: typeof r.width === 'number' ? r.width : 1620,
            height: typeof r.height === 'number' ? r.height : 1080,
            heading: (r.heading as string) || '',
            title: (r.title as string) || '',
            description: (r.description as string) || '',
            buttons: Array.isArray(r.buttons) ? r.buttons as Button[] : [],
            order: typeof r.order === 'number' ? r.order : 0,
          });
        })
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { slideId, heading, title, description, buttons, ...rest } = data;
      const payload: Record<string, unknown> = { ...rest };
      if (heading) payload.heading = heading;
      if (title) payload.title = title;
      if (description) payload.description = description;
      if (buttons.length > 0) payload.buttons = buttons;

      if (isNew) {
        // Shift all existing slides up by 1 then insert new slide at order 0
        const existing = await listItems('hero_slides') as Array<Record<string, unknown>>;
        await Promise.all(
          existing.map(s => {
            const { id, entityType: _et, ...fields } = s as Record<string, unknown>;
            return putItem('hero_slides', id as string, {
              ...fields,
              order: typeof fields.order === 'number' ? fields.order + 1 : 1,
            });
          })
        );
        payload.order = 0;
      }

      await putItem('hero_slides', slideId, payload);
      navigate('/hero-slides');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addButton() {
    setData(prev => ({ ...prev, buttons: [...prev.buttons, { label: '', href: '' }] }));
  }

  function updateButton(idx: number, field: keyof Button, val: string) {
    setData(prev => {
      const buttons = [...prev.buttons];
      buttons[idx] = { ...buttons[idx], [field]: val };
      return { ...prev, buttons };
    });
  }

  function removeButton(idx: number) {
    setData(prev => ({ ...prev, buttons: prev.buttons.filter((_, i) => i !== idx) }));
  }

  if (loading) return <div className="page-loading">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'New Hero Slide' : 'Edit Hero Slide'}</h1>
        <Link to="/hero-slides" className="btn-ghost">Back to Slides</Link>
      </div>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit} className="cms-form">
        <div className="form-group">
          <label>ID</label>
          <input
            type="text"
            value={data.slideId}
            onChange={e => setData(prev => ({ ...prev, slideId: e.target.value }))}
            required
          />
        </div>
        <ImageField
          label="Image"
          value={data.src}
          onChange={src => setData(prev => ({ ...prev, src }))}
          placeholder="/hero/raw/image.jpg"
          required
        />
        <div className="form-row">
          <div className="form-group">
            <label>Width</label>
            <input
              type="number"
              value={data.width}
              onChange={e => setData(prev => ({ ...prev, width: Number(e.target.value) }))}
            />
          </div>
          <div className="form-group">
            <label>Height</label>
            <input
              type="number"
              value={data.height}
              onChange={e => setData(prev => ({ ...prev, height: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Heading (optional tag above title)</label>
          <input
            type="text"
            value={data.heading}
            placeholder="Player Spotlight"
            onChange={e => setData(prev => ({ ...prev, heading: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Title (optional headline)</label>
          <input
            type="text"
            value={data.title}
            onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            value={data.description}
            onChange={e => setData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <label>Buttons</label>
            <button type="button" className="btn-ghost btn-sm" onClick={addButton}>Add Button</button>
          </div>
          {data.buttons.map((btn, idx) => (
            <div key={idx} className="array-item button-item">
              <input
                type="text"
                placeholder="Label"
                value={btn.label}
                onChange={e => updateButton(idx, 'label', e.target.value)}
              />
              <input
                type="text"
                placeholder="/players/name/"
                value={btn.href}
                onChange={e => updateButton(idx, 'href', e.target.value)}
              />
              <button type="button" className="btn-danger btn-sm" onClick={() => removeButton(idx)}>Remove</button>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Slide'}
          </button>
        </div>
      </form>
    </div>
  );
}
