import { useEffect, useRef, useState } from 'react';
import { listMedia, presignUpload, deleteMedia, type MediaImage } from '../../lib/api';

export default function MediaLibrary() {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaImage | null>(null);
  const [copied, setCopied] = useState(false);
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
      const { uploadUrl } = await presignUpload(file.name, file.type);
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(img: MediaImage) {
    if (!confirm(`Delete "${img.key.split('-').slice(1).join('-') || img.key}"?`)) return;
    try {
      await deleteMedia(img.key);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayName = (img: MediaImage) =>
    img.key.split('-').slice(1).join('-') || img.key;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Media Library</h1>
        <label className={`btn-primary${uploading ? ' disabled' : ''}`} style={{ cursor: 'pointer' }}>
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
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : images.length === 0 ? (
        <div className="page-loading">No images yet. Upload one above.</div>
      ) : (
        <div className="media-grid">
          {images.map((img) => (
            <div key={img.key} className="media-card">
              <button
                type="button"
                className="media-card-thumb-btn"
                onClick={() => setSelected(img)}
                title={displayName(img)}
              >
                <img src={img.url} alt={displayName(img)} className="media-card-thumb" />
              </button>
              <div className="media-card-footer">
                <span className="media-card-name" title={displayName(img)}>
                  {displayName(img)}
                </span>
                <button
                  type="button"
                  className="btn-danger btn-sm"
                  onClick={() => handleDelete(img)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="picker-overlay" onClick={() => setSelected(null)}>
          <div className="image-detail-modal" onClick={(e) => e.stopPropagation()}>
            <img
              src={selected.url}
              alt={displayName(selected)}
              className="image-detail-img"
            />
            <div className="image-detail-info">
              <div className="image-detail-name">{displayName(selected)}</div>
              <div
                className="image-detail-url"
                onClick={() => copyUrl(selected.url)}
                title="Click to copy URL"
              >
                {selected.url}
              </div>
              <div className="image-detail-actions">
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => copyUrl(selected.url)}
                >
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={() => handleDelete(selected)}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => setSelected(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
