import { useState, useMemo } from "react";
import type { DashboardState, UserRecord, EmployeeRecord, ReportResponse } from "./types";
import Sidebar from "./Sidebar";
import MetricCard from "./MetricCard";
import RoleTable from "./RoleTable";

type DashboardScreenProps = {
  dashboard: DashboardState;
  onLogout: () => void;
  loading: boolean;
  onToggleTrackingNeeded?: (empId: string, currentVal: boolean) => void;
};

export default function DashboardScreen({
  dashboard,
  onLogout,
  loading,
  onToggleTrackingNeeded,
}: DashboardScreenProps) {
  const [selectedView, setSelectedView] = useState<string>("dashboard");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [selectedWarriorId, setSelectedWarriorId] = useState<string>("");

  const meName = dashboard.me?.full_name ?? "Admin Operator";

  // Filter Lists
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

  // Calculate Totals & Stats
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

    const totalCalls = filteredReportWarriors.reduce((sum, w) => sum + (w.total_calls || 0), 0);
    const incoming = filteredReportWarriors.reduce((sum, w) => sum + (w.incoming_calls_count || 0), 0);
    const outgoing = filteredReportWarriors.reduce((sum, w) => sum + (w.outgoing_calls_count || 0), 0);
    const hours = filteredReportWarriors.reduce((sum, w) => sum + (w.total_calling_hours || 0), 0);
    const totalSeconds = filteredReportWarriors.reduce((sum, w) => sum + (w.total_calling_seconds || 0), 0);
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
      const groupWarriors = report.warriors.filter(
        (w) => w.manager_id === selectedLeaderId || w.manager_name === leaderUser?.full_name
      );
      const totalCalls = groupWarriors.reduce((sum, w) => sum + (w.total_calls || 0), 0);
      const totalHours = groupWarriors.reduce((sum, w) => sum + (w.total_calling_hours || 0), 0);
      const totalSeconds = groupWarriors.reduce((sum, w) => sum + (w.total_calling_seconds || 0), 0);
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
      hours: report.overall_total_calling_hours || 0,
      avg: report.overall_average_call_seconds || 0,
      count: report.warriors.length,
    };
  }, [dashboard, selectedLeaderId]);

  const buildTrend = (warriors: any[]): number[] => {
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
  };

  const progressPercentage = (val: number, total: number) => {
    return Math.round((val / Math.max(1, total)) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar Panel */}
      <Sidebar
        meName={meName}
        onLogout={onLogout}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Status Header Bar */}
        <header className="h-24 bg-white border-b border-slate-100 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-800 capitalize">{selectedView} Console</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/50 px-3 py-1 text-xs font-bold text-[#04693F]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Sync Active
            </span>
          </div>
          <div className="text-sm font-semibold text-slate-400">
            {totals.totalUsers} Registered Users
          </div>
        </header>

        {/* View Layouts */}
        <div className="p-8 flex-1">
          {selectedView === "dashboard" && (
            <div className="space-y-6">
              {/* Filter Section */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col gap-1 text-left w-full md:w-auto">
                  <span className="text-xs uppercase tracking-widest text-[#04693F] font-bold">Interactive Hierarchy Filter</span>
                  <span className="text-sm text-slate-400 font-semibold">Filter metrics and log sheets dynamically</span>
                </div>
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto justify-end">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs text-slate-400 font-bold uppercase">Group Leader</label>
                    <select
                      value={selectedLeaderId}
                      onChange={(e) => handleLeaderChange(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/5 font-semibold text-slate-600"
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
                    <label className="text-xs text-slate-400 font-bold uppercase">Warrior</label>
                    <select
                      value={selectedWarriorId}
                      onChange={(e) => setSelectedWarriorId(e.target.value)}
                      className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/5 font-semibold text-slate-600"
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
                      className="px-5 py-2.5 rounded-full border border-rose-100 text-rose-600 hover:bg-rose-50/50 text-xs font-bold transition-all mt-4"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Users" value={totals.totalUsers} note="All registered roles" icon="" />
                <MetricCard title="Group Leaders" value={totals.leaders} note="Managers overseeing groups" icon="" />
                <MetricCard title="Call Volume" value={totals.totalCalls} note="Synced records" icon="" />
                <MetricCard title="Hours Logged" value={`${totals.hours.toFixed(2)}h`} note="Active calling duration" icon="" />
              </div>

              {/* Layout Mix Details */}
              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                {/* Trend Graph */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800">Call Volume Distribution</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Live active trends on the platform</p>
                  
                  <div className="mt-8 flex h-64 items-end gap-2 px-2">
                    {buildTrend(filteredReportWarriors).map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col justify-end h-full">
                        <div className="rounded-t-lg bg-gradient-to-t from-[#e6f7ee] to-[#e8f4fc] border-t border-x border-[#04693F]/10 shadow-sm" style={{ height: `${point}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center text-xs text-slate-400 font-bold">12-Period Timeline Report</div>
                </div>

                {/* Progress Indicators */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">System Call Mix</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Status and tracking coverage details</p>
                  </div>

                  <div className="space-y-4">
                    {/* Incoming */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Incoming Calls</span>
                        <span>{totals.incoming} ({progressPercentage(totals.incoming, totals.totalCalls)}%)</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.incoming, totals.totalCalls)}%` }} />
                      </div>
                    </div>

                    {/* Outgoing */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Outgoing Calls</span>
                        <span>{totals.outgoing} ({progressPercentage(totals.outgoing, totals.totalCalls)}%)</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.outgoing, totals.totalCalls)}%` }} />
                      </div>
                    </div>

                    {/* Active Tracked */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                        <span>Tracking Enabled</span>
                        <span>{totals.trackingOn} / {totals.totalUsers} ({progressPercentage(totals.trackingOn, totals.totalUsers)}%)</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.trackingOn, totals.totalUsers)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leader Details summary Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-800">Operational Overview</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">Current team report details</p>
                
                <div className="grid gap-4 mt-6 md:grid-cols-4">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Reporting Head</span>
                    <div className="text-lg font-black text-slate-800 mt-2">{leaderSummaryData.name}</div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Hours Logged</span>
                    <div className="text-lg font-black text-slate-800 mt-2">{leaderSummaryData.hours.toFixed(2)}h</div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Average Call Duration</span>
                    <div className="text-lg font-black text-slate-800 mt-2">{leaderSummaryData.avg.toFixed(1)}s</div>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                    <span className="text-xs text-slate-400 font-bold uppercase">Warriors in Group</span>
                    <div className="text-lg font-black text-slate-800 mt-2">{leaderSummaryData.count}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col gap-1 text-left">
                <h2 className="text-xl font-bold text-slate-800">Members & Employee Registry</h2>
                <p className="text-xs text-slate-400 font-semibold">Manage system registry requirements and review employee records.</p>
              </div>
              <RoleTable
                users={filteredUsersTable}
                employees={dashboard.employees}
                onToggleTrackingNeeded={onToggleTrackingNeeded}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
