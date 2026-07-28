import { useState, useEffect, useMemo } from "react";
import type { UserRecord, EmployeeRecord, ReportResponse } from "./types";

type RoleTableProps = {
  users: UserRecord[];
  employees: EmployeeRecord[];
  onToggleTrackingNeeded?: (empId: string, currentVal: boolean) => void;
  report: ReportResponse | null;
};



function parseDbTimestamp(tsStr: string): Date | null {
  if (!tsStr) return null;

  // Try standard ISO parsing first
  if (tsStr.includes("T") || tsStr.includes("Z")) {
    const d = new Date(tsStr);
    if (!isNaN(d.getTime())) return d;
  }

  const parts = tsStr.trim().split(/\s+/);
  if (parts.length < 2) {
    const d = new Date(tsStr);
    if (!isNaN(d.getTime())) return d;
    return null;
  }
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
  const [roleFilter, setRoleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [fromTime, setFromTime] = useState("");
  const [toDate, setToDate] = useState("");
  const [toTime, setToTime] = useState("");
  const [selectedReportUser, setSelectedReportUser] = useState<UserRecord | null>(null);
  const [modalTab, setModalTab] = useState<"missed" | "all">("missed");
  const [registryPreset, setRegistryPreset] = useState<"today" | "1m" | "3m" | "overall" | "">("today");
  const [sortBy, setSortBy] = useState<"totalCalls" | "totalTalktime">("totalCalls");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const formatDateToYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleRegistryPreset = (preset: "today" | "1m" | "3m" | "overall") => {
    setRegistryPreset(preset);
    if (preset === "overall") {
      setFromDate("");
      setFromTime("");
      setToDate("");
      setToTime("");
    } else {
      const end = new Date();
      const start = new Date();
      if (preset === "today") {
        // start is today
      } else if (preset === "1m") {
        start.setMonth(end.getMonth() - 1);
      } else if (preset === "3m") {
        start.setMonth(end.getMonth() - 3);
      }
      setFromDate(formatDateToYYYYMMDD(start));
      setFromTime(preset === "today" ? "09:30" : "00:00");
      setToDate(formatDateToYYYYMMDD(end));
      setToTime(preset === "today" ? "19:30" : "23:59");
    }
  };

  useEffect(() => {
    handleRegistryPreset("today");
  }, []);

  const getMissedCallReportDetails = (user: UserRecord) => {
    const warriorData = report?.warriors?.find((w) => w.warrior_id === user.id);
    if (!warriorData) return [];

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

    // Find all missed calls (incoming missed)
    const missedCalls = calls.filter(c => {
      const type = (c.call_type || "").toLowerCase();
      const status = (c.call_status || "").toLowerCase();
      return type === "incoming" && (status === "missed" || status === "missed call" || status.includes("missed"));
    });

    // Map each missed call to its response details
    return missedCalls.map((mc) => {
      const mcTime = parseDbTimestamp(mc.timestamp);

      // Split missed timestamp into date and time
      let missedDateStr = "-";
      let missedTimeStr = "-";
      if (mcTime) {
        missedDateStr = mcTime.toLocaleDateString();
        missedTimeStr = mcTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        // Fallback split from string if parsing failed
        const pts = mc.timestamp.split(/\s+/);
        if (pts.length >= 2) {
          missedDateStr = pts[0];
          missedTimeStr = pts[1];
        }
      }

      // Find first subsequent successful call (duration > 0)
      let firstResponse: typeof calls[0] | null = null;
      let responseTime: Date | null = null;

      if (mcTime) {
        // Sort remaining calls chronologically to find the earliest response
        const subsequentCalls = calls
          .filter(c => {
            if (c.phone_number !== mc.phone_number) return false;
            const cTime = parseDbTimestamp(c.timestamp);
            return cTime && cTime >= mcTime && c.duration_seconds > 0;
          })
          .sort((a, b) => {
            const timeA = parseDbTimestamp(a.timestamp);
            const timeB = parseDbTimestamp(b.timestamp);
            return (timeA?.getTime() ?? 0) - (timeB?.getTime() ?? 0);
          });

        if (subsequentCalls.length > 0) {
          firstResponse = subsequentCalls[0];
          responseTime = parseDbTimestamp(firstResponse.timestamp);
        }
      }

      let durationStr = "Not Responded";
      let respondedDateStr = "-";
      let respondedTimeStr = "-";
      let responseTypeStr = "-";

      if (firstResponse && responseTime && mcTime) {
        respondedDateStr = responseTime.toLocaleDateString();
        respondedTimeStr = responseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        responseTypeStr = (firstResponse.call_type || "").toUpperCase();

        const diffSecs = Math.floor((responseTime.getTime() - mcTime.getTime()) / 1000);
        if (diffSecs >= 0) {
          const hrs = Math.floor(diffSecs / 3600);
          const mins = Math.floor((diffSecs % 3600) / 60);
          const secs = diffSecs % 60;
          durationStr = `${hrs > 0 ? `${hrs}h ` : ""}${mins}m ${secs}s`;
        }
      }

      return {
        number: mc.phone_number,
        missedDate: missedDateStr,
        missedTime: missedTimeStr,
        respondDuration: durationStr,
        respondedDate: respondedDateStr,
        respondedTime: respondedTimeStr,
        responseType: responseTypeStr
      };
    });
  };

  const getAllCallLogsDetails = (user: UserRecord) => {
    const warriorData = report?.warriors?.find((w) => w.warrior_id === user.id);
    if (!warriorData) return [];

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

    // Sort calls chronologically (newest first)
    const sortedCalls = [...calls].sort((a, b) => {
      const timeA = parseDbTimestamp(a.timestamp);
      const timeB = parseDbTimestamp(b.timestamp);
      return (timeB?.getTime() ?? 0) - (timeA?.getTime() ?? 0);
    });

    return sortedCalls.map((c) => {
      const cTime = parseDbTimestamp(c.timestamp);
      let dateStr = "-";
      let timeStr = "-";
      if (cTime) {
        dateStr = cTime.toLocaleDateString();
        timeStr = cTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        const pts = c.timestamp.split(/\s+/);
        if (pts.length >= 2) {
          dateStr = pts[0];
          timeStr = pts[1];
        }
      }

      // Format duration
      let durationStr = "0s";
      if (c.duration_seconds > 0) {
        const hrs = Math.floor(c.duration_seconds / 3600);
        const mins = Math.floor((c.duration_seconds % 3600) / 60);
        const secs = c.duration_seconds % 60;
        durationStr = `${hrs > 0 ? `${hrs}h ` : ""}${mins > 0 ? `${mins}m ` : ""}${secs}s`;
      }

      return {
        number: c.phone_number,
        type: (c.call_type || "").toUpperCase(),
        date: dateStr,
        time: timeStr,
        duration: durationStr,
        status: c.call_status || "Unknown",
      };
    });
  };

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
        totalDurationSeconds: 0,
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
      const isMissed = isIncoming && (status === "missed" || status === "missed call" || status.includes("missed"));

      // Dialed call: outgoing but no answer/not accepted/not successful
      const isDialed = isOutgoing && (status === "missed" || status === "missed call" || status.includes("missed") || status === "dialed" || status.includes("dialed") || status === "dropped" || status === "rejected" || status === "failed" || c.duration_seconds === 0 || isDropped);

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
        dialed++;
        if (isSuccess) {
          outgoingSuccessReceived++;
          outgoingTotalSeconds += c.duration_seconds || 0;
        }
      }
    });

    // Calculate missed not responded
    let missedNotResponded = 0;
    const missedCalls = calls.filter(c => {
      const type = (c.call_type || "").toLowerCase();
      const status = (c.call_status || "").toLowerCase();
      return type === "incoming" && (status === "missed" || status === "missed call" || status.includes("missed"));
    });

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
      totalCalls: incomingCalls + totalOutgoingCalls + missed,
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
      totalDurationSeconds,
      incomingTotalSeconds,
      outgoingTotalSeconds,
      incomingSuccessAnswered,
    };
  };

  const handleSort = (field: "totalCalls" | "totalTalktime") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortUsersWithMetrics = (userList: { user: UserRecord; metrics: ReturnType<typeof getUserCallMetrics> }[]) => {
    return [...userList].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "totalTalktime") {
        valA = a.metrics.totalDurationSeconds;
        valB = b.metrics.totalDurationSeconds;
      } else {
        valA = a.metrics.totalCalls;
        valB = b.metrics.totalCalls;
      }
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });
  };

  // Split search query by commas or newlines to support multi-term searches (e.g. pasted from Excel)
  const searchQueries = searchQuery
    .split(/[,\r\n]/)
    .map((q) => q.trim().toLowerCase())
    .filter(Boolean);

  // Filter users by search queries and role filter
  const filteredUsers = users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) {
      return false;
    }
    if (searchQueries.length === 0) return true;

    const dept = u.department || "Unassigned";
    const roleNormalized = (u.role || "").replace(/_/g, " ").toLowerCase();
    const roleOriginal = (u.role || "").toLowerCase();
    const fullName = (u.full_name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const systemId = (u.system_id || "").toLowerCase();
    const deptLower = dept.toLowerCase();

    return searchQueries.some((q) =>
      fullName.includes(q) ||
      email.includes(q) ||
      roleOriginal.includes(q) ||
      roleNormalized.includes(q) ||
      systemId.includes(q) ||
      deptLower.includes(q)
    );
  });

  const usersWithMetrics = useMemo(() => {
    return filteredUsers.map((user) => ({
      user,
      metrics: getUserCallMetrics(user.id),
    }));
  }, [filteredUsers, report, fromDate, fromTime, toDate, toTime]);

  const sortedUsersWithMetrics = useMemo(() => {
    return sortUsersWithMetrics(usersWithMetrics);
  }, [usersWithMetrics, sortBy, sortOrder]);

  const summaryMetrics = useMemo(() => {
    let totalCalls = 0;
    let totalSuccessCalls = 0;
    let missed = 0;
    let missedNotResponded = 0;
    let totalDurationSeconds = 0;
    let incomingCalls = 0;
    let incomingTotalSeconds = 0;
    let incomingSuccessAnswered = 0;
    let dialed = 0;
    let outgoingSuccessReceived = 0;
    let outgoingTotalSeconds = 0;

    usersWithMetrics.forEach(({ metrics }) => {
      totalCalls += metrics.totalCalls;
      totalSuccessCalls += metrics.totalSuccessCalls;
      missed += metrics.missed;
      missedNotResponded += metrics.missedNotResponded;
      totalDurationSeconds += metrics.totalDurationSeconds;
      incomingCalls += metrics.incomingCalls;
      incomingTotalSeconds += metrics.incomingTotalSeconds || 0;
      incomingSuccessAnswered += metrics.incomingSuccessAnswered || 0;
      dialed += metrics.dialed;
      outgoingSuccessReceived += metrics.outgoingSuccessReceived;
      outgoingTotalSeconds += metrics.outgoingTotalSeconds || 0;
    });

    return {
      totalCalls,
      totalSuccessCalls,
      missed,
      missedNotResponded,
      totalTalktime: formatToHHMM(totalDurationSeconds),
      avgCalltime: formatToMMSS(totalSuccessCalls > 0 ? totalDurationSeconds / totalSuccessCalls : 0),
      incomingCalls,
      incomingTalktime: formatToHHMM(incomingTotalSeconds),
      incomingAvgTT: formatToMMSS(incomingSuccessAnswered > 0 ? incomingTotalSeconds / incomingSuccessAnswered : 0),
      dialed,
      outgoingSuccessReceived,
      outgoingTalktime: formatToHHMM(outgoingTotalSeconds),
      outgoingAvgTT: formatToMMSS(outgoingSuccessReceived > 0 ? outgoingTotalSeconds / outgoingSuccessReceived : 0),
    };
  }, [usersWithMetrics]);

  // Filter employees by search queries
  const filteredEmployees = employees.filter((emp) => {
    if (searchQueries.length === 0) return true;

    const dept = emp.department || "Unassigned";
    const empId = (emp.employee_id || "").toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const systemId = (emp.system_id || "").toLowerCase();
    const deptLower = dept.toLowerCase();

    return searchQueries.some((q) =>
      empId.includes(q) ||
      email.includes(q) ||
      systemId.includes(q) ||
      deptLower.includes(q)
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

    const rows = sortedUsersWithMetrics.map(({ user, metrics }) => [
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

    rows.push([
      "Total Summary",
      "",
      summaryMetrics.totalCalls,
      summaryMetrics.totalSuccessCalls,
      summaryMetrics.missed,
      summaryMetrics.missedNotResponded,
      summaryMetrics.totalTalktime,
      summaryMetrics.avgCalltime,
      summaryMetrics.incomingCalls,
      summaryMetrics.incomingTalktime,
      summaryMetrics.incomingAvgTT,
      summaryMetrics.dialed,
      summaryMetrics.outgoingSuccessReceived,
      summaryMetrics.outgoingTalktime,
      summaryMetrics.outgoingAvgTT
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

    let tableRows = sortedUsersWithMetrics.map(({ user, metrics }) => `
        <tr>
          <td><b>${user.full_name}</b></td>
          <td style="color: #04693F; font-weight: bold;">${user.role.replace("_", " ").toUpperCase()} / ${user.department || "Unassigned"}</td>
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

    tableRows += `
      <tr style="background-color: #f8fafc; font-weight: bold; border-top: 2px solid #04693F;">
        <td><b>Total Summary</b></td>
        <td></td>
        <td>${summaryMetrics.totalCalls}</td>
        <td>${summaryMetrics.totalSuccessCalls}</td>
        <td>${summaryMetrics.missed}</td>
        <td>${summaryMetrics.missedNotResponded}</td>
        <td>${summaryMetrics.totalTalktime}</td>
        <td>${summaryMetrics.avgCalltime}</td>
        <td>${summaryMetrics.incomingCalls}</td>
        <td>${summaryMetrics.incomingTalktime}</td>
        <td>${summaryMetrics.incomingAvgTT}</td>
        <td>${summaryMetrics.dialed}</td>
        <td>${summaryMetrics.outgoingSuccessReceived}</td>
        <td>${summaryMetrics.outgoingTalktime}</td>
        <td>${summaryMetrics.outgoingAvgTT}</td>
      </tr>
    `;

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
                <th>NAME</th>
                <th>ROLE / DEPT</th>
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
    <div className="bg-[#0E1528] border border-slate-800/80 rounded-2xl shadow-sm overflow-hidden mt-3 flex-1 flex flex-col min-h-0 text-[#F8FAFC]">
      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-[#0E1528] p-1.5 gap-1.5">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === "users"
            ? "bg-slate-800 text-[#1F8FFF] shadow-sm"
            : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/50"
            }`}
        >
          Active Users Directory ({filteredUsers.length})
        </button>
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${activeTab === "registry"
            ? "bg-slate-800 text-[#1F8FFF] shadow-sm"
            : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/50"
            }`}
        >
          Employee Registry ({filteredEmployees.length})
        </button>
      </div>

      {/* ERP Control Panel */}
      <div className="p-2 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        {/* Search & Role Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 max-w-lg">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              placeholder={activeTab === "users" ? "Search active users by name, email, role..." : "Search registered..."}
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
              className="w-full rounded-full border border-slate-800 bg-[#050816] px-3 py-1.5 pl-8 text-xs outline-none transition focus:border-[#1F8FFF] focus:ring-1 focus:ring-[#1F8FFF]/10 font-semibold text-[#F8FAFC] placeholder-[#94A3B8]/50"
            />
            {/* Search Icon */}
            <svg
              className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Role Filter Dropdown */}
          {activeTab === "users" && (
            <div className="relative min-w-[130px]">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-full border border-slate-800 bg-[#050816] px-3 py-1.5 text-xs outline-none text-[#F8FAFC] font-semibold transition focus:border-[#1F8FFF] cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="group_leader">Group Leader</option>
                <option value="warrior">Warrior</option>
              </select>
            </div>
          )}
        </div>

        {/* Date & Time Range Filters */}
        {activeTab === "users" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Range Presets */}
            <div className="flex bg-slate-950/60 rounded-lg p-0.5 border border-slate-800 shrink-0">
              {[
                { id: "today", label: "Today" },
                { id: "1m", label: "1 Month" },
                { id: "3m", label: "3 Months" },
                { id: "overall", label: "Overall" }
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleRegistryPreset(preset.id as any)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${registryPreset === preset.id
                    ? "bg-primary text-text shadow-xs font-black"
                    : "text-text-secondary hover:text-text"
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/40 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider whitespace-nowrap">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setRegistryPreset("");
                }}
                className="rounded border border-slate-800 bg-[#050816] px-1.5 py-0.5 text-xs font-semibold text-[#F8FAFC] outline-none transition focus:border-[#1F8FFF]"
              />
              <input
                type="time"
                value={fromTime}
                onChange={(e) => {
                  setFromTime(e.target.value);
                  setRegistryPreset("");
                }}
                className="rounded border border-slate-800 bg-[#050816] px-1.5 py-0.5 text-xs font-semibold text-[#F8FAFC] outline-none transition focus:border-[#1F8FFF]"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/40 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider whitespace-nowrap">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setRegistryPreset("");
                }}
                className="rounded border border-slate-800 bg-[#050816] px-1.5 py-0.5 text-xs font-semibold text-[#F8FAFC] outline-none transition focus:border-[#1F8FFF]"
              />
              <input
                type="time"
                value={toTime}
                onChange={(e) => {
                  setToTime(e.target.value);
                  setRegistryPreset("");
                }}
                className="rounded border border-slate-800 bg-[#050816] px-1.5 py-0.5 text-xs font-semibold text-[#F8FAFC] outline-none transition focus:border-[#1F8FFF]"
              />
            </div>
          </div>
        )}

        {/* Clear Filters Button */}
        {(searchQuery || roleFilter || registryPreset !== "today") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              handleRegistryPreset("today");
            }}
            className="text-rose-400 hover:text-rose-300 text-[10px] font-bold transition-all whitespace-nowrap"
          >
            Clear Filters
          </button>
        )}

        {/* Export Buttons */}
        {activeTab === "users" && (
          <div className="flex gap-1.5">
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1 rounded-md border border-slate-800 bg-[#050816] hover:bg-slate-850 text-[#F8FAFC] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#1F8FFF]/10 to-[#8B5CF6]/10 border border-[#1F8FFF]/30 hover:opacity-95 text-[#1F8FFF] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
            >
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto overflow-y-auto flex-1">
        {activeTab === "users" ? (
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-semibold border-collapse">
            <thead className="text-[#94A3B8] uppercase tracking-wider font-bold">
              <tr>
                <th className="px-3 py-3 sticky top-0 left-0 z-30 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] border-r border-slate-800 text-center min-w-[50px]">
                  <div className="leading-tight text-[10px] font-bold text-[#F8FAFC]">#</div>
                </th>
                <th className="px-4 py-3 sticky top-0 left-[50px] z-30 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] border-r border-slate-800 text-left min-w-[140px]">
                  <div className="leading-tight text-[10px] font-bold text-[#F8FAFC]">NAME</div>
                </th>
                <th className="px-3 py-3 text-left sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[10px] font-bold leading-tight min-w-[150px]">
                  <div>ROLE / DEPT</div>
                </th>
                <th
                  onClick={() => handleSort("totalCalls")}
                  className={`px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[90px] border-l-2 border-slate-500 border-r border-slate-800/40 cursor-pointer select-none transition-all hover:bg-slate-800/60 ${sortBy === "totalCalls" ? "text-[#1F8FFF]" : "text-[#94A3B8]"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1 justify-center w-full">
                      <span>TOTAL</span>
                      {sortBy === "totalCalls" && (
                        <span className="text-[#1F8FFF] text-[10px]">{sortOrder === "desc" ? "▼" : "▲"}</span>
                      )}
                    </div>
                    <div>CALLS</div>
                  </div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[125px] border-r border-slate-800/40">
                  <div>TOTAL SUCCESS</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[110px] border-r border-slate-800/40">
                  <div>TOTAL MISSED</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[145px] border-r border-slate-800/40">
                  <div>TOTAL MISSED</div>
                  <div>NOT RESPONDED</div>
                </th>
                <th
                  onClick={() => handleSort("totalTalktime")}
                  className={`px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[125px] border-r border-slate-800/40 cursor-pointer select-none transition-all hover:bg-slate-800/60 ${sortBy === "totalTalktime" ? "text-[#1F8FFF]" : "text-[#94A3B8]"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1 justify-center w-full">
                      <span>TOTAL TALKTIME</span>
                      {sortBy === "totalTalktime" && (
                        <span className="text-[#1F8FFF] text-[10px]">{sortOrder === "desc" ? "▼" : "▲"}</span>
                      )}
                    </div>
                    <div>(HH:MM)</div>
                  </div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[110px] border-r-2 border-slate-500">
                  <div>AVERAGE CALL</div>
                  <div>TIME (MM:SS)</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[130px] border-l-2 border-slate-500 border-r border-slate-800/40">
                  <div>TOTAL INCOMING</div>
                  <div>CALLS</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[100px] border-r border-slate-800/40">
                  <div>INCOMING</div>
                  <div>TALKTIME</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[125px] border-r-2 border-slate-500">
                  <div>INCOMING</div>
                  <div>AVR. CALL TT</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[90px] border-l-2 border-slate-500 border-r border-slate-800/40">
                  <div>TOTAL</div>
                  <div>DIALED</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[125px] border-r border-slate-800/40">
                  <div>TOTAL SUCCESS</div>
                  <div>DIALED</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[100px] border-r border-slate-800/40">
                  <div>OUTGOING</div>
                  <div>TALKTIME</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[125px] border-r-2 border-slate-500">
                  <div>OUTCOMING</div>
                  <div>AVR. CALL TT</div>
                </th>
                <th className="px-3 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-[9px] font-bold leading-tight min-w-[110px]">
                  <div>ACTION</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-[#0E1528]">
              {sortedUsersWithMetrics.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-6 py-10 text-center text-[#94A3B8]/60 font-medium">
                    No active users match the current hierarchy or search filters.
                  </td>
                </tr>
              ) : (
                <>
                  {sortedUsersWithMetrics.map(({ user, metrics }, idx) => {
                    const isTodayPreset = registryPreset === "today";
                    const isSearching = searchQueries.length > 0;
                    // Less than 4 hours (14400 seconds)
                    const isBelowTarget = metrics.totalDurationSeconds < 14400;
                    const showBlink = isTodayPreset && isSearching && isBelowTarget;

                    return (
                      <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-3 py-2 sticky left-0 z-20 bg-[#0E1528] group-hover:bg-slate-800/40 transition-colors border-r border-slate-800 text-center font-bold text-[#94A3B8] text-xs w-[50px] min-w-[50px]">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 sticky left-[50px] z-20 bg-[#0E1528] group-hover:bg-slate-800/40 transition-colors border-r border-slate-800 font-bold text-[#F8FAFC] text-xs truncate max-w-[150px]" title={user.full_name}>
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="truncate flex-1">{user.full_name}</span>
                            {showBlink && (
                              <span className="relative flex h-2 w-2 shrink-0" title="Talktime less than 4 hours today!">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-left text-xs font-bold text-[#1F8FFF] whitespace-nowrap">
                          {user.role.replace("_", " ").toUpperCase()} / {user.department || "Unassigned"}
                        </td>
                        <td className="px-4 py-2 text-center text-sm font-bold text-[#F8FAFC] border-l-2 border-slate-500 border-r border-slate-800/40">{metrics.totalCalls}</td>
                        <td className="px-4 py-2 text-center text-sm font-bold text-[#00E6B8] border-r border-slate-800/40">{metrics.totalSuccessCalls}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-r border-slate-800/40">{metrics.missed}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-r border-slate-800/40">{metrics.missedNotResponded}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] font-medium border-r border-slate-800/40">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={showBlink ? "text-rose-400 font-black animate-pulse" : ""}>{metrics.totalTalktime}</span>
                            {showBlink && (
                              <span className="relative flex h-2 w-2 shrink-0" title="Talktime less than 4 hours today!">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] font-medium border-r-2 border-slate-500">{metrics.avgCalltime}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-l-2 border-slate-500 border-r border-slate-800/40">{metrics.incomingCalls}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-r border-slate-800/40">{metrics.incomingTalktime}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] font-medium border-r-2 border-slate-500">{metrics.incomingAvgTT}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-l-2 border-slate-500 border-r border-slate-800/40">{metrics.dialed}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-r border-slate-800/40">{metrics.outgoingSuccessReceived}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] border-r border-slate-800/40">{metrics.outgoingTalktime}</td>
                        <td className="px-4 py-2 text-center text-[#94A3B8] font-medium border-r-2 border-slate-500">{metrics.outgoingAvgTT}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => setSelectedReportUser(user)}
                            className="px-2.5 py-1 rounded-md bg-gradient-to-r from-[#1F8FFF]/10 to-[#8B5CF6]/10 border border-[#1F8FFF]/25 hover:opacity-90 text-[#1F8FFF] text-[10px] font-bold transition-all shadow-xs whitespace-nowrap"
                          >
                            View Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900/60 font-bold border-t-2 border-slate-700 hover:bg-slate-800/20 transition-colors">
                    <td className="px-3 py-3 text-center text-[#94A3B8] text-xs border-r border-slate-800 font-extrabold">-</td>
                    <td className="px-4 py-3 text-left text-xs font-black text-white border-r border-slate-800 uppercase tracking-wider sticky left-[50px] z-20 bg-[#0E1528] group-hover:bg-slate-800/40 transition-colors">
                      Total Summary
                    </td>
                    <td className="px-3 py-3 text-left text-xs text-[#94A3B8] font-extrabold">-</td>
                    <td className="px-4 py-3 text-center text-sm font-black text-[#F8FAFC] border-l-2 border-slate-500 border-r border-slate-800/40 bg-slate-900/40">{summaryMetrics.totalCalls}</td>
                    <td className="px-4 py-3 text-center text-sm font-black text-[#00E6B8] border-r border-slate-800/40 bg-slate-900/40">{summaryMetrics.totalSuccessCalls}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-r border-slate-800/40">{summaryMetrics.missed}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-r border-slate-800/40">{summaryMetrics.missedNotResponded}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] font-bold border-r border-slate-800/40">{summaryMetrics.totalTalktime}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] font-bold border-r-2 border-slate-500">{summaryMetrics.avgCalltime}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-l-2 border-slate-500 border-r border-slate-800/40">{summaryMetrics.incomingCalls}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-r border-slate-800/40">{summaryMetrics.incomingTalktime}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] font-bold border-r-2 border-slate-500">{summaryMetrics.incomingAvgTT}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-l-2 border-slate-500 border-r border-slate-800/40">{summaryMetrics.dialed}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-r border-slate-800/40">{summaryMetrics.outgoingSuccessReceived}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] border-r border-slate-800/40">{summaryMetrics.outgoingTalktime}</td>
                    <td className="px-4 py-3 text-center text-[#94A3B8] font-bold border-r-2 border-slate-500">{summaryMetrics.outgoingAvgTT}</td>
                    <td className="px-3 py-3 text-center text-xs text-[#94A3B8] font-extrabold">-</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm border-collapse">
            <thead className="text-[#94A3B8] uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] text-center w-[60px] border-r border-slate-800 font-bold">#</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">Employee ID / Email</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">System ID</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">Department</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">Created Date</th>
                <th className="px-6 py-4 sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">Call Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-[#0E1528]">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#94A3B8]/60 font-medium">
                    No registered employees match the search filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-center text-xs font-bold text-[#94A3B8] border-r border-slate-800">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#F8FAFC]">{emp.employee_id}</div>
                      <div className="text-xs text-[#94A3B8] font-medium">{emp.email ?? "No email provided"}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#1F8FFF]">
                      {emp.system_id}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#F8FAFC]">
                      {emp.department || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] font-medium">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onToggleTrackingNeeded?.(emp.employee_id, emp.is_tracking_needed)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${emp.is_tracking_needed
                          ? "bg-gradient-to-r from-[#00E6B8]/10 to-[#1F8FFF]/10 text-[#00E6B8] border-[#00E6B8]/30 hover:opacity-90"
                          : "bg-[#050816] text-[#94A3B8] border-slate-850 hover:bg-slate-800/40"
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

      {/* Detailed Call Analytics Report Modal Overlay */}
      {selectedReportUser && (() => {
        const reportData = getMissedCallReportDetails(selectedReportUser);
        const allLogsData = getAllCallLogsDetails(selectedReportUser);
        const userName = selectedReportUser.full_name;
        const userDept = selectedReportUser.department || "Unassigned";

        const handleModalPrint = () => {
          const printWindow = window.open("", "_blank");
          if (!printWindow) return;

          if (modalTab === "missed") {
            const rowsHtml = reportData.map((row) => `
              <tr>
                <td>${row.number}</td>
                <td>${row.missedDate}</td>
                <td>${row.missedTime}</td>
                <td>${row.respondDuration}</td>
                <td>${row.respondedDate}</td>
                <td>${row.respondedTime}</td>
                <td>${row.responseType}</td>
              </tr>
            `).join("");

            printWindow.document.write(`
              <html>
                <head>
                  <title>Missed Call Detailed Report - ${userName}</title>
                  <style>
                    body { font-family: system-ui, sans-serif; margin: 40px; color: #1e293b; }
                    h1 { font-size: 18px; font-weight: 800; color: #04693F; margin-bottom: 2px; }
                    h2 { font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 20px; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 15px; }
                    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
                    th { background-color: #f8fafc; font-weight: 700; color: #04693F; }
                  </style>
                </head>
                <body>
                  <h1>MISSED CALL DETAILED REPORT</h1>
                  <h2>NAME: ${userName} &nbsp;&bull;&nbsp; DEPT: ${userDept}</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>NUMBER</th>
                        <th>MISSED DATE</th>
                        <th>MISSED TIME</th>
                        <th>NO RESPOND DURATION</th>
                        <th>RESPONDED DATE</th>
                        <th>RESPONDED TIME</th>
                        <th>RESPONSE TYPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="7">No missed calls recorded.</td></tr>`}
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
          } else {
            const rowsHtml = allLogsData.map((row) => `
              <tr>
                <td>${row.number}</td>
                <td>${row.type}</td>
                <td>${row.date}</td>
                <td>${row.time}</td>
                <td>${row.duration}</td>
                <td>${row.status}</td>
              </tr>
            `).join("");

            printWindow.document.write(`
              <html>
                <head>
                  <title>All Organization Logs Report - ${userName}</title>
                  <style>
                    body { font-family: system-ui, sans-serif; margin: 40px; color: #1e293b; }
                    h1 { font-size: 18px; font-weight: 800; color: #04693F; margin-bottom: 2px; }
                    h2 { font-size: 14px; color: #64748b; margin-top: 0; margin-bottom: 20px; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 15px; }
                    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: center; }
                    th { background-color: #f8fafc; font-weight: 700; color: #04693F; }
                  </style>
                </head>
                <body>
                  <h1>Get Organization Data REPORT</h1>
                  <h2>NAME: ${userName} &nbsp;&bull;&nbsp; DEPT: ${userDept}</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>NUMBER</th>
                        <th>CALL TYPE</th>
                        <th>DATE</th>
                        <th>TIME</th>
                        <th>DURATION</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rowsHtml.length > 0 ? rowsHtml : `<tr><td colspan="6">No calls recorded.</td></tr>`}
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
          }
          printWindow.document.close();
        };

        const handleModalCSV = () => {
          if (modalTab === "missed") {
            const headers = [
              "NAME", "DEPT", "NUMBER", "MISSED DATE", "MISSED TIME", "NO RESPOND DURATION", "RESPONDED DATE", "RESPONDED TIME", "RESPONSE TYPE"
            ];
            const rows = reportData.map((row) => [
              userName,
              userDept,
              row.number,
              row.missedDate,
              row.missedTime,
              row.respondDuration,
              row.respondedDate,
              row.respondedTime,
              row.responseType
            ]);

            const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `missed_call_report_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            const headers = [
              "NAME", "DEPT", "NUMBER", "CALL TYPE", "DATE", "TIME", "DURATION", "STATUS"
            ];
            const rows = allLogsData.map((row) => [
              userName,
              userDept,
              row.number,
              row.type,
              row.date,
              row.time,
              row.duration,
              row.status
            ]);

            const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `all_call_logs_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050816]/75 backdrop-blur-xs">
            <div className="bg-[#0E1528] rounded-3xl border border-slate-800 shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
                <div>
                  <h3 className="text-sm font-black text-[#1F8FFF] uppercase tracking-wider">DETAILED CALL ANALYTICS REPORT</h3>
                  <div className="text-xs font-bold text-[#F8FAFC] mt-0.5">
                    {userName} &nbsp;&bull;&nbsp; <span className="text-[#00E6B8]">{userDept}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReportUser(null)}
                  className="p-1.5 rounded-xl text-[#94A3B8] hover:bg-slate-800 hover:text-[#F8FAFC] transition-all"
                  aria-label="Close Modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Tab Switcher */}
              <div className="flex border-b border-slate-800 bg-slate-900/40 p-1.5 gap-1.5 mx-6 mt-3">
                <button
                  onClick={() => setModalTab("missed")}
                  className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${modalTab === "missed"
                    ? "bg-[#0E1528] text-[#1F8FFF] shadow-xs border border-slate-800"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/50"
                    }`}
                >
                  Missed Call Report ({reportData.length})
                </button>
                <button
                  onClick={() => setModalTab("all")}
                  className={`flex-1 py-1.5 px-4 rounded-xl text-xs font-bold transition-all ${modalTab === "all"
                    ? "bg-[#0E1528] text-[#1F8FFF] shadow-xs border border-slate-800"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-slate-800/50"
                    }`}
                >
                  Total Call Report ({allLogsData.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 pb-6 pt-0 flex-grow overflow-y-auto min-h-0 mt-3">
                {modalTab === "missed" ? (
                  <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-semibold border-collapse">
                    <thead className="text-[#94A3B8] uppercase tracking-wider font-bold bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                      <tr>
                        <th className="px-4 py-3 text-left sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">NUMBER</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">MISSED DATE</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">MISSED TIME</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">NO RESPOND DURATION</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">RESPONDED DATE</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">RESPONDED TIME</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">RESPONSE TYPE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#0E1528]">
                      {reportData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-[#94A3B8]/60 font-medium">
                            No missed calls recorded for this user under the active filters.
                          </td>
                        </tr>
                      ) : (
                        reportData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-left text-sm font-bold text-[#F8FAFC]">{row.number}</td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.missedDate}</td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.missedTime}</td>
                            <td className={`px-4 py-3 text-center font-bold ${row.respondDuration === "Not Responded" ? "text-rose-400" : "text-[#00E6B8]"}`}>
                              {row.respondDuration}
                            </td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.respondedDate}</td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.respondedTime}</td>
                            <td className="px-4 py-3 text-center">
                              {row.responseType !== "-" ? (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.responseType === "INCOMING"
                                  ? "bg-[#00E6B8]/10 text-[#00E6B8] border border-[#00E6B8]/20"
                                  : "bg-[#1F8FFF]/10 text-[#1F8FFF] border border-[#1F8FFF]/20"
                                  }`}>
                                  {row.responseType}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]/60">-</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-semibold border-collapse">
                    <thead className="text-[#94A3B8] uppercase tracking-wider font-bold bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                      <tr>
                        <th className="px-4 py-3 text-left sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">NUMBER</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">CALL TYPE</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">DATE</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">TIME</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">DURATION</th>
                        <th className="px-4 py-3 text-center sticky top-0 z-10 bg-[#0E1528] shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#0E1528]">
                      {allLogsData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-[#94A3B8]/60 font-medium">
                            No call logs recorded for this user under the active filters.
                          </td>
                        </tr>
                      ) : (
                        allLogsData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 text-left text-sm font-bold text-[#F8FAFC]">{row.number}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.type === "INCOMING"
                                ? "bg-[#00E6B8]/10 text-[#00E6B8] border border-[#00E6B8]/20"
                                : "bg-[#1F8FFF]/10 text-[#1F8FFF] border border-[#1F8FFF]/20"
                                }`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.date}</td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.time}</td>
                            <td className="px-4 py-3 text-center text-[#94A3B8]">{row.duration}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status.toLowerCase().includes("missed")
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : row.status.toLowerCase().includes("answered") || row.status.toLowerCase().includes("success")
                                  ? "bg-[#00E6B8]/10 text-[#00E6B8] border border-[#00E6B8]/20"
                                  : "bg-slate-800 text-[#94A3B8] border border-slate-700"
                                }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex justify-end gap-3">
                <button
                  onClick={handleModalCSV}
                  className="px-4 py-2 rounded-xl border border-slate-850 bg-[#050816] hover:bg-slate-800/40 text-[#F8FAFC] text-xs font-bold transition-all"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleModalPrint}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1F8FFF]/10 to-[#8B5CF6]/10 border border-[#1F8FFF]/30 hover:opacity-95 text-[#1F8FFF] text-xs font-bold transition-all"
                >
                  Print Report
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}