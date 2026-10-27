import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorBox, Spinner, Notice } from '../components/ui.jsx';
import { timeStr } from '../utils/format.js';

const ENDPOINTS = [['GET', '/'], ['GET', '/health'], ['POST', '/forecast'], ['POST', '/inventory/recommend'], ['POST', '/inventory/analyze'], ['POST', '/ask']];

export default function Status({ health }) {
  const [root, setRoot] = useState(null);
  const [rootErr, setRootErr] = useState(null);
  useEffect(() => { api.root().then(setRoot).catch((e) => setRootErr(e.message)); }, [health.checkedAt]);
  const ok = health.state === 'online';
  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          {health.state === 'checking' ? <Spinner label="Checking" /> : ok ? <><CheckCircle2 className="h-5 w-5 text-emerald-400" /><span className="font-medium text-slate-100">API reachable</span></> : <><XCircle className="h-5 w-5 text-red-400" /><span className="font-medium text-slate-100">API unreachable</span></>}
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Base URL</dt><dd className="break-all">{api.base}</dd></div>
          <div><dt className="text-xs text-slate-500">Last check</dt><dd>{health.checkedAt ? timeStr(health.checkedAt) : 'pending'}</dd></div>
          <div><dt className="text-xs text-slate-500">GET / says</dt><dd>{root ? `${root.message} (${root.status})` : rootErr ? 'unavailable' : 'loading'}</dd></div>
        </dl>
        {health.error && <ErrorBox message={health.error} onRetry={health.refresh} />}
      </div>
      <div className="card">
        <h3 className="mb-3 text-sm font-medium text-slate-100">Endpoints this frontend uses</h3>
        <ul className="space-y-1.5 text-sm">{ENDPOINTS.map(([m, p]) => <li key={p} className="flex gap-3"><span className="w-12 text-xs text-cyan-300">{m}</span><code className="text-slate-300">{p}</code></li>)}</ul>
      </div>
      <Notice tone="cyan" title="About the MCP server">The project&apos;s MCP server is a separate tool interface for MCP clients. This frontend does not call it; every action here goes through the FastAPI endpoints above.</Notice>
    </div>
  );
}
