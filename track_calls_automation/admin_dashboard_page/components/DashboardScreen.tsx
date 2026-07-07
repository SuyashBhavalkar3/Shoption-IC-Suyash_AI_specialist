import { useState, useMemo, useCallback, useEffect } from "react";
import type { DashboardState, UserRecord, EmployeeRecord, ReportResponse } from "./types";
import Sidebar from "./Sidebar";
import MetricCard from "./MetricCard";
import RoleTable from "./RoleTable";
import CallLogsPage from "./CallLogsPage";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Sector,
  Cell,
  LabelList,
  AreaChart,
  Area,
} from "recharts";

function parseDbTimestamp(tsStr: string): Date | null {
  if (!tsStr) return null;
  const parts = tsStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const datePart = parts[0];
  const timePart = parts[1];

  const dateParts = datePart.split("-");
  if (dateParts.length < 3) return null;
  const day = parseInt(dateParts[0], 10);
  const monthStr = dateParts[1];
  const year = parseInt(dateParts[2], 10);

  const timeParts = timePart.split(":");
  if (timeParts.length < 2) return null;
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);

  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };
  const month = months[monthStr.toLowerCase()];
  if (month === undefined) return null;

  return new Date(year, month, day, hours, minutes);
}

function RestyledMetricCard({
  title,
  value,
  note,
  icon,
  accentColorClass = "text-primary",
  bgAccentClass = "bg-primary/12",
  trendText,
  trendType = "up"
}: {
  title: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  accentColorClass?: string;
  bgAccentClass?: string;
  trendText?: string;
  trendType?: "up" | "down" | "neutral";
}) {
  return (
    <div className="flex-1 min-w-[220px] bg-card rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-800 transition-colors">
      <div className="flex items-start justify-between">
        {/* Tinted Icon Chip */}
        <div className={`w-10 h-10 rounded-xl ${bgAccentClass} flex items-center justify-center ${accentColorClass} shrink-0`}>
          {icon}
        </div>

        {/* Trend Delta Badge */}
        {trendText && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendType === "up"
            ? "bg-emerald-950/20 text-ai-accent"
            : trendType === "down"
              ? "bg-rose-950/20 text-warning"
              : "bg-slate-850 text-text-secondary"
            }`}>
            {trendText}
          </span>
        )}
      </div>

      <div className="mt-4 text-left">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.08em] block mb-1">
          {title}
        </span>
        <span className="text-[30px] font-bold text-text block tracking-tight">
          {value}
        </span>
      </div>

      <div className="mt-2 text-[11px] text-text-secondary font-normal text-left">
        {note}
      </div>
    </div>
  );
}

function VerticalRailBadge({
  icon,
  value,
  label,
  accentColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accentColor: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex flex-col items-center text-center shrink-0 w-20">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-[52px] h-[52px] rounded-full bg-card border-2 flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
        style={{
          borderColor: accentColor,
          color: accentColor,
          transform: isHovered ? "translateY(-5px) scale(1.06)" : "translateY(0) scale(1)",
          boxShadow: isHovered
            ? `0 12px 20px -4px ${accentColor}60, 0 0 16px ${accentColor}40`
            : `0 0 8px ${accentColor}40`
        }}
      >
        <span className="w-5 h-5 flex items-center justify-center shrink-0">
          {icon}
        </span>
      </div>
      <span className="text-[14px] font-bold text-text mt-2 block tracking-tight truncate w-full" title={String(value)}>
        {value}
      </span>
      <span className="text-[9px] font-medium text-text-secondary uppercase tracking-[0.08em] block mt-1 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const CustomXAxisTick = (props: any) => {
  const { x, y, payload, index } = props;
  const value = payload?.value || "";
  // Staggered layout: even indices closer (dy=8), odd indices further down (dy=20)
  const dy = index % 2 === 0 ? 8 : 20;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={dy}
        textAnchor="middle"
        fill="var(--chart-label)"
        fontSize={9}
        fontWeight="600"
      >
        {value}
      </text>
    </g>
  );
};

function CompactStatItem({
  title,
  value,
  icon,
  accentColorClass = "text-primary"
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  accentColorClass?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 p-3.5 bg-card rounded-xl border border-slate-850 hover:border-slate-800/80 transition-colors">
      <div className={`text-base ${accentColorClass} shrink-0`}>
        {icon}
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{title}</span>
        <span className="text-sm font-bold text-text mt-0.5">{value}</span>
      </div>
    </div>
  );
}


function CompactMetricCard({ title, value, note, textColor = "text-[#00E6B8]", borderColor = "bg-[#00E6B8]" }: { title: string; value: string | number; note: string; textColor?: string; borderColor?: string }) {
  // Map light colors to premium dark theme colors
  let mappedTextColor = textColor;
  let mappedBorderColor = borderColor;

  if (textColor.includes("04693F")) {
    mappedTextColor = "text-[#00E6B8]"; // AI Accent
    mappedBorderColor = "bg-[#00E6B8]";
  } else if (textColor.includes("015C96")) {
    mappedTextColor = "text-[#1F8FFF]"; // Primary Brand
    mappedBorderColor = "bg-[#1F8FFF]";
  } else if (textColor.includes("indigo")) {
    mappedTextColor = "text-[#8B5CF6]"; // Accent
    mappedBorderColor = "bg-[#8B5CF6]";
  } else if (textColor.includes("amber")) {
    mappedTextColor = "text-amber-400";
    mappedBorderColor = "bg-amber-400";
  } else if (textColor.includes("rose")) {
    mappedTextColor = "text-rose-400";
    mappedBorderColor = "bg-rose-500";
  } else if (textColor.includes("slate")) {
    mappedTextColor = "text-[#94A3B8]";
    mappedBorderColor = "bg-slate-700";
  }

  return (
    <div className="flex-1 min-w-[200px] max-w-[340px] bg-card border border-slate-800/80 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-colors">
      {/* Accent side border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${mappedBorderColor}`} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.08em] block">{title}</span>
      </div>

      <div className="mt-2.5">
        <span className={`text-[30px] font-bold ${mappedTextColor} tracking-tight block leading-none`}>
          {value}
        </span>
      </div>

      <div className="mt-2 text-[11px] text-text-secondary font-normal block leading-normal">
        {note}
      </div>
    </div>
  );
}

