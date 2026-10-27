import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Metric, EmptyState, Notice, chartTip, axisProps } from '../components/ui.jsx';
import { useSession } from '../hooks/useSession.jsx';
import { METRICS, fmtUsd, fmtNum, timeStr } from '../utils/format.js';

const Recent = ({ title, items, render, empty }) => (
  <div className="card">
    <h3 className="mb-3 text-sm font-medium text-slate-100">{title}</h3>
    {items.length ? <ul className="space-y-2">{items.slice(0, 5).map((x, i) => (
      <li key={i} className="flex items-start justify-between gap-3 text-xs"><span className="min-w-0 truncate text-slate-300">{render(x)}</span><span className="shrink-0 text-slate-500">{timeStr(x.at)}</span></li>
    ))}</ul> : <p className="text-xs text-slate-500">{empty}</p>}
  </div>
);

export default function Overview({ health }) {
  const { history } = useSession();
  const f = [...history.forecasts].reverse().map((x) => ({ name: `S${x.store}/D${x.department} ${x.forecast_date}`, value: x.predicted_weekly_sales }));
  const hs = { online: ['Online', 'text-emerald-300'], offline: ['Offline', 'text-red-300'], checking: ['Checking', 'text-slate-300'] }[health.state];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="MAE (validation)" value={fmtUsd(METRICS.mae)} sub="Documented evaluation result, sales value in USD" />
        <Metric label="RMSE (validation)" value={fmtUsd(METRICS.rmse)} sub="Documented evaluation result, sales value in USD" />
        <Metric label="WAPE (validation)" value={`${METRICS.wape}%`} sub="Documented evaluation result, percentage of sales" />
        <Metric label="API health" value={hs[0]} tone={hs[1]} sub={health.checkedAt ? `Live check at ${timeStr(health.checkedAt)}` : 'Checking /health'} />
      </div>
      <Notice tone="cyan" title="About these numbers">MAE, RMSE and WAPE are fixed results from the project&apos;s model evaluation, not live values. They describe weekly sales revenue in USD, not product units.</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-medium text-slate-100">Historical weekly sales</h3>
          <p className="mb-3 text-xs text-slate-500">Weekly_Sales over time</p>
          <div className="h-64"><EmptyState title="No historical sales data available">The backend does not expose an endpoint for data/raw/train.csv, so this chart stays empty rather than showing invented numbers. Adding a read-only history endpoint to FastAPI would enable it.</EmptyState></div>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-100">Forecasts requested this session</h3>
          <p className="mb-3 text-xs text-slate-500">Predicted weekly sales revenue (USD). No actual values are available to compare against.</p>
          <div className="h-64">{f.length ? (
            <ResponsiveContainer><BarChart data={f} margin={{ left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" {...axisProps} interval={0} tick={false} label={{ value: 'Store / department / date (hover for detail)', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${fmtNum(v / 1000, 0)}k`} label={{ value: 'USD', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip {...chartTip} formatter={(v) => [fmtUsd(v), 'Predicted']} />
              <Legend />
              <Bar dataKey="value" name="Predicted weekly sales (USD)" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart></ResponsiveContainer>
          ) : <EmptyState title="No forecasts yet">Run a forecast on the Demand Forecasting page and it will appear here for this session.</EmptyState>}</div>
        </div>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-slate-100">Model error summary</h3>
        <p className="mb-3 text-xs text-slate-500">Validation MAE and RMSE for {METRICS.model}, in USD of weekly sales</p>
        <div className="h-48"><ResponsiveContainer><BarChart data={[{ n: 'MAE', v: METRICS.mae }, { n: 'RMSE', v: METRICS.rmse }]} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke="#1e293b" horizontal={false} />
          <XAxis type="number" {...axisProps} tickFormatter={(v) => `$${fmtNum(v)}`} label={{ value: 'Error (USD)', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
          <YAxis type="category" dataKey="n" {...axisProps} width={50} />
          <Tooltip {...chartTip} formatter={(v) => [fmtUsd(v), 'Error']} />
          <Bar dataKey="v" name="Validation error (USD)" fill="#22d3ee" radius={[0, 3, 3, 0]} />
        </BarChart></ResponsiveContainer></div>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-slate-100">Recent activity</h3>
        <p className="mb-3 text-xs text-slate-500">Kept in this browser session only. It clears when you reload the page; the backend stores no history.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          <Recent title="Forecasts" items={history.forecasts} empty="No forecasts this session." render={(x) => `Store ${x.store}, dept ${x.department}, ${x.forecast_date}: ${fmtUsd(x.predicted_weekly_sales)}`} />
          <Recent title="Inventory analyses" items={history.inventory} empty="No inventory analyses this session." render={(x) => `${x.mode}: ${x.stockout_risk} risk, reorder ${fmtNum(x.reorder_quantity, 0)} units`} />
          <Recent title="AI questions" items={history.questions} empty="No questions this session." render={(x) => x.question} />
        </div>
      </div>
    </div>
  );
}
