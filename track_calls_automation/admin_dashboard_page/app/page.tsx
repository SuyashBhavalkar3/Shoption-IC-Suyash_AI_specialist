"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useRef } from "react";

type Role = "super_admin" | "admin" | "group_leader" | "warrior";

type UserRecord = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  manager_id: string | null;
  organisation_id: string | null;
  system_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  is_tracking_enabled: boolean;
  is_tracking_active: boolean;
  created_at: string;
  employee_id?: string | null;
};

type ReportResponse = {
  leader_id: string;
  leader_name: string;
  overall_total_calls: number;
  overall_incoming_calls_count: number;
  overall_outgoing_calls_count: number;
  overall_total_calling_hours: number;
  overall_average_call_seconds: number;
  warriors: Array<{
    warrior_id: string;
    full_name: string;
    is_tracking_enabled: boolean;
    total_calls: number;
    incoming_calls_count: number;
    outgoing_calls_count: number;
    total_calling_seconds: number;
    total_calling_hours: number;
    average_call_seconds: number;
    calls: Array<{
      phone_number: string;
      call_type: string;
      call_status?: string | null;
      duration_seconds: number;
      timestamp: string;
    }>;
    manager_id?: string | null;
    manager_name?: string | null;
  }>;
};

type EmployeeRecord = {
  id: string;
  system_id: string;
  employee_id: string;
  email?: string | null;
  is_tracking_needed: boolean;
  org_id: string;
  created_at: string;
};

type DashboardState = {
  me: UserRecord | null;
  users: UserRecord[];
  report: ReportResponse | null;
  employees: EmployeeRecord[];
};

const DEFAULT_EMAIL = "sharad.kale@shoption.in";
const DEFAULT_PASSWORD = "Shoption@123";

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  return url.replace(/\/$/, "");
};

