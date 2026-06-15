import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { listItems, deleteItem, reorderItems } from '../../lib/api';

interface HeroSlide {
  id: string;
  src: string;
  title?: string;
  order: number;
  [key: string]: unknown;
}

function SortableRow({
  slide,
  onDelete,
}: {
  slide: HeroSlide;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <td>
        <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">
          ⠿
        </span>
      </td>
      <td>{slide.order}</td>
      <td>
        {slide.src
          ? <img src={slide.src} alt="" className="slide-thumb" />
          : <em className="muted">—</em>}
      </td>
      <td>{slide.title || <em className="muted">—</em>}</td>
      <td className="table-actions">
        <Link to={`/hero-slides/${slide.id}`} className="btn-ghost btn-sm">Edit</Link>
        <button className="btn-danger btn-sm" onClick={() => onDelete(slide.id)}>Delete</button>
      </td>
    </tr>
  );
}

export default function HeroSlidesList() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function load() {
    try {
      const data = await listItems('hero_slides') as HeroSlide[];
      setSlides([...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex(s => s.id === active.id);
    const newIndex = slides.findIndex(s => s.id === over.id);
    const reordered = arrayMove(slides, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));

    setSlides(reordered);
    setSaving(true);
    try {
      await reorderItems('hero_slides', reordered.map(s => ({ id: s.id, order: s.order })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page-loading">Loading…</div>;
  if (error) return <div className="page-error">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Hero Slides
          {saving && <span className="saving-indicator">Saving…</span>}
        </h1>
        <Link to="/hero-slides/new" className="btn-primary">New Slide</Link>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '2rem' }} />
                  <th>Order</th>
                  <th style={{ width: '8rem' }}>Image</th>
                  <th>Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map(slide => (
                  <SortableRow key={slide.id} slide={slide} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
