import { useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const SCENARIOS = [
  {
    id: "delete_block",
    label: "Delete 500 Records",
    tag: "BLOCK",
    tagClass: "badge-block",
    desc: "Exceeds threshold of 100 — policy RULE001 blocks this.",
    icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    color: "border-red-200 hover:border-red-400 hover:bg-red-50",
    iconBg: "bg-red-100 text-red-600",
    action: "delete_records", params: { record_count: 500 },
  },
  {
    id: "delete_allow",
    label: "Delete 5 Records",
    tag: "ALLOW",
    tagClass: "badge-allow",
    desc: "Below threshold — no rule matches, action proceeds.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
    action: "delete_records", params: { record_count: 5 },
  },
  {
    id: "email_hitl",
    label: "External Email",
    tag: "HITL",
    tagClass: "badge-hitl",
    desc: "Sends to gmail.com — RULE002 pauses for human approval.",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    iconBg: "bg-amber-100 text-amber-600",
    action: "send_email", params: { recipient: "user@gmail.com" },
  },
  {
    id: "email_allow",
    label: "Internal Email",
    tag: "ALLOW",
    tagClass: "badge-allow",
    desc: "Sends to @company.com — internal domain passes through.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
    action: "send_email", params: { recipient: "employee@company.com" },
  },
  {
    id: "confidential",
    label: "Confidential File Read",
    tag: "LOG & ALLOW",
    tagClass: "badge-log",
    desc: "Path contains 'confidential' — RULE003 logs and allows.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    iconBg: "bg-blue-100 text-blue-600",
    action: "read_file", params: { path: "confidential_payroll_report.pdf" },
  },
  {
    id: "dry_run",
    label: "Dry Run Mode",
    tag: "SIMULATE",
    tagClass: "badge-log",
    desc: "Policy evaluated — no action executed. Used for testing.",
    icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
    iconBg: "bg-indigo-100 text-indigo-600",
    action: "delete_records", params: { record_count: 500 }, dry: true,
  },
];

function ResultPanel({ result }) {
  if (!result) return null;

  // Map status to decision for display
  const statusToDecision = {
    "blocked": "block",
    "pending_approval": "require_hitl",
    "simulation": "block (dry run)",
    "success": result.decision || "allow"
  };

  const d = result.decision || statusToDecision[result.status] || result.guardrail_result?.decision;
  const rule = result.rule_id || result.guardrail_result?.rule_id || result.matched_rule;

  // Determine display label
  const displayLabel =
    result.status === "blocked" ? "BLOCK" :
    result.status === "pending_approval" ? "REQUIRE HITL" :
    result.status === "simulation" ? "DRY RUN — NOT EXECUTED" :
    result.decision === "log_and_allow" ? "LOG & ALLOW" :
    result.status === "success" ? "ALLOW" : d?.toUpperCase() || "ALLOW";

  const color =
    result.status === "blocked" ? "border-red-300 bg-red-50"
    : result.status === "pending_approval" ? "border-amber-300 bg-amber-50"
    : result.status === "simulation" ? "border-indigo-300 bg-indigo-50"
    : result.decision === "log_and_allow" ? "border-blue-300 bg-blue-50"
    : "border-emerald-300 bg-emerald-50";

  const textColor =
    result.status === "blocked" ? "text-red-700"
    : result.status === "pending_approval" ? "text-amber-700"
    : result.status === "simulation" ? "text-indigo-700"
    : result.decision === "log_and_allow" ? "text-blue-700"
    : "text-emerald-700";

  return (
    <div className={`card border-2 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">Evaluation Result</h3>
        <span className={`text-sm font-bold uppercase tracking-wide ${textColor}`}>{displayLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <p className="text-xs text-slate-400 mb-1">Decision</p>
          <p className={`font-bold text-sm ${textColor}`}>{displayLabel}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <p className="text-xs text-slate-400 mb-1">Matched Rule</p>
          <p className="font-bold text-sm font-mono text-slate-700">{rule || "None — action allowed"}</p>
        </div>
      </div>
      <details className="mt-2">
        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">Raw response</summary>
        <pre className="mt-2 bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono overflow-auto text-slate-700 max-h-48">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Scenarios() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(null);

  const run = async (sc) => {
    try {
      setLoading(sc.id);
      setResult(null);

      if (sc.dry) {
        const res = await axios.post(`${API_BASE}/execute`, {
          agent_id: "demo_agent",
          tool_name: "database_tool",
          action: sc.action,
          parameters: sc.params,
          dry_run: true,
        });
        setResult(res.data);
        return;
      }

      const toolMap = {
        delete_records: "database_tool",
        send_email: "email_tool",
        read_file: "file_tool",
      };

      const res = await axios.post(`${API_BASE}/execute`, {
        agent_id: "demo_agent",
        tool_name: toolMap[sc.action],
        action: sc.action,
        parameters: sc.params,
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data || "Error occurred" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="page-header">Scenario Demonstration</h1>
        <p className="page-sub">Click any scenario to trigger the guardrail and observe the enforcement decision in real time.</p>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => run(sc)}
            disabled={!!loading}
            className={`text-left p-5 rounded-2xl border-2 bg-white transition-all duration-150 disabled:opacity-60 ${sc.color} ${loading === sc.id ? "scale-95" : ""}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.iconBg}`}>
                {loading === sc.id ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={sc.icon} />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-800 text-sm">{sc.label}</p>
                  <span className={sc.tagClass}>{sc.tag}</span>
                </div>
                <p className="text-xs text-slate-500">{sc.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <ResultPanel result={result} />

    </div>
  );
}

export default Scenarios;
