import { useEffect, useRef, useState } from 'react';
import { listMedia, presignUpload, type MediaImage } from '../lib/api';

function displayName(key: string): string {
  const basename = key.includes('/') ? key.split('/').pop()! : key;
  const parts = basename.split('-');
  return parts.length > 1 && /^\d+$/.test(parts[0]) ? parts.slice(1).join('-') : basename;
}

function folderName(prefix: string): string {
  return prefix.replace(/\/$/, '').split('/').pop() ?? prefix;
}

// ── Modal picker ──────────────────────────────────────────────────────────────

interface ImagePickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const [folders, setFolders] = useState<string[]>([]);
  const [images, setImages] = useState<MediaImage[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    load(currentFolder);
  }, [currentFolder]);

  async function load(prefix: string) {
    setLoading(true);
    try {
      const result = await listMedia(prefix || undefined);
      setFolders(result.folders);
      setImages(result.files);
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
      const { uploadUrl, publicUrl } = await presignUpload(file.name, file.type, currentFolder || undefined);
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await load(currentFolder);
      onSelect(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  const breadcrumbs = currentFolder ? currentFolder.replace(/\/$/, '').split('/') : [];

  return (
    <div className="picker-overlay" onClick={onClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-header">
          <div className="picker-breadcrumb">
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
          <div className="picker-actions">
            <label className={`btn-ghost btn-sm picker-upload-btn${uploading ? ' disabled' : ''}`}>
              {uploading ? 'Uploading…' : 'Upload Image'}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden disabled={uploading} />
            </label>
            <button type="button" className="btn-ghost btn-sm" onClick={onClose}>✕</button>
          </div>
        </div>
        {error && <div className="form-error picker-error">{error}</div>}
        {loading ? (
          <div className="page-loading">Loading…</div>
        ) : folders.length === 0 && images.length === 0 ? (
          <div className="picker-empty">
            {currentFolder ? 'Empty folder.' : 'No images yet. Upload one to get started.'}
          </div>
        ) : (
          <div className="picker-grid">
            {folders.map((prefix) => (
              <button
                key={prefix}
                type="button"
                className="picker-folder-item"
                onClick={() => setCurrentFolder(prefix)}
              >
                <div className="picker-folder-icon">
                  <svg width="40" height="32" viewBox="0 0 48 40" fill="none">
                    <path d="M0 6a4 4 0 014-4h14l4 6h22a4 4 0 014 4v24a4 4 0 01-4 4H4a4 4 0 01-4-4V6z" fill="#30363d"/>
                    <path d="M0 12h48v22a4 4 0 01-4 4H4a4 4 0 01-4-4V12z" fill="#3d444d"/>
                  </svg>
                </div>
                <div className="picker-item-name">{folderName(prefix)}</div>
              </button>
            ))}
            {images.map((img) => (
              <button
                key={img.key}
                type="button"
                className="picker-item"
                onClick={() => onSelect(img.url)}
                title={displayName(img.key)}
              >
                <img src={img.url} alt={displayName(img.key)} className="picker-thumb" />
                <div className="picker-item-name">{displayName(img.key)}</div>
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
        <button type="button" className="btn-ghost btn-sm" onClick={() => setPickerOpen(true)}>
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
