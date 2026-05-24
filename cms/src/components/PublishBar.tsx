import { useState } from 'react';
import { publish } from '../lib/api';

type Status = { type: 'success' | 'error'; message: string } | null;

export default function PublishBar() {
  const [loading, setLoading] = useState<'next' | 'live' | null>(null);
  const [status, setStatus] = useState<Status>(null);

  async function handlePublish(env: 'next' | 'live') {
    if (env === 'live') {
      const ok = window.confirm('Publish to production (live site)? This will trigger a build and deploy.');
      if (!ok) return;
    }
    setLoading(env);
    setStatus(null);
    try {
      await publish(env);
      setStatus({ type: 'success', message: env === 'live' ? 'Live deploy triggered!' : 'Staging deploy triggered!' });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setLoading(null);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  return (
    <div className="publish-bar">
      {status && (
        <span className={`publish-status publish-status--${status.type}`}>
          {status.message}
        </span>
      )}
      <button
        className="btn-ghost"
        disabled={loading !== null}
        onClick={() => handlePublish('next')}
      >
        {loading === 'next' ? 'Triggering…' : 'Preview on Staging'}
      </button>
      <button
        className="btn-primary"
        disabled={loading !== null}
        onClick={() => handlePublish('live')}
      >
        {loading === 'live' ? 'Triggering…' : 'Publish Live'}
      </button>
    </div>
  );
}
