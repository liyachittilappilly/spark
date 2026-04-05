import React, { useState } from 'react';
import { Sparkles, Send, Loader2, AlertCircle, MessageSquare } from 'lucide-react';

const GeminiAdvisor: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/gemini-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch advice');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          AI Pest Advisor
        </h3>
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
          Powered by Gemini
        </span>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-4">
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the pest or crop issue (e.g., 'Small brown insects at the base of the plant')"
            className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-24"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 transition-all shadow-lg shadow-indigo-200"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        </div>
      )}

      {response && (
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-indigo-600">
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">AI Recommendation</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {response}
          </p>
        </div>
      )}

      {!response && !loading && !error && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Pro Tip:</strong> Be specific about symptoms, colors, and location on the plant for more accurate advice.
          </p>
        </div>
      )}
    </div>
  );
};

export default GeminiAdvisor;
