import { useEffect, useRef, useState } from 'react';
import { listMedia, presignUpload, deleteMedia, moveMedia, createFolder, type MediaImage } from '../../lib/api';

function displayName(key: string): string {
  const basename = key.includes('/') ? key.split('/').pop()! : key;
  const parts = basename.split('-');
  return parts.length > 1 && /^\d+$/.test(parts[0]) ? parts.slice(1).join('-') : basename;
}

function folderName(prefix: string): string {
  return prefix.replace(/\/$/, '').split('/').pop() ?? prefix;
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(url);
}

const FolderSvg = () => (
  <svg width="52" height="44" viewBox="0 0 48 40" fill="none">
    <path d="M0 6a4 4 0 014-4h14l4 6h22a4 4 0 014 4v24a4 4 0 01-4 4H4a4 4 0 01-4-4V6z" fill="#30363d"/>
    <path d="M0 12h48v22a4 4 0 01-4 4H4a4 4 0 01-4-4V12z" fill="#3d444d"/>
  </svg>
);

export default function MediaLibrary() {
  const [folders, setFolders] = useState<string[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaImage | null>(null);
  const [copied, setCopied] = useState(false);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load(currentFolder);
  }, [currentFolder]);

  async function load(prefix: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await listMedia(prefix || undefined);
      setFolders(result.folders);
      setImages(result.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
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
      const { uploadUrl } = await presignUpload(file.name, file.type, currentFolder || undefined);
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await load(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(img: MediaImage) {
    if (!confirm(`Delete "${displayName(img.key)}"?`)) return;
    try {
      await deleteMedia(img.key);
      setSelected(null);
      await load(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleDrop(sourceKey: string, destFolderPrefix: string) {
    setDragOverFolder(null);
    const destFolder = destFolderPrefix.replace(/\/$/, '');
    try {
      await moveMedia(sourceKey, destFolder);
      await load(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Move failed');
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateFolder() {
    const name = newFolderInput.trim()
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (!name) return;
    const folderPath = currentFolder + name;
    setCreatingFolder(false);
    setNewFolderInput('');
    try {
      await createFolder(folderPath);
      await load(currentFolder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  }

  const breadcrumbs = currentFolder ? currentFolder.replace(/\/$/, '').split('/') : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Media Library</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setCreatingFolder(true);
              setTimeout(() => newFolderRef.current?.focus(), 50);
            }}
          >
            New Folder
          </button>
          <label className={`btn-primary${uploading ? ' disabled' : ''}`} style={{ cursor: 'pointer' }}>
            {uploading ? 'Uploading…' : 'Upload'}
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleUpload} hidden disabled={uploading} />
          </label>
        </div>
      </div>

      {creatingFolder && (
        <div className="new-folder-bar">
          <input
            ref={newFolderRef}
            type="text"
            className="new-folder-input"
            placeholder="Folder name"
            value={newFolderInput}
            onChange={e => setNewFolderInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderInput(''); }
            }}
          />
          <button type="button" className="btn-primary btn-sm" onClick={handleCreateFolder}>Create</button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => { setCreatingFolder(false); setNewFolderInput(''); }}>Cancel</button>
        </div>
      )}

      <div className="media-breadcrumb">
        <button
          type="button"
          className={`breadcrumb-item${currentFolder === '' ? ' breadcrumb-current' : ''}`}
          onClick={() => setCurrentFolder('')}
          disabled={currentFolder === ''}
        >
          All Media
        </button>
        {breadcrumbs.map((seg, i) => {
          const prefix = breadcrumbs.slice(0, i + 1).join('/') + '/';
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={prefix} className="breadcrumb-sep-wrap">
              <span className="breadcrumb-sep">/</span>
              <button
                type="button"
                className={`breadcrumb-item${isLast ? ' breadcrumb-current' : ''}`}
                onClick={() => setCurrentFolder(prefix)}
                disabled={isLast}
              >
                {seg}
              </button>
            </span>
          );
        })}
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : folders.length === 0 && images.length === 0 ? (
        <div className="page-loading">
          {currentFolder ? 'Empty folder. Upload an image above.' : 'No images yet. Upload one above.'}
        </div>
      ) : (
        <div className="media-grid">
          {folders.map((prefix) => (
            <div
              key={prefix}
              className={`media-card media-card--folder${dragOverFolder === prefix ? ' drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOverFolder(prefix); }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={e => { e.preventDefault(); const key = e.dataTransfer.getData('text/plain'); if (key) handleDrop(key, prefix); }}
            >
              <button
                type="button"
                className="media-card-thumb-btn media-card-folder-btn"
                onClick={() => setCurrentFolder(prefix)}
              >
                <FolderSvg />
              </button>
              <div className="media-card-footer">
                <span className="media-card-name" title={folderName(prefix)}>{folderName(prefix)}</span>
              </div>
            </div>
          ))}
          {images.map((img) => (
            <div
              key={img.key}
              className="media-card"
              draggable
              onDragStart={e => e.dataTransfer.setData('text/plain', img.key)}
            >
              <button
                type="button"
                className="media-card-thumb-btn"
                onClick={() => setSelected(img)}
                title={displayName(img.key)}
              >
                {isVideo(img.url)
                  ? <video src={img.url} className="media-card-thumb" muted playsInline preload="metadata" />
                  : <img src={img.url} alt={displayName(img.key)} className="media-card-thumb" />}
              </button>
              <div className="media-card-footer">
                <span className="media-card-name" title={displayName(img.key)}>{displayName(img.key)}</span>
                <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(img)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="picker-overlay" onClick={() => setSelected(null)}>
          <div className="image-detail-modal" onClick={(e) => e.stopPropagation()}>
            {isVideo(selected.url)
              ? <video src={selected.url} className="image-detail-img" controls muted playsInline />
              : <img src={selected.url} alt={displayName(selected.key)} className="image-detail-img" />}
            <div className="image-detail-info">
              <div className="image-detail-name">{displayName(selected.key)}</div>
              <div className="image-detail-url" onClick={() => copyUrl(selected.url)} title="Click to copy URL">
                {selected.url}
              </div>
              <div className="image-detail-actions">
                <button type="button" className="btn-ghost btn-sm" onClick={() => copyUrl(selected.url)}>
                  {copied ? 'Copied!' : 'Copy URL'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(selected)}>Delete</button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
