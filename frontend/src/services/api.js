// All backend communication lives here. Endpoints and fields match api.py.
const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, kind } = {}) { super(message); this.status = status; this.kind = kind; }
}

function detailText(d) {
  if (!d) return null;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e) => `${(e.loc || []).filter((x) => x !== 'body').join('.')}: ${e.msg}`).join('; ');
  return JSON.stringify(d);
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { ...options, headers: { 'Content-Type': 'application/json' } });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${BASE}. Make sure FastAPI is running. If it is, the browser is probably blocking the request (CORS): add CORSMiddleware allowing ${window.location.origin} to api.py (see README).`,
      { kind: 'network' }
    );
  }
  const text = await res.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); }
    catch { if (res.ok) throw new ApiError('The API returned a response that is not valid JSON.', { status: res.status, kind: 'parse' }); }
  }
  if (!res.ok) throw new ApiError(detailText(body?.detail) || `Request failed (HTTP ${res.status}).`, { status: res.status, kind: 'http' });
  if (body == null) throw new ApiError('The API returned an empty response.', { status: res.status, kind: 'empty' });
  return body;
}

const post = (path, payload) => request(path, { method: 'POST', body: JSON.stringify(payload) });

export const api = {
  base: BASE,
  root: () => request('/'),
  health: () => request('/health'),
  forecast: (p) => post('/forecast', p), // {store, department, forecast_date}
  recommend: (p) => post('/inventory/recommend', p), // {forecast_weekly_demand, current_stock, lead_time_days, review_period_days}
  analyze: (p) => post('/inventory/analyze', p), // + safety_stock
  ask: (question) => post('/ask', { question }),
};
