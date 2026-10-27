import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
export function useHealth() {
  const [s, setS] = useState({ state: 'checking', error: null, checkedAt: null });
  const refresh = useCallback(async () => {
    setS((p) => ({ ...p, state: 'checking' }));
    try {
      const r = await api.health();
      const ok = r.status === 'ok';
      setS({ state: ok ? 'online' : 'offline', error: ok ? null : 'Unexpected /health response.', checkedAt: new Date() });
    } catch (e) { setS({ state: 'offline', error: e.message, checkedAt: new Date() }); }
  }, []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 30000); return () => clearInterval(t); }, [refresh]);
  return { ...s, refresh };
}
