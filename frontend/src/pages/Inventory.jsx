import { useState } from 'react';
import { Boxes } from 'lucide-react';
import { Field, ErrorBox, Spinner, Metric, RiskBadge, Markdown, Sources, UnitWarning } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useSession } from '../hooks/useSession.jsx';
import { fmtNum } from '../utils/format.js';

const blank = { forecast_weekly_demand: '', current_stock: '', lead_time_days: '', review_period_days: '7', safety_stock: '0' };
const num = (s) => (s.trim() === '' ? NaN : Number(s));

export default function Inventory() {
  const { add } = useSession();
  const [mode, setMode] = useState('recommend');
  const [v, setV] = useState(blank);
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [out, setOut] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const ai = mode === 'analyze';

  async function submit(e) {
    e.preventDefault();
    const d = num(v.forecast_weekly_demand), s = num(v.current_stock), l = num(v.lead_time_days), r = num(v.review_period_days), sf = num(v.safety_stock);
    const er = {};
    if (!(d > 0)) er.forecast_weekly_demand = 'Enter a number greater than 0.';
    if (!(s >= 0)) er.current_stock = 'Enter 0 or more.';
    if (!(Number.isInteger(l) && l > 0)) er.lead_time_days = 'Enter a whole number of days, 1 or more.';
    if (!(Number.isInteger(r) && r > 0)) er.review_period_days = 'Enter a whole number of days, 1 or more.';
    if (ai && !(Number.isInteger(sf) && sf >= 0)) er.safety_stock = 'Enter a whole number, 0 or more.';
    setErrs(er); setError(null);
    if (Object.keys(er).length) return;
    const payload = { forecast_weekly_demand: d, current_stock: s, lead_time_days: l, review_period_days: r };
    setLoading(true);
    try {
      if (ai) {
        const res = await api.analyze({ ...payload, safety_stock: sf });
        setOut({ mode: 'analyze', inv: res.inventory, explanation: res.explanation, sources: res.sources });
        add('inventory', { mode: 'AI analysis', ...res.inventory });
      } else {
        const res = await api.recommend(payload);
        setOut({ mode: 'recommend', inv: res });
        add('inventory', { mode: 'Recommendation', ...res });
      }
    } catch (x) { setOut(null); setError(x.message); }
    finally { setLoading(false); }
  }

  const inv = out?.inv;
  return (
    <div className="space-y-6">
      <UnitWarning />
      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={submit} className="card space-y-4 lg:col-span-2" noValidate>
          <div role="tablist" aria-label="Inventory mode" className="grid grid-cols-2 gap-1 rounded-md bg-slate-950 p-1 text-sm">
            {[['recommend', 'Recommendation'], ['analyze', 'AI analysis']].map(([id, t]) => (
              <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setOut(null); setError(null); }}
                className={`rounded px-3 py-1.5 transition-colors ${mode === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{t}</button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{ai ? 'POST /inventory/analyze: calculates inventory metrics, then adds an AI explanation grounded in retrieved policies.' : 'POST /inventory/recommend: calculates inventory metrics only, with no AI involved.'}</p>
          <Field id="d" label="Forecast weekly demand (units)" type="number" min="0" step="any" value={v.forecast_weekly_demand} onChange={set('forecast_weekly_demand')} error={errs.forecast_weekly_demand} hint="Physical units per week, greater than 0" />
          <Field id="s" label="Current stock (units)" type="number" min="0" step="any" value={v.current_stock} onChange={set('current_stock')} error={errs.current_stock} hint="Units on hand, 0 or more" />
          <div className="grid grid-cols-2 gap-3">
            <Field id="l" label="Lead time (days)" type="number" min="1" step="1" value={v.lead_time_days} onChange={set('lead_time_days')} error={errs.lead_time_days} hint="Supplier delivery time" />
            <Field id="r" label="Review period (days)" type="number" min="1" step="1" value={v.review_period_days} onChange={set('review_period_days')} error={errs.review_period_days} hint="Days to next review" />
          </div>
          {ai && <Field id="sf" label="Safety stock (units)" type="number" min="0" step="1" value={v.safety_stock} onChange={set('safety_stock')} error={errs.safety_stock} hint="Extra buffer, whole units" />}
          <button className="btn w-full" disabled={loading}>{loading ? <Spinner label={ai ? 'Analysing' : 'Calculating'} /> : <><Boxes className="h-4 w-4" />{ai ? 'Analyse inventory' : 'Calculate recommendation'}</>}</button>
          {!ai && <p className="text-xs text-slate-500">The recommendation endpoint has no safety stock input, so none is applied.</p>}
        </form>
        <div className="space-y-4 lg:col-span-3">
          {error && <ErrorBox message={error} />}
          {inv ? (
            <>
              <div className="card flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-sm text-slate-400">Reorder required</p><p className="text-xl font-semibold text-slate-100">{inv.reorder_required ? `Yes, order ${fmtNum(inv.reorder_quantity, 0)} units` : 'No'}</p></div>
                <RiskBadge risk={inv.stockout_risk} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Forecast weekly demand" value={fmtNum(inv.forecast_weekly_demand)} sub="units, as entered" />
                <Metric label="Current stock" value={fmtNum(inv.current_stock)} sub="units, as entered" />
                <Metric label="Daily demand" value={fmtNum(inv.daily_demand)} sub="units per day" />
                <Metric label="Days of cover" value={inv.days_of_cover == null ? 'n/a' : fmtNum(inv.days_of_cover)} sub="days" />
                <Metric label="Target stock" value={fmtNum(inv.target_stock, 0)} sub="units" />
                <Metric label="Reorder quantity" value={fmtNum(inv.reorder_quantity, 0)} sub="units" />
              </div>
              {out.mode === 'analyze' && (
                <div className="card space-y-4">
                  <h3 className="text-sm font-medium text-slate-100">AI explanation</h3>
                  <Markdown text={out.explanation} />
                  <Sources sources={out.sources} />
                  <p className="text-xs text-slate-500">The explanation is generated by an LLM from the retrieved sources above. The numbers come from the inventory calculation.</p>
                </div>
              )}
            </>
          ) : !error && <div className="card text-sm text-slate-500">Enter physical unit demand and stock levels to see a reorder recommendation.</div>}
        </div>
      </div>
    </div>
  );
}
