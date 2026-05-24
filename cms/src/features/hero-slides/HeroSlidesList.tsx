import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listItems, deleteItem } from '../../lib/api';

interface HeroSlide {
  id: string;
  src: string;
  title?: string;
  order?: number;
}

export default function HeroSlidesList() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await listItems('hero_slides') as HeroSlide[];
      setSlides(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this slide?')) return;
    try {
      await deleteItem('hero_slides', id);
      setSlides(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Hero Slides</h1>
        <Link to="/hero-slides/new" className="btn-primary">New Slide</Link>
      </div>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Image Path</th>
              <th>Title</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slides.map(slide => (
              <tr key={slide.id}>
                <td>{slide.order ?? slide.id}</td>
                <td className="slide-src">{slide.src}</td>
                <td>{slide.title || <em className="muted">—</em>}</td>
                <td className="table-actions">
                  <Link to={`/hero-slides/${slide.id}`} className="btn-ghost btn-sm">Edit</Link>
                  <button
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(slide.id)}
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
