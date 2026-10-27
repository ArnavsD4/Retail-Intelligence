import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Metric, Notice, chartTip, axisProps } from '../components/ui.jsx';
import { METRICS, fmtUsd, fmtNum } from '../utils/format.js';

const EXPLAIN = [
  ['MAE: mean absolute error', 'The average size of the gap between predicted and actual weekly sales, ignoring direction. Easy to read: on average a prediction is off by this many USD.'],
  ['RMSE: root mean squared error', 'Like MAE but squares errors first, so large misses count more. A higher RMSE than MAE means some predictions miss by a lot.'],
  ['WAPE: weighted absolute percentage error', 'Total absolute error divided by total actual sales. It stays meaningful when some store-department weeks have very small sales.'],
];

export default function Performance() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="MAE" value={fmtUsd(METRICS.mae)} sub="weekly sales, USD" />
        <Metric label="RMSE" value={fmtUsd(METRICS.rmse)} sub="weekly sales, USD" />
        <Metric label="WAPE" value={`${METRICS.wape}%`} sub="of total actual sales" />
        <Metric label="Model" value={<span className="text-base">{METRICS.model}</span>} sub="scikit-learn" />
      </div>
      <Notice tone="cyan" title="Where these numbers come from">These are the project&apos;s existing validation evaluation results, entered as fixed values, not computed live by this page. The target is Walmart Weekly_Sales, measured in USD of revenue, not product units. No model comparison report was provided, so no other algorithms are shown.</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-sm font-medium text-slate-100">What each metric means</h3>
          <dl className="space-y-4">{EXPLAIN.map(([t, d]) => <div key={t}><dt className="text-sm font-medium text-slate-200">{t}</dt><dd className="mt-0.5 text-sm leading-relaxed text-slate-400">{d}</dd></div>)}</dl>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-100">Validation error in USD</h3>
          <p className="mb-3 text-xs text-slate-500">WAPE is a percentage and is shown separately above.</p>
          <div className="h-56"><ResponsiveContainer><BarChart data={[{ n: 'MAE', v: METRICS.mae }, { n: 'RMSE', v: METRICS.rmse }]} margin={{ left: 8, bottom: 8 }}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="n" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `$${fmtNum(v, 0)}`} label={{ value: 'Error (USD)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip {...chartTip} formatter={(v) => [fmtUsd(v), 'Error']} />
            <Bar dataKey="v" name="Validation error (USD)" fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={80} />
          </BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}
