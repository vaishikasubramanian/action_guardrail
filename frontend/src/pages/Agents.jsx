import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const ALL_TOOLS = ["database_tool", "email_tool", "file_tool"];

function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedTools, setSelectedTools] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  const token = () => localStorage.getItem("token");

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/agents`, { headers: { Authorization: `Bearer ${token()}` } });
      setAgents(res.data.agents);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to load agents.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (id) => {
    try {
      setToggling(id);
      await axios.patch(`${API_BASE}/agents/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update agent.");
    } finally {
      setToggling(null);
    }
  };

  const saveTools = async () => {
    try {
      setSaving(true);
      await axios.put(
        `${API_BASE}/agents/${editing.id}/tools`,
        { allowed_tools: selectedTools },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      setEditing(null);
      fetchAgents();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update tools.");
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  useEffect(() => { fetchAgents(); }, []);

  return (
    <div className="p-8">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-header">Agent Registry</h1>
          <p className="page-sub">Manage AI agents and their tool permissions.</p>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading agents...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="table-th">Agent</th>
                <th className="table-th">Description</th>
                <th className="table-th">Allowed Tools</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => (
                <tr key={agent.id} className={`hover:bg-slate-50 transition-colors ${!agent.enabled ? "opacity-50" : ""}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm text-slate-800 font-mono">{agent.agent_name}</span>
                    </div>
                  </td>
                  <td className="table-td text-slate-500 text-sm">{agent.description}</td>
                  <td className="table-td">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.allowed_tools.split(",").map((t) => (
                        <span key={t} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-xs font-mono">{t.trim()}</span>
                      ))}
                    </div>
                  </td>
                  <td className="table-td">
                    {agent.enabled
                      ? <span className="badge-allow">Active</span>
                      : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Disabled</span>
                    }
                  </td>
                  <td className="table-td">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditing(agent); setSelectedTools(agent.allowed_tools.split(",").map(t => t.trim())); }}
                        className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Edit Tools
                      </button>
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        disabled={toggling === agent.id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${agent.enabled ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                      >
                        {toggling === agent.id ? "..." : agent.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Edit Agent Tools</h2>
                <p className="text-sm text-slate-500 mt-0.5 font-mono">{editing.agent_name}</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {ALL_TOOLS.map((tool) => (
                <label key={tool} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTools.includes(tool) ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool)}
                    onChange={() => toggleTool(tool)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="font-mono font-semibold text-sm text-slate-700">{tool}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={saveTools} disabled={saving || selectedTools.length === 0} className="btn-primary flex-1">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Agents;
