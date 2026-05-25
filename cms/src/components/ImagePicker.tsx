import { useEffect, useRef, useState } from 'react';
import { listMedia, presignUpload, type MediaImage } from '../lib/api';

// ── Modal picker ──────────────────────────────────────────────────────────────

interface ImagePickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setImages(await listMedia());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await presignUpload(file.name, file.type);
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      await load();
      onSelect(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <h3>Media Library</h3>
          <div className="picker-actions">
            <label className={`btn-ghost btn-sm picker-upload-btn${uploading ? ' disabled' : ''}`}>
              {uploading ? 'Uploading…' : 'Upload Image'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                hidden
                disabled={uploading}
              />
            </label>
            <button type="button" className="btn-ghost btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        {error && <div className="form-error picker-error">{error}</div>}
        {loading ? (
          <div className="page-loading">Loading…</div>
        ) : images.length === 0 ? (
          <div className="picker-empty">No images yet. Upload one to get started.</div>
        ) : (
          <div className="picker-grid">
            {images.map((img) => (
              <button
                key={img.key}
                type="button"
                className="picker-item"
                onClick={() => onSelect(img.url)}
                title={img.key}
              >
                <img src={img.url} alt={img.key} className="picker-thumb" />
                <div className="picker-item-name">{img.key.split('-').slice(1).join('-') || img.key}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline field with preview + Browse button ─────────────────────────────────

interface ImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function ImageField({ label, value, onChange, placeholder, required }: ImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="form-group">
      <label>{label}{required && ' *'}</label>
      <div className="image-field-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://… or /path/to/image.jpg'}
          required={required}
        />
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setPickerOpen(true)}
        >
          Browse
        </button>
      </div>
      {value && (
        <img
          src={value}
          alt="preview"
          className="image-field-preview"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'block'; }}
        />
      )}
      {pickerOpen && (
        <ImagePicker
          onSelect={(url) => { onChange(url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
