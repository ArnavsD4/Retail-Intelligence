import { useState } from 'react';
import { LayoutDashboard, TrendingUp, Boxes, MessageSquare, Gauge, Activity, Menu, X, PanelLeftClose, PanelLeftOpen, RefreshCw, Store } from 'lucide-react';
import { useHealth } from './hooks/useHealth.js';
import Overview from './pages/Overview.jsx';
import Forecast from './pages/Forecast.jsx';
import Inventory from './pages/Inventory.jsx';
import Assistant from './pages/Assistant.jsx';
import Performance from './pages/Performance.jsx';
import Status from './pages/Status.jsx';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, desc: 'Model quality, session activity and API health', C: Overview },
  { id: 'forecast', label: 'Demand Forecasting', icon: TrendingUp, desc: 'Predict weekly sales revenue for a store and department', C: Forecast },
  { id: 'inventory', label: 'Inventory Intelligence', icon: Boxes, desc: 'Reorder quantities and stockout risk from unit demand', C: Inventory },
  { id: 'assistant', label: 'Retail AI Assistant', icon: MessageSquare, desc: 'Policy-grounded answers to retail operations questions', C: Assistant },
  { id: 'performance', label: 'Model Performance', icon: Gauge, desc: 'Validation results for the forecasting model', C: Performance },
  { id: 'status', label: 'API Status', icon: Activity, desc: 'Backend connection and endpoints', C: Status },
];

export default function App() {
  const [page, setPage] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const health = useHealth();
  const cur = NAV.find((n) => n.id === page);
  const dot = { online: 'bg-emerald-400', offline: 'bg-red-400', checking: 'bg-amber-400' }[health.state];

  const Nav = ({ mini }) => (
    <nav className="flex-1 space-y-1 p-3" aria-label="Main">
      {NAV.map(({ id, label, icon: I }) => (
        <button key={id} onClick={() => { setPage(id); setOpen(false); }} title={label} aria-current={page === id ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400 ${page === id ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'}`}>
          <I className="h-4 w-4 shrink-0" />{!mini && <span className="truncate">{label}</span>}
        </button>
      ))}
    </nav>
  );
  const Brand = ({ mini }) => (
    <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
      <Store className="h-5 w-5 shrink-0 text-cyan-400" />{!mini && <span className="truncate text-sm font-semibold text-slate-100">Retail Intelligence</span>}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className={`sticky top-0 hidden h-screen flex-col border-r border-slate-800 bg-slate-950 transition-[width] lg:flex ${collapsed ? 'w-16' : 'w-60'}`}>
        <Brand mini={collapsed} /><Nav mini={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="m-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-800/70 hover:text-slate-300">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
        </button>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between pr-3"><Brand /><button onClick={() => setOpen(false)} aria-label="Close menu" className="text-slate-400"><X className="h-5 w-5" /></button></div>
            <Nav />
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur sm:px-6">
          <button className="text-slate-400 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold text-slate-100">{cur.label}</h1><p className="hidden truncate text-xs text-slate-500 sm:block">{cur.desc}</p></div>
          <span className="hidden text-xs text-slate-500 md:block">{new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="flex items-center gap-2 rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300"><span className={`h-2 w-2 rounded-full ${dot}`} />{health.state === 'online' ? 'API online' : health.state === 'offline' ? 'API offline' : 'Checking'}</span>
          <button className="btn-ghost" onClick={health.refresh} aria-label="Refresh API status"><RefreshCw className={`h-4 w-4 ${health.state === 'checking' ? 'animate-spin' : ''}`} /></button>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {health.state === 'offline' && page !== 'status' && (
            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">The backend is not reachable at the configured URL, so API-backed actions will fail. Open API Status for troubleshooting.</div>
          )}
          <cur.C health={health} />
        </main>
      </div>
    </div>
  );
}
