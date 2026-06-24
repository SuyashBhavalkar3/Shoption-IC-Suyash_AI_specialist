import { useState, useMemo } from "react";
import type { DashboardState, UserRecord, EmployeeRecord, ReportResponse } from "./types";
import Sidebar from "./Sidebar";
import MetricCard from "./MetricCard";
import RoleTable from "./RoleTable";

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
  allLabel: string;
}

function SearchableSelect({ label, placeholder, value, onChange, options, allLabel }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedName = options.find((o) => o.id === value)?.name || allLabel;

  const filtered = options.filter((o) =>
    (o.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col text-left relative w-[160px]">
      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">{label}</label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none hover:border-slate-300 font-semibold text-slate-600 w-full text-left"
      >
        <span className="truncate">{selectedName}</span>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform flex-shrink-0 ml-1.5 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          {/* Overlay to click close */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-[100%] left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col max-h-[220px]">
            {/* Search Box */}
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] outline-none focus:border-[#04693F] font-semibold text-slate-700 mb-1"
              autoFocus
            />
            
            {/* List */}
            <div className="overflow-y-auto flex-grow space-y-0.5 pr-0.5">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  value === ""
                    ? "bg-[#04693F]/5 text-[#04693F]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {allLabel}
              </button>
              
              {filtered.length === 0 ? (
                <div className="text-[10px] text-slate-400 px-2 py-1.5 font-medium">
                  No options found
                </div>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all truncate ${
                      value === opt.id
                        ? "bg-[#04693F]/5 text-[#04693F]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    title={opt.name}
                  >
                    {opt.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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
    <div className="h-screen bg-slate-50 text-slate-800 flex flex-col overflow-hidden">
      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      {/* Sidebar Panel - Slide-out drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out h-screen ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          meName={meName}
          onLogout={onLogout}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Status Header Bar */}
        <header className="h-16 bg-white border-b border-slate-100 px-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Hamburger Button (3 horizontal lines) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center justify-center"
              aria-label="Open Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedView("dashboard")}
              className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left border-0 bg-transparent p-0"
              title="Go to Home Dashboard"
            >
              <img
                src="/logo_product_page.png"
                alt="LeadLens Logo"
                width={105}
                height={24}
                className="object-contain"
              />
              <span className="text-[8px] uppercase font-black tracking-widest text-[#04693F] border-l border-slate-200 pl-2.5">
                ERP
              </span>
            </button>
            <span className="text-xs font-bold text-slate-400 border-l border-slate-200 pl-3 capitalize">
              {selectedView} Console
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50/50 px-2 py-0.5 text-[10px] font-bold text-[#04693F]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live Sync
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-400">
            {totals.totalUsers} Users
          </div>
        </header>

        {/* View Layouts */}
        <div className="px-5 pb-5 pt-3 flex-1 flex flex-col min-h-0">
          {selectedView === "dashboard" && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Filter Section */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col text-left w-full md:w-auto">
                  <span className="text-[10px] uppercase tracking-widest text-[#04693F] font-bold">Interactive Hierarchy Filter</span>
                  <span className="text-xs text-slate-400 font-semibold">Filter metrics and log sheets dynamically</span>
                </div>
                 <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
                   <SearchableSelect
                     label="Group Leader"
                     placeholder="Search leader..."
                     value={selectedLeaderId}
                     onChange={handleLeaderChange}
                     options={leadersList.map(l => ({ id: l.id, name: l.full_name }))}
                     allLabel="All Leaders"
                   />
                   
                   <SearchableSelect
                     label="Warrior"
                     placeholder="Search warrior..."
                     value={selectedWarriorId}
                     onChange={setSelectedWarriorId}
                     options={warriorsList.map(w => ({ id: w.id, name: w.full_name }))}
                     allLabel="All Warriors"
                   />

                   {(selectedLeaderId || selectedWarriorId) && (
                     <button
                       onClick={() => {
                         setSelectedLeaderId("");
                         setSelectedWarriorId("");
                       }}
                       className="px-3.5 py-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50/50 text-[10px] font-bold transition-all self-end"
                     >
                       Reset Filters
                     </button>
                   )}
                 </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Users" value={totals.totalUsers} note="All registered roles" icon="" />
                <MetricCard title="Group Leaders" value={totals.leaders} note="Managers overseeing groups" icon="" />
                <MetricCard title="Call Volume" value={totals.totalCalls} note="Synced records" icon="" />
                <MetricCard title="Hours Logged" value={`${totals.hours.toFixed(2)}h`} note="Active calling duration" icon="" />
              </div>

              {/* Layout Mix Details */}
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                {/* Trend Graph */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-800">Call Volume Distribution</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live active trends on the platform</p>
                  
                  <div className="mt-4 flex h-44 items-end gap-1.5 px-1">
                    {buildTrend(filteredReportWarriors).map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col justify-end h-full">
                        <div className="rounded-t bg-gradient-to-t from-[#e6f7ee] to-[#e8f4fc] border-t border-x border-[#04693F]/10 shadow-xs" style={{ height: `${point}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-center text-[10px] text-slate-400 font-bold">12-Period Timeline Report</div>
                </div>

                {/* Progress Indicators */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">System Call Mix</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Status and tracking coverage details</p>
                  </div>

                  <div className="space-y-3">
                    {/* Incoming */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Incoming Calls</span>
                        <span>{totals.incoming} ({progressPercentage(totals.incoming, totals.totalCalls)}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.incoming, totals.totalCalls)}%` }} />
                      </div>
                    </div>

                    {/* Outgoing */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Outgoing Calls</span>
                        <span>{totals.outgoing} ({progressPercentage(totals.outgoing, totals.totalCalls)}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.outgoing, totals.totalCalls)}%` }} />
                      </div>
                    </div>

                    {/* Active Tracked */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Tracking Enabled</span>
                        <span>{totals.trackingOn} / {totals.totalUsers} ({progressPercentage(totals.trackingOn, totals.totalUsers)}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/10 rounded-full" style={{ width: `${progressPercentage(totals.trackingOn, totals.totalUsers)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leader Details summary Card */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800">Operational Overview</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Current team report details</p>
                
                <div className="grid gap-3 mt-4 md:grid-cols-4">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Reporting Head</span>
                    <div className="text-base font-black text-slate-800 mt-1">{leaderSummaryData.name}</div>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Hours Logged</span>
                    <div className="text-base font-black text-slate-800 mt-1">{leaderSummaryData.hours.toFixed(2)}h</div>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Average Call Duration</span>
                    <div className="text-base font-black text-slate-800 mt-1">{leaderSummaryData.avg.toFixed(1)}s</div>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Warriors in Group</span>
                    <div className="text-base font-black text-slate-800 mt-1">{leaderSummaryData.count}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === "users" && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col gap-0.5 text-left">
                <h2 className="text-lg font-bold text-slate-800">Members & Employee Registry</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Manage system registry requirements and review employee records.</p>
              </div>
              <RoleTable
                users={filteredUsersTable}
                employees={dashboard.employees}
                onToggleTrackingNeeded={onToggleTrackingNeeded}
                report={dashboard.report}
              />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
