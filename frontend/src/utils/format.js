const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const fmtUsd = (n) => (n == null ? '—' : usd.format(n));
export const fmtNum = (n, d = 2) => (n == null ? 'n/a' : Number(n).toLocaleString('en-US', { maximumFractionDigits: d }));
export const isRealDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
export const timeStr = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
export const METRICS = { mae: 1839.08, rmse: 3696.4, wape: 11.65, model: 'HistGradientBoostingRegressor' };

// Turn backend 400 messages into clearer guidance.
export function friendlyForecastError(msg) {
  if (/No Walmart feature record/i.test(msg)) return 'That store and date are not in the Walmart dataset. Use a week-ending Friday that exists in features.csv for this store (for example 2012-10-26).';
  if (/four earlier sales/i.test(msg)) return 'This store and department have fewer than four earlier weekly observations before that date, so lag features cannot be built. Try a later date or another department.';
  if (/Store \d+ was not found/i.test(msg)) return msg + ' Check the store ID.';
  if (/Invalid isoformat|Unknown string format|time data/i.test(msg)) return 'The date could not be parsed. Use the format YYYY-MM-DD.';
  return msg;
}
