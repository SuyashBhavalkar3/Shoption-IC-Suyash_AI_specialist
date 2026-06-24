"use client";

import { useEffect, useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import DashboardScreen from "@/components/DashboardScreen";
import type { DashboardState, UserRecord, ReportResponse, EmployeeRecord } from "@/components/types";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data.detail || data.message || `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // Loading on initial auth check
  const [loadingData, setLoadingData] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardState>({
    me: null,
    users: [],
    report: null,
    employees: [],
  });

  // Attempt to restore token on mount
  useEffect(() => {
    const storedToken = window.localStorage.getItem("shoption_admin_token");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else {
      setLoading(false);
    }
  }, []);

  // Poll for dashboard data when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    void loadDashboard(token);

    const interval = setInterval(() => {
      void loadDashboard(token);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      const data: { access_token: string } = await res.json();
      window.localStorage.setItem("shoption_admin_token", data.access_token);
      setToken(data.access_token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("shoption_admin_token");
    setToken(null);
    setIsAuthenticated(false);
    setDashboard({ me: null, users: [], report: null, employees: [] });
  };

  const handleToggleTrackingNeeded = async (employeeId: string, currentVal: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/org-employees/${encodeURIComponent(employeeId)}/tracking-needed?needed=${!currentVal}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(await readError(res));
      }

      // Optimistically or immediately update registry state locally
      setDashboard((prev) => ({
        ...prev,
        employees: prev.employees.map((emp) =>
          emp.employee_id === employeeId ? { ...emp, is_tracking_needed: !currentVal } : emp
        ),
      }));
    } catch (err) {
      console.error("Failed to update tracking need status:", err);
      // reload dashboard data to sync back
      void loadDashboard(token);
    }
  };

  async function loadDashboard(authToken: string) {
    if (!dashboard.me) {
      setLoadingData(true);
    }
    setError("");
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [meRes, usersRes, reportRes, employeesRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/users/me`, { headers }),
        fetch(`${getApiBaseUrl()}/users/`, { headers }),
        fetch(`${getApiBaseUrl()}/calls/reports`, { headers }),
        fetch(`${getApiBaseUrl()}/org-employees/`, { headers }),
      ]);

      if (!meRes.ok) throw new Error(await readError(meRes));
      if (!usersRes.ok) throw new Error(await readError(usersRes));
      if (!reportRes.ok) throw new Error(await readError(reportRes));

      const [me, users, report] = await Promise.all([
        meRes.json() as Promise<UserRecord>,
        usersRes.json() as Promise<UserRecord[]>,
        reportRes.json() as Promise<ReportResponse>,
      ]);

      let employees: EmployeeRecord[] = [];
      if (employeesRes.ok) {
        employees = (await employeesRes.json()) as EmployeeRecord[];
      }

      setDashboard({
        me,
        users,
        report,
        employees,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      // Enforce strict login: if data load fails (e.g. invalid/expired token), logout immediately
      handleLogout();
    } finally {
      setLoadingData(false);
      setLoading(false);
    }
  }

  const handleUpdateUser = async (userId: string, data: any) => {
    if (!token) return;
    const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(await readError(res));
    }
    void loadDashboard(token);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!token) return;
    const res = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(await readError(res));
    }
    void loadDashboard(token);
  };

  const handleToggleUserTracking = async (userId: string, enabled: boolean) => {
    if (!token) return;
    const res = await fetch(`${getApiBaseUrl()}/users/${userId}/tracking?enabled=${enabled}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(await readError(res));
    }
    void loadDashboard(token);
  };

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-xl max-w-sm w-full text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#04693F] mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Checking Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSubmit={handleLogin}
        error={error}
        loading={loading}
      />
    );
  }

  return (
    <DashboardScreen
      dashboard={dashboard}
      onLogout={handleLogout}
      loading={loadingData}
      onToggleTrackingNeeded={handleToggleTrackingNeeded}
      onUpdateUser={handleUpdateUser}
      onDeleteUser={handleDeleteUser}
      onToggleUserTracking={handleToggleUserTracking}
    />
  );
}