export default function Home() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardState>({
    me: null,
    users: [],
    report: null,
    employees: [],
  });

  const dashboardRef = useRef(dashboard);
  dashboardRef.current = dashboard;

  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [selectedWarriorId, setSelectedWarriorId] = useState<string>("");

  const leadersList = useMemo(() => {
    return dashboard.users.filter((u) => u.role === "group_leader");
  }, [dashboard.users]);

  const warriorsList = useMemo(() => {
    return dashboard.users.filter((u) => {
      if (u.role !== "warrior") return false;
      if (selectedLeaderId) {
        return u.manager_id === selectedLeaderId;
      }
      return true;
    });
  }, [dashboard.users, selectedLeaderId]);

  const handleLeaderChange = (leaderId: string) => {
    setSelectedLeaderId(leaderId);
    setSelectedWarriorId("");
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    void loadDashboard(token);

    // Fetch data in real-time by polling every 5 seconds
    const interval = setInterval(() => {
      void loadDashboard(token);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, token]);

  const totals = useMemo(() => {
    const users = dashboard.users;
    const admins = users.filter((user) => user.role === "admin");
    const leaders = users.filter((user) => user.role === "group_leader");
    const warriors = users.filter((user) => user.role === "warrior");
    const superAdmins = users.filter((user) => user.role === "super_admin");
    const approved = users.filter((user) => user.is_approved);
    const active = users.filter((user) => user.is_active);
    const trackingOn = users.filter((user) => user.is_tracking_enabled).length;

    let filteredReportWarriors = dashboard.report?.warriors ?? [];
    if (selectedLeaderId) {
      filteredReportWarriors = filteredReportWarriors.filter(
        (w) => w.manager_id === selectedLeaderId || w.warrior_id === selectedLeaderId
      );
    }
    if (selectedWarriorId) {
      filteredReportWarriors = filteredReportWarriors.filter(
        (w) => w.warrior_id === selectedWarriorId
      );
    }

    const totalCalls = filteredReportWarriors.reduce((sum, w) => sum + w.total_calls, 0);
    const incoming = filteredReportWarriors.reduce((sum, w) => sum + w.incoming_calls_count, 0);
    const outgoing = filteredReportWarriors.reduce((sum, w) => sum + w.outgoing_calls_count, 0);
    const hours = filteredReportWarriors.reduce((sum, w) => sum + w.total_calling_hours, 0);
    const totalSeconds = filteredReportWarriors.reduce((sum, w) => sum + w.total_calling_seconds, 0);
    const averageCallSeconds = totalCalls > 0 ? totalSeconds / totalCalls : 0;

    return {
      totalUsers: users.length,
      admins: admins.length,
      leaders: leaders.length,
      warriors: warriors.length,
      superAdmins: superAdmins.length,
      approved: approved.length,
      active: active.length,
      trackingOn,
      totalCalls,
      incoming,
      outgoing,
      hours,
      averageCallSeconds,
      employees: dashboard.employees.length,
    };
  }, [dashboard, selectedLeaderId, selectedWarriorId]);

  const filteredReportWarriors = useMemo(() => {
    let list = dashboard.report?.warriors ?? [];
    if (selectedLeaderId) {
      list = list.filter((w) => w.manager_id === selectedLeaderId || w.warrior_id === selectedLeaderId);
    }
    if (selectedWarriorId) {
      list = list.filter((w) => w.warrior_id === selectedWarriorId);
    }
    return list;
  }, [dashboard.report, selectedLeaderId, selectedWarriorId]);

  const filteredUsersTable = useMemo(() => {
    return dashboard.users.filter((user) => {
      if (selectedLeaderId) {
        if (user.id === selectedLeaderId) return true;
        if (user.manager_id === selectedLeaderId) return true;
        return false;
      }
      if (selectedWarriorId) {
        return user.id === selectedWarriorId;
      }
      return true;
    });
  }, [dashboard.users, selectedLeaderId, selectedWarriorId]);

  const leaderSummaryData = useMemo(() => {
    const report = dashboard.report;
    if (!report) return { name: "-", hours: 0, avg: 0, count: 0 };
    if (selectedLeaderId) {
      const leaderUser = dashboard.users.find((u) => u.id === selectedLeaderId);
      const groupWarriors = report.warriors.filter((w) => w.manager_id === selectedLeaderId);
      const totalCalls = groupWarriors.reduce((sum, w) => sum + w.total_calls, 0);
      const totalHours = groupWarriors.reduce((sum, w) => sum + w.total_calling_hours, 0);
      const totalSeconds = groupWarriors.reduce((sum, w) => sum + w.total_calling_seconds, 0);
      const avg = totalCalls > 0 ? totalSeconds / totalCalls : 0;
      return {
        name: leaderUser?.full_name ?? "-",
        hours: totalHours,
        avg: avg,
        count: groupWarriors.length,
      };
    }
    return {
      name: report.leader_name,
      hours: report.overall_total_calling_hours,
      avg: report.overall_average_call_seconds,
      count: report.warriors.length,
    };
  }, [dashboard, selectedLeaderId]);

  const roleBreakdown = useMemo(() => {
    const users = dashboard.users;
    const counts = {
      super_admin: users.filter((user) => user.role === "super_admin").length,
      admin: users.filter((user) => user.role === "admin").length,
      group_leader: users.filter((user) => user.role === "group_leader").length,
      warrior: users.filter((user) => user.role === "warrior").length,
    };
    const max = Math.max(1, ...Object.values(counts));
    return [
      { label: "Super Admin", value: counts.super_admin, color: "#8B5CF6" },
      { label: "Admin", value: counts.admin, color: "#60A5FA" },
      { label: "Group Leader", value: counts.group_leader, color: "#34D399" },
      { label: "Warrior", value: counts.warrior, color: "#64748B" },
    ].map((item) => ({ ...item, width: `${Math.max(12, (item.value / max) * 100)}%` }));
  }, [dashboard.users]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const detail = await readError(res);
        throw new Error(detail);
      }

      const data: { access_token: string } = await res.json();
      window.localStorage.setItem("shoption_admin_token", data.access_token);
      setToken(data.access_token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem("shoption_admin_token");
    setToken(null);
    setIsAuthenticated(false);
    setDashboard({ me: null, users: [], report: null, employees: [] });
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f8fcff] text-slate-900 flex flex-col">
        {/* Sticky Navbar for Auth Page */}
        <header className="border-b border-black/10 bg-white/90 backdrop-blur sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo_product_page.png"
                alt="LeadLens Logo"
                width={160}
                height={40}
                className="object-contain"
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#04693F] border-l border-black/20 pl-3">
                Console Login
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="text-xs text-slate-500 font-semibold">
                Super Admin Portal
              </span>
            </div>
          </div>
        </header>

        <section className="mx-auto flex-1 flex w-full max-w-6xl items-center justify-center px-6 py-10">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-black/10 bg-white/80 shadow-[0_24px_90px_rgba(0,0,0,0.12)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
            <div className="relative overflow-hidden bg-[#e6f7ee] p-10 text-slate-900">
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="inline-flex rounded-full border border-slate-900/10 bg-slate-900/5 px-4 py-1 text-xs uppercase tracking-[0.28em] text-slate-700">
                    Live super admin console
                  </p>
                  <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-tight md:text-5xl text-slate-900">
                    Real metrics, real hierarchy, real organisation data.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-700 md:text-base">
                    Connects directly to the FastAPI backend using your API base URL and renders live analytics for admins, group leaders, and warriors.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-10">
                  <StatMini label="API base" value="Live" />
                  <StatMini label="Access" value="Full org view" />
                  <StatMini label="Charts" value="Enabled" />
                  <StatMini label="Data source" value="FastAPI" />
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Log in with the super-admin account to load live organisation analytics.
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block text-left">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/10"
                  />
                </label>
                <label className="block text-left">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/10"
                  />
                </label>
                {error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                ) : null}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#e6f7ee] border border-[#04693F]/20 px-4 py-3.5 text-sm font-semibold text-[#04693F] transition hover:bg-[#d0f0dd]"
                >
                  Open dashboard
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fcff] text-slate-900">
      {/* Sticky Navbar styled like product_web_page */}
      <header className="border-b border-black/10 bg-white/90 backdrop-blur sticky top-0 z-50 mb-6">
        <div className="max-w-[1600px] mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo_product_page.png"
              alt="LeadLens Logo"
              width={160}
              height={40}
              className="object-contain"
            />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#04693F] border-l border-black/20 pl-3">
              Super Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="hidden lg:flex items-center gap-3">
              <Pill>Live sync</Pill>
              <Pill>{totals.totalUsers} users</Pill>
              <span className="text-xs text-slate-500 font-semibold">
                Hi, {dashboard.me?.full_name ?? email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-[#04693F] text-[#04693F] hover:bg-[#04693F] hover:text-white transition-all text-xs font-bold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
        {/* Interactive Filter Controls */}
        <section className="mb-6 p-6 rounded-[2rem] border border-black/10 bg-white/80 shadow-sm backdrop-blur flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col gap-1 w-full md:w-auto text-left">
            <span className="text-xs uppercase tracking-widest text-[#04693F] font-bold">Interactive Hierarchy Filter</span>
            <span className="text-sm text-slate-500 font-medium">Filter real-time analytics by Group Leader or specific Warrior</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs text-slate-500 font-semibold">Group Leader</label>
              <select
                value={selectedLeaderId}
                onChange={(e) => handleLeaderChange(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 font-medium"
              >
                <option value="">All Leaders</option>
                {leadersList.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.full_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs text-slate-500 font-semibold">Warrior</label>
              <select
                value={selectedWarriorId}
                onChange={(e) => setSelectedWarriorId(e.target.value)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 font-medium"
              >
                <option value="">All Warriors</option>
                {warriorsList.map((warrior) => (
                  <option key={warrior.id} value={warrior.id}>
                    {warrior.full_name}
                  </option>
                ))}
              </select>
            </div>

            {(selectedLeaderId || selectedWarriorId) && (
              <button
                onClick={() => {
                  setSelectedLeaderId("");
                  setSelectedWarriorId("");
                }}
                className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        </section>

        {loadingData ? (
          <LoadingScreen label="Loading organisation metrics" />
        ) : (
          <>
            <section className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard title="Total users" value={totals.totalUsers.toLocaleString()} note="All roles" accent="sky" />
                  <MetricCard title="Admins" value={totals.admins.toString()} note="Org administrators" accent="green" />
                  <MetricCard title="Call volume" value={totals.totalCalls.toLocaleString()} note="All synced calls" accent="blue" />
                  <MetricCard title="Employees" value={totals.employees.toString()} note="Registry entries" accent="mixed" />
                </div>

                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <Panel title="Call trend" subtitle="Activity returned from live backend analytics">
                    <div className="mt-6 grid h-64 grid-cols-12 items-end gap-2">
                      {buildTrend(filteredReportWarriors).map((point, index) => (
                        <div key={index} className="flex flex-col justify-end">
                          <div className="rounded-t-2xl bg-sky-300 shadow-[0_10px_24px_rgba(72,143,115,0.12)]" style={{ height: `${point}%` }} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Based on warrior-level call activity snapshots.</div>
                  </Panel>

                  <Panel title="Call mix" subtitle="Incoming vs outgoing">
                    <div className="mt-6 space-y-4">
                      <ProgressRow label="Incoming" value={totals.incoming} total={Math.max(1, totals.totalCalls)} />
                      <ProgressRow label="Outgoing" value={totals.outgoing} total={Math.max(1, totals.totalCalls)} />
                      <ProgressRow label="Approved users" value={totals.approved} total={Math.max(1, totals.totalUsers)} />
                      <ProgressRow label="Tracking on" value={totals.trackingOn} total={Math.max(1, totals.totalUsers)} />
                    </div>
                  </Panel>
                </div>

                <Panel title="Role analytics" subtitle="Live organisation composition">
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {roleBreakdown.map((item) => (
                      <div key={item.label} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-500">{item.label}</div>
                            <div className="mt-1 text-2xl font-semibold">{item.value}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">{item.width}</div>
                        </div>
                        <div className="mt-4 h-3 rounded-full bg-slate-100">
                          <div className="h-3 rounded-full" style={{ width: item.width, backgroundColor: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="grid gap-5">
                <Panel title="Organisation health" subtitle="Operational snapshot">
                  <div className="mt-6 space-y-4">
                    <HealthRow label="Approved users" value={`${totals.approved}/${totals.totalUsers || 1}`} />
                    <HealthRow label="Active users" value={`${totals.active}/${totals.totalUsers || 1}`} />
                    <HealthRow label="Tracking enabled" value={`${totals.trackingOn}/${totals.totalUsers || 1}`} />
                    <HealthRow label="Groups covered" value={dashboard.report?.warriors.length ? "Live" : "No data"} />
                  </div>
                </Panel>

                <Panel title="Access overview" subtitle="Super admin controls">
                  <div className="mt-6 grid gap-3">
                    <AccessItem title="User approvals" description="Inspect and approve admins, group leaders, and warriors." />
                    <AccessItem title="Reports" description="Review leader and warrior call metrics from live API data." />
                    <AccessItem title="Registry" description="Manage employees and their system IDs." />
                    <AccessItem title="Webhooks" description="Review integration-ready events and downstream syncs." />
                  </div>
                </Panel>

                <Panel title="Leader summary" subtitle="Backend report response">
                  <div className="mt-6 space-y-3">
                    <SummaryItem label="Leader" value={leaderSummaryData.name} />
                    <SummaryItem label="Total hours" value={`${leaderSummaryData.hours.toFixed(2)} h`} />
                    <SummaryItem label="Average call" value={`${leaderSummaryData.avg.toFixed(2)} sec`} />
                    <SummaryItem label="Warriors in report" value={`${leaderSummaryData.count}`} />
                  </div>
                </Panel>
              </div>
            </section>

            <section className="mt-5 overflow-hidden rounded-[2rem] border border-black/10 bg-white/85 shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-semibold">Detailed role table</h2>
                <p className="mt-1 text-sm text-slate-600">All live users returned by the backend.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50/80 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Approved</th>
                      <th className="px-6 py-4 font-medium">Active</th>
                      <th className="px-6 py-4 font-medium">Tracking</th>
                      <th className="px-6 py-4 font-medium">System ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsersTable.map((user) => (
                      <tr key={user.id} className="hover:bg-sky-50/40">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{user.full_name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 capitalize">{user.role.replace("_", " ")}</td>
                        <td className="px-6 py-4">{user.is_approved ? "Yes" : "No"}</td>
                        <td className="px-6 py-4">{user.is_active ? "Yes" : "No"}</td>
                        <td className="px-6 py-4">{user.is_tracking_enabled ? "Enabled" : "Disabled"}</td>
                        <td className="px-6 py-4 font-mono text-xs">{user.system_id ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );

  async function loadDashboard(authToken: string) {
    if (!dashboardRef.current.me) {
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
    } finally {
      setLoadingData(false);
    }
  }
}

function buildTrend(warriors: any[]): number[] {
  if (warriors.length === 0) {
    return [18, 28, 22, 35, 42, 44, 31, 53, 48, 58, 62, 66];
  }
  if (warriors.length === 1) {
    const w = warriors[0];
    const calls = w.calls ?? [];
    if (calls.length === 0) {
      return [w.total_calls || 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
    }
    return calls.slice(0, 12).map((c: any) => Math.min(100, Math.max(12, (c.duration_seconds / 10) || 12)));
  }
  return warriors.slice(0, 12).map((w) => Math.min(100, Math.max(12, w.total_calls || 12)));
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-3xl border border-slate-200 bg-white/80 px-6 py-5 text-sm text-slate-600 shadow-sm">
        {label}...
      </div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-slate-900/5 p-4 text-left backdrop-blur-sm">
      <div className="text-xs uppercase tracking-[0.22em] text-slate-600">{label}</div>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  const isLive = children === "Live sync";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-slate-700">
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      )}
      {children}
    </span>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/85 p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  value,
  note,
  accent,
}: {
  title: string;
  value: string;
  note: string;
  accent: "sky" | "green" | "blue" | "mixed";
}) {
  const accentClass =
    accent === "sky"
      ? "bg-sky-50"
      : accent === "green"
        ? "bg-emerald-50"
        : accent === "blue"
          ? "bg-blue-50 text-blue-900"
          : "bg-white";

  return (
    <div className={`rounded-[1.5rem] border border-black/10 ${accentClass} p-5 shadow-sm`}>
      <div className={`text-sm ${accent === "blue" ? "text-blue-700" : "text-slate-600"}`}>{title}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className={`mt-2 text-sm ${accent === "blue" ? "text-blue-600" : "text-slate-600"}`}>{note}</div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function AccessItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm leading-6 text-slate-600">{description}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {value} / {total} ({pct}%)
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className="h-3 rounded-full bg-sky-400" style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
    </div>
  );
}

async function readError(res: Response) {
  try {
    const data = await res.json();
    return data.detail || data.message || `Request failed with status ${res.status}`;
  } catch {
    return `Request failed with status ${res.status}`;
  }
}
