import { useState } from "react";
import axios from "axios";
import API_BASE from "../api";

// This page represents what an external system or employee-facing app would see.
// It calls POST /execute directly — no login required.
// The guardrail runs transparently in the background.

const EXAMPLES = [
  { label: "Delete 500 records", prompt: "Delete 500 customer records from the database" },
  { label: "Delete 5 records", prompt: "Delete 5 test records from staging" },
  { label: "Email to Gmail", prompt: "Send quarterly report to cfo@gmail.com" },
  { label: "Email internal", prompt: "Send invoice to billing@company.com" },
  { label: "Read confidential file", prompt: "Read the confidential_payroll.pdf file" },
  { label: "Read normal file", prompt: "Read the quarterly_report.pdf file" },
];

const decisionConfig = {
  blocked: { color: "bg-red-50 border-red-300 text-red-700", icon: "❌", label: "BLOCKED" },
  pending_approval: { color: "bg-amber-50 border-amber-300 text-amber-700", icon: "⏸️", label: "PAUSED — AWAITING HUMAN REVIEW" },
  simulation: { color: "bg-blue-50 border-blue-300 text-blue-700", icon: "🔵", label: "DRY RUN" },
  success: { color: "bg-emerald-50 border-emerald-300 text-emerald-700", icon: "✅", label: "ALLOWED & EXECUTED" },
};

function PublicDemo() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      // Calls POST /agent — no auth needed
      const res = await axios.post(`${API_BASE}/agent`, { prompt });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.detail || "Server error." });
    } finally {
      setLoading(false);
    }
  };

  const cfg = result?.guardrail_result
    ? decisionConfig[result.guardrail_result.status] || decisionConfig.success
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-semibold">Action Guardrail</span>
          <span className="text-slate-400 text-sm">— Live API Demo</span>
        </div>
        <a
          href="/login"
          className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition-all"
        >
          Admin Login →
        </a>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            AI Action Guardrail
          </h1>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Every instruction you give is evaluated against governance policies
            before any tool executes. Type anything below and see what happens.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Give an instruction to the AI agent
          </label>
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none font-mono"
            placeholder='Try: "Delete 500 customer records" or "Send report to user@gmail.com"'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-slate-400">
              The guardrail evaluates this before any action executes.
            </p>
            <button
              onClick={run}
              disabled={loading || !prompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Evaluating...
                </>
              ) : "Run"}
            </button>
          </div>
        </div>

        {/* Quick examples */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EXAMPLES.map((e) => (
            <button
              key={e.label}
              onClick={() => setPrompt(e.prompt)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 transition-all"
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4">

            {result.error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm">
                {result.error}
              </div>
            ) : (
              <>
                {/* Decision */}
                <div className={`rounded-2xl border-2 p-5 ${cfg.color}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <p className="font-bold text-lg">{cfg.label}</p>
                      <p className="text-sm opacity-80 mt-0.5">
                        {result.guardrail_result?.rule_id
                          ? `Matched policy rule: ${result.guardrail_result.rule_id}`
                          : "No policy rule matched — action proceeded normally."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tool call generated */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    AI Generated Tool Call
                  </p>
                  <pre className="bg-slate-50 rounded-xl p-4 text-xs font-mono text-slate-700 overflow-auto">
                    {JSON.stringify(result.generated_tool_call, null, 2)}
                  </pre>
                </div>

                {/* Guardrail response */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Guardrail Response
                  </p>
                  <pre className="bg-slate-50 rounded-xl p-4 text-xs font-mono text-slate-700 overflow-auto">
                    {JSON.stringify(result.guardrail_result, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}

        {/* How it works */}
        {!result && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">How it works</p>
            <div className="space-y-3">
              {[
                { color: "bg-red-500", label: "BLOCK", desc: "Action rejected — policy violated. Tool never executes." },
                { color: "bg-amber-500", label: "HITL", desc: "Action paused — a human reviewer must approve before it executes." },
                { color: "bg-blue-500", label: "LOG & ALLOW", desc: "Action executes but an audit record is created." },
                { color: "bg-emerald-500", label: "ALLOW", desc: "Action executes normally — no policy matched." },
              ].map((d) => (
                <div key={d.label} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full ${d.color} mt-1.5 flex-shrink-0`} />
                  <div>
                    <span className="text-xs font-bold text-slate-700">{d.label} — </span>
                    <span className="text-xs text-slate-500">{d.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default PublicDemo;
