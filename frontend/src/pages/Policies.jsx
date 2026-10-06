import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const decisionBadge = (d) => {
  if (d === "block") return "badge-block";
  if (d === "require_hitl") return "badge-hitl";
  if (d === "log_and_allow") return "badge-log";
  return "badge-allow";
};

function Policies() {
  const [policies, setPolicies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  const fetchPolicies = async () => {
    try {
      const res = await axios.get(`${API_BASE}/policies`);
      setPolicies(res.data.rules);
    } catch {}
  };

  useEffect(() => { fetchPolicies(); }, []);

  const openEdit = (p) => {
    setEditing(p);
    setNewValue(p.value || "");
    setNewDecision(p.decision);
  };

  const savePolicy = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/policies/${editing.rule_id}`,
        { value: Number(newValue), decision: newDecision },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(null);
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update policy. Admin required.");
    } finally {
      setSaving(false);
    }
  };

  const togglePolicy = async (ruleId) => {
    try {
      setToggling(ruleId);
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_BASE}/policies/${ruleId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPolicies();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to toggle policy.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="page-header">Policy Engine</h1>
        <p className="page-sub">Configure rules that govern every agent tool call before execution.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="table-th">Rule ID</th>
              <th className="table-th">Action</th>
              <th className="table-th">Condition</th>
              <th className="table-th">Decision</th>
              <th className="table-th">Status</th>
              <th className="table-th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {policies.map((p) => (
              <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${!p.enabled ? "opacity-50" : ""}`}>
                <td className="table-td">
                  <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">{p.rule_id}</span>
                </td>
                <td className="table-td font-mono text-xs">{p.action}</td>
                <td className="table-td">
                  <span className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{p.field}</span>
                    {" "}{p.operator}{" "}
                    <span className="font-semibold text-slate-700">{p.value || "—"}</span>
                  </span>
                </td>
                <td className="table-td">
                  <span className={decisionBadge(p.decision)}>
                    {p.decision === "require_hitl" ? "HITL" : p.decision === "log_and_allow" ? "Log & Allow" : p.decision.charAt(0).toUpperCase() + p.decision.slice(1)}
                  </span>
                </td>
                <td className="table-td">
                  {p.enabled
                    ? <span className="badge-allow">Active</span>
                    : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Disabled</span>
                  }
                </td>
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                      Edit
                    </button>
                    <button
                      onClick={() => togglePolicy(p.rule_id)}
                      disabled={toggling === p.rule_id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${p.enabled ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      {toggling === p.rule_id ? "..." : p.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Policy</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-mono font-semibold text-indigo-600">{editing.rule_id}</span> — {editing.action}
                </p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Threshold Value</label>
                <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="input" />
                <p className="text-xs text-slate-400 mt-1">Current field: <span className="font-mono">{editing.field} {editing.operator}</span></p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Decision</label>
                <select value={newDecision} onChange={(e) => setNewDecision(e.target.value)} className="input">
                  <option value="block">Block</option>
                  <option value="require_hitl">Require HITL</option>
                  <option value="log_and_allow">Log and Allow</option>
                  <option value="allow">Allow</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={savePolicy} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Policies;
