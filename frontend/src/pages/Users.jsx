import { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../api";

const roleStyles = {
  admin: "bg-red-50 text-red-700 border-red-200",
  reviewer: "bg-amber-50 text-amber-700 border-amber-200",
  auditor: "bg-blue-50 text-blue-700 border-blue-200",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(null);

  const token = () => localStorage.getItem("token");
  const currentUser = localStorage.getItem("username");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token()}` } });
      setUsers(res.data.users);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to load users. Admin required.");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = async (userId) => {
    try {
      setToggling(userId);
      await axios.patch(`${API_BASE}/users/${userId}/toggle`, {}, { headers: { Authorization: `Bearer ${token()}` } });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setToggling(null);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await axios.put(
        `${API_BASE}/users/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role.");
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="page-header">User Management</h1>
        <p className="page-sub">Manage platform users, roles, and access. Admin only.</p>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading users...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="table-th">User</th>
                <th className="table-th">Role</th>
                <th className="table-th">Status</th>
                <th className="table-th">Change Role</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{user.username}</p>
                        {user.username === currentUser && (
                          <p className="text-xs text-indigo-500">You</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleStyles[user.role] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${user.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <span className={`text-sm font-medium ${user.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                        {user.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="input max-w-xs text-sm py-1.5"
                      disabled={user.username === currentUser}
                    >
                      <option value="admin">Admin</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </td>
                  <td className="table-td">
                    <button
                      onClick={() => toggleUser(user.id)}
                      disabled={toggling === user.id || user.username === currentUser}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        user.enabled
                          ? "text-red-600 hover:bg-red-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {toggling === user.id ? "..." : user.enabled ? "Disable" : "Enable"}
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

export default Users;
