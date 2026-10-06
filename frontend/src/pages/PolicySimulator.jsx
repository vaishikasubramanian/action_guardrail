import { useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const ACTIONS = [
  { value: "delete_records", label: "delete_records", paramLabel: "Record count", paramType: "number", placeholder: "e.g. 500" },
  { value: "send_email", label: "send_email", paramLabel: "Recipient email", paramType: "text", placeholder: "e.g. user@gmail.com" },
  { value: "read_file", label: "read_file", paramLabel: "File path", paramType: "text", placeholder: "e.g. confidential_report.pdf" },
];

const decisionInfo = {
  block: { label: "BLOCK", color: "text-red-700 bg-red-50 border-red-200", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
  require_hitl: { label: "REQUIRE HITL", color: "text-amber-700 bg-amber-50 border-amber-200", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  log_and_allow: { label: "LOG & ALLOW", color: "text-blue-700 bg-blue-50 border-blue-200", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  allow: { label: "ALLOW", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
};

function PolicySimulator() {
  const [action, setAction] = useState("");
  const [paramValue, setParamValue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedAction = ACTIONS.find((a) => a.value === action);

  const simulate = async () => {
    if (!action || !paramValue) {
      setError("Please select an action and enter a parameter.");
      return;
    }
    setError("");
    try {
      setLoading(true);
      setResult(null);
      const params = action === "delete_records"
        ? { record_count: Number(paramValue) }
        : action === "send_email"
        ? { recipient: paramValue }
        : { path: paramValue };

      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/simulate`,
        { action, parameters: params },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);    } catch (err) {
      setError(err.response?.data?.detail || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const info = result ? decisionInfo[result.decision] || decisionInfo.allow : null;

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="page-header">Policy Simulator</h1>
        <p className="page-sub">Test how the policy engine evaluates an action — without executing it. Safe for testing rule changes.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Input */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-5">Configure Action</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Action Type</label>
              <select value={action} onChange={(e) => { setAction(e.target.value); setParamValue(""); setResult(null); }} className="input">
                <option value="">Select an action...</option>
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {selectedAction && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{selectedAction.paramLabel}</label>
                <input
                  type={selectedAction.paramType}
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                  placeholder={selectedAction.placeholder}
                  className="input"
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button onClick={simulate} disabled={loading || !action} className="btn-primary w-full justify-center flex items-center gap-2">
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
                  Run Simulation
                </>
              )}
            </button>

            <p className="text-xs text-center text-slate-400">Action will be evaluated but NOT executed.</p>
          </div>
        </div>

        {/* Result */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-5">Simulation Result</h2>

          {!result ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <p className="text-sm">Configure and run a simulation to see results.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-2xl border-2 p-5 ${info.color}`}>
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={info.icon} />
                  </svg>
                  <div>
                    <p className="font-bold text-lg">{info.label}</p>
                    <p className="text-xs mt-0.5 opacity-80">Tool NOT executed — simulation only</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-0.5">Matched Rule</p>
                  <p className="font-mono font-semibold text-sm text-slate-700">{result.matched_rule || "None"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-0.5">Agent</p>
                  <p className="font-mono font-semibold text-sm text-slate-700">{result.agent || "simulation_agent"}</p>
                </div>
              </div>

              {result.explanations?.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-xs text-slate-400 mb-1">Explanation</p>
                  {result.explanations.map((e, i) => (
                    <p key={i} className="text-xs text-slate-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default PolicySimulator;
