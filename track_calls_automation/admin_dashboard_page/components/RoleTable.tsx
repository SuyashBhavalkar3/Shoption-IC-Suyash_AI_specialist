import { useState } from "react";
import type { UserRecord, EmployeeRecord, ReportResponse } from "./types";

type RoleTableProps = {
  users: UserRecord[];
  employees: EmployeeRecord[];
  onToggleTrackingNeeded?: (empId: string, currentVal: boolean) => void;
  report: ReportResponse | null;
};



function parseDbTimestamp(tsStr: string): Date | null {
  if (!tsStr) return null;
  const parts = tsStr.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const datePart = parts[0]; // e.g. "24-Jun-2026"
  const timePart = parts[1]; // e.g. "11:05"

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

export default function RoleTable({ users, employees, onToggleTrackingNeeded, report }: RoleTableProps) {
  const [activeTab, setActiveTab] = useState<"users" | "registry">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");

  // Helper to get call metrics for a user
  const getUserCallMetrics = (userId: string) => {
    const warriorData = report?.warriors?.find((w) => w.warrior_id === userId);

    if (!warriorData) {
      return {
        totalCalls: 0,
        totalSuccessCalls: 0,
        totalDurationHours: "0.00",
        totalAvgMinutes: "0.0",
        incomingCalls: 0,
        incomingSuccessAnswered: 0,
        incomingDurationHours: "0.00",
        incomingAvgMinutes: "0.0",
        missed: 0,
        incomingDropped: 0,
        totalOutgoingCalls: 0,
        outgoingSuccessReceived: 0,
        dialed: 0,
        outgoingDropped: 0,
        outgoingDurationHours: "0.00",
        outgoingAvgMinutes: "0.0",
      };
    }

    let calls = warriorData.calls ?? [];

    // Parse From Date/Time
    let startLimit: Date | null = null;
    if (fromDate) {
      const timeStr = fromTime || "00:00";
      const [h, m] = timeStr.split(":").map(Number);
      const [y, mo, d] = fromDate.split("-").map(Number);
      startLimit = new Date(y, mo - 1, d, h, m, 0);
    }

    // Parse To Date/Time
    let endLimit: Date | null = null;
    if (toDate) {
      const timeStr = toTime || "23:59";
      const [h, m] = timeStr.split(":").map(Number);
      const [y, mo, d] = toDate.split("-").map(Number);
      endLimit = new Date(y, mo - 1, d, h, m, 59);
    }

    // Filter calls by date/time
    if (startLimit || endLimit) {
      calls = calls.filter((c) => {
        const callDate = parseDbTimestamp(c.timestamp);
        if (!callDate) return false;
        
        if (startLimit && callDate < startLimit) return false;
        if (endLimit && callDate > endLimit) return false;
        return true;
      });
    }

    let totalSuccessCalls = 0;
    let incomingCalls = 0;
    let incomingSuccessAnswered = 0;
    let incomingTotalSeconds = 0;
    let missed = 0;
    let incomingDropped = 0;

    let totalOutgoingCalls = 0;
    let outgoingSuccessReceived = 0;
    let dialed = 0;
    let outgoingDropped = 0;
    let outgoingTotalSeconds = 0;

    calls.forEach((c) => {
      const type = (c.call_type || "").toLowerCase();
      const status = (c.call_status || "").toLowerCase();

      const isIncoming = type === "incoming";
      const isOutgoing = type === "outgoing";

      // Dropped call: duration is 1-10s or explicit dropped status
      const isDropped = (status === "dropped" || status === "rejected" || status === "failed") || (c.duration_seconds >= 1 && c.duration_seconds <= 10);

      // Missed call: incoming missed
      const isMissed = isIncoming && (status === "missed");

      // Dialed call: outgoing but no answer/not accepted/not successful
      const isDialed = isOutgoing && (status === "missed" || status === "dropped" || status === "rejected" || status === "failed" || c.duration_seconds === 0 || isDropped);

      // Success call: duration > 10s OR (not dialed, not missed, and not dropped)
      const isSuccess = (c.duration_seconds > 10) || (!isDialed && !isMissed && !isDropped);

      if (isSuccess) {
        totalSuccessCalls++;
      }

      if (isIncoming) {
        incomingCalls++;
        if (isSuccess) {
          incomingSuccessAnswered++;
          incomingTotalSeconds += c.duration_seconds || 0;
        } else if (isMissed) {
          missed++;
        }

        if (isDropped) {
          incomingDropped++;
        }
      } else if (isOutgoing) {
        totalOutgoingCalls++;
        if (isSuccess) {
          outgoingSuccessReceived++;
          outgoingTotalSeconds += c.duration_seconds || 0;
        } else {
          dialed++;
        }

        if (isDropped) {
          outgoingDropped++;
        }
      }
    });

    const incomingDurationHours = (incomingTotalSeconds / 3600).toFixed(2);
    const incomingAvgMinutes = incomingSuccessAnswered > 0
      ? (incomingTotalSeconds / incomingSuccessAnswered / 60).toFixed(1)
      : "0.0";

    const outgoingDurationHours = (outgoingTotalSeconds / 3600).toFixed(2);
    const outgoingAvgMinutes = outgoingSuccessReceived > 0
      ? (outgoingTotalSeconds / outgoingSuccessReceived / 60).toFixed(1)
      : "0.0";

    const totalDurationHours = ((incomingTotalSeconds + outgoingTotalSeconds) / 3600).toFixed(2);
    const totalAvgMinutes = (incomingSuccessAnswered + outgoingSuccessReceived) > 0
      ? ((incomingTotalSeconds + outgoingTotalSeconds) / (incomingSuccessAnswered + outgoingSuccessReceived) / 60).toFixed(1)
      : "0.0";

    return {
      totalCalls: calls.length,
      totalSuccessCalls,
      totalDurationHours,
      totalAvgMinutes,
      incomingCalls,
      incomingSuccessAnswered,
      incomingDurationHours,
      incomingAvgMinutes,
      missed,
      incomingDropped,
      totalOutgoingCalls,
      outgoingSuccessReceived,
      outgoingDurationHours,
      outgoingAvgMinutes,
      dialed,
      outgoingDropped,
    };
  };

  // Filter users by search query
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    const dept = u.department || "Unassigned";
    return (
      (u.full_name || "").toLowerCase().includes(query) ||
      (u.email || "").toLowerCase().includes(query) ||
      (u.role || "").toLowerCase().includes(query) ||
      (u.system_id || "").toLowerCase().includes(query) ||
      dept.toLowerCase().includes(query)
    );
  });

  // Filter employees by search query
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const dept = emp.department || "Unassigned";
    return (
      (emp.employee_id || "").toLowerCase().includes(query) ||
      (emp.email || "").toLowerCase().includes(query) ||
      (emp.system_id || "").toLowerCase().includes(query) ||
      dept.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    const headers = [
      "Name", "Role", "Email", "Department", "Total Calls", "Total Success Calls",
      "Total Incoming Calls", "Total Talk Duration (hrs)", "Total Avg Call Duration (min)", "Success Incoming Answered", "Incoming Duration (hrs)", "Incoming Avg Talk (mins)",
      "Missed Call", "Dropped Incoming Call", "Total Outgoing Calls", "Success Outgoing Received",
      "Outgoing Duration (hrs)", "Outgoing Avg Talk (mins)", "Dialed", "Dropped Outgoing Call"
    ];
    
    const rows = filteredUsers
      .map((user) => ({
        user,
        metrics: getUserCallMetrics(user.id),
      }))
      .sort((a, b) => b.metrics.totalCalls - a.metrics.totalCalls)
      .map(({ user, metrics }) => [
        user.full_name,
        user.role.replace("_", " "),
        user.email,
        user.department || "Unassigned",
        metrics.totalCalls,
        metrics.totalSuccessCalls,
        metrics.incomingCalls,
        metrics.totalDurationHours,
        metrics.totalAvgMinutes,
        metrics.incomingSuccessAnswered,
        metrics.incomingDurationHours,
        metrics.incomingAvgMinutes,
        metrics.missed,
        metrics.incomingDropped,
        metrics.totalOutgoingCalls,
        metrics.outgoingSuccessReceived,
        metrics.outgoingDurationHours,
        metrics.outgoingAvgMinutes,
        metrics.dialed,
        metrics.outgoingDropped
      ]);

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `erp_call_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableRows = filteredUsers
      .map((user) => ({
        user,
        metrics: getUserCallMetrics(user.id),
      }))
      .sort((a, b) => b.metrics.totalCalls - a.metrics.totalCalls)
      .map(({ user, metrics }) => `
        <tr>
          <td><b>${user.full_name}</b><br/><small>${user.email}</small></td>
          <td>${user.department || "Unassigned"}</td>
          <td>${metrics.totalCalls}</td>
          <td>${metrics.totalSuccessCalls}</td>
          <td>${metrics.incomingCalls}</td>
          <td>${metrics.totalDurationHours}</td>
          <td>${metrics.totalAvgMinutes}</td>
          <td>${metrics.incomingSuccessAnswered}</td>
          <td>${metrics.incomingDurationHours}</td>
          <td>${metrics.incomingAvgMinutes}</td>
          <td>${metrics.missed}</td>
          <td>${metrics.incomingDropped}</td>
          <td>${metrics.totalOutgoingCalls}</td>
          <td>${metrics.outgoingSuccessReceived}</td>
          <td>${metrics.outgoingDurationHours}</td>
          <td>${metrics.outgoingAvgMinutes}</td>
          <td>${metrics.dialed}</td>
          <td>${metrics.outgoingDropped}</td>
        </tr>
      `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Shoption Call Analytics Report</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 40px; color: #1e293b; }
            h1 { font-size: 20px; font-weight: 800; color: #04693F; margin-bottom: 5px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
            th { background-color: #f8fafc; font-weight: 700; color: #04693F; }
            td:first-child, th:first-child { text-align: left; }
          </style>
        </head>
        <body>
          <h1>SHOPTION CALL ANALYTICS REPORT</h1>
          <p>Generated on ${new Date().toLocaleString()} • Filtered ERP Records</p>
          <table>
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Department</th>
                <th>Total</th>
                <th>Success</th>
                <th>Inc</th>
                <th>Inc Success</th>
                <th>Inc Dur (h)</th>
                <th>Inc Avg (m)</th>
                <th>Missed</th>
                <th>Inc Drop</th>
                <th>Total Out</th>
                <th>Out Success</th>
                <th>Out Dur (h)</th>
                <th>Out Avg (m)</th>
                <th>Dialed</th>
                <th>Out Drop</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden mt-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 px-6 rounded-2xl text-sm font-semibold transition-all ${activeTab === "users"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
        >
          Active Users Directory ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex-1 py-3 px-6 rounded-2xl text-sm font-semibold transition-all ${activeTab === "registry"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
        >
          Employee Registry ({filteredEmployees.length})
        </button>
      </div>

      {/* ERP Control Panel */}
      <div className="p-6 bg-slate-50/30 border-b border-slate-100/80 flex flex-col gap-4">
        {/* Row 1: Search & Export Buttons */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder={activeTab === "users" ? "Search active users by name, email, role, or dept..." : "Search registered employees..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-5 py-2.5 pl-11 text-sm outline-none transition focus:border-[#04693F] focus:ring-4 focus:ring-[#04693F]/5 font-semibold text-slate-700"
            />
            {/* Search Icon */}
            <svg
              className="absolute left-4 top-3 h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {activeTab === "users" && (
            <div className="flex gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleExportCSV}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Export Excel
              </button>
              <button
                onClick={handleExportPDF}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-full bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/15 hover:opacity-95 text-[#04693F] text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>

        {/* Row 2: Date & Time Range Filters (Only for call log telemetry users) */}
        {activeTab === "users" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#04693F]"
              />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">From Time</label>
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#04693F]"
              />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#04693F]"
              />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">To Time</label>
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-[#04693F]"
              />
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {(searchQuery || fromDate || fromTime || toDate || toTime) && (
          <div className="flex justify-start">
            <button
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setFromTime("");
                setToDate("");
                setToTime("");
              }}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold transition-all"
            >
              Clear ERP Filters
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
        {activeTab === "users" ? (
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold border-collapse">
            <thead className="text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Name / Role</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Department</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Calls</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Success Calls</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Incoming Calls</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Talk Duration (hrs)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Avg Call Duration (min)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Success Incoming Answered</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Incoming Duration (hrs)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Incoming Avg Talk (mins)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Missed Call</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Dropped Incoming Call</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Total Outgoing Calls</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Success Outgoing Received</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Outgoing Duration (hrs)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Outgoing Avg Talk (mins)</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Dialed</th>
                <th className="px-4 py-4 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Dropped Outgoing Call</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No active users match the current hierarchy or search filters.
                  </td>
                </tr>
              ) : (
                filteredUsers
                  .map((user) => ({
                    user,
                    metrics: getUserCallMetrics(user.id),
                  }))
                  .sort((a, b) => b.metrics.totalCalls - a.metrics.totalCalls)
                  .map(({ user, metrics }) => {
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/45 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{user.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
                          <div className="text-[9px] text-[#04693F] uppercase tracking-wider mt-1">{user.role.replace("_", " ")}</div>
                        </td>
                        <td className="px-4 py-4 text-center text-xs font-semibold text-slate-700">
                          {user.department || "Unassigned"}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">{metrics.totalCalls}</td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-[#04693F]">{metrics.totalSuccessCalls}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingCalls}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.totalDurationHours}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.totalAvgMinutes}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingSuccessAnswered}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.incomingDurationHours}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingAvgMinutes}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.missed}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingDropped}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.totalOutgoingCalls}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.outgoingSuccessReceived}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.outgoingDurationHours}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.outgoingAvgMinutes}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.dialed}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.outgoingDropped}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm border-collapse">
            <thead className="text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Employee ID / Email</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">System ID</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Department</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Created Date</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]">Call Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No registered employees match the search filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{emp.employee_id}</div>
                      <div className="text-xs text-slate-400 font-medium">{emp.email ?? "No email provided"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#015C96]">
                      {emp.system_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {emp.department || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleTrackingNeeded?.(emp.id, emp.is_tracking_needed)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${emp.is_tracking_needed
                            ? "bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] text-[#04693F] border-[#04693F]/15 hover:opacity-90"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        {emp.is_tracking_needed ? "Tracking Required" : "Tracking Disabled"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
