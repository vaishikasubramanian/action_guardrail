import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

function PolicyHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(null);

  const token = () => localStorage.getItem("token");

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/policy-history`);
      setHistory(res.data);
    } catch {
      alert("Failed to load policy history.");
    } finally {
      setLoading(false);
    }
  };

  const rollback = async (historyId, ruleId) => {
    if (!confirm(`Roll back policy ${ruleId} to its previous configuration?`)) return;
    try {
      setRolling(historyId);
      const res = await axios.post(
        `${API_BASE}/policy-history/rollback/${historyId}`,
        {},
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      if (res.data.status === "success") {
        fetchHistory();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Rollback failed. Admin required.");
    } finally {
      setRolling(null);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="page-header">Policy History</h1>
        <p className="page-sub">Audit trail of all policy changes with one-click rollback.</p>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-600">No changes recorded yet</p>
          <p className="text-sm text-slate-400 mt-1">Policy edits will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="table-th">Rule</th>
                <th className="table-th">Old Value</th>
                <th className="table-th">New Value</th>
                <th className="table-th">Old Decision</th>
                <th className="table-th">New Decision</th>
                <th className="table-th">Timestamp</th>
                <th className="table-th">Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">{entry.rule_id}</span>
                  </td>
                  <td className="table-td">
                    <span className="bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded text-xs font-mono">{entry.old_value}</span>
                  </td>
                  <td className="table-td">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-xs font-mono">{entry.new_value}</span>
                  </td>
                  <td className="table-td text-sm text-slate-500 font-mono">{entry.old_decision}</td>
                  <td className="table-td text-sm font-semibold text-slate-700 font-mono">{entry.new_decision}</td>
                  <td className="table-td font-mono text-xs text-slate-400">{entry.timestamp}</td>
                  <td className="table-td">
                    <button
                      onClick={() => rollback(entry.id, entry.rule_id)}
                      disabled={rolling === entry.id}
                      className="text-xs font-semibold text-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                    >
                      {rolling === entry.id ? "Rolling back..." : "Rollback"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PolicyHistory;
