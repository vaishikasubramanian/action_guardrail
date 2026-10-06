import { useState, useEffect } from "react";
import axios from "axios";
import MetricsCards from "../components/MetricsCards";
import DecisionCard from "../components/DecisionCard";
import API_BASE from "../api";

const EXAMPLE_PROMPTS = [
  "Delete 500 customer records from the database",
  "Send quarterly report to cfo@gmail.com",
  "Read the confidential_payroll.pdf file",
  "Delete 3 test records from staging",
  "Send invoice to billing@company.com",
];

function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="page-header">{title}</h1>
      {subtitle && <p className="page-sub">{subtitle}</p>}
    </div>
  );
}

function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/metrics`);
      setMetrics(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const executePrompt = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await axios.post(`${API_BASE}/agent`, { prompt });
      setResult(res.data);
      fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.detail || "Backend error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Live view of agent actions, policy decisions, and governance metrics."
      />

      {metrics && <MetricsCards metrics={metrics} />}

      <div className="grid grid-cols-3 gap-6">

        {/* Agent Console — spans 2 cols */}
        <div className="col-span-2 card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-800">Agent Console</h2>
          </div>

          <textarea
            className="input h-28 resize-none font-mono text-sm"
            placeholder='Type a natural language instruction — e.g. "Delete 500 customer records"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) executePrompt(); }}
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-400">⌘ + Enter to run</p>
            <button onClick={executePrompt} disabled={loading || !prompt.trim()} className="btn-primary flex items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Execute
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Generated Tool Call</p>
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono overflow-auto text-slate-700">
                  {JSON.stringify(result.generated_tool_call, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Guardrail Decision</p>
                <DecisionCard decision={result.guardrail_result} />
              </div>
            </div>
          )}
        </div>

        {/* Quick examples panel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="font-semibold text-slate-800">Quick Examples</h2>
          </div>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl px-3 py-2.5 transition-all duration-150"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">How it works</p>
            <div className="space-y-2">
              {[
                { color: "bg-red-500", label: "BLOCK", desc: "Rejected — policy violated" },
                { color: "bg-amber-500", label: "HITL", desc: "Paused — human review needed" },
                { color: "bg-blue-500", label: "LOG", desc: "Allowed + audit record created" },
                { color: "bg-emerald-500", label: "ALLOW", desc: "Executed — no rule matched" },
              ].map((d) => (
                <div key={d.label} className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${d.color} flex-shrink-0`} />
                  <span className="text-xs font-semibold text-slate-700 w-12">{d.label}</span>
                  <span className="text-xs text-slate-400">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
