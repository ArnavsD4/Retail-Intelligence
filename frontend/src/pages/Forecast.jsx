import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Field, ErrorBox, Spinner, Notice } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useSession } from '../hooks/useSession.jsx';
import { fmtUsd, isRealDate, friendlyForecastError } from '../utils/format.js';

export default function Forecast() {
  const { history, add } = useSession();
  const [v, setV] = useState({ store: '1', department: '1', date: '' });
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!/^\d+$/.test(v.store) || +v.store < 1) er.store = 'Enter a whole number of 1 or more.';
    if (!/^\d+$/.test(v.department) || +v.department < 1) er.department = 'Enter a whole number of 1 or more.';
    if (!isRealDate(v.date)) er.date = 'Pick a valid date.';
    setErrs(er); setError(null);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      const r = await api.forecast({ store: +v.store, department: +v.department, forecast_date: v.date });
      setRes(r); add('forecasts', r);
    } catch (x) { setRes(null); setError(x.kind === 'http' ? friendlyForecastError(x.message) : x.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={submit} className="card space-y-4 lg:col-span-2" noValidate>
        <h3 className="text-sm font-medium text-slate-100">Forecast request</h3>
        <Field id="store" label="Store ID" type="number" min="1" step="1" inputMode="numeric" value={v.store} onChange={set('store')} error={errs.store} hint="Walmart store number, 1 or higher" />
        <Field id="dept" label="Department ID" type="number" min="1" step="1" inputMode="numeric" value={v.department} onChange={set('department')} error={errs.department} hint="Walmart department number, 1 or higher" />
        <Field id="date" label="Forecast date" type="date" value={v.date} onChange={set('date')} error={errs.date} hint="Must be a week that exists in the Walmart dataset (weeks end on Fridays). Arbitrary future dates are rejected." />
        <button className="btn w-full" disabled={loading}>{loading ? <Spinner label="Requesting forecast" /> : <><TrendingUp className="h-4 w-4" />Run forecast</>}</button>
      </form>
      <div className="space-y-4 lg:col-span-3">
        {error && <ErrorBox message={error} />}
        {res ? (
          <div className="card">
            <p className="text-sm text-slate-400">Predicted Weekly Sales Revenue (USD)</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums text-indigo-300">{fmtUsd(res.predicted_weekly_sales)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-sm sm:grid-cols-4">
              {[['Store', res.store], ['Department', res.department], ['Week', res.forecast_date], ['Model', res.model]].map(([k, val]) => (
                <div key={k} className="min-w-0"><dt className="text-xs text-slate-500">{k}</dt><dd className="break-words text-slate-200">{val}</dd></div>
              ))}
            </dl>
            <div className="mt-5 space-y-3">
              <Notice tone="cyan" title="This is a prediction, not an observed value">The API does not return actual sales for this week, so no comparison with real revenue can be shown.</Notice>
              {res.note && <p className="text-xs leading-relaxed text-slate-500">Backend note: {res.note}</p>}
            </div>
          </div>
        ) : !error && <div className="card text-sm text-slate-500">Submit a store, department and week to see the predicted weekly sales revenue. The value is revenue in USD, not units sold.</div>}
        {history.forecasts.length > 0 && (
          <div className="card">
            <h3 className="mb-1 text-sm font-medium text-slate-100">This session</h3>
            <p className="mb-3 text-xs text-slate-500">Cleared on page reload.</p>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs">
              <thead className="text-slate-500"><tr><th className="py-1 pr-3 font-medium">Store</th><th className="pr-3 font-medium">Dept</th><th className="pr-3 font-medium">Week</th><th className="text-right font-medium">Predicted (USD)</th></tr></thead>
              <tbody>{history.forecasts.map((x, i) => <tr key={i} className="border-t border-slate-800"><td className="py-1.5 pr-3">{x.store}</td><td className="pr-3">{x.department}</td><td className="pr-3">{x.forecast_date}</td><td className="text-right tabular-nums">{fmtUsd(x.predicted_weekly_sales)}</td></tr>)}</tbody>
            </table></div>
          </div>
        )}
      </div>
    </div>
  );
}
