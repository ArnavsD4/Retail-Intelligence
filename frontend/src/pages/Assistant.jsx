import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ErrorBox, Spinner, Markdown, Sources } from '../components/ui.jsx';
import { api } from '../services/api.js';
import { useSession } from '../hooks/useSession.jsx';

const SUGGESTED = [
  'What factors should a retailer consider when planning inventory?',
  'How should stockout risk be assessed?',
  'Why is supplier lead time important?',
  'How should demand forecasts support reorder planning?',
];

export default function Assistant() {
  const { add } = useSession();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading, err]);

  async function send(q, retry = false) {
    q = q.trim();
    if (!q || loading) return;
    if (q.length > 2000) { setErr({ question: q, message: 'Questions are limited to 2,000 characters.', noRetry: true }); return; }
    if (!retry) setMsgs((m) => [...m, { role: 'user', content: q }]);
    setText(''); setErr(null); setLoading(true);
    try {
      const r = await api.ask(q);
      setMsgs((m) => [...m, { role: 'assistant', content: r.answer, sources: r.sources }]);
      add('questions', { question: q });
    } catch (x) { setErr({ question: q, message: x.message }); }
    finally { setLoading(false); }
  }

  return (
    <div className="card flex h-[calc(100vh-11rem)] min-h-[420px] flex-col p-0">
      <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
        {!msgs.length && !loading && !err && (
          <div className="mx-auto max-w-xl pt-6 text-center">
            <Bot className="mx-auto mb-2 h-7 w-7 text-indigo-300" />
            <p className="text-sm text-slate-300">Ask about inventory planning, stockout risk, lead times or demand forecasting.</p>
            <p className="mt-1 text-xs text-slate-500">Answers are generated from the retail policy documents the backend retrieves. Retrieved sources are listed under each answer.</p>
            <div className="mt-5 grid gap-2 text-left">{SUGGESTED.map((s) => <button key={s} onClick={() => send(s)} className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-500 hover:bg-slate-800">{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => m.role === 'user' ? (
          <div key={i} className="flex justify-end gap-2"><div className="max-w-[85%] rounded-lg bg-indigo-500/20 px-3 py-2 text-sm text-slate-100">{m.content}</div><User className="mt-1 h-4 w-4 shrink-0 text-slate-500" /></div>
        ) : (
          <div key={i} className="flex gap-2"><Bot className="mt-1 h-4 w-4 shrink-0 text-indigo-300" />
            <div className="min-w-0 max-w-[90%] flex-1 space-y-3"><div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2"><Markdown text={m.content} /></div><Sources sources={m.sources} /></div>
          </div>
        ))}
        {loading && <div className="flex gap-2"><Bot className="mt-1 h-4 w-4 text-indigo-300" /><Spinner label="Retrieving policies and generating an answer" /></div>}
        {err && <ErrorBox message={err.message} onRetry={err.noRetry ? undefined : () => send(err.question, true)} />}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex items-end gap-2 border-t border-slate-800 p-3">
        <label htmlFor="q" className="sr-only">Your question</label>
        <textarea id="q" rows={1} maxLength={2100} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a retail operations question"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text); } }} className="input max-h-32 resize-none" />
        <button className="btn" disabled={loading || !text.trim()} aria-label="Send question"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
