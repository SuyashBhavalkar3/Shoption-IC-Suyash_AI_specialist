import { useState, useEffect, useMemo, useCallback } from "react";
import type { UserRecord } from "./types";

type CallingTeamPageProps = {
  token?: string | null;
  users: UserRecord[];
};

type CallerStat = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  total_calls: number;
  total_seconds: number;
  total_calling_seconds: number;
};

export default function CallingTeamPage({ token: propToken, users }: CallingTeamPageProps) {
  const [token, setToken] = useState<string | null>(propToken || null);

  useEffect(() => {
    if (!token && typeof window !== "undefined") {
      setToken(localStorage.getItem("shoption_admin_token"));
    }
  }, [token]);
  // Helper to format Date to YYYY-MM-DD in local time
  const getLocalDateString = (date: Date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [callerStats, setCallerStats] = useState<CallerStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("B2C");

  // Extract unique departments from the users prop
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) {
        set.add(u.department);
      }
    });
    return Array.from(set).sort();
  }, [users]);

  const targetSeconds = 4 * 3600; // 4 Hours = 14,400 Seconds

  const fetchCallingTeam = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/calling-team?date=${selectedDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch calling team. Status: ${res.status}`);
      }

      const data = await res.json();
      setCallerStats(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    void fetchCallingTeam();
  }, [fetchCallingTeam]);

  // Handle date presets
  const handleSetToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setSelectedDate(getLocalDateString(yesterday));
  };

  // Format seconds into HH:MM:SS
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Filter callerStats by search queries (supports multi-term searches, e.g. copied from Excel) and selected department
  const filteredCallerStats = useMemo(() => {
    let filtered = callerStats;

    // 1. Filter by Department dropdown
    if (selectedDept === "B2C") {
      filtered = filtered.filter((c) =>
        (c.department || "").toLowerCase().includes("b2c")
      );
    } else if (selectedDept && selectedDept !== "all") {
      filtered = filtered.filter((c) =>
        c.department === selectedDept
      );
    }

    // 2. Filter by search queries
    const searchQueries = searchQuery
      .split(/[,\r\n]/)
      .map((q) => q.trim().toLowerCase())
      .filter(Boolean);

    if (searchQueries.length === 0) return filtered;

    return filtered.filter((c) => {
      const fullName = (c.full_name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const dept = (c.department || "").toLowerCase();

      return searchQueries.some((q) =>
        fullName.includes(q) ||
        email.includes(q) ||
        dept.includes(q)
      );
    });
  }, [callerStats, selectedDept, searchQuery]);

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-bold text-text">Today's Calling Team</h2>
          <p className="text-xs text-text-secondary font-semibold">
            Track daily calling team talk times and daily targets (4-hour daily target per employee).
          </p>
        </div>

        {/* Date Filters & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSetToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedDate === getLocalDateString()
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-background text-text-secondary border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            Today
          </button>
          <button
            onClick={handleSetYesterday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedDate === getLocalDateString(new Date(Date.now() - 86400000))
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-background text-text-secondary border-slate-800 hover:bg-slate-800/40"
            }`}
          >
            Yesterday
          </button>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-text outline-none focus:border-primary font-semibold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Department, and Refresh */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Left: Search & Department Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search callers by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData("text");
                if (pastedText.includes("\n") || pastedText.includes("\r")) {
                  e.preventDefault();
                  const clean = pastedText
                    .split(/\r?\n/)
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .join(", ");
                  setSearchQuery(clean);
                }
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-background text-xs outline-none transition focus:border-primary font-semibold text-text placeholder:text-text-secondary/50"
            />
          </div>

          {/* Department Select Dropdown */}
          <div className="relative w-full sm:w-56">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-background px-3.5 py-2 text-xs outline-none focus:border-primary font-semibold text-text cursor-pointer"
            >
              <option value="B2C">B2C Departments</option>
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => void fetchCallingTeam()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-slate-800 text-xs font-bold text-text-secondary hover:text-text hover:bg-slate-800/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-card border border-slate-800/40 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-primary" />
              <p className="text-xs text-text-secondary font-semibold">Loading stats for {selectedDate}...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-2">
              <div className="p-3 bg-warning/10 text-warning rounded-full border border-warning/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text">Failed to fetch calling stats</h3>
              <p className="text-xs text-text-secondary max-w-sm">{error}</p>
            </div>
          ) : filteredCallerStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 space-y-2">
              <div className="p-3 bg-slate-800/40 text-text-secondary rounded-full border border-slate-700/50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.824-1.802-5.14-4.117-6.942-6.942l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text">No calls recorded</h3>
              <p className="text-xs text-text-secondary max-w-sm">
                No employees made or received calls on {selectedDate}.
              </p>
            </div>
          ) : (
            <table className="w-full divide-y divide-slate-800/35 text-left text-xs font-semibold border-collapse">
              <thead className="text-text-secondary uppercase tracking-wider font-bold bg-card sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
                <tr>
                  <th className="px-6 py-4 bg-card text-center min-w-[50px]">#</th>
                  <th className="px-6 py-4 bg-card">Employee Name</th>
                  <th className="px-6 py-4 bg-card">Progress (4 Hrs target)</th>
                  <th className="px-6 py-4 bg-card">Role / Department</th>
                  <th className="px-6 py-4 bg-card text-center border-l-2 border-slate-500">Total Calls</th>
                  <th className="px-6 py-4 bg-card text-center">Talk Time</th>
                  <th className="px-6 py-4 bg-card text-center">Remaining Time</th>
                  <th className="px-6 py-4 bg-card text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/35 bg-card">
                {filteredCallerStats.map((caller, idx) => {
                  const talkSeconds = caller.total_calling_seconds;
                  const remainingSeconds = Math.max(0, targetSeconds - talkSeconds);
                  const isCompleted = talkSeconds >= targetSeconds;
                  const progressPercent = Math.min(100, Math.round((talkSeconds / targetSeconds) * 100));

                  return (
                    <tr key={caller.user_id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 text-center font-bold text-text-secondary">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-text text-xs">{caller.full_name}</div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-800/60 rounded-full h-2.5 overflow-hidden border border-slate-700/30">
                            <div
                              style={{ width: `${progressPercent}%` }}
                              className={`h-full transition-all duration-500 rounded-full ${
                                isCompleted ? "bg-emerald-500" : "bg-primary"
                              }`}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-text-secondary">
                            {progressPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-text font-bold uppercase tracking-wider">
                            {caller.role?.replace("_", " ")}
                          </span>
                          {caller.department && (
                            <span className="text-[10px] text-text-secondary font-semibold">
                              {caller.department}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-text font-bold border-l-2 border-slate-500">
                        {caller.total_calls}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-text">
                        {formatDuration(talkSeconds)}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-xs text-text-secondary">
                        {isCompleted ? (
                          <span className="text-emerald-400 font-bold">Completed</span>
                        ) : (
                          formatDuration(remainingSeconds)
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800/40 text-text-secondary border-slate-700/50"
                          }`}
                        >
                          {isCompleted ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
