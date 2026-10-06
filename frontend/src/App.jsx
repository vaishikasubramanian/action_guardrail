import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HITL from "./pages/HITL";
import AuditLogs from "./pages/AuditLogs";
import Policies from "./pages/Policies";
import PolicySimulator from "./pages/PolicySimulator";
import Agents from "./pages/Agents";
import Scenarios from "./pages/Scenarios";
import Users from "./pages/Users";
import PolicyHistory from "./pages/PolicyHistory";
import PublicDemo from "./pages/PublicDemo";

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    return token ? { token, role, username } : null;
  });

  const handleLogin = (role, username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("username", username);
    setAuth({ token, role, username });
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuth(null);
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* Public route — no login needed */}
        <Route path="/demo" element={<PublicDemo />} />

        {/* Auth routes */}
        <Route
          path="/*"
          element={
            !auth ? (
              <Login onLogin={handleLogin} />
            ) : (
              <div className="flex h-screen overflow-hidden bg-slate-50">
                <Sidebar role={auth.role} username={auth.username} onLogout={handleLogout} />
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/hitl" element={<HITL />} />
                    <Route path="/audit" element={<AuditLogs />} />
                    <Route path="/policies" element={<Policies />} />
                    <Route path="/policy-history" element={<PolicyHistory />} />
                    <Route path="/simulator" element={<PolicySimulator />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/scenarios" element={<Scenarios />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            )
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
