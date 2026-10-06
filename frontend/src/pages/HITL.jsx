import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

function HITL() {
  const [requests, setRequests] = useState([]);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/hitl/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const act = async (id, action) => {
    try {
      setProcessing(`${id}-${action}`);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/hitl/${action}/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (action === "approve" && res.data.tool_result) {
        alert(`✅ Approved & executed.\n\nResult: ${JSON.stringify(res.data.tool_result, null, 2)}`);
      }
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${action}. Are you logged in as admin or reviewer?`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-header">HITL Review Queue</h1>
          <p className="page-sub">Actions paused for human review before execution.</p>
        </div>
        <div className="flex items-center gap-2">
          {requests.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
              {requests.length} pending
            </span>
          )}
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-500">Live</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-semibold text-slate-700">Queue is clear</p>
          <p className="text-sm text-slate-400 mt-1">No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card border-l-4 border-l-amber-400">

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#{req.id}</span>
                    <span className="badge-hitl">Awaiting Review</span>
                    <span className="text-xs text-slate-400 ml-auto">Rule: <span className="font-mono font-semibold text-slate-600">{req.rule_id}</span></span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Agent</p>
                      <p className="text-sm font-mono font-semibold text-slate-700">{req.agent_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Tool</p>
                      <p className="text-sm font-mono font-semibold text-slate-700">{req.tool_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-0.5">Action</p>
                      <p className="text-sm font-mono font-semibold text-slate-700">{req.action}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 font-medium mb-1">Parameters</p>
                    <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-700 overflow-auto">
                      {req.parameters}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 flex-1">Reviewer action required before tool executes.</p>
                <button
                  onClick={() => act(req.id, "reject")}
                  disabled={!!processing}
                  className="btn-danger text-sm"
                >
                  {processing === `${req.id}-reject` ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={() => act(req.id, "approve")}
                  disabled={!!processing}
                  className="btn-success text-sm"
                >
                  {processing === `${req.id}-approve` ? "Approving..." : "Approve & Execute"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HITL;
