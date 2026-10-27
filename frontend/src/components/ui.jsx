import { Loader2, AlertTriangle, Inbox, FileText, TriangleAlert } from 'lucide-react';

export const Spinner = ({ label = 'Loading' }) => (
  <span className="inline-flex items-center gap-2 text-sm text-slate-400" role="status"><Loader2 className="h-4 w-4 animate-spin" />{label}</span>
);

export function Metric({ label, value, sub, tone = 'text-slate-100' }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export const ErrorBox = ({ message, onRetry }) => (
  <div role="alert" className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button className="btn-ghost" onClick={onRetry}>Retry</button>}
  </div>
);

export const EmptyState = ({ title, children }) => (
  <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed border-slate-700 p-6 text-center">
    <Inbox className="mb-2 h-6 w-6 text-slate-500" />
    <p className="text-sm font-medium text-slate-300">{title}</p>
    {children && <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">{children}</p>}
  </div>
);

export const Notice = ({ title, children, tone = 'amber' }) => {
  const c = tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
  return (
    <div className={`flex gap-3 rounded-md border p-3 text-sm ${c}`}>
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div><p className="font-medium">{title}</p><div className="mt-0.5 text-[13px] leading-relaxed opacity-90">{children}</div></div>
    </div>
  );
};

export function Field({ label, id, hint, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className={`input ${error ? 'border-red-500' : ''}`} aria-invalid={!!error} aria-describedby={`${id}-d`} {...props} />
      <p id={`${id}-d`} className={`mt-1 text-xs ${error ? 'text-red-400' : 'text-slate-500'}`}>{error || hint}</p>
    </div>
  );
}

const RISK = { Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300', High: 'border-red-500/30 bg-red-500/10 text-red-300' };
export const RiskBadge = ({ risk }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK[risk] || 'border-slate-700 text-slate-300'}`}>{risk} risk</span>
);

export function Sources({ sources }) {
  if (!sources?.length) return <p className="text-xs text-slate-500">The backend returned no policy sources for this response.</p>;
  return (
    <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-cyan-300"><FileText className="h-3.5 w-3.5" />Retrieved policy sources</p>
      <ul className="space-y-1.5">
        {sources.map((s, i) => (
          <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
            <span className="text-slate-300"><span className="text-slate-500">{s.source}</span> / {s.section}</span>
            <span className="tabular-nums text-slate-500">similarity {s.similarity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Minimal safe Markdown renderer: builds React elements only, never raw HTML.
function inline(t) {
  return t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-slate-100">{p.slice(2, -2)}</strong>;
    if (p.length > 2 && p.startsWith('`') && p.endsWith('`')) return <code key={i} className="rounded bg-slate-800 px-1 py-0.5 text-[12px]">{p.slice(1, -1)}</code>;
    return p;
  });
}
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
export function Markdown({ text }) {
  const lines = String(text || '').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    const h = l.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (h) { out.push(<h4 key={i} className="mt-3 text-sm font-semibold text-slate-100">{inline(h[2])}</h4>); i++; continue; }
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { if (!/^[\s|:-]+$/.test(lines[i])) rows.push(cells(lines[i])); i++; }
      out.push(
        <div key={i} className="my-2 overflow-x-auto"><table className="w-full text-left text-xs">
          <thead><tr>{rows[0].map((c, k) => <th key={k} className="border-b border-slate-700 px-2 py-1 font-medium text-slate-200">{inline(c)}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r, a) => <tr key={a}>{r.map((c, k) => <td key={k} className="border-b border-slate-800 px-2 py-1">{inline(c)}</td>)}</tr>)}</tbody>
        </table></div>
      );
      continue;
    }
    const li = /^\s*([-*]|\d+\.)\s+/;
    if (li.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && li.test(lines[i])) { items.push(lines[i].replace(li, '')); i++; }
      const Tag = ordered ? 'ol' : 'ul';
      out.push(<Tag key={i} className={`my-1.5 space-y-1 pl-5 ${ordered ? 'list-decimal' : 'list-disc'}`}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</Tag>);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(\||#|([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(<p key={i} className="my-1.5">{inline(para.join(' '))}</p>);
  }
  return <div className="text-sm leading-relaxed text-slate-300">{out}</div>;
}

export const UnitWarning = () => (
  <Notice title="Inventory inputs must be physical units, not revenue">
    The forecasting model predicts weekly sales revenue in USD. The inventory calculator expects weekly demand in product units. These are not interchangeable, so the forecast is never pasted in automatically. Treating revenue as unit demand does not give a validated stock quantity; that needs unit-level demand or a validated conversion (for example average selling price at SKU level).
  </Notice>
);

export const chartTip = { contentStyle: { background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 12 }, labelStyle: { color: '#cbd5e1' }, cursor: { fill: 'rgba(99,102,241,0.08)' } };
export const axisProps = { stroke: '#64748b', tick: { fontSize: 11, fill: '#94a3b8' } };