interface SearchableSelectProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ id: string; name: string }>;
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
      <label className="text-[9px] text-[#94A3B8] font-bold uppercase mb-0.5">{label}</label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#050816] px-3 py-1.5 text-xs outline-none hover:border-slate-700 font-semibold text-slate-250 w-full text-left cursor-pointer"
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

          <div className="absolute top-[100%] left-0 right-0 mt-1 z-50 bg-[#0E1528] border border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col max-h-[220px]">
            {/* Search Box */}
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-[#050816] px-2 py-1 text-[11px] outline-none focus:border-[#1F8FFF] font-semibold text-slate-200 mb-1 placeholder-slate-600"
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
                className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${value === ""
                  ? "bg-[#1F8FFF]/10 text-[#1F8FFF]"
                  : "text-[#94A3B8] hover:bg-slate-800/40 hover:text-white"
                  }`}
              >
                {allLabel}
              </button>

              {filtered.length === 0 ? (
                <div className="text-[10px] text-[#94A3B8] px-2 py-1.5 font-medium">
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
                    className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all truncate cursor-pointer ${value === opt.id
                      ? "bg-[#1F8FFF]/10 text-[#1F8FFF]"
                      : "text-[#94A3B8] hover:bg-slate-800/40 hover:text-white"
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
  onUpdateUser?: (userId: string, data: any) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onToggleUserTracking?: (userId: string, enabled: boolean) => Promise<void>;
  onRefresh?: () => Promise<void>;
};

function computeTotals(
  reportWarriors: any[],
  users: UserRecord[],
  employees: EmployeeRecord[],
  startDateTime?: Date | null,
  endDateTime?: Date | null
) {
  const admins = users.filter((user) => user.role === "admin");
  const leaders = users.filter((user) => user.role === "group_leader");
  const warriors = users.filter((user) => user.role === "warrior");
  const superAdmins = users.filter((user) => user.role === "super_admin");
  const approved = users.filter((user) => user.is_approved);
  const active = users.filter((user) => user.is_active);
  const trackingOn = users.filter((user) => user.is_tracking_enabled).length;

  // Accumulate all calls from report warriors
  const rawCalls = reportWarriors.flatMap(w => w.calls ?? []);

  // Pre-parse and filter calls within the date range
  const parsedCalls: any[] = [];
  for (let i = 0; i < rawCalls.length; i++) {
    const c = rawCalls[i];
    const callDate = parseDbTimestamp(c.timestamp);
    if (!callDate) continue;
    if (startDateTime && callDate < startDateTime) continue;
    if (endDateTime && callDate > endDateTime) continue;

    parsedCalls.push({
      ...c,
      parsedDate: callDate,
      parsedTimeMs: callDate.getTime(),
      typeLower: (c.call_type || "").toLowerCase(),
      statusLower: (c.call_status || "").toLowerCase(),
    });
  }

  // Metric counters
  let totalCallsDone = parsedCalls.length;
  let totalSuccessCalls = 0;
  let totalTalkSeconds = 0;

  let incomingCalls = 0;
  let incomingSuccessCalls = 0;
  let incomingTotalSeconds = 0;

  let outgoingCalls = 0;
  let outgoingSuccessCalls = 0;
  let outgoingTotalSeconds = 0;

  let droppedCalls = 0;
  let incomingDroppedCalls = 0;
  let outgoingDroppedCalls = 0;

  const missedCallsList: any[] = [];
  const outgoingCallsByPhone = new Map<string, any[]>();

  for (let i = 0; i < parsedCalls.length; i++) {
    const c = parsedCalls[i];
    const type = c.typeLower;
    const status = c.statusLower;
    const duration = c.duration_seconds || 0;

    const isIncoming = type === "incoming";
    const isOutgoing = type === "outgoing";

    // Dropped call definition: talk time between 0s and 10s
    const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);

    // Missed call definition: incoming missed
    const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

    // Dialed call: outgoing missed/dialed/dropped/rejected/failed/0s/etc.
    const isDialed = isOutgoing && (status === "missed" || status === "missed call" || status.includes("missed") || status === "dialed" || status.includes("dialed") || status === "dropped" || status === "rejected" || status === "failed" || duration === 0 || isDropped);

    // Success call definition (from RoleTable logic):
    const isSuccess = (duration > 10) || (!isDialed && !isMissed && !isDropped && duration > 0);

    if (isSuccess) {
      totalSuccessCalls++;
    }

    if (isDropped) {
      droppedCalls++;
    }

    if (isIncoming) {
      incomingCalls++;
      incomingTotalSeconds += duration;
      if (isSuccess) {
        incomingSuccessCalls++;
      }
      if (isDropped) {
        incomingDroppedCalls++;
      }
      if (isMissed) {
        missedCallsList.push(c);
      }
    } else if (isOutgoing) {
      outgoingCalls++;
      outgoingTotalSeconds += duration;
      if (isSuccess) {
        outgoingSuccessCalls++;
      }
      if (isDropped) {
        outgoingDroppedCalls++;
      }

      if (c.phone_number) {
        let list = outgoingCallsByPhone.get(c.phone_number);
        if (!list) {
          list = [];
          outgoingCallsByPhone.set(c.phone_number, list);
        }
        list.push(c);
      }
    }

    // Add to overall talk time only if it is not a failed/missed call
    if (duration > 0 && !isMissed && status !== "failed") {
      totalTalkSeconds += duration;
    }
  }

  // Sort each phone number's list of outgoing calls by time
  outgoingCallsByPhone.forEach((list) => {
    list.sort((a, b) => a.parsedTimeMs - b.parsedTimeMs);
  });

  // Total Missed Calls = Total incoming calls - Total success incoming calls
  const totalMissed = Math.max(0, incomingCalls - incomingSuccessCalls);

  // Calculate missed call response details:
  let totalResponseSeconds = 0;
  let respondedMissedCallsCount = 0;

  missedCallsList.forEach((mc) => {
    const mcTimeMs = mc.parsedTimeMs;
    const candidates = outgoingCallsByPhone.get(mc.phone_number);
    if (candidates) {
      const firstOut = candidates.find(c => c.parsedTimeMs > mcTimeMs);
      if (firstOut) {
        const diffMs = firstOut.parsedTimeMs - mcTimeMs;
        totalResponseSeconds += diffMs / 1000;
        respondedMissedCallsCount++;
      }
    }
  });

  const missedNotResponded = Math.max(0, totalMissed - respondedMissedCallsCount);

  const avgResponseTimeSeconds = respondedMissedCallsCount > 0 ? totalResponseSeconds / respondedMissedCallsCount : 0;

  // Helper functions for formatting
  const formatHHMM = (totalSecs: number): string => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatMMSS = (totalSecs: number): string => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatResponseTime = (secs: number): string => {
    if (secs === 0) return "-";
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  const avgTTOverall = totalCallsDone > 0 ? totalTalkSeconds / totalCallsDone : 0;
  const avgTTIncoming = incomingCalls > 0 ? incomingTotalSeconds / incomingCalls : 0;
  const avgTTOutgoing = outgoingCalls > 0 ? outgoingTotalSeconds / outgoingCalls : 0;

  return {
    totalUsers: users.length,
    admins: admins.length,
    leaders: leaders.length,
    warriors: warriors.length,
    superAdmins: superAdmins.length,
    approved: approved.length,
    active: active.length,
    trackingOn,
    employees: employees.length,
    employeesTrackingNeeded: employees.filter((emp) => emp.is_tracking_needed).length,
    employeesTrackingActive: users.filter((user) => user.is_tracking_active).length,

    // Calculated Metrics
    totalCallsDone,
    totalSuccessCalls,
    totalTalkSeconds,
    totalTalkTimeFormatted: formatHHMM(totalTalkSeconds),
    avgTTCallFormatted: formatMMSS(avgTTOverall),

    incomingCalls,
    incomingSuccessCalls,
    incomingTalkTimeFormatted: formatHHMM(incomingTotalSeconds),
    avgTTIncomingFormatted: formatMMSS(avgTTIncoming),

    outgoingCalls,
    outgoingSuccessCalls,
    outgoingTalkTimeFormatted: formatHHMM(outgoingTotalSeconds),
    avgTTOutgoingFormatted: formatMMSS(avgTTOutgoing),

    totalMissed,
    missedNotResponded,
    avgResponseTimeFormatted: formatResponseTime(avgResponseTimeSeconds),

    droppedCalls,
    incomingDroppedCalls,
    outgoingDroppedCalls,
  };
}


const highlightInsightNumbers = (text: string) => {
  const numberRegex = /(\d+(?:\.\d+)?%|\d+\s+out\s+of\s+\d+|\d+)/g;
  const parts = text.split(numberRegex);
  return parts.map((part, index) => {
    if (numberRegex.test(part)) {
      return (
        <span key={index} className="text-text font-semibold">
          {part}
        </span>
      );
    }
    return part;
  });
};


const getPrevious15MinInterval = (label: string) => {
  const match = label.match(/(\d+):(\d+)\s+(AM|PM)/);
  if (!match) return label;
  const hour = parseInt(match[1], 10);
  const min = parseInt(match[2], 10);
  const ampm = match[3];

  let prevMin = min - 15;
  let prevHour = hour;
  let prevAmpm = ampm;

  if (prevMin < 0) {
    prevMin = 45;
    prevHour = hour - 1;
    if (prevHour === 0) {
      prevHour = 12;
    } else if (prevHour === 11) {
      prevAmpm = ampm === "AM" ? "PM" : "AM";
    }
  }

  const prevMinStr = String(prevMin).padStart(2, "0");
  return `${prevHour}:${prevMinStr} ${prevAmpm} to ${hour}:${String(min).padStart(2, "0")} ${ampm}`;
};


export default function DashboardScreen({
  dashboard,
  onLogout,
  loading,
  onToggleTrackingNeeded,
  onUpdateUser,
  onDeleteUser,
  onToggleUserTracking,
  onRefresh,
}: DashboardScreenProps) {
  const [selectedView, setSelectedView] = useState<string>("dashboard");

  // In-page refresh state management
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Callback to trigger an in-page dashboard data refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (err) {
      console.error("Dashboard refresh failed:", err);
    } finally {
      // Keep state active for at least 600ms to allow visual transition of the spinning icon/loader
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  }, [onRefresh, isRefreshing]);

  // Hydrate selectedView from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      if (viewParam && ["dashboard", "users", "workforce", "user-management", "call-logs"].includes(viewParam)) {
        setSelectedView(viewParam);
      }
    }
  }, []);

  // Prevent unauthorized view access to Get Organization Data
  useEffect(() => {
    if (dashboard.me && selectedView === "call-logs" && dashboard.me.role !== "super_admin") {
      setSelectedView("dashboard");
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.delete("view");
        params.delete("page");
        params.delete("limit");
        params.delete("range");
        params.delete("search");
        params.delete("sortBy");
        params.delete("sortOrder");
        window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
      }
    }
  }, [dashboard.me, selectedView]);

  const [selectedSubordinateId, setSelectedSubordinateId] = useState<string>("");
  const [subordinateSearchQuery, setSubordinateSearchQuery] = useState<string>("");
  const [isSubordinateSearchOpen, setIsSubordinateSearchOpen] = useState<boolean>(false);

  // Helper to format Date to YYYY-MM-DD
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Helper to format Time to HH:MM
  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  // Helper to get current shift bounds (9:30 AM based)
  const getShiftRange = (now: Date = new Date()) => {
    const todayNineThirty = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0, 0);
    if (now >= todayNineThirty) {
      const start = todayNineThirty;
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30, 0, 0);
      return { start, end };
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 30, 0, 0);
      const end = todayNineThirty;
      return { start, end };
    }
  };

  // Default initialization: Today shift range (9:30 AM to tomorrow 9:30 AM)
  const initialShift = getShiftRange(new Date());

  // Date/Time Filters State
  const [filterStartDate, setFilterStartDate] = useState<string>(formatDate(initialShift.start));
  const [filterStartTime, setFilterStartTime] = useState<string>(formatTime(initialShift.start));
  const [filterEndDate, setFilterEndDate] = useState<string>(formatDate(initialShift.end));
  const [filterEndTime, setFilterEndTime] = useState<string>(formatTime(initialShift.end));
  const [selectedRangePreset, setSelectedRangePreset] = useState<string>("today");
  const [selectedWorkforceUserId, setSelectedWorkforceUserId] = useState<string>("");
  const [workforceExpandedNodes, setWorkforceExpandedNodes] = useState<Record<string, boolean>>({});

  // Chart type for Hero Chart (Overall / Incoming / Outgoing / Missed / Dropped)
  const [chartCallType, setChartCallType] = useState<"Overall" | "Incoming" | "Outgoing" | "Missed" | "Dropped">("Outgoing");
  const [selectedComparisonCategory, setSelectedComparisonCategory] = useState<string>("Outgoing");

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Summary switcher call type state
  const [activeSummaryCallType, setActiveSummaryCallType] = useState<"incoming" | "outgoing" | "missed" | "dropped">("outgoing");

  // Workforce Tree search state
  const [workforceSearchQuery, setWorkforceSearchQuery] = useState<string>("");
  const [isWorkforceSearchOpen, setIsWorkforceSearchOpen] = useState<boolean>(false);

  // Theme state & sync
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hoveredDirectionIndex, setHoveredDirectionIndex] = useState<number | null>(null);
  const [hoveredRecoveryIndex, setHoveredRecoveryIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light";
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  // Auto-update shift on crossing end filter datetime (e.g. crossing 9:30 AM)
  useEffect(() => {
    if (selectedRangePreset !== "today") return;

    const interval = setInterval(() => {
      const now = new Date();
      const parts = filterEndDate.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const timeParts = filterEndTime.split(":");
        const hours = timeParts[0] ? parseInt(timeParts[0]) : 9;
        const minutes = timeParts[1] ? parseInt(timeParts[1]) : 30;
        const currentShiftEnd = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);

        if (now >= currentShiftEnd) {
          const newShift = getShiftRange(now);
          setFilterStartDate(formatDate(newShift.start));
          setFilterStartTime(formatTime(newShift.start));
          setFilterEndDate(formatDate(newShift.end));
          setFilterEndTime(formatTime(newShift.end));
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [selectedRangePreset, filterEndDate, filterEndTime]);

  const handlePresetChange = (preset: string) => {
    setSelectedRangePreset(preset);
    if (!preset) {
      return;
    }
    const now = new Date();
    const currentShift = getShiftRange(now);

    let start: Date;
    let end: Date;

    if (preset === "today") {
      start = currentShift.start;
      end = currentShift.end;
    } else if (preset === "yesterday") {
      start = new Date(currentShift.start.getTime() - 24 * 60 * 60 * 1000);
      end = currentShift.start;
    } else if (preset === "last_week") {
      start = new Date(currentShift.start.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = currentShift.end;
    } else if (preset === "last_30_days") {
      start = new Date(currentShift.start.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = currentShift.end;
    } else {
      return;
    }

    setFilterStartDate(formatDate(start));
    setFilterStartTime(formatTime(start));
    setFilterEndDate(formatDate(end));
    setFilterEndTime(formatTime(end));
  };

  const startFilterDateTime = useMemo(() => {
    if (!filterStartDate) return null;
    const parts = filterStartDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = filterStartTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 9;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 30;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [filterStartDate, filterStartTime]);

  const endFilterDateTime = useMemo(() => {
    if (!filterEndDate) return null;
    const parts = filterEndDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = filterEndTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 23;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 59;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [filterEndDate, filterEndTime]);

  // Filtered Analytics Section Date/Time Filters State
  const [filteredStartDate, setFilteredStartDate] = useState<string>(formatDate(initialShift.start));
  const [filteredStartTime, setFilteredStartTime] = useState<string>(formatTime(initialShift.start));
  const [filteredEndDate, setFilteredEndDate] = useState<string>(formatDate(initialShift.end));
  const [filteredEndTime, setFilteredEndTime] = useState<string>(formatTime(initialShift.end));
  const [filteredRangePreset, setFilteredRangePreset] = useState<string>("today");

  const filteredStartDateTime = startFilterDateTime;
  const filteredEndDateTime = endFilterDateTime;

  // Auto-update shift on crossing end filter datetime for individual metrics
  useEffect(() => {
    if (filteredRangePreset !== "today") return;

    const interval = setInterval(() => {
      const now = new Date();
      const parts = filteredEndDate.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const timeParts = filteredEndTime.split(":");
        const hours = timeParts[0] ? parseInt(timeParts[0]) : 9;
        const minutes = timeParts[1] ? parseInt(timeParts[1]) : 30;
        const currentShiftEnd = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);

        if (now >= currentShiftEnd) {
          const newShift = getShiftRange(now);
          setFilteredStartDate(formatDate(newShift.start));
          setFilteredStartTime(formatTime(newShift.start));
          setFilteredEndDate(formatDate(newShift.end));
          setFilteredEndTime(formatTime(newShift.end));
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [filteredRangePreset, filteredEndDate, filteredEndTime]);

  const handleFilteredPresetChange = (preset: string) => {
    setFilteredRangePreset(preset);
    if (!preset) {
      return;
    }
    const now = new Date();
    const currentShift = getShiftRange(now);

    let start: Date;
    let end: Date;

    if (preset === "today") {
      start = currentShift.start;
      end = currentShift.end;
    } else if (preset === "yesterday") {
      start = new Date(currentShift.start.getTime() - 24 * 60 * 60 * 1000);
      end = currentShift.start;
    } else if (preset === "last_week") {
      start = new Date(currentShift.start.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = currentShift.end;
    } else if (preset === "last_30_days") {
      start = new Date(currentShift.start.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = currentShift.end;
    } else {
      return;
    }

    setFilteredStartDate(formatDate(start));
    setFilteredStartTime(formatTime(start));
    setFilteredEndDate(formatDate(end));
    setFilteredEndTime(formatTime(end));
  };


  // Filtered Analytics — Hierarchy Filter States
  const [filteredAdminId, setFilteredAdminId] = useState<string>("");
  const [filteredLeaderId, setFilteredLeaderId] = useState<string>("");
  const [filteredWarriorId, setFilteredWarriorId] = useState<string>("");

  const [individualSearchQuery, setIndividualSearchQuery] = useState<string>("");
  const [isIndividualSearchOpen, setIsIndividualSearchOpen] = useState<boolean>(false);

  // User Management State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<UserRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    role: "warrior",
    manager_id: "",
    manager_ids: [] as string[],
    system_id: "",
    is_active: true,
    is_approved: true,
    is_tracking_needed: false,
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const meName = dashboard.me?.full_name ?? "Admin Operator";

  // Recursive Manager Check Helper
  const isManagedBy = (userId: string, managerId: string, users: UserRecord[]): boolean => {
    const user = users.find((u) => u.id === userId);
    if (!user) return false;
    const directManagers = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
    if (directManagers.includes(managerId)) return true;
    return directManagers.some((mId) => isManagedBy(mId, managerId, users));
  };

  // Workforce Tree Structures
  interface TreeNode {
    user: UserRecord;
    children: TreeNode[];
    totalCalls: number;
    successCalls: number;
    totalTalkTime: number;
  }

  const userStatsMap = useMemo(() => {
    const stats: Record<string, { totalCalls: number; successCalls: number; totalTalkTime: number }> = {};
    dashboard.users.forEach((u) => {
      stats[u.id] = { totalCalls: 0, successCalls: 0, totalTalkTime: 0 };
    });

    (dashboard.report?.warriors ?? []).forEach((w) => {
      const u = dashboard.users.find(usr => usr.id === w.warrior_id);
      if (u) {
        let totalCalls = 0;
        let successCalls = 0;
        let totalTalkTime = 0;

        (w.calls || []).forEach((c: any) => {
          const type = (c.call_type || "").toLowerCase();
          const status = (c.call_status || "").toLowerCase();
          const duration = c.duration_seconds || 0;

          const isIncoming = type === "incoming";
          const isOutgoing = type === "outgoing";
          const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
          const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);
          const isDialed = isOutgoing && (status === "missed" || status === "missed call" || status.includes("missed") || status === "dialed" || status.includes("dialed") || status === "dropped" || status === "rejected" || status === "failed" || duration === 0 || isDropped);
          const isSuccess = (duration > 10) || (!isDialed && !isMissed && !isDropped && duration > 0);

          totalCalls++;
          totalTalkTime += duration;
          if (isSuccess) {
            successCalls++;
          }
        });

        stats[u.id] = { totalCalls, successCalls, totalTalkTime };
      }
    });

    return stats;
  }, [dashboard.users, dashboard.report]);

  const buildWorkforceTree = useCallback((userId: string, visited: Set<string> = new Set()): TreeNode | null => {
    if (visited.has(userId)) return null;
    const user = dashboard.users.find((u) => u.id === userId);
    if (!user) return null;

    const newVisited = new Set(visited);
    newVisited.add(userId);

    const childrenNodes: TreeNode[] = [];
    dashboard.users.forEach((u) => {
      const mIds = u.manager_ids || (u.manager_id ? [u.manager_id] : []);
      if (mIds.includes(userId)) {
        const childTree = buildWorkforceTree(u.id, newVisited);
        if (childTree) {
          childrenNodes.push(childTree);
        }
      }
    });

    const ownStats = userStatsMap[userId] || { totalCalls: 0, successCalls: 0, totalTalkTime: 0 };
    let totalCalls = ownStats.totalCalls;
    let successCalls = ownStats.successCalls;
    let totalTalkTime = ownStats.totalTalkTime;

    childrenNodes.forEach((c) => {
      totalCalls += c.totalCalls;
      successCalls += c.successCalls;
      totalTalkTime += c.totalTalkTime;
    });

    return {
      user,
      children: childrenNodes,
      totalCalls,
      successCalls,
      totalTalkTime
    };
  }, [dashboard.users, userStatsMap]);

  const selectedWorkforceTree = useMemo(() => {
    if (!selectedWorkforceUserId) return null;
    return buildWorkforceTree(selectedWorkforceUserId);
  }, [selectedWorkforceUserId, buildWorkforceTree]);

  useEffect(() => {
    if (selectedWorkforceUserId) {
      const flatIds: string[] = [];
      const collectIds = (node: TreeNode) => {
        flatIds.push(node.user.id);
        node.children.forEach(collectIds);
      };
      const tree = buildWorkforceTree(selectedWorkforceUserId);
      if (tree) {
        collectIds(tree);
      }
      const initialExpanded: Record<string, boolean> = {};
      flatIds.forEach((id) => {
        initialExpanded[id] = true;
      });
      setWorkforceExpandedNodes(initialExpanded);
    }
  }, [selectedWorkforceUserId, buildWorkforceTree]);

  // Filter Lists - Get list of subordinates with priority strictly lower than logged in user
  const searchableSubordinates = useMemo(() => {
    const me = dashboard.me;
    if (!me) return [];

    const getRolePriority = (role: string) => {
      if (role === "super_admin") return 4;
      if (role === "admin") return 3;
      if (role === "group_leader") return 2;
      if (role === "warrior") return 1;
      return 0;
    };

    const mePriority = getRolePriority(me.role);

    return dashboard.users.filter((u) => {
      // Must be strictly lower role priority
      if (getRolePriority(u.role) >= mePriority) return false;

      // Must be managed by me (if not admin or super_admin)
      if (me.role !== "super_admin" && me.role !== "admin") {
        return u.manager_id === me.id || isManagedBy(u.id, me.id, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, dashboard.me]);

  const filteredSearchableSubordinates = useMemo(() => {
    if (!subordinateSearchQuery) return searchableSubordinates;
    const q = subordinateSearchQuery.toLowerCase();
    return searchableSubordinates.filter(
      u => (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [searchableSubordinates, subordinateSearchQuery]);

  const filteredIndividualSearchSubordinates = useMemo(() => {
    if (!individualSearchQuery) return searchableSubordinates;
    const q = individualSearchQuery.toLowerCase();
    return searchableSubordinates.filter(
      u => (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    );
  }, [searchableSubordinates, individualSearchQuery]);

  // Filtered Analytics — Cascading hierarchy lists
  const filteredAdminsList = useMemo(() => {
    return dashboard.users.filter(u => u.role === "admin" || u.role === "super_admin");
  }, [dashboard.users]);

  const filteredLeadersList = useMemo(() => {
    return dashboard.users.filter(u => {
      if (u.role !== "group_leader") return false;
      if (filteredAdminId) {
        return u.manager_id === filteredAdminId || isManagedBy(u.id, filteredAdminId, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, filteredAdminId]);

  const filteredWarriorsList = useMemo(() => {
    return dashboard.users.filter(u => {
      if (u.role !== "warrior") return false;
      if (filteredLeaderId) {
        return u.manager_id === filteredLeaderId || isManagedBy(u.id, filteredLeaderId, dashboard.users);
      }
      if (filteredAdminId) {
        return u.manager_id === filteredAdminId || isManagedBy(u.id, filteredAdminId, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, filteredAdminId, filteredLeaderId]);

  const handleFilteredAdminChange = (adminId: string) => {
    setFilteredAdminId(adminId);
    setFilteredLeaderId("");
    setFilteredWarriorId("");
  };

  const handleFilteredLeaderChange = (leaderId: string) => {
    setFilteredLeaderId(leaderId);
    setFilteredWarriorId("");
  };

  const handleIndividualSearchSelect = (user: UserRecord) => {
    if (user.role === "admin" || user.role === "super_admin") {
      setFilteredAdminId(user.id);
      setFilteredLeaderId("");
      setFilteredWarriorId("");
    } else if (user.role === "group_leader") {
      setFilteredLeaderId(user.id);
      setFilteredWarriorId("");
      const directManagers = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
      const adminManager = dashboard.users.find(u => directManagers.includes(u.id) && (u.role === "admin" || u.role === "super_admin"));
      if (adminManager) {
        setFilteredAdminId(adminManager.id);
      } else {
        setFilteredAdminId("");
      }
    } else if (user.role === "warrior") {
      setFilteredWarriorId(user.id);
      const directManagers = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
      const leaderManager = dashboard.users.find(u => directManagers.includes(u.id) && u.role === "group_leader");
      if (leaderManager) {
        setFilteredLeaderId(leaderManager.id);
        const lManagers = leaderManager.manager_ids || (leaderManager.manager_id ? [leaderManager.manager_id] : []);
        const adminManager = dashboard.users.find(u => lManagers.includes(u.id) && (u.role === "admin" || u.role === "super_admin"));
        if (adminManager) {
          setFilteredAdminId(adminManager.id);
        } else {
          setFilteredAdminId("");
        }
      } else {
        const adminManager = dashboard.users.find(u => directManagers.includes(u.id) && (u.role === "admin" || u.role === "super_admin"));
        if (adminManager) {
          setFilteredAdminId(adminManager.id);
        } else {
          setFilteredAdminId("");
        }
        setFilteredLeaderId("");
      }
    }
    setIndividualSearchQuery(user.full_name);
    setIsIndividualSearchOpen(false);
  };

  const roleLevels: Record<string, number> = {
    super_admin: 4,
    admin: 3,
    group_leader: 2,
    warrior: 1,
  };

  const getRoleLevel = (role: string) => roleLevels[role] || 1;

  const canManageUser = (targetUser: UserRecord) => {
    const myRole = dashboard.me?.role || "warrior";
    if (myRole === "super_admin") return true;
    return getRoleLevel(myRole) > getRoleLevel(targetUser.role);
  };

  const handleOpenEditModal = (user: UserRecord) => {
    setEditingUser(user);
    const emp = dashboard.employees.find(
      (e) => e.system_id === user.system_id || (e.email && e.email.toLowerCase() === user.email.toLowerCase())
    );
    setEditFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      role: user.role || "warrior",
      manager_id: user.manager_id || "",
      manager_ids: user.manager_ids || (user.manager_id ? [user.manager_id] : []),
      system_id: user.system_id || "",
      is_active: user.is_active,
      is_approved: user.is_approved,
      is_tracking_needed: emp ? emp.is_tracking_needed : false,
    });
    setManagerSearchQuery("");
    setActionError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !onUpdateUser) return;
    setActionLoading(true);
    setActionError("");
    try {
      const payload: any = {
        full_name: editFormData.full_name,
        email: editFormData.email,
        role: editFormData.role,
        is_active: editFormData.is_active,
        is_approved: editFormData.is_approved,
        system_id: editFormData.system_id || null,
        manager_ids: editFormData.manager_ids.length > 0 ? editFormData.manager_ids : null,
      };

      // Update User details
      await onUpdateUser(editingUser.id, payload);

      // Update Employee tracking needed status if changed
      const emp = dashboard.employees.find(
        (e) => e.system_id === editingUser.system_id || (e.email && e.email.toLowerCase() === editingUser.email.toLowerCase())
      );
      if (emp && emp.is_tracking_needed !== editFormData.is_tracking_needed && onToggleTrackingNeeded) {
        await onToggleTrackingNeeded(emp.employee_id, emp.is_tracking_needed);
      }

      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeleteModal = (user: UserRecord) => {
    setIsDeletingUser(user);
    setActionError("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!isDeletingUser || !onDeleteUser) return;
    setActionLoading(true);
    setActionError("");
    try {
      await onDeleteUser(isDeletingUser.id);
      setIsDeleteModalOpen(false);
      setIsDeletingUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserTrackingState = async (user: UserRecord) => {
    if (!onToggleUserTracking) return;
    try {
      await onToggleUserTracking(user.id, !user.is_tracking_enabled);
    } catch (err) {
      console.error("Failed to toggle user tracking status:", err);
    }
  };

  // Calculate Totals & Stats (reacts to subordinate filter and date range)
  const totals = useMemo(() => {
    let filteredReportWarriors = dashboard.report?.warriors ?? [];
    if (selectedSubordinateId) {
      filteredReportWarriors = filteredReportWarriors.filter(
        (w) => w.warrior_id === selectedSubordinateId || w.manager_id === selectedSubordinateId || isManagedBy(w.warrior_id, selectedSubordinateId, dashboard.users)
      );
    }
    return computeTotals(filteredReportWarriors, dashboard.users, dashboard.employees, startFilterDateTime, endFilterDateTime);
  }, [dashboard, selectedSubordinateId, startFilterDateTime, endFilterDateTime]);

  // Calculate Overall Totals & Stats (stays overall, unfiltered by subordinate but filtered by date range)
  const overallTotals = useMemo(() => {
    return computeTotals(dashboard.report?.warriors ?? [], dashboard.users, dashboard.employees, startFilterDateTime, endFilterDateTime);
  }, [dashboard, startFilterDateTime, endFilterDateTime]);

  const comparisonData = useMemo(() => {
    return [
      {
        name: "Overall",
        Total: totals.totalCallsDone,
        Success: totals.totalSuccessCalls,
        "Not Responded": totals.missedNotResponded,
        "Incoming Dropped": totals.incomingDroppedCalls,
        "Outgoing Dropped": totals.outgoingDroppedCalls,
      },
      {
        name: "Incoming",
        Total: totals.incomingCalls,
        Success: totals.incomingSuccessCalls,
        "Not Responded": 0,
        "Incoming Dropped": totals.incomingDroppedCalls,
        "Outgoing Dropped": 0,
      },
      {
        name: "Outgoing",
        Total: totals.outgoingCalls,
        Success: totals.outgoingSuccessCalls,
        "Not Responded": 0,
        "Incoming Dropped": 0,
        "Outgoing Dropped": totals.outgoingDroppedCalls,
      },
      {
        name: "Missed",
        Total: totals.totalMissed,
        Success: 0,
        "Not Responded": totals.missedNotResponded,
        "Incoming Dropped": 0,
        "Outgoing Dropped": 0,
      },
      {
        name: "Dropped",
        Total: totals.droppedCalls,
        Success: 0,
        "Not Responded": 0,
        "Incoming Dropped": totals.incomingDroppedCalls,
        "Outgoing Dropped": totals.outgoingDroppedCalls,
      },
    ];
  }, [totals]);

  const activeComparisonBarData = useMemo(() => {
    const item = comparisonData.find(d => d.name === selectedComparisonCategory);
    if (!item) return [];

    if (selectedComparisonCategory === "Overall") {
      return [
        { name: "Total Calls", value: item.Total, fill: "#1F8FFF" },
        { name: "Success Calls", value: item.Success, fill: "#00E6B8" },
        { name: "Unresponded", value: item["Not Responded"], fill: "rgba(244, 63, 94, 0.8)" },
        { name: "Incoming Dropped", value: item["Incoming Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
        { name: "Outgoing Dropped", value: item["Outgoing Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
      ];
    } else if (selectedComparisonCategory === "Incoming") {
      return [
        { name: "Total Incoming", value: item.Total, fill: "#1F8FFF" },
        { name: "Success Incoming", value: item.Success, fill: "#00E6B8" },
        { name: "Incoming Dropped", value: item["Incoming Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
      ];
    } else if (selectedComparisonCategory === "Outgoing") {
      return [
        { name: "Total Outgoing", value: item.Total, fill: "#1F8FFF" },
        { name: "Success Outgoing", value: item.Success, fill: "#00E6B8" },
        { name: "Outgoing Dropped", value: item["Outgoing Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
      ];
    } else if (selectedComparisonCategory === "Missed") {
      return [
        { name: "Total Missed", value: item.Total, fill: "#1F8FFF" },
        { name: "Not Responded", value: item["Not Responded"], fill: "rgba(244, 63, 94, 0.8)" },
      ];
    } else {
      return [
        { name: "Total Dropped", value: item.Total, fill: "#1F8FFF" },
        { name: "Incoming Dropped", value: item["Incoming Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
        { name: "Outgoing Dropped", value: item["Outgoing Dropped"], fill: "rgba(244, 63, 94, 0.8)" },
      ];
    }
  }, [comparisonData, selectedComparisonCategory]);

  const directionData = useMemo(() => {
    return [
      { name: "Incoming", value: totals.incomingCalls, color: "#1F8FFF" },
      { name: "Outgoing", value: totals.outgoingCalls, color: "#8B5CF6" },
    ];
  }, [totals]);

  const recoveryData = useMemo(() => {
    const resolved = Math.max(0, totals.totalMissed - totals.missedNotResponded);
    return [
      { name: "Responded", value: resolved, color: "#00E6B8" },
      { name: "Unresponded", value: totals.missedNotResponded, color: "#e11d48" },
    ];
  }, [totals]);

  const filteredReportWarriors = useMemo(() => {
    let list = dashboard.report?.warriors ?? [];
    if (selectedSubordinateId) {
      list = list.filter((w) => w.warrior_id === selectedSubordinateId || w.manager_id === selectedSubordinateId || isManagedBy(w.warrior_id, selectedSubordinateId, dashboard.users));
    }
    return list;
  }, [dashboard.report, dashboard.users, selectedSubordinateId]);

  const filteredUsersList = useMemo(() => {
    return dashboard.users.filter((user) => {
      const q = userSearchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (user.full_name || "").toLowerCase().includes(q) ||
        (user.email || "").toLowerCase().includes(q)
      );
    });
  }, [dashboard.users, userSearchQuery]);

  const leaderSummaryData = useMemo(() => {
    const report = dashboard.report;
    if (!report) return { name: "-", hours: 0, avg: 0, count: 0 };
    if (selectedSubordinateId) {
      const leaderUser = dashboard.users.find((u) => u.id === selectedSubordinateId);
      const groupWarriors = report.warriors.filter(
        (w) => w.warrior_id === selectedSubordinateId || w.manager_id === selectedSubordinateId || isManagedBy(w.warrior_id, selectedSubordinateId, dashboard.users)
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
  }, [dashboard, selectedSubordinateId]);

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

  const filteredVisualizationData = useMemo(() => {
    const allWarriors = dashboard.report?.warriors ?? [];

    // Warrior selected — show that warrior's individual breakdown
    if (filteredWarriorId) {
      const warrior = allWarriors.find(w => w.warrior_id === filteredWarriorId);
      if (!warrior) return [];
      const wTotals = computeTotals([warrior], dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
      return [
        { name: "Total", value: wTotals.totalCallsDone, fill: "#015C96" },
        { name: "Success", value: wTotals.totalSuccessCalls, fill: "#04693F" },
        { name: "Incoming", value: wTotals.incomingCalls, fill: "#3b82f6" },
        { name: "Outgoing", value: wTotals.outgoingCalls, fill: "#f59e0b" },
        { name: "Missed", value: wTotals.totalMissed, fill: "#ef4444" },
      ];
    }

    // Leader selected — show team member comparison
    if (filteredLeaderId) {
      const groupWarriors = allWarriors.filter(
        w => w.warrior_id === filteredLeaderId || w.manager_id === filteredLeaderId || isManagedBy(w.warrior_id, filteredLeaderId, dashboard.users)
      );
      return groupWarriors.map(w => {
        const wTotals = computeTotals([w], dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
        return {
          name: w.full_name.split(' ')[0] || w.full_name,
          "Total Calls": wTotals.totalCallsDone,
          "Success Calls": wTotals.totalSuccessCalls,
          "Calling Hours": parseFloat((wTotals.totalTalkSeconds / 3600).toFixed(1))
        };
      });
    }

    // Admin selected — show leaders under that admin
    if (filteredAdminId) {
      const adminLeaders = filteredLeadersList; // already filtered by admin
      if (adminLeaders.length > 0) {
        return adminLeaders.map(leader => {
          const groupWarriors = allWarriors.filter(
            w => w.warrior_id === leader.id || w.manager_id === leader.id || isManagedBy(w.warrior_id, leader.id, dashboard.users)
          );
          const groupTotals = computeTotals(groupWarriors, dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
          return {
            name: leader.full_name.split(' ')[0] || leader.full_name,
            "Total Calls": groupTotals.totalCallsDone,
            "Calling Hours": parseFloat((groupTotals.totalTalkSeconds / 3600).toFixed(1))
          };
        });
      }
      // No leaders under admin — show warriors directly under admin
      const adminWarriors = allWarriors.filter(w => isManagedBy(w.warrior_id, filteredAdminId, dashboard.users));
      return adminWarriors.map(w => {
        const wTotals = computeTotals([w], dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
        return {
          name: w.full_name.split(' ')[0] || w.full_name,
          "Total Calls": wTotals.totalCallsDone,
          "Success Calls": wTotals.totalSuccessCalls,
        };
      });
    }

    // No filter — show all leaders with their team totals
    const leaders = dashboard.users.filter(u => u.role === "group_leader");
    if (leaders.length === 0) {
      const sortedWarriors = [...allWarriors]
        .sort((a, b) => b.total_calls - a.total_calls)
        .slice(0, 8);
      return sortedWarriors.map(w => {
        const wTotals = computeTotals([w], dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
        return {
          name: w.full_name.split(' ')[0] || w.full_name,
          "Total Calls": wTotals.totalCallsDone,
          "Success Calls": wTotals.totalSuccessCalls,
          "Calling Hours": parseFloat((wTotals.totalTalkSeconds / 3600).toFixed(1))
        };
      });
    }

    return leaders.map(leader => {
      const groupWarriors = allWarriors.filter(
        w => w.warrior_id === leader.id || w.manager_id === leader.id || isManagedBy(w.warrior_id, leader.id, dashboard.users)
      );
      const groupTotals = computeTotals(groupWarriors, dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);
      return {
        name: leader.full_name.split(' ')[0] || leader.full_name,
        "Total Calls": groupTotals.totalCallsDone,
        "Calling Hours": parseFloat((groupTotals.totalTalkSeconds / 3600).toFixed(1))
      };
    });
  }, [dashboard, filteredAdminId, filteredLeaderId, filteredWarriorId, filteredLeadersList, filteredStartDateTime, filteredEndDateTime]);

  const filteredInsights = useMemo(() => {
    const allWarriors = dashboard.report?.warriors ?? [];
    let scopedWarriors = allWarriors;
    let title = "Overall Organization Insights";

    if (filteredWarriorId) {
      const warrior = allWarriors.find(w => w.warrior_id === filteredWarriorId);
      scopedWarriors = warrior ? [warrior] : [];
      title = `${warrior?.full_name ?? "Warrior"}'s Individual Insights`;
    } else if (filteredLeaderId) {
      scopedWarriors = allWarriors.filter(
        w => w.warrior_id === filteredLeaderId || w.manager_id === filteredLeaderId || isManagedBy(w.warrior_id, filteredLeaderId, dashboard.users)
      );
      const leaderName = dashboard.users.find(u => u.id === filteredLeaderId)?.full_name ?? "Leader";
      title = `${leaderName}'s Group Insights`;
    } else if (filteredAdminId) {
      scopedWarriors = allWarriors.filter(w => isManagedBy(w.warrior_id, filteredAdminId, dashboard.users));
      const adminName = dashboard.users.find(u => u.id === filteredAdminId)?.full_name ?? "Admin";
      title = `${adminName}'s Team Insights`;
    }

    const insights: string[] = [];
    const t = computeTotals(scopedWarriors, dashboard.users, dashboard.employees, filteredStartDateTime, filteredEndDateTime);

    if (t.totalCallsDone > 0) {
      const successRate = ((t.totalSuccessCalls / t.totalCallsDone) * 100).toFixed(1);
      insights.push(`Call connection quality: ${successRate}% of calls are successful (duration >10 seconds).`);
    } else {
      insights.push("No call data logged for the selected filter.");
    }

    if (t.totalCallsDone > 0) {
      const outgoingPct = ((t.outgoingCalls / t.totalCallsDone) * 100).toFixed(1);
      const incomingPct = ((t.incomingCalls / t.totalCallsDone) * 100).toFixed(1);
      insights.push(`Call mix shows ${outgoingPct}% Outgoing calls and ${incomingPct}% Incoming calls.`);
    }

    if (t.totalMissed > 0) {
      const respondedCount = Math.max(0, t.totalMissed - t.missedNotResponded);
      const recoveryRate = ((respondedCount / t.totalMissed) * 100).toFixed(1);
      insights.push(`Lead Recovery: ${recoveryRate}% of missed calls were followed up with an outgoing call.`);
      if (t.missedNotResponded > 0) {
        insights.push(`Warning: ${t.missedNotResponded} missed calls remain unresponded, risking potential lead leaks.`);
      }
    } else if (t.totalCallsDone > 0) {
      insights.push("Zero missed calls detected. Excellent incoming coverage!");
    }

    if (!filteredWarriorId) {
      const trackingEnabledCount = scopedWarriors.filter(w => w.is_tracking_enabled).length;
      insights.push(`Active tracking: ${trackingEnabledCount} out of ${scopedWarriors.length} members have app tracking enabled.`);
    }

    return { title, insights };
  }, [dashboard, filteredAdminId, filteredLeaderId, filteredWarriorId, filteredStartDateTime, filteredEndDateTime]);

  const topPerformers = useMemo(() => {
    const warriorsList = filteredReportWarriors;
    const unsplashAvatars = [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
    ];
    return [...warriorsList]
      .map((w, idx) => {
        const wTotals = computeTotals([w], dashboard.users, dashboard.employees, startFilterDateTime, endFilterDateTime);
        const u = dashboard.users.find(usr => usr.id === w.warrior_id);
        const nameParts = (w.full_name || "").split(' ');
        const initials = nameParts.map(p => p[0]).join('').slice(0, 2).toUpperCase();
        const hh = Math.floor(wTotals.totalTalkSeconds / 3600);
        const mm = Math.floor((wTotals.totalTalkSeconds % 3600) / 60);
        const formattedTalkTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
        return {
          id: w.warrior_id,
          name: w.full_name,
          calls: wTotals.totalCallsDone,
          hours: formattedTalkTime,
          isTrackingActive: u ? u.is_tracking_active : false,
          initials: initials || "W",
          avatarUrl: (u as any)?.avatar_url || unsplashAvatars[idx % unsplashAvatars.length]
        };
      })
      .sort((a, b) => {
        if (a.isTrackingActive && !b.isTrackingActive) return -1;
        if (!a.isTrackingActive && b.isTrackingActive) return 1;
        return b.calls - a.calls;
      })
      .map((w, idx) => ({ ...w, rank: idx + 1 }));
  }, [filteredReportWarriors, dashboard.users, startFilterDateTime, endFilterDateTime]);

  const warriorHourlyData = useMemo(() => {
    if (!filteredWarriorId) return [];
    const warrior = dashboard.report?.warriors.find(w => w.warrior_id === filteredWarriorId);
    if (!warrior || !warrior.calls) return [];

    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) {
      hourlyCounts[h] = 0;
    }

    warrior.calls.forEach(c => {
      const date = parseDbTimestamp(c.timestamp);
      if (date) {
        const hour = date.getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }
    });

    const data = [];
    for (let h = 0; h < 24; h++) {
      const count = hourlyCounts[h];
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      data.push({
        hourStr: `${displayHour} ${ampm}`,
        hour: h,
        "Calls": count
      });
    }

    const activeHours = data.filter(d => d.Calls > 0);
    if (activeHours.length === 0) {
      return data.filter(d => d.hour >= 9 && d.hour <= 18);
    }
    const minHour = Math.max(0, Math.min(...activeHours.map(d => d.hour)) - 1);
    const maxHour = Math.min(23, Math.max(...activeHours.map(d => d.hour)) + 1);
    return data.filter(d => d.hour >= minHour && d.hour <= maxHour);
  }, [dashboard, filteredWarriorId]);

  const warriorTimeRange = useMemo(() => {
    if (!selectedSubordinateId) return null;
    const isWarrior = dashboard.users.find(u => u.id === selectedSubordinateId)?.role === "warrior";
    if (!isWarrior) return null;
    const warrior = dashboard.report?.warriors.find(w => w.warrior_id === selectedSubordinateId);
    if (!warrior || !warrior.calls || warrior.calls.length === 0) return null;

    const dates = warrior.calls
      .map(c => parseDbTimestamp(c.timestamp))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return null;

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];

    const formatDate = (d: Date) => {
      const day = d.getDate().toString().padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const formatTime = (d: Date) => {
      const hrs = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${hrs}:${mins}`;
    };

    return {
      fromDate: formatDate(minDate),
      fromTime: formatTime(minDate),
      toDate: formatDate(maxDate),
      toTime: formatTime(maxDate)
    };
  }, [dashboard, selectedSubordinateId]);

  const hourlyFilteredCalls = useMemo(() => {
    const reportWarriors = dashboard.report?.warriors ?? [];
    const users = dashboard.users;

    const isUserManagedBy = (userId: string, managerId: string): boolean => {
      const user = users.find((u) => u.id === userId);
      if (!user) return false;
      const directManagers = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
      if (directManagers.includes(managerId)) return true;
      return directManagers.some((mId) => isUserManagedBy(mId, managerId));
    };

    let targetUserIds: string[] = [];

    if (filteredWarriorId) {
      targetUserIds = [filteredWarriorId];
    } else if (filteredLeaderId) {
      const managedWarriors = users.filter(u => u.role === "warrior" && (u.manager_id === filteredLeaderId || isUserManagedBy(u.id, filteredLeaderId)));
      targetUserIds = [filteredLeaderId, ...managedWarriors.map(w => w.id)];
    } else if (filteredAdminId) {
      const managedUsers = users.filter(u => u.manager_id === filteredAdminId || isUserManagedBy(u.id, filteredAdminId));
      targetUserIds = [filteredAdminId, ...managedUsers.map(u => u.id)];
    } else {
      targetUserIds = users.map(u => u.id);
    }

    let filteredWarriors = reportWarriors.filter(w => targetUserIds.includes(w.warrior_id));
    if (selectedSubordinateId) {
      filteredWarriors = filteredWarriors.filter(
        (w) => w.warrior_id === selectedSubordinateId || w.manager_id === selectedSubordinateId || isUserManagedBy(w.warrior_id, selectedSubordinateId)
      );
    }
    let allCalls = filteredWarriors.flatMap(w => w.calls ?? []);

    if (filteredStartDateTime || filteredEndDateTime) {
      allCalls = allCalls.filter(c => {
        const callDate = parseDbTimestamp(c.timestamp);
        if (!callDate) return false;
        if (filteredStartDateTime && callDate < filteredStartDateTime) return false;
        if (filteredEndDateTime && callDate > filteredEndDateTime) return false;
        return true;
      });
    }

    return allCalls;
  }, [dashboard, selectedSubordinateId, filteredAdminId, filteredLeaderId, filteredWarriorId, filteredStartDateTime, filteredEndDateTime]);

  const hourlyDistributionData = useMemo(() => {
    const isToday = selectedRangePreset === "today";
    const isLastWeek = selectedRangePreset === "last_week";
    const isLast30Days = selectedRangePreset === "last_30_days";

    // 1) TODAY: 15-minute interval data
    if (isToday) {
      const intervalCounts: Record<string, { hourStr: string; timeVal: number; Total: number; Incoming: number; Outgoing: number; Missed: number; Dropped: number }> = {};

      for (let h = 0; h < 24; h++) {
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        for (let m = 0; m < 60; m += 15) {
          const timeKey = `${h}:${m}`;
          const displayMin = String(m).padStart(2, "0");
          const label = `${displayHour}:${displayMin} ${ampm}`;
          intervalCounts[timeKey] = {
            hourStr: label,
            timeVal: h + m / 60,
            Total: 0,
            Incoming: 0,
            Outgoing: 0,
            Missed: 0,
            Dropped: 0
          };
        }
      }

      hourlyFilteredCalls.forEach(c => {
        const date = parseDbTimestamp(c.timestamp);
        if (!date) return;
        const hour = date.getHours();
        const min = Math.floor(date.getMinutes() / 15) * 15;
        const key = `${hour}:${min}`;

        const type = (c.call_type || "").toLowerCase();
        const status = (c.call_status || "").toLowerCase();
        const duration = c.duration_seconds || 0;

        const isIncoming = type === "incoming";
        const isOutgoing = type === "outgoing";
        const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
        const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

        if (intervalCounts[key]) {
          intervalCounts[key].Total++;
          if (isIncoming) intervalCounts[key].Incoming++;
          if (isOutgoing) intervalCounts[key].Outgoing++;
          if (isMissed) intervalCounts[key].Missed++;
          if (isDropped) intervalCounts[key].Dropped++;
        }
      });

      const data = Object.values(intervalCounts);
      const activeIntervals = data.filter(d => d.Total > 0 || d.Incoming > 0 || d.Outgoing > 0 || d.Missed > 0 || d.Dropped > 0);
      if (activeIntervals.length === 0) {
        return data.filter(d => d.timeVal >= 9 && d.timeVal <= 18);
      }
      const minVal = Math.max(0, Math.min(...activeIntervals.map(d => d.timeVal)) - 0.5);
      const maxVal = Math.min(23.75, Math.max(...activeIntervals.map(d => d.timeVal)) + 0.5);
      return data.filter(d => d.timeVal >= minVal && d.timeVal <= maxVal);
    }

    // 2) 7 DAYS (last_week): Group by day of week chronologically
    if (isLastWeek) {
      const last7Days: { dateStr: string; dayName: string; dateObj: Date; Total: number; Incoming: number; Outgoing: number; Missed: number; Dropped: number }[] = [];
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = dayNames[d.getDay()];
        const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        last7Days.push({
          dateStr: `${dayName} (${dateStr})`,
          dayName,
          dateObj: d,
          Total: 0,
          Incoming: 0,
          Outgoing: 0,
          Missed: 0,
          Dropped: 0
        });
      }

      hourlyFilteredCalls.forEach(c => {
        const date = parseDbTimestamp(c.timestamp);
        if (!date) return;

        const type = (c.call_type || "").toLowerCase();
        const status = (c.call_status || "").toLowerCase();
        const duration = c.duration_seconds || 0;

        const isIncoming = type === "incoming";
        const isOutgoing = type === "outgoing";
        const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
        const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

        const match = last7Days.find(d =>
          d.dateObj.getDate() === date.getDate() &&
          d.dateObj.getMonth() === date.getMonth() &&
          d.dateObj.getFullYear() === date.getFullYear()
        );

        if (match) {
          match.Total++;
          if (isIncoming) match.Incoming++;
          if (isOutgoing) match.Outgoing++;
          if (isMissed) match.Missed++;
          if (isDropped) match.Dropped++;
        }
      });

      return last7Days.map(d => ({
        hourStr: d.dateStr,
        Total: d.Total,
        Incoming: d.Incoming,
        Outgoing: d.Outgoing,
        Missed: d.Missed,
        Dropped: d.Dropped
      }));
    }

    // 3) MONTH (last_30_days): Group by date chronologically
    if (isLast30Days) {
      const last30Days: { dateStr: string; dateObj: Date; Total: number; Incoming: number; Outgoing: number; Missed: number; Dropped: number }[] = [];

      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        last30Days.push({
          dateStr,
          dateObj: d,
          Total: 0,
          Incoming: 0,
          Outgoing: 0,
          Missed: 0,
          Dropped: 0
        });
      }

      hourlyFilteredCalls.forEach(c => {
        const date = parseDbTimestamp(c.timestamp);
        if (!date) return;

        const type = (c.call_type || "").toLowerCase();
        const status = (c.call_status || "").toLowerCase();
        const duration = c.duration_seconds || 0;

        const isIncoming = type === "incoming";
        const isOutgoing = type === "outgoing";
        const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
        const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

        const match = last30Days.find(d =>
          d.dateObj.getDate() === date.getDate() &&
          d.dateObj.getMonth() === date.getMonth() &&
          d.dateObj.getFullYear() === date.getFullYear()
        );

        if (match) {
          match.Total++;
          if (isIncoming) match.Incoming++;
          if (isOutgoing) match.Outgoing++;
          if (isMissed) match.Missed++;
          if (isDropped) match.Dropped++;
        }
      });

      return last30Days.map(d => ({
        hourStr: d.dateStr,
        Total: d.Total,
        Incoming: d.Incoming,
        Outgoing: d.Outgoing,
        Missed: d.Missed,
        Dropped: d.Dropped
      }));
    }

    // 4) CUSTOM RANGE: If spanned over multiple days, group by day
    let daysDiff = 0;
    if (filterStartDate && filterEndDate) {
      const start = new Date(filterStartDate);
      const end = new Date(filterEndDate);
      daysDiff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (daysDiff > 1) {
      const daysCount = Math.min(60, daysDiff + 1);
      const customDays: { dateStr: string; dateObj: Date; Total: number; Incoming: number; Outgoing: number; Missed: number; Dropped: number }[] = [];
      const startD = new Date(filterStartDate);

      for (let i = 0; i < daysCount; i++) {
        const d = new Date(startD);
        d.setDate(startD.getDate() + i);
        const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        customDays.push({
          dateStr,
          dateObj: d,
          Total: 0,
          Incoming: 0,
          Outgoing: 0,
          Missed: 0,
          Dropped: 0
        });
      }

      hourlyFilteredCalls.forEach(c => {
        const date = parseDbTimestamp(c.timestamp);
        if (!date) return;

        const type = (c.call_type || "").toLowerCase();
        const status = (c.call_status || "").toLowerCase();
        const duration = c.duration_seconds || 0;

        const isIncoming = type === "incoming";
        const isOutgoing = type === "outgoing";
        const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
        const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

        const match = customDays.find(d =>
          d.dateObj.getDate() === date.getDate() &&
          d.dateObj.getMonth() === date.getMonth() &&
          d.dateObj.getFullYear() === date.getFullYear()
        );

        if (match) {
          match.Total++;
          if (isIncoming) match.Incoming++;
          if (isOutgoing) match.Outgoing++;
          if (isMissed) match.Missed++;
          if (isDropped) match.Dropped++;
        }
      });

      return customDays.map(d => ({
        hourStr: d.dateStr,
        Total: d.Total,
        Incoming: d.Incoming,
        Outgoing: d.Outgoing,
        Missed: d.Missed,
        Dropped: d.Dropped
      }));
    }

    // 5) DEFAULT: Hourly distribution
    const hourlyCounts: Record<number, { hourStr: string; hour: number; Total: number; Incoming: number; Outgoing: number; Missed: number; Dropped: number }> = {};

    for (let h = 0; h < 24; h++) {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      hourlyCounts[h] = {
        hourStr: `${displayHour} ${ampm}`,
        hour: h,
        Total: 0,
        Incoming: 0,
        Outgoing: 0,
        Missed: 0,
        Dropped: 0
      };
    }

    hourlyFilteredCalls.forEach(c => {
      const date = parseDbTimestamp(c.timestamp);
      if (!date) return;
      const hour = date.getHours();

      const type = (c.call_type || "").toLowerCase();
      const status = (c.call_status || "").toLowerCase();
      const duration = c.duration_seconds || 0;

      const isIncoming = type === "incoming";
      const isOutgoing = type === "outgoing";
      const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
      const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

      if (hourlyCounts[hour]) {
        hourlyCounts[hour].Total++;
        if (isIncoming) hourlyCounts[hour].Incoming++;
        if (isOutgoing) hourlyCounts[hour].Outgoing++;
        if (isMissed) hourlyCounts[hour].Missed++;
        if (isDropped) hourlyCounts[hour].Dropped++;
      }
    });

    const data = Object.values(hourlyCounts);
    const activeHours = data.filter(d => d.Total > 0 || d.Incoming > 0 || d.Outgoing > 0 || d.Missed > 0 || d.Dropped > 0);
    if (activeHours.length === 0) {
      return data.filter(d => d.hour >= 9 && d.hour <= 18);
    }
    const minHour = Math.max(0, Math.min(...activeHours.map(d => d.hour)) - 1);
    const maxHour = Math.min(23, Math.max(...activeHours.map(d => d.hour)) + 1);
    return data.filter(d => d.hour >= minHour && d.hour <= maxHour);
  }, [hourlyFilteredCalls, selectedRangePreset, filterStartDate, filterEndDate]);

  const individualVisualsData = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;

    let incomingSuccess = 0;
    let incomingMissed = 0;

    let outgoingSuccess = 0;
    let outgoingDialed = 0;

    let incomingDropped = 0;
    let outgoingDropped = 0;

    let total = hourlyFilteredCalls.length;

    hourlyFilteredCalls.forEach(c => {
      const type = (c.call_type || "").toLowerCase();
      const status = (c.call_status || "").toLowerCase();
      const duration = c.duration_seconds || 0;

      const isIncoming = type === "incoming";
      const isOutgoing = type === "outgoing";
      const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
      const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

      if (isIncoming) {
        incoming++;
        if (isMissed) {
          incomingMissed++;
        } else {
          incomingSuccess++;
          if (isDropped) {
            incomingDropped++;
          }
        }
      } else if (isOutgoing) {
        outgoing++;
        if (isDropped) {
          outgoingDialed++;
          outgoingDropped++;
        } else {
          outgoingSuccess++;
        }
      }
    });

    const totalDropped = incomingDropped + outgoingDropped;

    const directionData = [
      { name: "Incoming", value: incoming, color: "#1F8FFF" },
      { name: "Outgoing", value: outgoing, color: "#8B5CF6" }
    ];

    const incomingData = [
      { name: "Success", value: incomingSuccess, color: "#00E6B8" },
      { name: "Missed", value: incomingMissed, color: "#ef4444" }
    ];

    const outgoingData = [
      { name: "Success", value: outgoingSuccess, color: "#1F8FFF" },
      { name: "Dialed/Dropped", value: outgoingDialed, color: "#e11d48" }
    ];

    const droppedData = [
      { name: "Incoming Dropped", value: incomingDropped, color: "#f59e0b" },
      { name: "Outgoing Dropped", value: outgoingDropped, color: "#ef4444" }
    ];

    return {
      total,
      incoming,
      outgoing,
      incomingSuccess,
      incomingMissed,
      outgoingSuccess,
      outgoingDialed,
      incomingDropped,
      outgoingDropped,
      totalDropped,
      directionData,
      incomingData,
      outgoingData,
      droppedData
    };
  }, [hourlyFilteredCalls]);

  const formatSecondsToDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const exportWorkforceSummaryCSV = () => {
    if (!selectedWorkforceTree) return;

    try {
      const flatNodes: TreeNode[] = [];
      const collectNodes = (node: TreeNode) => {
        if (!node) return;
        flatNodes.push(node);
        (node.children || []).forEach(collectNodes);
      };
      collectNodes(selectedWorkforceTree);

      const rows = [
        ["Employee Name", "Email", "Role", "Active Tracking Status", "Managers", "Direct Subordinates Count", "Own Call Count", "Total Tree Calls (Inc. Subordinates)", "Total Tree Talk Time (HH:MM:SS)"]
      ];

      flatNodes.forEach((node) => {
        const u = node.user;
        if (!u) return;
        const ownStats = userStatsMap[u.id] || { totalCalls: 0, successCalls: 0, totalTalkTime: 0 };
        const mIds = u.manager_ids || (u.manager_id ? [u.manager_id] : []);
        const managerNames = dashboard.users.filter(x => mIds.includes(x.id)).map(x => x.full_name || x.email).join("; ");

        rows.push([
          u.full_name || "",
          u.email || "",
          (u.role || "").replace("_", " "),
          u.is_tracking_active ? "Active" : "Inactive",
          managerNames || "None",
          String((node.children || []).length),
          String(ownStats.totalCalls || 0),
          String(node.totalCalls || 0),
          formatSecondsToDuration(node.totalTalkTime || 0)
        ]);
      });

      const csvString = rows.map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const fileName = `${(selectedWorkforceTree.user?.full_name || "workforce").replace(/\s+/g, "_")}_workforce_summary.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting workforce summary:", error);
    }
  };

  const exportWorkforceDetailedCallsCSV = () => {
    if (!selectedWorkforceTree) {
      alert("No employee selected");
      return;
    }

    try {
      const flatUsers: UserRecord[] = [];
      const collectUsers = (node: TreeNode) => {
        if (!node) return;
        flatUsers.push(node.user);
        (node.children || []).forEach(collectUsers);
      };
      collectUsers(selectedWorkforceTree);

      const flatUserIdsNormalized = flatUsers.map(u => String(u.id || "").trim().toLowerCase()).filter(Boolean);

      console.log("DEBUG: flatUserIdsNormalized", flatUserIdsNormalized);
      console.log("DEBUG: dashboard.report.warriors count", dashboard.report?.warriors?.length);

      const rows = [
        ["Date/Time", "Employee Name", "Email", "Role", "Phone Number", "Call Type", "Status", "Duration (Seconds)", "Duration (Formatted)"]
      ];

      let matchCount = 0;
      let callCount = 0;

      (dashboard.report?.warriors ?? []).forEach((w) => {
        const wIdNormalized = String(w.warrior_id || "").trim().toLowerCase();
        if (flatUserIdsNormalized.includes(wIdNormalized)) {
          matchCount++;
          const u = flatUsers.find(x => String(x.id || "").trim().toLowerCase() === wIdNormalized);
          if (u) {
            (w.calls || []).forEach((c: any) => {
              callCount++;
              rows.push([
                c.timestamp || "",
                u.full_name || "",
                u.email || "",
                u.role || "",
                c.phone_number || "",
                c.call_type || "",
                c.call_status || "Answered",
                String(c.duration_seconds ?? 0),
                formatSecondsToDuration(c.duration_seconds ?? 0)
              ]);
            });
          }
        }
      });

      const csvString = rows.map(e => e.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);

      const fileName = `${(selectedWorkforceTree.user?.full_name || "workforce").replace(/\s+/g, "_")}_detailed_calls.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting workforce detailed calls:", error);
    }
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = !!workforceExpandedNodes[node.user.id];
    const hasChildren = node.children.length > 0;
    const ownStats = userStatsMap[node.user.id] || { totalCalls: 0, successCalls: 0, totalTalkTime: 0 };

    const toggleExpand = () => {
      setWorkforceExpandedNodes({
        ...workforceExpandedNodes,
        [node.user.id]: !isExpanded
      });
    };

    return (
      <div key={node.user.id} className="select-none text-left">
        <div
          className="flex items-center justify-between py-2.5 px-4 hover:bg-slate-800/30 rounded-xl transition-all border border-transparent hover:border-slate-800/40 cursor-pointer"
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={hasChildren ? toggleExpand : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              {hasChildren ? (
                <span className="text-slate-400 hover:text-white transition-colors">
                  {isExpanded ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </span>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
              )}
            </div>

            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#1F8FFF]/10 to-[#8B5CF6]/10 border border-[#1F8FFF]/20 flex items-center justify-center text-[#1F8FFF] font-bold text-[10px] shrink-0">
              {node.user.full_name[0]?.toUpperCase() ?? "E"}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#F8FAFC] truncate">{node.user.full_name}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-slate-850 text-[#94A3B8] font-bold uppercase tracking-wider shrink-0">
                  {node.user.role.replace("_", " ")}
                </span>

                {node.user.role === "warrior" && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${node.user.is_tracking_active
                    ? "bg-emerald-950/30 text-emerald-450 border border-emerald-900/50"
                    : "bg-slate-900 text-slate-500 border border-slate-800"
                    }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${node.user.is_tracking_active ? "bg-emerald-500 animate-pulse" : "bg-slate-650"}`}></span>
                    {node.user.is_tracking_active ? "Tracking" : "Idle"}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 truncate">{node.user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-right font-mono text-[10px] text-slate-400 shrink-0">
            <div>
              <span className="text-slate-500 font-sans text-[8px] block uppercase font-bold tracking-wider mb-0.5">Calls (Own / Total)</span>
              <span>{ownStats.totalCalls} / <strong className="text-white">{node.totalCalls}</strong></span>
            </div>
            <div className="w-[100px]">
              <span className="text-slate-500 font-sans text-[8px] block uppercase font-bold tracking-wider mb-0.5">Total Talk Time</span>
              <span className="text-[#00E6B8] font-bold">{formatSecondsToDuration(node.totalTalkTime)}</span>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 border-l border-slate-800/50 ml-6 pl-2 space-y-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-background text-text flex overflow-hidden">
      {/* Mobile Sidebar backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-background/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar: Fixed/visible on desktop, slide-out drawer on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:translate-x-0 lg:static lg:z-auto lg:h-screen lg:shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}`}
      >
        <Sidebar
          meName={meName}
          meRole={dashboard.me?.role}
          onLogout={onLogout}
          selectedView={selectedView}
          setSelectedView={(view) => {
            setSelectedView(view);
            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              params.set("view", view);
              if (view !== "call-logs") {
                params.delete("page");
                params.delete("limit");
                params.delete("range");
                params.delete("search");
                params.delete("sortBy");
                params.delete("sortOrder");
              }
              window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
            }
          }}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Unified Header & Filter Bar */}
        <header className="min-h-16 bg-card border-b border-slate-800/40 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 shadow-md relative">
          {/* Subtle Refreshing progress bar at the very top of header */}
          {isRefreshing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-ai-accent to-highlight animate-pulse" />
          )}
          {/* Title & View Info */}
          <div className="flex items-center gap-3 shrink-0 text-left">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1.5 rounded-xl text-text-secondary hover:bg-slate-800 hover:text-text transition-all flex items-center justify-center cursor-pointer lg:hidden"
              aria-label="Open Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-3 bg-primary rounded-xs inline-block" />
                LeadLens Console
              </span>
              <h1 className="text-[22px] font-bold text-text capitalize mt-0.5">
                {selectedView === "dashboard"
                  ? "Dashboard Overview"
                  : selectedView === "users"
                    ? "Performance Metrics"
                    : selectedView === "workforce"
                      ? "Workforce Hierarchy & Registry"
                      : selectedView === "call-logs"
                        ? "Get Organization Data"
                        : "User Management Console"}
              </h1>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-950 bg-emerald-950/20 px-2 py-0.5 text-[10px] font-bold text-ai-accent ml-2 shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Live Sync
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#050816] hover:bg-slate-800 hover:border-slate-700 px-3 py-1 text-[10px] font-bold text-text-secondary hover:text-text transition-all cursor-pointer shadow-sm select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh dashboard data in-place"
            >
              <svg
                className={`w-3.5 h-3.5 text-primary transition-transform duration-500 ${
                  isRefreshing ? "animate-spin" : "hover:rotate-180"
                }`}
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
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Unified Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Quick Presets & Date Picker (Only on Dashboard Page) */}
            {selectedView === "dashboard" && (
              <>
                {/* Quick Presets Segmented Control */}
                <div className="flex bg-background rounded-full p-1 border border-slate-800/20 dark:border-slate-800/40 shrink-0">
                  {[
                    { id: "today", label: "Today" },
                    { id: "last_week", label: "7 Days" },
                    { id: "last_30_days", label: "Month" },
                    { id: "", label: "Custom" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${selectedRangePreset === preset.id
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-secondary hover:text-primary hover:bg-primary/10"
                        }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Range Picker Inline */}
                {selectedRangePreset === "" && (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 shrink-0">
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => {
                        setFilterStartDate(e.target.value);
                        setSelectedRangePreset("");
                      }}
                      className="rounded-xl border border-slate-800 bg-background px-2.5 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text w-[115px] cursor-pointer"
                    />
                    <input
                      type="time"
                      value={filterStartTime}
                      onChange={(e) => {
                        setFilterStartTime(e.target.value);
                        setSelectedRangePreset("");
                      }}
                      className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text w-[75px] cursor-pointer"
                    />
                    <span className="text-text-secondary text-[10px] font-bold uppercase">to</span>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => {
                        setFilterEndDate(e.target.value);
                        setSelectedRangePreset("");
                      }}
                      className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text w-[115px] cursor-pointer"
                    />
                    <input
                      type="time"
                      value={filterEndTime}
                      onChange={(e) => {
                        setFilterEndTime(e.target.value);
                        setSelectedRangePreset("");
                      }}
                      className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text w-[75px] cursor-pointer"
                    />
                  </div>
                )}

                {/* Subordinate Search Selector */}
                {searchableSubordinates.length > 0 && (
                  <div className="relative w-44 shrink-0">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-text-secondary">
                      <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Filter by person..."
                      value={subordinateSearchQuery}
                      onFocus={() => setIsSubordinateSearchOpen(true)}
                      onBlur={() => setTimeout(() => setIsSubordinateSearchOpen(false), 200)}
                      onChange={(e) => {
                        setSubordinateSearchQuery(e.target.value);
                        if (!e.target.value) {
                          setSelectedSubordinateId("");
                        }
                        setIsSubordinateSearchOpen(true);
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-background pl-8 pr-6 py-1 text-xs outline-none transition focus:border-primary font-semibold text-text placeholder:text-text-secondary/40"
                    />
                    {selectedSubordinateId && (
                      <button
                        onClick={() => {
                          setSelectedSubordinateId("");
                          setSubordinateSearchQuery("");
                          setIsSubordinateSearchOpen(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text text-sm cursor-pointer bg-transparent border-0 outline-none font-bold"
                      >
                        ×
                      </button>
                    )}
                    {isSubordinateSearchOpen && (
                      <div className="absolute right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-slate-800 rounded-xl shadow-xl z-50 py-1 w-52">
                        {filteredSearchableSubordinates.length === 0 ? (
                          <div className="px-3 py-2 text-[11px] text-text-secondary">No subordinates found</div>
                        ) : (
                          filteredSearchableSubordinates.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedSubordinateId(u.id);
                                setSubordinateSearchQuery(u.full_name);
                                setIsSubordinateSearchOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-slate-800/80 text-text-secondary hover:text-text transition-colors block border-none bg-transparent cursor-pointer font-medium"
                            >
                              {u.full_name} <span className="text-[9px] text-text-secondary/50 ml-1">({u.role.replace("_", " ")})</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Unified Role Filters */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <select
                    value={filteredAdminId}
                    onChange={(e) => handleFilteredAdminChange(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text max-w-[110px] cursor-pointer"
                  >
                    <option value="">All Admins</option>
                    {filteredAdminsList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>

                  <select
                    value={filteredLeaderId}
                    onChange={(e) => handleFilteredLeaderChange(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text max-w-[110px] cursor-pointer"
                  >
                    <option value="">All Leaders</option>
                    {filteredLeadersList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>

                  <select
                    value={filteredWarriorId}
                    onChange={(e) => setFilteredWarriorId(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-background px-2 py-1 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text max-w-[110px] cursor-pointer"
                  >
                    <option value="">All Warriors</option>
                    {filteredWarriorsList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>
                </div>

                {/* Reset Button */}
                {(selectedRangePreset !== "today" || selectedSubordinateId || filteredAdminId || filteredLeaderId || filteredWarriorId) && (
                  <button
                    onClick={() => {
                      const newShift = getShiftRange();
                      setFilterStartDate(formatDate(newShift.start));
                      setFilterStartTime(formatTime(newShift.start));
                      setFilterEndDate(formatDate(newShift.end));
                      setFilterEndTime(formatTime(newShift.end));
                      setSelectedRangePreset("today");
                      setSelectedSubordinateId("");
                      setSubordinateSearchQuery("");
                      handleFilteredAdminChange("");
                    }}
                    className="p-1 px-2.5 rounded-xl border border-warning/20 text-warning hover:bg-warning/10 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    title="Reset Filters"
                  >
                    Clear
                  </button>
                )}
              </>
            )}

            {/* Theme Toggle Button Switcher */}
            <button
              onClick={toggleTheme}
              className="relative w-14 h-7 rounded-full border border-slate-700/30 flex items-center justify-between px-1.5 cursor-pointer focus:outline-none transition-all hover:scale-105 duration-200 shrink-0 select-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] bg-bg-subtle hover:bg-bg-hover"
              aria-label="Toggle Theme"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {/* Sun Icon */}
              <svg className={`w-3.5 h-3.5 text-amber-500 transition-transform duration-200 ${theme === "light" ? "scale-100 rotate-0" : "scale-75 opacity-20 -rotate-45"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464-4.95a1 1 0 111.414 1.414L14.12 7.293a1 1 0 01-1.414-1.414l.828-.828zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-2.95 4.243a1 1 0 11-1.414-1.414l.828-.828a1 1 0 111.414 1.414l-.828.828zM11 17a1 1 0 11-2 0v-1a1 1 0 112 0v1zm-7.071-1.414a1 1 0 111.414-1.414l.828.828a1 1 0 11-1.414 1.414l-.828-.828zM4 11a1 1 0 100-2H3a1 1 0 100 2h1zM6.228 6.228a1 1 0 111.414-1.414l-.828-.828a1 1 0 11-1.414 1.414l.828.828z" clipRule="evenodd" />
              </svg>

              {/* Moon Icon */}
              <svg className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${theme === "dark" ? "scale-100 rotate-0" : "scale-75 opacity-20 rotate-45"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>

              {/* Sliding thumb */}
              <span className={`absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full shadow-md transition-transform duration-200 ease-out pointer-events-none ${theme === "light"
                ? "translate-x-0 bg-amber-500 shadow-amber-500/20"
                : "translate-x-[28px] bg-primary shadow-primary/20"
                }`} />
            </button>
          </div>
        </header>

        {/* View Layouts */}
        <div className={`px-6 pb-6 pt-4 flex-1 flex flex-col min-h-0 overflow-hidden ${
          isRefreshing ? "is-refreshing pointer-events-none" : ""
        }`}>
          {selectedView === "dashboard" && (
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
              {/* Left Scrollable Content Panel */}
              <div className="flex-1 space-y-6 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* Switchable Call-Type Summary Card */}
                <div className="bg-card border border-slate-800/20 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/40">
                    <div className="text-left">
                      <h3 className="text-[14px] font-black text-text uppercase tracking-[0.08em]">Overall Metrics</h3>
                      <p className="text-[12px] text-text-secondary font-normal mt-0.5">Real-time connection volume and response analytics</p>
                    </div>

                    {/* Switcher selector */}
                    <div className="flex bg-background rounded-full p-1 border border-slate-800/20 dark:border-slate-800/40 shrink-0 self-end sm:self-auto">
                      {[
                        { id: "incoming", label: "Incoming" },
                        { id: "outgoing", label: "Outgoing" },
                        { id: "missed", label: "Missed" },
                        { id: "dropped", label: "Dropped" }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setActiveSummaryCallType(type.id as any)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${activeSummaryCallType === type.id
                            ? "bg-primary text-white shadow-sm"
                            : "text-text-secondary hover:text-primary hover:bg-primary/10"
                            }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Stat Tiles */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {(() => {
                      let tiles: {
                        title: string;
                        value: string | number;
                        desc: string;
                        accentBgClass: string;
                        accentTextClass: string;
                        icon: React.ReactNode;
                      }[] = [];
                      if (activeSummaryCallType === "incoming") {
                        tiles = [
                          {
                            title: "Total Incoming",
                            value: totals.incomingCalls,
                            desc: "All call types",
                            accentBgClass: "bg-primary",
                            accentTextClass: "text-primary",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Success Incoming",
                            value: totals.incomingSuccessCalls,
                            desc: "Duration >10s",
                            accentBgClass: "bg-ai-accent",
                            accentTextClass: "text-ai-accent",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                              </svg>
                            )
                          },
                          {
                            title: "Incoming Talk Time",
                            value: totals.incomingTalkTimeFormatted,
                            desc: "(hh:mm)",
                            accentBgClass: "bg-highlight",
                            accentTextClass: "text-highlight",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5 8.25-8.25M21.75 8.25v5.258m0-5.258h-5.258" />
                              </svg>
                            )
                          },
                          {
                            title: "Avg Duration",
                            value: totals.avgTTIncomingFormatted,
                            desc: "(mm:ss)",
                            accentBgClass: "bg-amber-custom",
                            accentTextClass: "text-amber-custom",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          }
                        ];
                      } else if (activeSummaryCallType === "outgoing") {
                        tiles = [
                          {
                            title: "Total Outgoing",
                            value: totals.outgoingCalls,
                            desc: "Total Calls",
                            accentBgClass: "bg-primary",
                            accentTextClass: "text-primary",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Success Outgoing",
                            value: totals.outgoingSuccessCalls,
                            desc: "Duration >10s",
                            accentBgClass: "bg-ai-accent",
                            accentTextClass: "text-ai-accent",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                              </svg>
                            )
                          },
                          {
                            title: "Outgoing Talk Time",
                            value: totals.outgoingTalkTimeFormatted,
                            desc: "(hh:mm)",
                            accentBgClass: "bg-highlight",
                            accentTextClass: "text-highlight",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5 8.25-8.25M21.75 8.25v5.258m0-5.258h-5.258" />
                              </svg>
                            )
                          },
                          {
                            title: "Avg TT per Outgoing",
                            value: totals.avgTTOutgoingFormatted,
                            desc: "(mm:ss)",
                            accentBgClass: "bg-amber-custom",
                            accentTextClass: "text-amber-custom",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          }
                        ];
                      } else if (activeSummaryCallType === "missed") {
                        const recoveryRate = totals.totalMissed > 0 ? Math.round(((totals.totalMissed - totals.missedNotResponded) / totals.totalMissed) * 100) + "%" : "100%";
                        tiles = [
                          {
                            title: "Total Missed Calls",
                            value: totals.totalMissed,
                            desc: "incoming - success incoming",
                            accentBgClass: "bg-primary",
                            accentTextClass: "text-primary",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Missed Not Responded",
                            value: totals.missedNotResponded,
                            desc: "no follow-up outgoing call",
                            accentBgClass: "bg-ai-accent",
                            accentTextClass: "text-ai-accent",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                              </svg>
                            )
                          },
                          {
                            title: "Avg Response Time",
                            value: totals.avgResponseTimeFormatted,
                            desc: "average recovery connection gap",
                            accentBgClass: "bg-highlight",
                            accentTextClass: "text-highlight",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )
                          },
                          {
                            title: "Recovery Rate",
                            value: recoveryRate,
                            desc: "percentage of missed calls retrieved",
                            accentBgClass: "bg-amber-custom",
                            accentTextClass: "text-amber-custom",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5 8.25-8.25M21.75 8.25v5.258m0-5.258h-5.258" />
                              </svg>
                            )
                          }
                        ];
                      } else {
                        const dropRatio = totals.totalCallsDone > 0 ? Math.round((totals.droppedCalls / totals.totalCallsDone) * 100) + "%" : "0%";
                        tiles = [
                          {
                            title: "Total Dropped Calls",
                            value: totals.droppedCalls,
                            desc: "talk duration 0s to 10s",
                            accentBgClass: "bg-primary",
                            accentTextClass: "text-primary",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Incoming Dropped",
                            value: totals.incomingDroppedCalls,
                            desc: "talk time 0s to 10s",
                            accentBgClass: "bg-ai-accent",
                            accentTextClass: "text-ai-accent",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Outgoing Dropped",
                            value: totals.outgoingDroppedCalls,
                            desc: "talk time 0s to 10s",
                            accentBgClass: "bg-highlight",
                            accentTextClass: "text-highlight",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                              </svg>
                            )
                          },
                          {
                            title: "Drop Ratio",
                            value: dropRatio,
                            desc: "percentage of short calls over total",
                            accentBgClass: "bg-amber-custom",
                            accentTextClass: "text-amber-custom",
                            icon: (
                              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5 8.25-8.25M21.75 8.25v5.258m0-5.258h-5.258" />
                              </svg>
                            )
                          }
                        ];
                      }

                      return tiles.map((tile, idx) => {
                        return (
                          <div key={idx} className="bg-card metric-card-3d border border-[rgba(148,163,184,0.08)] pl-6 pr-5 py-5 rounded-xl flex flex-col justify-between items-start text-left relative h-[140px] shadow-sm cursor-default">
                            {/* Left Accent Color Stripe */}
                            <div className={`metric-card-accent-bar ${tile.accentBgClass}`} />

                            <div className="flex items-start justify-between w-full z-20">
                              <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.08em] block">{tile.title}</span>
                              <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${tile.accentTextClass}`}>
                                <span className="w-5.5 h-5.5 flex items-center justify-center">{tile.icon}</span>
                              </div>
                            </div>

                            <div className="mt-2 w-full z-20">
                              <span className="text-[28px] font-bold text-text block tracking-tight leading-none">{tile.value}</span>
                              <span className="text-[11px] text-text-secondary block mt-1.5 leading-normal font-normal">
                                {tile.desc}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Donut Charts card (Call Ratio & Recovery Analytics) */}
                <div className="bg-card border border-slate-800/20 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-[14px] font-black text-text uppercase tracking-[0.08em]">Call Ratio & Recovery Analytics</h3>
                    <p className="text-[12px] text-text-secondary font-normal mt-0.5">Interactive ratio and recovery analytics breakdown</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-5 flex-grow">
                      {/* Left column: Direction Mix */}
                      <div className="flex items-center gap-6 justify-center bg-background/20 border border-slate-800/10 rounded-xl p-4 w-full metric-card-3d cursor-default">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2">Direction Mix</span>
                          <div className="h-[180px] w-[180px] relative shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={directionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={68}
                                  paddingAngle={3}
                                  dataKey="value"
                                  activeShape={renderActiveShape}
                                  onMouseEnter={(_, index) => setHoveredDirectionIndex(index)}
                                  onMouseLeave={() => setHoveredDirectionIndex(null)}
                                >
                                  <Cell fill="#1F8FFF" opacity={hoveredDirectionIndex === null || hoveredDirectionIndex === 0 ? 1 : 0.45} className="transition-all duration-200" />
                                  <Cell fill="#8B5CF6" opacity={hoveredDirectionIndex === null || hoveredDirectionIndex === 1 ? 1 : 0.45} className="transition-all duration-200" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                              <span className="text-[28px] font-bold text-text leading-none transition-all duration-200">
                                {hoveredDirectionIndex === 0
                                  ? totals.incomingCalls
                                  : hoveredDirectionIndex === 1
                                    ? totals.outgoingCalls
                                    : totals.totalCallsDone}
                              </span>
                              <span className="text-[12px] font-semibold text-text-secondary uppercase mt-1.5 transition-all duration-200 tracking-[0.06em]">
                                {hoveredDirectionIndex === 0
                                  ? "Incoming"
                                  : hoveredDirectionIndex === 1
                                    ? "Outgoing"
                                    : "Total"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direction Mix Legends */}
                        <div className="flex flex-col gap-2 text-xs font-semibold select-none flex-1 max-w-[200px]">
                          <div
                            onMouseEnter={() => setHoveredDirectionIndex(0)}
                            onMouseLeave={() => setHoveredDirectionIndex(null)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${hoveredDirectionIndex === 0 ? "bg-primary/10 border border-primary/20 scale-[1.03]" : "border border-transparent"}`}
                          >
                            <div className="flex items-center gap-2 text-text-secondary"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Incoming</div>
                            <span className="font-bold text-text">{totals.incomingCalls} ({totals.totalCallsDone > 0 ? Math.round(totals.incomingCalls / totals.totalCallsDone * 100) : 0}%)</span>
                          </div>
                          <div
                            onMouseEnter={() => setHoveredDirectionIndex(1)}
                            onMouseLeave={() => setHoveredDirectionIndex(null)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${hoveredDirectionIndex === 1 ? "bg-highlight/10 border border-highlight/20 scale-[1.03]" : "border border-transparent"}`}
                          >
                            <div className="flex items-center gap-2 text-text-secondary"><span className="w-2.5 h-2.5 rounded-full bg-highlight" /> Outgoing</div>
                            <span className="font-bold text-text">{totals.outgoingCalls} ({totals.totalCallsDone > 0 ? Math.round(totals.outgoingCalls / totals.totalCallsDone * 100) : 0}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Right column: Lead Recovery */}
                      <div className="flex items-center gap-6 justify-center bg-background/20 border border-slate-800/10 rounded-xl p-4 w-full metric-card-3d cursor-default">
                        <div className="flex flex-col items-center shrink-0">
                          <span className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider mb-2">Lead Recovery</span>
                          <div className="h-[180px] w-[180px] relative shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={recoveryData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={68}
                                  paddingAngle={3}
                                  dataKey="value"
                                  activeShape={renderActiveShape}
                                  onMouseEnter={(_, index) => setHoveredRecoveryIndex(index)}
                                  onMouseLeave={() => setHoveredRecoveryIndex(null)}
                                >
                                  <Cell fill="#00E6B8" opacity={hoveredRecoveryIndex === null || hoveredRecoveryIndex === 0 ? 1 : 0.45} className="transition-all duration-200" />
                                  <Cell fill="#F43F5E" opacity={hoveredRecoveryIndex === null || hoveredRecoveryIndex === 1 ? 1 : 0.45} className="transition-all duration-200" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                              <span className="text-[28px] font-bold text-text leading-none transition-all duration-200">
                                {hoveredRecoveryIndex === 0
                                  ? Math.max(0, totals.totalMissed - totals.missedNotResponded)
                                  : hoveredRecoveryIndex === 1
                                    ? totals.missedNotResponded
                                    : totals.totalMissed}
                              </span>
                              <span className="text-[12px] font-semibold text-text-secondary uppercase mt-1.5 transition-all duration-200 tracking-[0.06em]">
                                {hoveredRecoveryIndex === 0
                                  ? "Responded"
                                  : hoveredRecoveryIndex === 1
                                    ? "Unresponded"
                                    : "Missed"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lead Recovery Legends */}
                        <div className="flex flex-col gap-2 text-xs font-semibold select-none flex-1 max-w-[200px]">
                          <div
                            onMouseEnter={() => setHoveredRecoveryIndex(0)}
                            onMouseLeave={() => setHoveredRecoveryIndex(null)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${hoveredRecoveryIndex === 0 ? "bg-ai-accent/10 border border-ai-accent/20 scale-[1.03]" : "border border-transparent"}`}
                          >
                            <div className="flex items-center gap-2 text-text-secondary"><span className="w-2.5 h-2.5 rounded-full bg-ai-accent" /> Responded</div>
                            <span className="font-bold text-text">{Math.max(0, totals.totalMissed - totals.missedNotResponded)} ({totals.totalMissed > 0 ? Math.round(Math.max(0, totals.totalMissed - totals.missedNotResponded) / totals.totalMissed * 100) : 0}%)</span>
                          </div>
                          <div
                            onMouseEnter={() => setHoveredRecoveryIndex(1)}
                            onMouseLeave={() => setHoveredRecoveryIndex(null)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${hoveredRecoveryIndex === 1 ? "bg-warning/10 border border-warning/20 scale-[1.03]" : "border border-transparent"}`}
                          >
                            <div className="flex items-center gap-2 text-text-secondary">
                              <span className="relative flex h-3 w-3 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-90 scale-150"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-warning shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                              </span>
                              Unresponded
                            </div>
                            <span className="font-bold text-text">{totals.missedNotResponded} ({totals.totalMissed > 0 ? Math.round(totals.missedNotResponded / totals.totalMissed * 100) : 0}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts & Analytics */}
                <div className="flex flex-col lg:flex-row gap-5 items-stretch w-full min-h-[380px] max-h-[460px] mb-6">
                  {/* Outcome Comparison Bar Chart */}
                  <div className="flex-1 bg-card border border-slate-800/20 rounded-2xl pt-5 px-5 pb-4 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col gap-1 pb-2 border-b border-slate-800/40">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <h3 className="text-[14px] font-black text-text uppercase tracking-[0.08em]">Call Outcome Comparison</h3>
                          <p className="text-[11px] text-text-secondary font-normal leading-tight mt-0.5">Outcome distribution metrics per call category type</p>
                        </div>
                        <select
                          value={selectedComparisonCategory}
                          onChange={(e) => setSelectedComparisonCategory(e.target.value)}
                          className="rounded-full border border-primary bg-card px-3 py-1 text-[11px] outline-none hover:border-primary/80 focus:border-primary font-semibold text-text cursor-pointer select-none shadow-sm transition-all shrink-0"
                        >
                          <option value="Overall">Overall</option>
                          <option value="Incoming">Incoming</option>
                          <option value="Outgoing">Outgoing</option>
                          <option value="Missed">Missed</option>
                          <option value="Dropped">Dropped</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex-grow w-full text-[10px] mt-3 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeComparisonBarData} margin={{ top: 10, right: 0, left: -25, bottom: 32 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis
                            dataKey="name"
                            stroke="var(--chart-label)"
                            tickLine={false}
                            interval={0}
                            height={32}
                            tick={<CustomXAxisTick />}
                          />
                          <YAxis stroke="var(--chart-label)" fontSize={11} tickLine={false} domain={[0, (dataMax: number) => dataMax === 0 ? 10 : Math.ceil(dataMax * 1.15)]} />
                          <ChartTooltip
                            contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border-custom)', fontSize: '13px', color: 'var(--text)' }}
                            itemStyle={{ color: 'var(--text)' }}
                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                            formatter={(val) => [`${val} calls`, 'Value']}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
                            {activeComparisonBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="value" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '11px', fill: 'var(--text)', fontWeight: '600' }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Hourly Call Distribution Area Chart */}
                  <div className="flex-1 bg-card border border-slate-800/20 rounded-2xl pt-5 px-5 pb-4 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col gap-2 pb-2 border-b border-slate-800/40">
                      {/* Row 1: Title & Annotation */}
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-[14px] font-black text-text uppercase tracking-[0.08em] whitespace-nowrap">Hourly Call Distribution</h3>

                        {/* Axis Label Indicators */}
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/20 dark:border-slate-800/40 bg-slate-100/60 dark:bg-[#050816]/50 px-2.5 py-0.5 text-[10px] font-bold text-text-secondary select-none shrink-0">
                          <span className="text-primary font-black">Y:</span> Calls
                          <span className="text-highlight font-black ml-1">X:</span> {
                            selectedRangePreset === "today"
                              ? "Time (15m)"
                              : selectedRangePreset === "last_week"
                                ? "Day of Week"
                                : selectedRangePreset === "last_30_days"
                                  ? "Date"
                                  : "Time (Hour)"
                          }
                        </div>
                      </div>

                      {/* Row 2: Subtitle & Segmented Selectors */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full">
                        <p className="text-[11px] text-text-secondary font-normal leading-tight text-left">
                          Analysis of hourly peak activity across categories
                        </p>

                        <div className="flex bg-background rounded-full p-0.5 border border-slate-800/20 dark:border-slate-800/40 text-[10px] overflow-x-auto whitespace-nowrap no-scrollbar max-w-full shrink-0">
                          {["Overall", "Incoming", "Outgoing", "Missed", "Dropped"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setChartCallType(type as any)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all cursor-pointer select-none ${chartCallType === type
                                ? "bg-primary text-white shadow-sm"
                                : "text-text-secondary hover:text-primary hover:bg-primary/10"
                                }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow w-full text-[10px] mt-3 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyDistributionData} margin={{ top: 15, right: 15, left: -15, bottom: 0 }}>
                          <defs>
                            <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1F8FFF" stopOpacity={0.22} />
                              <stop offset="95%" stopColor="#1F8FFF" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                          <XAxis dataKey="hourStr" stroke="var(--chart-label)" fontSize={11} tickLine={false} interval="preserveStartEnd" />
                          <YAxis stroke="var(--chart-label)" fontSize={11} tickLine={false} />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: 'var(--card)',
                              borderRadius: '12px',
                              border: '1px solid var(--border-custom)',
                              fontSize: '13px',
                              color: 'var(--text)'
                            }}
                            itemStyle={{ color: 'var(--text)' }}
                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}
                            labelFormatter={(label) => {
                              if (selectedRangePreset === "today" && typeof label === "string") {
                                return getPrevious15MinInterval(label);
                              }
                              return label;
                            }}
                            cursor={{ stroke: 'rgba(31, 206, 230, 0.2)', strokeWidth: 32 }}
                          />
                          <Area
                            type="monotone"
                            dataKey={
                              chartCallType === "Overall" ? "Total" :
                                chartCallType === "Incoming" ? "Incoming" :
                                  chartCallType === "Outgoing" ? "Outgoing" :
                                    chartCallType === "Missed" ? "Missed" : "Dropped"
                            }
                            stroke="#1F8FFF"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#heroAreaGrad)"
                            name="Call"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Dynamic Analysis & Top Performers Panel */}
                <div className="bg-card border border-slate-800/20 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-[14px] font-black text-text uppercase tracking-[0.08em]">Performance Analytics & Insights</h3>
                    <p className="text-[12px] text-text-secondary font-normal mt-0.5">Dynamic performance charts and telemetry-derived insights based on filters</p>
                  </div>

                  <div className={`grid gap-6 ${filteredWarriorId ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                    {/* Left Column: Visualizer Chart / Ranked Table */}
                    <div className="bg-background/40 border border-slate-800/40 rounded-xl p-5 flex flex-col min-h-[300px]">
                      <div className="border-b border-slate-800/40 pb-2 mb-3 text-left">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest block">
                          {filteredWarriorId
                            ? "Call Metric Breakdown"
                            : filteredLeaderId
                              ? "Team Member Comparison"
                              : filteredAdminId
                                ? "Leaders Under Admin"
                                : "Top Performers (by Total Calls)"}
                        </span>
                      </div>

                      {filteredWarriorId ? (
                        <div className="h-56 mt-2 text-[9px] font-semibold">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredVisualizationData as any} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                              <XAxis dataKey="name" stroke="var(--chart-label)" />
                              <YAxis stroke="var(--chart-label)" />
                              <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-custom)', color: 'var(--text)', fontSize: '10px' }} />
                              <Bar dataKey="value" fill="#1F8FFF" radius={[4, 4, 0, 0]} maxBarSize={30}>
                                <LabelList dataKey="value" position="top" style={{ fontSize: '8px', fill: '#94a3b8', fontWeight: 'bold' }} />
                                {filteredVisualizationData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill || "#1F8FFF"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : filteredLeaderId || filteredAdminId ? (
                        <div className="h-56 mt-2 text-[9px] font-semibold">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredVisualizationData as any} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                              <XAxis dataKey="name" stroke="var(--chart-label)" />
                              <YAxis stroke="var(--chart-label)" />
                              <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-custom)', color: 'var(--text)', fontSize: '10px' }} />
                              <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#94A3B8' }} />
                              <Bar dataKey="Total Calls" fill="#1F8FFF" radius={[3, 3, 0, 0]} maxBarSize={20}>
                                <LabelList dataKey="Total Calls" position="top" style={{ fontSize: '7px', fill: '#1F8FFF', fontWeight: 'bold' }} />
                              </Bar>
                              {filteredLeaderId ? (
                                <Bar dataKey="Success Calls" fill="#00E6B8" radius={[3, 3, 0, 0]} maxBarSize={20}>
                                  <LabelList dataKey="Success Calls" position="top" style={{ fontSize: '7px', fill: '#00E6B8', fontWeight: 'bold' }} />
                                </Bar>
                              ) : (
                                <Bar dataKey="Calling Hours" fill="#8B5CF6" radius={[3, 3, 0, 0]} maxBarSize={20}>
                                  <LabelList dataKey="Calling Hours" position="top" style={{ fontSize: '7px', fill: '#8B5CF6', fontWeight: 'bold' }} />
                                </Bar>
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col justify-start max-h-[260px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-semibold border-collapse">
                              <thead>
                                <tr className="sticky top-0 bg-[#0E1528] z-10 border-b border-slate-800/40 text-text-secondary text-[12px] uppercase tracking-[0.1em] font-bold h-[52px]">
                                  <th className="px-4 py-3 font-bold bg-[#0E1528] uppercase text-left">  Agents</th>
                                  <th className="px-4 py-3 text-right font-bold bg-[#0E1528] uppercase">Calls</th>
                                  <th className="px-4 py-3 text-right font-bold bg-[#0E1528] uppercase">Talk
                                    (hh:mm)</th>
                                  <th className="px-4 py-3 text-right font-bold pr-4 bg-[#0E1528] uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/30 text-text">
                                {topPerformers.map((agent) => (
                                  <tr key={agent.id} className="hover:bg-slate-800/20 transition-colors h-[52px]">
                                    <td className="px-4 py-2 flex items-center gap-2.5">
                                      <span className="text-[11px] font-bold text-text-secondary w-4 shrink-0 text-center">{agent.rank}</span>
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${agent.isTrackingActive ? "bg-ai-accent animate-pulse shadow-[0_0_6px_#00E6B8]" : "bg-slate-650"}`} />
                                      <span className="font-medium text-[13px] text-text truncate max-w-[150px]" title={agent.name}>{agent.name}</span>
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-[13px] text-text">{agent.calls} calls</td>
                                    <td className="px-4 py-2 text-right font-medium text-[13px] text-text-secondary">{agent.hours}</td>
                                    <td className="px-4 py-2 text-right font-medium text-[13px] pr-4">
                                      <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] ${agent.isTrackingActive
                                        ? "bg-emerald-950/20 text-ai-accent"
                                        : "bg-slate-900 text-text-secondary/70"
                                        }`}>
                                        {agent.isTrackingActive ? "Active" : "Offline"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Middle Column (Only for selected warrior): Hour-wise distribution */}
                    {filteredWarriorId && (
                      <div className="bg-background/40 border border-slate-800/40 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                        <div className="border-b border-slate-800/40 pb-2 mb-3 text-left">
                          <span className="text-[10px] font-black text-highlight uppercase tracking-widest block">Hour-wise Call Distribution</span>
                        </div>
                        <div className="h-56 mt-2 text-[9px] font-semibold">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={warriorHourlyData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                              <XAxis dataKey="hourStr" stroke="var(--chart-label)" />
                              <YAxis stroke="var(--chart-label)" />
                              <ChartTooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border-custom)', color: 'var(--text)', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="Calls" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)">
                                <LabelList dataKey="Calls" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '8px', fill: '#8B5CF6', fontWeight: 'bold' }} />
                              </Area>
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Right Column: AI Analytical Insights */}
                    <div className="bg-background/40 border border-slate-800/40 rounded-xl p-5 flex flex-col justify-between min-h-[300px]">
                      <div>
                        <div className="flex items-center gap-1.5 border-b border-slate-800/40 pb-2 mb-3">
                          <svg className="w-4 h-4 text-ai-accent" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <span className="text-[10px] font-black text-ai-accent uppercase tracking-widest">{filteredInsights.title}</span>
                        </div>
                        {(() => {
                          const warnings = filteredInsights.insights.filter(insight => insight.toLowerCase().includes("warning"));
                          if (warnings.length === 0) return null;
                          return warnings.map((warning, index) => (
                            <div key={`warn-${index}`} className="mb-3.5 bg-warning/10 border border-warning/20 text-warning px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 select-none text-left">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
                              </span>
                              <span className="animate-pulse">{warning.toUpperCase()}</span>
                            </div>
                          ));
                        })()}

                        <div className="space-y-2.5 mt-3">
                          {(() => {
                            const regularInsights = filteredInsights.insights.filter(insight => !insight.toLowerCase().includes("warning"));
                            return regularInsights.map((insight, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[13px] leading-relaxed text-text-secondary font-normal text-left">
                                <span className="text-ai-accent mt-1 select-none shrink-0">✦</span>
                                <span>{highlightInsightNumbers(insight)}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      <div className="text-[9px] text-text-secondary/60 font-bold mt-4 uppercase border-t border-slate-850 pt-3 flex items-center justify-between">
                        <span>Generated from Live Telemetry</span>
                        <span className="text-ai-accent flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Real-time
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right-Hand Vertical Status Rail */}
              <div className="w-full lg:w-24 shrink-0 bg-card border border-slate-800/20 lg:border-0 lg:border-l lg:border-slate-800/40 rounded-2xl lg:rounded-none p-4 lg:py-4 lg:px-4 flex flex-row lg:flex-col items-center justify-between lg:justify-start gap-4 lg:gap-6 lg:h-full lg:overflow-y-auto scrollbar-none">
                <VerticalRailBadge
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a12.035 12.035 0 01-7.108-7.108c-.155-.44.01-1.274.387-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  }
                  accentColor="#1F8FFF"
                  value={totals.totalCallsDone}
                  label="Total Calls"
                />

                <VerticalRailBadge
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  accentColor="#00E6B8"
                  value={totals.totalTalkTimeFormatted}
                  label="Talk Time"
                />

                <VerticalRailBadge
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                    </svg>
                  }
                  accentColor="#8B5CF6"
                  value={totals.avgTTCallFormatted}
                  label="Avg/Call"
                />

                <VerticalRailBadge
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  }
                  accentColor="#1F8FFF"
                  value={`${overallTotals.trackingOn}/${overallTotals.employees}`}
                  label="Tracked"
                />
              </div>
            </div>
          )}

          {selectedView === "call-logs" && dashboard.me?.role === "super_admin" && (
            <CallLogsPage />
          )}

          {selectedView === "users" && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col gap-0.5 text-left">
                <h2 className="text-lg font-bold text-text">Members & Employee Registry</h2>
                <p className="text-xs text-text-secondary font-semibold">Manage system registry requirements and review employee records.</p>
              </div>
              <RoleTable
                users={dashboard.users}
                employees={dashboard.employees}
                onToggleTrackingNeeded={onToggleTrackingNeeded}
                report={dashboard.report}
              />
            </div>
          )}

          {selectedView === "user-management" && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col gap-0.5 text-left">
                  <h2 className="text-lg font-bold text-text">User Management Console</h2>
                  <p className="text-xs text-text-secondary font-semibold">
                    Administer user roles, modify reporting structures, enable/disable tracking (Super Admin only), and remove records.
                  </p>
                </div>
                {/* Search Box */}
                <div className="relative w-full md:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search people by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-background text-xs outline-none transition focus:border-primary font-semibold text-text placeholder:text-text-secondary/50"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="bg-card border border-slate-800/40 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                  <table className="w-full divide-y divide-slate-800/35 text-left text-xs font-semibold border-collapse">
                    <thead className="text-text-secondary uppercase tracking-wider font-bold bg-card sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
                      <tr>
                        <th className="px-4 py-3 bg-card">USER NAME</th>
                        <th className="px-4 py-3 bg-card">EMAIL</th>
                        <th className="px-4 py-3 bg-card text-center min-w-[120px] whitespace-nowrap">ROLE</th>
                        <th className="px-4 py-3 bg-card text-center">REPORTING TO</th>
                        <th className="px-4 py-3 bg-card text-center">MANAGER EMAIL</th>
                        <th className="px-4 py-3 bg-card text-center">SYSTEM ID</th>
                        <th className="px-4 py-3 bg-card text-center">CALL TRACKING</th>
                        <th className="px-4 py-3 bg-card text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/35 bg-card">
                      {filteredUsersList.map((user) => {
                        const mIds = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
                        const directManagers = dashboard.users.filter(u => mIds.includes(u.id));
                        const canEditOrDelete = canManageUser(user) && user.id !== dashboard.me?.id;
                        const isSuperAdmin = dashboard.me?.role === "super_admin";

                        return (
                          <tr key={user.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-text text-xs">{user.full_name}</div>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {!user.is_active && (
                                  <span className="inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 py-0.2 text-[8px] font-bold text-warning border border-warning/20">
                                    Inactive
                                  </span>
                                )}
                                {!user.is_approved && (
                                  <span className="inline-flex items-center gap-1 rounded bg-highlight/10 px-1.5 py-0.2 text-[8px] font-bold text-highlight border border-highlight/20">
                                    Pending Approval
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-text-secondary font-semibold">
                              {user.email}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap ${user.role === "super_admin"
                                ? "bg-highlight/10 text-highlight border border-highlight/20"
                                : user.role === "admin"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : user.role === "group_leader"
                                    ? "bg-ai-accent/10 text-ai-accent border border-ai-accent/20"
                                    : "bg-slate-800/40 text-text-secondary border border-slate-700/50"
                                }`}>
                                {user.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-text font-bold">
                              {directManagers.length > 0 ? (
                                directManagers.map(m => m.full_name).join(", ")
                              ) : (
                                <span className="text-text-secondary/40 font-normal">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-text-secondary font-semibold">
                              {directManagers.length > 0 ? (
                                directManagers.map(m => m.email).join(", ")
                              ) : (
                                <span className="text-text-secondary/40 font-normal">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-[11px] text-text font-bold">
                              {user.system_id || <span className="text-text-secondary/40 font-normal">-</span>}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                disabled={!isSuperAdmin}
                                onClick={() => handleToggleUserTrackingState(user)}
                                className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${user.is_tracking_enabled
                                  ? "bg-primary/10 text-primary border-primary/20 " + (isSuperAdmin ? "hover:bg-primary/20" : "opacity-80 cursor-not-allowed")
                                  : "bg-background text-text-secondary border-slate-800 " + (isSuperAdmin ? "hover:bg-slate-800/40" : "opacity-60 cursor-not-allowed")
                                  }`}
                              >
                                {user.is_tracking_enabled ? "Enabled" : "Disabled"}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canEditOrDelete ? (
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditModal(user)}
                                    className="px-2.5 py-0.5 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[9px] font-bold transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(user)}
                                    className="px-2.5 py-0.5 rounded border border-warning/20 bg-background hover:bg-warning/10 text-warning text-[9px] font-bold transition-all cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <span className="text-text-secondary/45 italic text-[10px]">No Access</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedView === "workforce" && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* View Header */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between text-left">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold text-text">Workforce Hierarchy & Registry</h2>
                  <p className="text-xs text-text-secondary font-semibold">
                    Select any manager or employee to view their reporting subordinates tree and download call summaries.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!selectedWorkforceTree}
                    onClick={exportWorkforceSummaryCSV}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 disabled:opacity-40 text-xs font-bold transition-all text-text flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                    </svg>
                    Export Tree Summary
                  </button>

                  <button
                    disabled={!selectedWorkforceTree}
                    onClick={exportWorkforceDetailedCallsCSV}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-highlight hover:opacity-90 disabled:opacity-40 text-xs font-bold transition-all text-text flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export Detailed Calls
                  </button>
                </div>
              </div>

              {/* Selector Bar */}
              <div className="bg-card border border-slate-800/20 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col text-left w-full md:w-auto">
                  <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Select Employee</span>
                  <span className="text-xs text-text-secondary font-semibold">Choose any operator to build their organization reporting structure</span>
                </div>
                <div className="w-full md:w-80 relative">
                  {(() => {
                    const selectedEmployee = dashboard.users.find(u => u.id === selectedWorkforceUserId);
                    return (
                      <>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={selectedEmployee ? `${selectedEmployee.full_name} (${selectedEmployee.role.replace("_", " ")})` : "Search Employee..."}
                            value={workforceSearchQuery}
                            onChange={(e) => {
                              setWorkforceSearchQuery(e.target.value);
                              setIsWorkforceSearchOpen(true);
                            }}
                            onFocus={() => setIsWorkforceSearchOpen(true)}
                            className="rounded-xl border border-slate-800 bg-background pl-3.5 pr-10 py-2.5 text-xs outline-none hover:border-slate-700 focus:border-primary font-semibold text-text w-full placeholder-text-secondary animate-all duration-200"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-secondary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>

                        {isWorkforceSearchOpen && (
                          <>
                            {/* Click outside backdrop close layer */}
                            <div className="fixed inset-0 z-30" onClick={() => setIsWorkforceSearchOpen(false)} />

                            {/* Dropdown list container */}
                            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-card border border-slate-800 rounded-xl shadow-xl z-45 p-1 flex flex-col gap-0.5 divide-y divide-slate-800/10">
                              {(() => {
                                const filtered = dashboard.users.filter((u) =>
                                  u.full_name.toLowerCase().includes(workforceSearchQuery.toLowerCase()) ||
                                  u.role.replace("_", " ").toLowerCase().includes(workforceSearchQuery.toLowerCase())
                                );

                                if (filtered.length === 0) {
                                  return <div className="text-[10px] text-text-secondary font-bold text-center py-4">No employees match your search</div>;
                                }

                                return filtered.map((u) => (
                                  <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedWorkforceUserId(u.id);
                                      setWorkforceSearchQuery("");
                                      setIsWorkforceSearchOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-between ${selectedWorkforceUserId === u.id
                                      ? "bg-primary/10 text-primary"
                                      : "text-text hover:bg-slate-850 hover:text-white"
                                      }`}
                                  >
                                    <span>{u.full_name}</span>
                                    <span className="text-[9px] uppercase font-black tracking-widest text-text-secondary">{u.role.replace("_", " ")}</span>
                                  </button>
                                ));
                              })()}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Tree View Panel */}
              <div className="bg-card border border-slate-800/20 rounded-2xl p-5 shadow-xs flex-1 overflow-y-auto min-h-0 flex flex-col">
                {selectedWorkforceTree ? (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {renderTreeNode(selectedWorkforceTree)}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-text-secondary py-10 space-y-2">
                    <svg className="w-10 h-10 text-slate-800" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <p className="text-xs font-semibold">Select an employee from the search bar above to display the workforce tree.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border border-slate-800/40 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left text-text">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between bg-background/30">
              <div>
                <h3 className="text-sm font-black text-primary uppercase tracking-wider">EDIT USER HIERARCHY</h3>
                <div className="text-xs text-text-secondary font-semibold mt-0.5">
                  Modifying Profile of {editingUser.full_name}
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-text-secondary hover:bg-slate-800 hover:text-text transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl text-xs font-semibold text-left">
                  {actionError}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-text-secondary font-bold uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-background px-3.5 py-2.5 text-xs outline-none transition focus:border-primary font-semibold text-text"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-text-secondary font-bold uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-background px-3.5 py-2.5 text-xs outline-none transition focus:border-primary font-semibold text-text"
                />
              </div>

              {/* System ID */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-text-secondary font-bold uppercase mb-1">System ID</label>
                <input
                  type="text"
                  placeholder="None"
                  value={editFormData.system_id}
                  onChange={(e) => setEditFormData({ ...editFormData, system_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-background px-3.5 py-2.5 text-xs outline-none transition focus:border-primary font-semibold text-text"
                />
              </div>

              {/* Role */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-text-secondary font-bold uppercase mb-1">Role Hierarchy</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-800 bg-background px-3.5 py-2.5 text-xs outline-none transition focus:border-primary font-semibold text-text cursor-pointer"
                >
                  {dashboard.me?.role === "super_admin" && (
                    <>
                      <option value="super_admin">Super Admin (Level 4)</option>
                      <option value="admin">Admin (Level 3)</option>
                    </>
                  )}
                  <option value="group_leader">Group Leader (Level 2)</option>
                  <option value="warrior">Warrior (Level 1)</option>
                </select>
              </div>

              {/* Manager Assignment */}
              {editFormData.role !== "super_admin" && (() => {
                const availableManagers = dashboard.users.filter(
                  (u) => u.id !== editingUser.id && getRoleLevel(u.role) > getRoleLevel(editFormData.role)
                );
                const filteredManagers = availableManagers.filter((u) => {
                  if (!managerSearchQuery) return true;
                  const q = managerSearchQuery.toLowerCase();
                  return (
                    (u.full_name && u.full_name.toLowerCase().includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q))
                  );
                });

                return (
                  <div className="flex flex-col text-left">
                    <label className="text-[10px] text-text-secondary font-bold uppercase mb-1">Assign Managers (Multiple Allowed)</label>
                    {availableManagers.length > 0 && (
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Search managers..."
                          value={managerSearchQuery}
                          onChange={(e) => setManagerSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-background px-3 py-1.5 text-xs outline-none transition focus:border-primary font-semibold text-text placeholder-slate-650"
                        />
                      </div>
                    )}
                    <div className="border border-slate-800 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-2 bg-background">
                      {availableManagers.length === 0 ? (
                        <div className="text-[11px] text-text-secondary font-medium">No higher-ranking managers available</div>
                      ) : filteredManagers.length === 0 ? (
                        <div className="text-[11px] text-text-secondary font-medium">No matching managers found</div>
                      ) : (
                        filteredManagers.map((mgr) => {
                          const isChecked = editFormData.manager_ids.includes(mgr.id);
                          return (
                            <label key={mgr.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-800/40 p-1.5 rounded-lg transition-colors">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let newIds = [...editFormData.manager_ids];
                                  if (e.target.checked) {
                                    newIds.push(mgr.id);
                                  } else {
                                    newIds = newIds.filter((id) => id !== mgr.id);
                                  }
                                  setEditFormData({ ...editFormData, manager_ids: newIds });
                                }}
                                className="h-4 w-4 rounded border-slate-800 text-primary focus:ring-primary cursor-pointer"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-text leading-tight">{mgr.full_name}</span>
                                <span className="text-[9px] font-black uppercase text-ai-accent mt-0.5">{mgr.role.replace("_", " ")}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Status Flags */}
              <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
                <span className="text-xs font-bold text-text-secondary">Account Approved</span>
                <input
                  type="checkbox"
                  checked={editFormData.is_approved}
                  onChange={(e) => setEditFormData({ ...editFormData, is_approved: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-800 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary">Account Active</span>
                <input
                  type="checkbox"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-800 text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/40 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-secondary">Tracking Needed</span>
                  {dashboard.me?.role !== "super_admin" && (
                    <span className="text-[10px] text-text-secondary font-semibold">(Super Admin access only)</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  disabled={dashboard.me?.role !== "super_admin"}
                  checked={editFormData.is_tracking_needed}
                  onChange={(e) => setEditFormData({ ...editFormData, is_tracking_needed: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-800 text-primary focus:ring-primary disabled:opacity-50 cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800/40 bg-background/30 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-background hover:bg-slate-800 text-text-secondary text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-highlight text-text text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && isDeletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border border-slate-800/40 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-left text-text">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/40 flex items-center justify-between bg-background/30">
              <h3 className="text-sm font-black text-warning uppercase tracking-wider">DELETE USER RECORD</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 rounded-xl text-text-secondary hover:bg-slate-850 hover:text-text transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3">
              {actionError && (
                <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl text-xs font-semibold">
                  {actionError}
                </div>
              )}
              <p className="text-xs text-text-secondary text-left leading-relaxed font-semibold">
                Are you absolutely sure you want to permanently delete user <b className="text-text">{isDeletingUser.full_name}</b>? This action is irreversible and will remove all call statistics association.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800/40 bg-background/30 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-background hover:bg-slate-800 text-text-secondary text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-warning hover:bg-rose-700 text-text text-xs font-bold transition-all cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}