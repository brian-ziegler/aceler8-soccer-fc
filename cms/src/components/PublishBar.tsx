import { useState, useEffect, useRef } from 'react';
import { publish, getDeployStatus, DeployStatus, DeployRunInfo } from '../lib/api';

function isActive(run: DeployRunInfo | null): boolean {
  return run?.status === 'in_progress' || run?.status === 'queued';
}

function isDeployed(run: DeployRunInfo | null): boolean {
  return run?.status === 'completed' && run?.conclusion === 'success';
}

function formatAge(isoDate: string): string {
  const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ run }: { run: DeployRunInfo | null | undefined }) {
  if (!run) return <span className="release-status release-status--unknown">No deploys</span>;
  if (isActive(run)) return <span className="release-status release-status--building">○ Building…</span>;
  if (isDeployed(run)) {
    return (
      <span className="release-status release-status--success">
        ● {formatAge(run.createdAt)}
      </span>
    );
  }
  return <span className="release-status release-status--failed">✕ Failed</span>;
}

export default function PublishBar() {
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [triggering, setTriggering] = useState<'next' | 'live' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function anyActive(s: DeployStatus): boolean {
    return isActive(s.next) || isActive(s.live);
  }

  async function fetchStatus(): Promise<DeployStatus | null> {
    try {
      const s = await getDeployStatus();
      setDeployStatus(s);
      return s;
    } catch {
      return null;
    }
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s && !anyActive(s)) stopPolling();
    }, 10000);
  }

  useEffect(() => {
    fetchStatus().then((s) => {
      if (s && anyActive(s)) startPolling();
    });
    return stopPolling;
  }, []);

  async function handlePublish(env: 'next' | 'live') {
    if (env === 'live') {
      const ok = window.confirm('Promote to live (aceler8fc.com)? This will trigger a build and deploy.');
      if (!ok) return;
    }
    setTriggering(env);
    setActionError(null);
    try {
      await publish(env);
      await fetchStatus();
      startPolling();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setTriggering(null);
    }
  }

  const busy = triggering !== null;
  const building = deployStatus ? anyActive(deployStatus) : false;

  return (
    <div className="publish-bar">
      {actionError && (
        <span className="publish-status publish-status--error">{actionError}</span>
      )}

      <div className="release-env">
        <span className="release-env__label">Staging</span>
        <StatusBadge run={deployStatus?.next} />
        {deployStatus?.nextUrl && (
          <a
            href={isDeployed(deployStatus.next) ? deployStatus.nextUrl : undefined}
            className={`release-link${isDeployed(deployStatus.next) ? '' : ' release-link--disabled'}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview ↗
          </a>
        )}
        <button
          className="btn-ghost btn-sm"
          disabled={busy || building}
          onClick={() => handlePublish('next')}
        >
          {triggering === 'next' ? 'Triggering…' : 'Deploy'}
        </button>
      </div>

      <div className="release-divider" />

      <div className="release-env">
        <span className="release-env__label">Live</span>
        <StatusBadge run={deployStatus?.live} />
        {deployStatus?.liveUrl && (
          <a
            href={deployStatus.liveUrl}
            className="release-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            View ↗
          </a>
        )}
        <button
          className="btn-primary btn-sm"
          disabled={busy || building}
          onClick={() => handlePublish('live')}
        >
          {triggering === 'live' ? 'Triggering…' : 'Promote'}
        </button>
      </div>
    </div>
  );
}
