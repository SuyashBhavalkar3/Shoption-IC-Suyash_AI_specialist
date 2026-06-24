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
  const formatToHHMM = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatToMMSS = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getUserCallMetrics = (userId: string) => {
    const warriorData = report?.warriors?.find((w) => w.warrior_id === userId);

    if (!warriorData) {
      return {
        totalCalls: 0,
        totalSuccessCalls: 0,
        missed: 0,
        missedNotResponded: 0,
        totalTalktime: "00:00",
        avgCalltime: "00:00",
        incomingCalls: 0,
        incomingTalktime: "00:00",
        incomingAvgTT: "00:00",
        dialed: 0,
        outgoingSuccessReceived: 0,
        outgoingTalktime: "00:00",
        outgoingAvgTT: "00:00",
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

    let totalOutgoingCalls = 0;
    let outgoingSuccessReceived = 0;
    let dialed = 0;
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
      } else if (isOutgoing) {
        totalOutgoingCalls++;
        if (isSuccess) {
          outgoingSuccessReceived++;
          outgoingTotalSeconds += c.duration_seconds || 0;
        } else {
          dialed++;
        }
      }
    });

    // Calculate missed not responded
    let missedNotResponded = 0;
    const missedCalls = calls.filter(c => (c.call_type || "").toLowerCase() === "incoming" && (c.call_status || "").toLowerCase() === "missed");
    
    missedCalls.forEach(mc => {
      const mcTime = parseDbTimestamp(mc.timestamp);
      if (!mcTime) return;
      const hasOutgoingAfter = calls.some(c => {
        if ((c.call_type || "").toLowerCase() !== "outgoing") return false;
        if (c.phone_number !== mc.phone_number) return false;
        const cTime = parseDbTimestamp(c.timestamp);
        return cTime && cTime > mcTime;
      });
      if (!hasOutgoingAfter) {
        missedNotResponded++;
      }
    });

    const totalDurationSeconds = incomingTotalSeconds + outgoingTotalSeconds;
    const totalTalktime = formatToHHMM(totalDurationSeconds);
    const avgCalltime = formatToMMSS(totalSuccessCalls > 0 ? totalDurationSeconds / totalSuccessCalls : 0);

    const incomingTalktime = formatToHHMM(incomingTotalSeconds);
    const incomingAvgTT = formatToMMSS(incomingSuccessAnswered > 0 ? incomingTotalSeconds / incomingSuccessAnswered : 0);

    const outgoingTalktime = formatToHHMM(outgoingTotalSeconds);
    const outgoingAvgTT = formatToMMSS(outgoingSuccessReceived > 0 ? outgoingTotalSeconds / outgoingSuccessReceived : 0);

    return {
      totalCalls: calls.length,
      totalSuccessCalls,
      missed,
      missedNotResponded,
      totalTalktime,
      avgCalltime,
      incomingCalls,
      incomingTalktime,
      incomingAvgTT,
      dialed,
      outgoingSuccessReceived,
      outgoingTalktime,
      outgoingAvgTT,
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
      "NAME", "ROLE / DEPT",
      "TOTAL CALLS", "TOTAL SUCCESS CALLS", "TOTAL MISSED CALLS", "TOTAL MISSED NOT RESPONDED",
      "TOTAL TALKTIME (HH:MM)", "AVERAGE CALL TIME (MM:SS)",
      "TOTAL INCOMING CALLS", "INCOMING TALKTIME", "INCOMING AVR. CALL TT",
      "TOTAL DIALED", "TOTAL SUCCESS DIALED", "OUTGOING TALKTIME", "OUTCOMING AVR. CALL TT"
    ];
    
    const rows = filteredUsers
      .map((user) => ({
        user,
        metrics: getUserCallMetrics(user.id),
      }))
      .sort((a, b) => b.metrics.totalCalls - a.metrics.totalCalls)
      .map(({ user, metrics }) => [
        user.full_name,
        `${user.role.replace("_", " ").toUpperCase()} / ${user.department || "Unassigned"}`,
        metrics.totalCalls,
        metrics.totalSuccessCalls,
        metrics.missed,
        metrics.missedNotResponded,
        metrics.totalTalktime,
        metrics.avgCalltime,
        metrics.incomingCalls,
        metrics.incomingTalktime,
        metrics.incomingAvgTT,
        metrics.dialed,
        metrics.outgoingSuccessReceived,
        metrics.outgoingTalktime,
        metrics.outgoingAvgTT
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
          <td>
            <b>${user.full_name}</b><br/>
            <small>${user.email}</small><br/>
            <small style="color: #04693F; font-weight: bold;">${user.role.replace("_", " ").toUpperCase()} / ${user.department || "Unassigned"}</small>
          </td>
          <td>${metrics.totalCalls}</td>
          <td>${metrics.totalSuccessCalls}</td>
          <td>${metrics.missed}</td>
          <td>${metrics.missedNotResponded}</td>
          <td>${metrics.totalTalktime}</td>
          <td>${metrics.avgCalltime}</td>
          <td>${metrics.incomingCalls}</td>
          <td>${metrics.incomingTalktime}</td>
          <td>${metrics.incomingAvgTT}</td>
          <td>${metrics.dialed}</td>
          <td>${metrics.outgoingSuccessReceived}</td>
          <td>${metrics.outgoingTalktime}</td>
          <td>${metrics.outgoingAvgTT}</td>
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
            table { width: 100%; border-collapse: collapse; font-size: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
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
                <th>NAME<br/><small style="font-weight: normal; opacity: 0.85;">ROLE / DEPT</small></th>
                <th>TOTAL CALLS</th>
                <th>TOTAL SUCCESS CALLS</th>
                <th>TOTAL MISSED CALLS</th>
                <th>TOTAL MISSED NOT RESPONDED</th>
                <th>TOTAL TALKTIME (HH:MM)</th>
                <th>AVERAGE CALL TIME (MM:SS)</th>
                <th>TOTAL INCOMING CALLS</th>
                <th>INCOMING TALKTIME</th>
                <th>INCOMING AVR. CALL TT</th>
                <th>TOTAL DIALED</th>
                <th>TOTAL SUCCESS DIALED</th>
                <th>OUTGOING TALKTIME</th>
                <th>OUTCOMING AVR. CALL TT</th>
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
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mt-3 flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === "users"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
        >
          Active Users Directory ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === "registry"
              ? "bg-white text-[#04693F] shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
            }`}
        >
          Employee Registry ({filteredEmployees.length})
        </button>
      </div>

      {/* ERP Control Panel */}
      <div className="p-2 bg-slate-50/10 border-b border-slate-100/60 flex items-center justify-between gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <input
            type="text"
            placeholder={activeTab === "users" ? "Search active users by name, email, role, or dept..." : "Search registered..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white px-3 py-1.5 pl-8 text-xs outline-none transition focus:border-[#04693F] focus:ring-1 focus:ring-[#04693F]/5 font-semibold text-slate-700"
          />
          {/* Search Icon */}
          <svg
            className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Date & Time Range Filters (Aligned next to search) */}
        {activeTab === "users" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50/50 px-2 py-0.5 rounded-lg border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-[#04693F]"
              />
              <input
                type="time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-[#04693F]"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50/50 px-2 py-0.5 rounded-lg border border-slate-100/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-[#04693F]"
              />
              <input
                type="time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-[#04693F]"
              />
            </div>
          </div>
        )}

        {/* Clear Filters Button (Shows next to inputs when active) */}
        {(searchQuery || fromDate || fromTime || toDate || toTime) && (
          <button
            onClick={() => {
              setSearchQuery("");
              setFromDate("");
              setFromTime("");
              setToDate("");
              setToTime("");
            }}
            className="text-rose-500 hover:text-rose-700 text-[10px] font-bold transition-all whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}

        {/* Export Buttons (Aligned to the right end) */}
        {activeTab === "users" && (
          <div className="flex gap-1.5">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#e6f7ee] to-[#e8f4fc] border border-[#04693F]/15 hover:opacity-95 text-[#04693F] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        {activeTab === "users" ? (
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs font-semibold border-collapse">
            <thead className="text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-3 sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-left">
                  <div className="leading-tight text-[10px] font-bold text-slate-700">NAME</div>
                  <div className="text-[9px] text-slate-400 font-bold mt-0.5 leading-none">ROLE / DEPT</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL SUCCESS</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL MISSED</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL MISSED</div>
                  <div>NOT RESPONDED</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL TALKTIME</div>
                  <div>(HH:MM)</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>AVERAGE CALL</div>
                  <div>TIME (MM:SS)</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL INCOMING</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>INCOMING</div>
                  <div>TALKTIME</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>INCOMING</div>
                  <div>AVR. CALL TT</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL</div>
                  <div>DIALED</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>TOTAL SUCCESS</div>
                  <div>DIALED</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>OUTGOING</div>
                  <div>TALKTIME</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-slate-50 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] text-[9px] font-bold leading-tight">
                  <div>OUTCOMING</div>
                  <div>AVR. CALL TT</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-10 text-center text-slate-400 font-medium">
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
                          <div className="text-[10px] text-[#04693F] font-bold mt-1">
                            {user.role.replace("_", " ").toUpperCase()} / {user.department || "Unassigned"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">{metrics.totalCalls}</td>
                        <td className="px-4 py-4 text-center text-sm font-bold text-[#04693F]">{metrics.totalSuccessCalls}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.missed}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.missedNotResponded}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.totalTalktime}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.avgCalltime}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingCalls}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingTalktime}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.incomingAvgTT}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.dialed}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.outgoingSuccessReceived}</td>
                        <td className="px-4 py-4 text-center text-slate-600 font-medium">{metrics.outgoingTalktime}</td>
                        <td className="px-4 py-4 text-center text-slate-600">{metrics.outgoingAvgTT}</td>
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
