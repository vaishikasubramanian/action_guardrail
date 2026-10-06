import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const decisionBadge = (d) => {
  if (d === "block") return "badge-block";
  if (d === "require_hitl") return "badge-hitl";
  if (d === "log_and_allow") return "badge-log";
  return "badge-allow";
};

const decisionLabel = (d) => {
  if (d === "block") return "Block";
  if (d === "require_hitl") return "HITL";
  if (d === "log_and_allow") return "Log & Allow";
  return "Allow";
};

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.reverse());
    } catch {}
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = logs.filter((l) => {
    const matchFilter = filter === "all" || l.decision === filter;
    const matchSearch = !search || l.agent_id.includes(search) || l.action.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="p-8">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-header">Audit Logs</h1>
          <p className="page-sub">Complete record of every evaluated agent action.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            className="input max-w-xs"
            placeholder="Search agent or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5">
            {["all", "block", "require_hitl", "log_and_allow", "allow"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "All" : decisionLabel(f)}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-slate-400">{filtered.length} entries</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="table-th">Timestamp</th>
              <th className="table-th">Agent</th>
              <th className="table-th">Tool</th>
              <th className="table-th">Action</th>
              <th className="table-th">Decision</th>
              <th className="table-th">Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center text-slate-400 py-12">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td font-mono text-xs text-slate-500">{log.timestamp}</td>
                  <td className="table-td">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono">{log.agent_id}</span>
                  </td>
                  <td className="table-td text-slate-600">{log.tool_name}</td>
                  <td className="table-td font-medium">{log.action}</td>
                  <td className="table-td">
                    <span className={decisionBadge(log.decision)}>{decisionLabel(log.decision)}</span>
                  </td>
                  <td className="table-td">
                    {log.rule_id
                      ? <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">{log.rule_id}</span>
                      : <span className="text-slate-400 text-xs">—</span>
                    }
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AuditLogs;
