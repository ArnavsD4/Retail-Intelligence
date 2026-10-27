import { createContext, useContext, useState, useCallback } from 'react';
// Client-side session history only. Nothing is persisted; it resets on reload.
const Ctx = createContext(null);
export function SessionProvider({ children }) {
  const [h, setH] = useState({ forecasts: [], inventory: [], questions: [] });
  const add = useCallback((kind, item) => setH((p) => ({ ...p, [kind]: [{ ...item, at: new Date() }, ...p[kind]].slice(0, 25) })), []);
  return <Ctx.Provider value={{ history: h, add }}>{children}</Ctx.Provider>;
}
export const useSession = () => useContext(Ctx);
