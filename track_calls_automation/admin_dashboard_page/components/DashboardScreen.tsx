import { useState, useMemo } from "react";
import type { DashboardState, UserRecord, EmployeeRecord, ReportResponse } from "./types";
import Sidebar from "./Sidebar";
import MetricCard from "./MetricCard";
import RoleTable from "./RoleTable";
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

function CompactMetricCard({ title, value, note, textColor = "text-[#04693F]", borderColor = "bg-[#04693F]" }: { title: string; value: string | number; note: string; textColor?: string; borderColor?: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-2.5 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden group flex flex-col justify-between h-20 min-w-[160px] flex-1">
      {/* Small top border line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${borderColor}`} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</span>
      </div>

      <div className="mt-0.5">
        <span className={`text-lg font-black ${textColor}`}>
          {value}
        </span>
      </div>

      <div className="mt-0.5 text-[9px] text-slate-400 font-semibold leading-tight line-clamp-1">
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
                className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${value === ""
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
                    className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold transition-all truncate ${value === opt.id
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
  onUpdateUser?: (userId: string, data: any) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onToggleUserTracking?: (userId: string, enabled: boolean) => Promise<void>;
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
  let allCalls = reportWarriors.flatMap(w => w.calls ?? []);

  // Filter by date-time if provided
  if (startDateTime || endDateTime) {
    allCalls = allCalls.filter(c => {
      const callDate = parseDbTimestamp(c.timestamp);
      if (!callDate) return false;
      if (startDateTime && callDate < startDateTime) return false;
      if (endDateTime && callDate > endDateTime) return false;
      return true;
    });
  }

  // Metric counters
  let totalCallsDone = allCalls.length;
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

  const missedCallsList: typeof allCalls = [];

  allCalls.forEach((c) => {
    const type = (c.call_type || "").toLowerCase();
    const status = (c.call_status || "").toLowerCase();
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
    }

    // Add to overall talk time only if it is not a failed/missed call
    if (duration > 0 && !isMissed && status !== "failed") {
      totalTalkSeconds += duration;
    }
  });

  // Total Missed Calls = Total incoming calls - Total success incoming calls
  const totalMissed = Math.max(0, incomingCalls - incomingSuccessCalls);

  // Calculate missed call response details:
  let totalResponseSeconds = 0;
  let respondedMissedCallsCount = 0;

  missedCallsList.forEach((mc) => {
    const mcTime = parseDbTimestamp(mc.timestamp);
    if (!mcTime) {
      return;
    }

    // Find first subsequent outgoing call to the same phone number
    const subsequentOutgoing = allCalls
      .filter(c => {
        if ((c.call_type || "").toLowerCase() !== "outgoing") return false;
        if (c.phone_number !== mc.phone_number) return false;
        const cTime = parseDbTimestamp(c.timestamp);
        return cTime && cTime > mcTime;
      })
      .sort((a, b) => {
        const timeA = parseDbTimestamp(a.timestamp);
        const timeB = parseDbTimestamp(b.timestamp);
        return (timeA?.getTime() ?? 0) - (timeB?.getTime() ?? 0);
      });

    if (subsequentOutgoing.length > 0) {
      const firstOutTime = parseDbTimestamp(subsequentOutgoing[0].timestamp);
      if (firstOutTime) {
        const diffMs = firstOutTime.getTime() - mcTime.getTime();
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


export default function DashboardScreen({
  dashboard,
  onLogout,
  loading,
  onToggleTrackingNeeded,
  onUpdateUser,
  onDeleteUser,
  onToggleUserTracking,
}: DashboardScreenProps) {
  const [selectedView, setSelectedView] = useState<string>("dashboard");
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>("");
  const [selectedWarriorId, setSelectedWarriorId] = useState<string>("");

  // Date/Time Filters State
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterStartTime, setFilterStartTime] = useState<string>("09:30");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterEndTime, setFilterEndTime] = useState<string>("");

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

  // Hourly Section Filters State (Cascading)
  const [hourlySelectedAdminId, setHourlySelectedAdminId] = useState<string>("");
  const [hourlySelectedLeaderId, setHourlySelectedLeaderId] = useState<string>("");
  const [hourlySelectedWarriorId, setHourlySelectedWarriorId] = useState<string>("");

  // Hourly Date/Time Filters State
  const [hourlyStartDate, setHourlyStartDate] = useState<string>("");
  const [hourlyStartTime, setHourlyStartTime] = useState<string>("09:30");
  const [hourlyEndDate, setHourlyEndDate] = useState<string>("");
  const [hourlyEndTime, setHourlyEndTime] = useState<string>("");

  const hourlyStartDateTime = useMemo(() => {
    if (!hourlyStartDate) return null;
    const parts = hourlyStartDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = hourlyStartTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 9;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 30;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [hourlyStartDate, hourlyStartTime]);

  const hourlyEndDateTime = useMemo(() => {
    if (!hourlyEndDate) return null;
    const parts = hourlyEndDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = hourlyEndTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 23;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 59;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [hourlyEndDate, hourlyEndTime]);

  // Filtered Analytics Section Date/Time Filters State
  const [filteredStartDate, setFilteredStartDate] = useState<string>("");
  const [filteredStartTime, setFilteredStartTime] = useState<string>("09:30");
  const [filteredEndDate, setFilteredEndDate] = useState<string>("");
  const [filteredEndTime, setFilteredEndTime] = useState<string>("");

  const filteredStartDateTime = useMemo(() => {
    if (!filteredStartDate) return null;
    const parts = filteredStartDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = filteredStartTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 9;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 30;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [filteredStartDate, filteredStartTime]);

  const filteredEndDateTime = useMemo(() => {
    if (!filteredEndDate) return null;
    const parts = filteredEndDate.split("-");
    if (parts.length < 3) return null;
    const [year, month, day] = parts;
    const timeParts = filteredEndTime.split(":");
    const hours = timeParts[0] ? parseInt(timeParts[0]) : 23;
    const minutes = timeParts[1] ? parseInt(timeParts[1]) : 59;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
  }, [filteredEndDate, filteredEndTime]);

  // Filtered Analytics — Hierarchy Filter States
  const [filteredAdminId, setFilteredAdminId] = useState<string>("");
  const [filteredLeaderId, setFilteredLeaderId] = useState<string>("");
  const [filteredWarriorId, setFilteredWarriorId] = useState<string>("");

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

  // Filter Lists
  const leadersList = useMemo(() => {
    return dashboard.users.filter((u) => u.role === "group_leader");
  }, [dashboard.users]);

  const warriorsList = useMemo(() => {
    return dashboard.users.filter((u) => {
      if (u.role !== "warrior") return false;
      if (selectedLeaderId) {
        return u.manager_id === selectedLeaderId || isManagedBy(u.id, selectedLeaderId, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, selectedLeaderId]);

  const handleLeaderChange = (leaderId: string) => {
    setSelectedLeaderId(leaderId);
    setSelectedWarriorId("");
  };

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

  // Calculate Totals & Stats (reacts to leader/warrior filters and date range)
  const totals = useMemo(() => {
    let filteredReportWarriors = dashboard.report?.warriors ?? [];
    if (selectedLeaderId) {
      filteredReportWarriors = filteredReportWarriors.filter(
        (w) => w.warrior_id === selectedLeaderId || w.manager_id === selectedLeaderId || isManagedBy(w.warrior_id, selectedLeaderId, dashboard.users)
      );
    }
    if (selectedWarriorId) {
      filteredReportWarriors = filteredReportWarriors.filter(
        (w) => w.warrior_id === selectedWarriorId
      );
    }
    return computeTotals(filteredReportWarriors, dashboard.users, dashboard.employees, startFilterDateTime, endFilterDateTime);
  }, [dashboard, selectedLeaderId, selectedWarriorId, startFilterDateTime, endFilterDateTime]);

  // Calculate Overall Totals & Stats (stays overall, unfiltered by leader/warrior but filtered by date range)
  const overallTotals = useMemo(() => {
    return computeTotals(dashboard.report?.warriors ?? [], dashboard.users, dashboard.employees, startFilterDateTime, endFilterDateTime);
  }, [dashboard, startFilterDateTime, endFilterDateTime]);

  const comparisonData = useMemo(() => {
    return [
      {
        name: "Overall",
        Total: overallTotals.totalCallsDone,
        Success: overallTotals.totalSuccessCalls,
      },
      {
        name: "Incoming",
        Total: overallTotals.incomingCalls,
        Success: overallTotals.incomingSuccessCalls,
      },
      {
        name: "Outgoing",
        Total: overallTotals.outgoingCalls,
        Success: overallTotals.outgoingSuccessCalls,
      },
      {
        name: "Missed",
        Total: overallTotals.totalMissed,
        "Not Responded": overallTotals.missedNotResponded,
      },
      {
        name: "Dropped",
        Total: overallTotals.droppedCalls,
        "Incoming Dropped": overallTotals.incomingDroppedCalls,
        "Outgoing Dropped": overallTotals.outgoingDroppedCalls,
      },
    ];
  }, [overallTotals]);

  const directionData = useMemo(() => {
    return [
      { name: "Incoming", value: overallTotals.incomingCalls, color: "#015C96" },
      { name: "Outgoing", value: overallTotals.outgoingCalls, color: "#b45309" },
    ];
  }, [overallTotals]);

  const recoveryData = useMemo(() => {
    const resolved = Math.max(0, overallTotals.totalMissed - overallTotals.missedNotResponded);
    return [
      { name: "Responded", value: resolved, color: "#04693F" },
      { name: "Unresponded", value: overallTotals.missedNotResponded, color: "#e11d48" },
    ];
  }, [overallTotals]);

  const filteredReportWarriors = useMemo(() => {
    let list = dashboard.report?.warriors ?? [];
    if (selectedLeaderId) {
      list = list.filter((w) => w.warrior_id === selectedLeaderId || w.manager_id === selectedLeaderId || isManagedBy(w.warrior_id, selectedLeaderId, dashboard.users));
    }
    if (selectedWarriorId) {
      list = list.filter((w) => w.warrior_id === selectedWarriorId);
    }
    return list;
  }, [dashboard.report, dashboard.users, selectedLeaderId, selectedWarriorId]);

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
    if (selectedLeaderId) {
      const leaderUser = dashboard.users.find((u) => u.id === selectedLeaderId);
      const groupWarriors = report.warriors.filter(
        (w) => w.warrior_id === selectedLeaderId || w.manager_id === selectedLeaderId || isManagedBy(w.warrior_id, selectedLeaderId, dashboard.users)
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
    if (!selectedWarriorId) return null;
    const warrior = dashboard.report?.warriors.find(w => w.warrior_id === selectedWarriorId);
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
  }, [dashboard, selectedWarriorId]);

  const hourlyAdminsList = useMemo(() => {
    return dashboard.users.filter(u => u.role === "admin" || u.role === "super_admin");
  }, [dashboard.users]);

  const hourlyLeadersList = useMemo(() => {
    return dashboard.users.filter(u => {
      if (u.role !== "group_leader") return false;
      if (hourlySelectedAdminId) {
        return u.manager_id === hourlySelectedAdminId || isManagedBy(u.id, hourlySelectedAdminId, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, hourlySelectedAdminId]);

  const hourlyWarriorsList = useMemo(() => {
    return dashboard.users.filter(u => {
      if (u.role !== "warrior") return false;
      if (hourlySelectedLeaderId) {
        return u.manager_id === hourlySelectedLeaderId || isManagedBy(u.id, hourlySelectedLeaderId, dashboard.users);
      }
      if (hourlySelectedAdminId) {
        return u.manager_id === hourlySelectedAdminId || isManagedBy(u.id, hourlySelectedAdminId, dashboard.users);
      }
      return true;
    });
  }, [dashboard.users, hourlySelectedAdminId, hourlySelectedLeaderId]);

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

    if (hourlySelectedWarriorId) {
      targetUserIds = [hourlySelectedWarriorId];
    } else if (hourlySelectedLeaderId) {
      const managedWarriors = users.filter(u => u.role === "warrior" && (u.manager_id === hourlySelectedLeaderId || isUserManagedBy(u.id, hourlySelectedLeaderId)));
      targetUserIds = [hourlySelectedLeaderId, ...managedWarriors.map(w => w.id)];
    } else if (hourlySelectedAdminId) {
      const managedUsers = users.filter(u => u.manager_id === hourlySelectedAdminId || isUserManagedBy(u.id, hourlySelectedAdminId));
      targetUserIds = [hourlySelectedAdminId, ...managedUsers.map(u => u.id)];
    } else {
      targetUserIds = users.map(u => u.id);
    }

    const filteredWarriors = reportWarriors.filter(w => targetUserIds.includes(w.warrior_id));
    let allCalls = filteredWarriors.flatMap(w => w.calls ?? []);

    if (hourlyStartDateTime || hourlyEndDateTime) {
      allCalls = allCalls.filter(c => {
        const callDate = parseDbTimestamp(c.timestamp);
        if (!callDate) return false;
        if (hourlyStartDateTime && callDate < hourlyStartDateTime) return false;
        if (hourlyEndDateTime && callDate > hourlyEndDateTime) return false;
        return true;
      });
    }

    return allCalls;
  }, [dashboard, hourlySelectedAdminId, hourlySelectedLeaderId, hourlySelectedWarriorId, hourlyStartDateTime, hourlyEndDateTime]);

  const hourlyDistributionData = useMemo(() => {
    const hourlyCounts: Record<number, { hourStr: string; hour: number; Total: number; Missed: number; Dropped: number }> = {};
    
    for (let h = 0; h < 24; h++) {
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      hourlyCounts[h] = {
        hourStr: `${displayHour} ${ampm}`,
        hour: h,
        Total: 0,
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
      const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (duration >= 0 && duration <= 10);
      const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed") || status === "rejected" || status === "failed" || duration === 0);

      if (hourlyCounts[hour]) {
        hourlyCounts[hour].Total++;
        if (isMissed) {
          hourlyCounts[hour].Missed++;
        }
        if (isDropped) {
          hourlyCounts[hour].Dropped++;
        }
      }
    });

    const data = Object.values(hourlyCounts);
    const activeHours = data.filter(d => d.Total > 0 || d.Missed > 0 || d.Dropped > 0);
    if (activeHours.length === 0) {
      return data.filter(d => d.hour >= 9 && d.hour <= 18);
    }
    const minHour = Math.max(0, Math.min(...activeHours.map(d => d.hour)) - 1);
    const maxHour = Math.min(23, Math.max(...activeHours.map(d => d.hour)) + 1);
    return data.filter(d => d.hour >= minHour && d.hour <= maxHour);
  }, [hourlyFilteredCalls]);

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
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <Sidebar
          meName={meName}
          meRole={dashboard.me?.role}
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
        <div className="px-2 pb-4 pt-3 flex-1 flex flex-col min-h-0">
          {selectedView === "dashboard" && (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Category: Employee & Tracking Status */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h3 className="text-xs font-black uppercase text-indigo-700 tracking-wider">Employee & Tracking Status</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Active workspace users and background tracking status</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <CompactMetricCard title="Total Employees" value={overallTotals.employees} note="Total workspace employees" textColor="text-indigo-700" borderColor="bg-indigo-600" />
                  <CompactMetricCard title="Tracking Requested" value={`${overallTotals.employeesTrackingNeeded}/${overallTotals.employees}`} note="Tracking needed flag is True" textColor="text-indigo-700" borderColor="bg-indigo-600" />
                  <CompactMetricCard title="Tracking Enabled" value={`${overallTotals.trackingOn}/${overallTotals.employees}`} note="App tracking permission enabled" textColor="text-indigo-700" borderColor="bg-indigo-600" />
                </div>
              </div>

              {/* Page-level Date & Time Filter Bar */}
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col text-left w-full md:w-auto">
                  <span className="text-[10px] uppercase tracking-widest text-[#04693F] font-bold">Metric Date Range</span>
                  <span className="text-xs text-slate-400 font-semibold">Filter overall metrics and comparison charts by date & time</span>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto justify-end">
                  <div className="flex flex-col text-left relative w-[130px]">
                    <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-650 w-full"
                    />
                  </div>

                  <div className="flex flex-col text-left relative w-[80px]">
                    <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Start Time</label>
                    <input
                      type="time"
                      value={filterStartTime}
                      onChange={(e) => setFilterStartTime(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-650 w-full"
                    />
                  </div>

                  <div className="flex flex-col text-left relative w-[130px]">
                    <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-650 w-full"
                    />
                  </div>

                  <div className="flex flex-col text-left relative w-[80px]">
                    <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">End Time</label>
                    <input
                      type="time"
                      value={filterEndTime}
                      onChange={(e) => setFilterEndTime(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-650 w-full"
                    />
                  </div>

                  {(filterStartDate || filterEndDate) && (
                    <button
                      onClick={() => {
                        setFilterStartDate("");
                        setFilterStartTime("09:30");
                        setFilterEndDate("");
                        setFilterEndTime("");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50/50 text-[10px] font-bold transition-all self-end"
                    >
                      Reset Range
                    </button>
                  )}
                </div>
              </div>

              {/* Category: Overall Metrics */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h3 className="text-xs font-black uppercase text-[#04693F] tracking-wider">Overall Metrics</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Overall call volume & talk times</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <CompactMetricCard title="Total Calls Done" value={overallTotals.totalCallsDone} note="All calls placed/received" textColor="text-[#04693F]" borderColor="bg-[#04693F]" />
                  <CompactMetricCard title="Total Call Success" value={overallTotals.totalSuccessCalls} note="Calls answered & >10s duration" textColor="text-[#04693F]" borderColor="bg-[#04693F]" />
                  <CompactMetricCard title="Total Talk Time" value={overallTotals.totalTalkTimeFormatted} note="Accumulated duration (HH:MM)" textColor="text-[#04693F]" borderColor="bg-[#04693F]" />
                  <CompactMetricCard title="Avg Talk Time per Call" value={overallTotals.avgTTCallFormatted} note="Average per call (MM:SS)" textColor="text-[#04693F]" borderColor="bg-[#04693F]" />
                </div>
              </div>

              {/* Category: Incoming Call Metrics */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h3 className="text-xs font-black uppercase text-[#015C96] tracking-wider">Incoming Call Metrics</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Incoming trends and answer duration</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <CompactMetricCard title="Total Incoming" value={overallTotals.incomingCalls} note="Total calls received" textColor="text-[#015C96]" borderColor="bg-[#015C96]" />
                  <CompactMetricCard title="Success Incoming" value={overallTotals.incomingSuccessCalls} note="Incoming calls answered & >10s" textColor="text-[#015C96]" borderColor="bg-[#015C96]" />
                  <CompactMetricCard title="Incoming Talk Time" value={overallTotals.incomingTalkTimeFormatted} note="Total incoming duration (HH:MM)" textColor="text-[#015C96]" borderColor="bg-[#015C96]" />
                  <CompactMetricCard title="Avg TT per Incoming" value={overallTotals.avgTTIncomingFormatted} note="Average incoming duration (MM:SS)" textColor="text-[#015C96]" borderColor="bg-[#015C96]" />
                </div>
              </div>

              {/* Category: Outgoing Call Metrics */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h3 className="text-xs font-black uppercase text-amber-700 tracking-wider">Outgoing Call Metrics</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Outgoing volume and successful connections</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <CompactMetricCard title="Total Outgoing" value={overallTotals.outgoingCalls} note="Total calls placed by sales" textColor="text-amber-700" borderColor="bg-amber-600" />
                  <CompactMetricCard title="Success Outgoing" value={overallTotals.outgoingSuccessCalls} note="Outgoing calls answered & >10s" textColor="text-amber-700" borderColor="bg-amber-600" />
                  <CompactMetricCard title="Outgoing Talk Time" value={overallTotals.outgoingTalkTimeFormatted} note="Total outgoing duration (HH:MM)" textColor="text-amber-700" borderColor="bg-amber-600" />
                  <CompactMetricCard title="Avg TT per Outgoing" value={overallTotals.avgTTOutgoingFormatted} note="Average outgoing duration (MM:SS)" textColor="text-amber-700" borderColor="bg-amber-600" />
                </div>
              </div>

              {/* Category: Missed & Dropped Metrics */}
              <div className="grid gap-1.5 md:grid-cols-2">
                {/* Missed Call Details */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <h3 className="text-xs font-black uppercase text-rose-600 tracking-wider">Missed Call Metrics</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Response and recovery rates</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <CompactMetricCard title="Total Missed Calls" value={overallTotals.totalMissed} note="Incoming - Success Incoming" textColor="text-rose-600" borderColor="bg-rose-500" />
                    <CompactMetricCard title="Missed Not Responded" value={overallTotals.missedNotResponded} note="No follow-up outgoing call" textColor="text-rose-600" borderColor="bg-rose-500" />
                    <CompactMetricCard title="Avg Time to Respond" value={overallTotals.avgResponseTimeFormatted} note="Time to call back client" textColor="text-rose-600" borderColor="bg-rose-500" />
                  </div>
                </div>

                {/* Dropped Call Details */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">Dropped Calls (0s to 10s)</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">Short duration connection dropouts</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <CompactMetricCard title="Total Dropped Calls" value={overallTotals.droppedCalls} note="Talk duration 0s to 10s" textColor="text-slate-600" borderColor="bg-slate-500" />
                    <CompactMetricCard title="Incoming Dropped" value={overallTotals.incomingDroppedCalls} note="Incoming talk time 0s to 10s" textColor="text-slate-600" borderColor="bg-slate-500" />
                    <CompactMetricCard title="Outgoing Dropped" value={overallTotals.outgoingDroppedCalls} note="Outgoing talk time 0s to 10s" textColor="text-slate-600" borderColor="bg-slate-500" />
                  </div>
                </div>
              </div>

              {/* Analytics & Visualizations Section */}
              <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                {/* Comparison Bar Chart */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Call Volume & Outcome Comparison</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Comparing total volumes against successful outcomes across call types</p>
                  </div>

                  <div className="h-60 mt-3 text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                        <ChartTooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '11px', fontWeight: '600' }}
                        />
                        <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Bar dataKey="Total" fill="#015C96" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          <LabelList dataKey="Total" position="top" formatter={(val: any) => (val > 0 ? `Total: ${val}` : "")} style={{ fontSize: '8px', fill: '#015c96', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Success" fill="#04693F" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          <LabelList dataKey="Success" position="top" formatter={(val: any) => (val > 0 ? `Success: ${val}` : "")} style={{ fontSize: '8px', fill: '#04693f', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Not Responded" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          <LabelList dataKey="Not Responded" position="top" formatter={(val: any) => (val > 0 ? `Not Resp: ${val}` : "")} style={{ fontSize: '8px', fill: '#e11d48', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Incoming Dropped" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          <LabelList dataKey="Incoming Dropped" position="top" formatter={(val: any) => (val > 0 ? `Inc Drop: ${val}` : "")} style={{ fontSize: '8px', fill: '#475569', fontWeight: 'bold' }} />
                        </Bar>
                        <Bar dataKey="Outgoing Dropped" fill="#64748b" radius={[4, 4, 0, 0]} maxBarSize={30}>
                          <LabelList dataKey="Outgoing Dropped" position="top" formatter={(val: any) => (val > 0 ? `Out Drop: ${val}` : "")} style={{ fontSize: '8px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut Mix Details */}
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Call Ratio & Recovery Analytics</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Direction mix and missed call recovery ratios</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 flex-1 items-center">
                    {/* Direction Donut */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Direction Mix</span>
                      <div className="h-28 w-28 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={directionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={24}
                              outerRadius={38}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {directionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip formatter={(val) => [`${val} calls`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs font-black text-slate-700">{overallTotals.totalCallsDone}</span>
                          <span className="text-[7px] font-bold text-slate-400 uppercase">Total</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-2 text-[9px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#015C96]" /> Incoming ({overallTotals.incomingCalls})</div>
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" /> Outgoing ({overallTotals.outgoingCalls})</div>
                      </div>
                    </div>

                    {/* Recovery Donut */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lead Recovery</span>
                      <div className="h-28 w-28 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={recoveryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={24}
                              outerRadius={38}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {recoveryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip formatter={(val) => [`${val} calls`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs font-black text-slate-700">{overallTotals.totalMissed}</span>
                          <span className="text-[7px] font-bold text-slate-400 uppercase">Missed</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-2 text-[9px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#04693F]" /> Responded ({Math.max(0, overallTotals.totalMissed - overallTotals.missedNotResponded)})</div>
                        <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#e11d48]" /> Unresponded ({overallTotals.missedNotResponded})</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hourly Call Volume Distribution Section */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Hourly Call Distribution</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Analysis of hourly peak activity across Total, Missed, and Dropped calls</p>
                  </div>
                  
                  {/* Cascading Hierarchical Selector */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {/* Admin Dropdown */}
                    <div className="flex flex-col text-left w-[150px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Admin</label>
                      <select
                        value={hourlySelectedAdminId}
                        onChange={(e) => {
                          setHourlySelectedAdminId(e.target.value);
                          setHourlySelectedLeaderId("");
                          setHourlySelectedWarriorId("");
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 font-semibold text-slate-600 w-full"
                      >
                        <option value="">All Admins</option>
                        {hourlyAdminsList.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Leader Dropdown */}
                    <div className="flex flex-col text-left w-[150px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Group Leader</label>
                      <select
                        value={hourlySelectedLeaderId}
                        onChange={(e) => {
                          setHourlySelectedLeaderId(e.target.value);
                          setHourlySelectedWarriorId("");
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 font-semibold text-slate-600 w-full"
                      >
                        <option value="">All Leaders</option>
                        {hourlyLeadersList.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Warrior Dropdown */}
                    <div className="flex flex-col text-left w-[150px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Warrior</label>
                      <select
                        value={hourlySelectedWarriorId}
                        onChange={(e) => setHourlySelectedWarriorId(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 font-semibold text-slate-600 w-full"
                      >
                        <option value="">All Warriors</option>
                        {hourlyWarriorsList.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Hourly Start Date */}
                    <div className="flex flex-col text-left w-[130px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Start Date</label>
                      <input
                        type="date"
                        value={hourlyStartDate}
                        onChange={(e) => setHourlyStartDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-600 w-full"
                      />
                    </div>

                    {/* Hourly Start Time */}
                    <div className="flex flex-col text-left w-[80px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Start Time</label>
                      <input
                        type="time"
                        value={hourlyStartTime}
                        onChange={(e) => setHourlyStartTime(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-600 w-full"
                      />
                    </div>

                    {/* Hourly End Date */}
                    <div className="flex flex-col text-left w-[130px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">End Date</label>
                      <input
                        type="date"
                        value={hourlyEndDate}
                        onChange={(e) => setHourlyEndDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-600 w-full"
                      />
                    </div>

                    {/* Hourly End Time */}
                    <div className="flex flex-col text-left w-[80px]">
                      <label className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">End Time</label>
                      <input
                        type="time"
                        value={hourlyEndTime}
                        onChange={(e) => setHourlyEndTime(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none hover:border-slate-300 focus:border-[#04693F] font-semibold text-slate-600 w-full"
                      />
                    </div>

                    {(hourlySelectedAdminId || hourlySelectedLeaderId || hourlySelectedWarriorId || hourlyStartDate || hourlyEndDate) && (
                      <button
                        onClick={() => {
                          setHourlySelectedAdminId("");
                          setHourlySelectedLeaderId("");
                          setHourlySelectedWarriorId("");
                          setHourlyStartDate("");
                          setHourlyStartTime("09:30");
                          setHourlyEndDate("");
                          setHourlyEndTime("");
                        }}
                        className="px-3 py-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50/50 text-[10px] font-bold transition-all self-end"
                      >
                        Reset Group
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of Hourly Charts */}
                <div className="grid gap-3 md:grid-cols-3">
                  {/* Total Calls Chart */}
                  <div className="bg-slate-50/40 border border-slate-150/40 rounded-xl p-3 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-bold text-[#015C96] uppercase tracking-wider mb-2">Total Call Volume</span>
                    <div className="h-40 text-[9px] font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyDistributionData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="totalHourlyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#015C96" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#015C96" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="hourStr" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="Total" stroke="#015C96" fillOpacity={1} fill="url(#totalHourlyGrad)">
                            <LabelList dataKey="Total" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '8px', fill: '#015C96', fontWeight: 'bold' }} />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Missed Calls Chart */}
                  <div className="bg-slate-50/40 border border-slate-150/40 rounded-xl p-3 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2">Missed Call Volume</span>
                    <div className="h-40 text-[9px] font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyDistributionData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="missedHourlyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="hourStr" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="Missed" stroke="#dc2626" fillOpacity={1} fill="url(#missedHourlyGrad)">
                            <LabelList dataKey="Missed" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '8px', fill: '#dc2626', fontWeight: 'bold' }} />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Dropped Calls Chart */}
                  <div className="bg-slate-50/40 border border-slate-150/40 rounded-xl p-3 flex flex-col justify-between min-h-[220px]">
                    <span className="text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-2">Dropped Call Volume</span>
                    <div className="h-40 text-[9px] font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyDistributionData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="droppedHourlyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#64748b" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="hourStr" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                          <Area type="monotone" dataKey="Dropped" stroke="#475569" fillOpacity={1} fill="url(#droppedHourlyGrad)">
                            <LabelList dataKey="Dropped" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '8px', fill: '#475569', fontWeight: 'bold' }} />
                          </Area>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>


              {/* Filtered Analytics and Visualizations Section */}
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Filtered Analytics & Visualization</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Dynamic performance insights and statistics based on current filter selection</p>
                  </div>

                </div>

                {/* Analysis Range Filter Controls — compact single row */}
                <div className="bg-indigo-50/20 border border-indigo-100/50 rounded-xl px-3 py-2 flex flex-row flex-wrap gap-2 items-center">
                  {/* Label */}
                  <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider whitespace-nowrap mr-1">Analysis Range</span>
                  <span className="h-3.5 w-px bg-indigo-200 shrink-0" />

                  {/* Hierarchy selects */}
                  <select
                    value={filteredAdminId}
                    onChange={(e) => handleFilteredAdminChange(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 max-w-[110px]"
                  >
                    <option value="">All Admins</option>
                    {filteredAdminsList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>

                  <select
                    value={filteredLeaderId}
                    onChange={(e) => handleFilteredLeaderChange(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 max-w-[110px]"
                  >
                    <option value="">All Leaders</option>
                    {filteredLeadersList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>

                  <select
                    value={filteredWarriorId}
                    onChange={(e) => setFilteredWarriorId(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 max-w-[110px]"
                  >
                    <option value="">All Warriors</option>
                    {filteredWarriorsList.map(u => <option key={u.id} value={u.id}>{u.full_name.split(' ')[0]}</option>)}
                  </select>

                  <span className="h-3.5 w-px bg-slate-200 shrink-0" />

                  {/* From group */}
                  <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">From:</span>
                  <input
                    type="date"
                    value={filteredStartDate}
                    onChange={(e) => setFilteredStartDate(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 w-[118px]"
                  />
                  <input
                    type="time"
                    value={filteredStartTime}
                    onChange={(e) => setFilteredStartTime(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 w-[78px]"
                  />

                  <span className="h-3.5 w-px bg-slate-200 shrink-0" />

                  {/* To group */}
                  <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">To:</span>
                  <input
                    type="date"
                    value={filteredEndDate}
                    onChange={(e) => setFilteredEndDate(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 w-[118px]"
                  />
                  <input
                    type="time"
                    value={filteredEndTime}
                    onChange={(e) => setFilteredEndTime(e.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] outline-none hover:border-indigo-300 focus:border-indigo-500 font-semibold text-slate-600 w-[78px]"
                  />

                  {(filteredAdminId || filteredLeaderId || filteredWarriorId || filteredStartDate || filteredEndDate || filteredStartTime !== "09:30" || filteredEndTime !== "") && (
                    <button
                      onClick={() => {
                        handleFilteredAdminChange("");
                        setFilteredStartDate("");
                        setFilteredStartTime("09:30");
                        setFilteredEndDate("");
                        setFilteredEndTime("");
                      }}
                      className="ml-1 px-2.5 py-1 rounded-md border border-rose-100 text-rose-600 hover:bg-rose-50/50 text-[9px] font-bold transition-all whitespace-nowrap"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className={`grid gap-4 ${filteredWarriorId ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  {/* Left Column: Visualizer Chart */}
                  <div className="bg-slate-50/40 border border-slate-150/40 rounded-xl p-3 flex flex-col justify-between min-h-[260px]">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                        {filteredWarriorId
                          ? "Call Metric Breakdown"
                          : filteredLeaderId
                            ? "Team Member Comparison"
                            : filteredAdminId
                              ? "Leaders Under Admin"
                              : "Top Performers (by Total Calls)"}
                      </span>
                    </div>

                    <div className="h-48 mt-2 text-[9px] font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        {filteredWarriorId ? (
                          <BarChart data={filteredVisualizationData as any} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                            <Bar dataKey="value" fill="#015C96" radius={[4, 4, 0, 0]} maxBarSize={30}>
                              <LabelList dataKey="value" position="top" style={{ fontSize: '8px', fill: '#475569', fontWeight: 'bold' }} />
                              {filteredVisualizationData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : (
                          <BarChart data={filteredVisualizationData as any} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                            <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                            <Bar dataKey="Total Calls" fill="#015C96" radius={[3, 3, 0, 0]} maxBarSize={20}>
                              <LabelList dataKey="Total Calls" position="top" style={{ fontSize: '7px', fill: '#015c96', fontWeight: 'bold' }} />
                            </Bar>
                            {filteredLeaderId ? (
                              <Bar dataKey="Success Calls" fill="#04693F" radius={[3, 3, 0, 0]} maxBarSize={20}>
                                <LabelList dataKey="Success Calls" position="top" style={{ fontSize: '7px', fill: '#04693f', fontWeight: 'bold' }} />
                              </Bar>
                            ) : (
                              <Bar dataKey="Calling Hours" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={20}>
                                <LabelList dataKey="Calling Hours" position="top" style={{ fontSize: '7px', fill: '#b45309', fontWeight: 'bold' }} />
                              </Bar>
                            )}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Middle Column (Only for selected warrior): Hour-wise distribution */}
                  {filteredWarriorId && (
                    <div className="bg-slate-50/40 border border-slate-150/40 rounded-xl p-3 flex flex-col justify-between min-h-[260px]">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Hour-wise Call Distribution</span>
                      </div>
                      <div className="h-48 mt-2 text-[9px] font-semibold">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={warriorHourlyData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="hourStr" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <ChartTooltip contentStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="Calls" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCalls)">
                              <LabelList dataKey="Calls" position="top" formatter={(val: any) => (val > 0 ? val : "")} style={{ fontSize: '8px', fill: '#4f46e5', fontWeight: 'bold' }} />
                            </Area>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Right Column: AI Analytical Insights */}
                  <div className="bg-gradient-to-br from-indigo-50/40 via-emerald-50/10 to-slate-50 border border-slate-150/40 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">{filteredInsights.title}</span>
                      </div>
                      <div className="space-y-2 mt-2">
                        {filteredInsights.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-600 font-semibold text-left">
                            <span className="text-indigo-500 mt-1 select-none">•</span>
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 font-bold mt-4 uppercase border-t border-slate-200/50 pt-2 flex items-center justify-between">
                      <span>Generated from Live Telemetry</span>
                      <span className="text-[#04693F] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time
                      </span>
                    </div>
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
                users={dashboard.users}
                employees={dashboard.employees}
                onToggleTrackingNeeded={onToggleTrackingNeeded}
                report={dashboard.report}
              />
            </div>
          )}

          {selectedView === "user-management" && (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="flex flex-col gap-0.5 text-left">
                  <h2 className="text-lg font-bold text-slate-800">User Management Console</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Administer user roles, modify reporting structures, enable/disable tracking (Super Admin only), and remove records.
                  </p>
                </div>
                {/* Search Box */}
                <div className="relative w-full md:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search people by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Table wrapper */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 mt-3">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                  <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold border-collapse">
                    <thead className="text-slate-500 uppercase tracking-wider font-bold bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">USER NAME / EMAIL</th>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-center">ROLE</th>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-center">REPORTING TO (MANAGER)</th>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-center">SYSTEM ID</th>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-center">CALL TRACKING</th>
                        <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredUsersList.map((user) => {
                        const mIds = user.manager_ids || (user.manager_id ? [user.manager_id] : []);
                        const directManagers = dashboard.users.filter(u => mIds.includes(u.id));
                        const canEditOrDelete = canManageUser(user) && user.id !== dashboard.me?.id;
                        const isSuperAdmin = dashboard.me?.role === "super_admin";

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/45 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 text-sm">{user.full_name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
                              {!user.is_active && (
                                <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 mt-1">
                                  Inactive
                                </span>
                              )}
                              {!user.is_approved && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 mt-1 ml-1.5">
                                  Pending Approval
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${user.role === "super_admin"
                                ? "bg-purple-50 text-purple-700 border border-purple-100"
                                : user.role === "admin"
                                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                                  : user.role === "group_leader"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : "bg-slate-50 text-slate-650 border border-slate-200/60"
                                }`}>
                                {user.role.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600 font-medium">
                              {directManagers.length > 0 ? (
                                <div className="space-y-1">
                                  {directManagers.map((m) => (
                                    <div key={m.id} className="leading-tight">
                                      <div className="font-bold text-slate-700">{m.full_name}</div>
                                      <div className="text-[9px] text-slate-400">({m.role.replace("_", " ").toUpperCase()})</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-[11px] text-slate-500 font-bold">
                              {user.system_id || <span className="text-slate-400 font-normal">-</span>}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                disabled={!isSuperAdmin}
                                onClick={() => handleToggleUserTrackingState(user)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${user.is_tracking_enabled
                                  ? "bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] text-[#04693F] border-[#04693F]/15 " + (isSuperAdmin ? "hover:opacity-90" : "opacity-80 cursor-not-allowed")
                                  : "bg-white text-slate-500 border-slate-200 " + (isSuperAdmin ? "hover:bg-slate-50" : "opacity-60 cursor-not-allowed")
                                  }`}
                              >
                                {user.is_tracking_enabled ? "Tracking Enabled" : "Tracking Disabled"}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {canEditOrDelete ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditModal(user)}
                                    className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/15 hover:opacity-90 text-[#04693F] text-[10px] font-bold transition-all shadow-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleOpenDeleteModal(user)}
                                    className="px-2.5 py-1 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-[10px] font-bold transition-all"
                                  >
                                    Delete
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">No Access</span>
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

        </div>
      </main>

      {/* Edit User Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-[#04693F] uppercase tracking-wider">EDIT USER HIERARCHY</h3>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">
                  Modifying Profile of {editingUser.full_name}
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-left">
                  {actionError}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700"
                />
              </div>

              {/* System ID */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">System ID</label>
                <input
                  type="text"
                  placeholder="None"
                  value={editFormData.system_id}
                  onChange={(e) => setEditFormData({ ...editFormData, system_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700"
                />
              </div>

              {/* Role (Conditional on level) */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Role Hierarchy</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700 font-semibold text-slate-600"
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
                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1">Assign Managers (Multiple Allowed)</label>
                    {availableManagers.length > 0 && (
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Search managers..."
                          value={managerSearchQuery}
                          onChange={(e) => setManagerSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none transition focus:border-[#04693F] font-semibold text-slate-700 placeholder-slate-400"
                        />
                      </div>
                    )}
                    <div className="border border-slate-200 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-2 bg-white">
                      {availableManagers.length === 0 ? (
                        <div className="text-[11px] text-slate-400 font-medium">No higher-ranking managers available</div>
                      ) : filteredManagers.length === 0 ? (
                        <div className="text-[11px] text-slate-400 font-medium">No matching managers found</div>
                      ) : (
                        filteredManagers.map((mgr) => {
                          const isChecked = editFormData.manager_ids.includes(mgr.id);
                          return (
                            <label key={mgr.id} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50/70 p-1.5 rounded-lg transition-colors">
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
                                className="h-4 w-4 rounded border-slate-350 text-[#04693F] focus:ring-[#04693F]"
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 leading-tight">{mgr.full_name}</span>
                                <span className="text-[9px] font-black uppercase text-[#04693F]/90 mt-0.5">{mgr.role.replace("_", " ")}</span>
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
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="text-xs font-bold text-slate-600">Account Approved</span>
                <input
                  type="checkbox"
                  checked={editFormData.is_approved}
                  onChange={(e) => setEditFormData({ ...editFormData, is_approved: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-350 text-[#04693F] focus:ring-[#04693F]"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Account Active</span>
                <input
                  type="checkbox"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-350 text-[#04693F] focus:ring-[#04693F]"
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-600">Tracking Needed</span>
                  {dashboard.me?.role !== "super_admin" && (
                    <span className="text-[10px] text-slate-400 font-semibold">(Super Admin access only)</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  disabled={dashboard.me?.role !== "super_admin"}
                  checked={editFormData.is_tracking_needed}
                  onChange={(e) => setEditFormData({ ...editFormData, is_tracking_needed: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-350 text-[#04693F] focus:ring-[#04693F] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/15 hover:opacity-95 text-[#04693F] text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {isDeleteModalOpen && isDeletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-black text-rose-600 uppercase tracking-wider">DELETE USER RECORD</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-3">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {actionError}
                </div>
              )}
              <p className="text-xs text-slate-500 text-left">
                Are you absolutely sure you want to permanently delete user <b>{isDeletingUser.full_name}</b>? This action is irreversible and will remove all call statistics association.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold transition-all"
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
