import { useState, useEffect, useRef } from "react";

type CallRecord = {
  id: number;
  user_id: string;
  agent_name: string | null;
  phone_number: string;
  call_type: string;
  call_status: string;
  duration_seconds: number;
  created_at: string;
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type CallLogsPageProps = {
  refreshTrigger?: number;
};

export default function CallLogsPage({ refreshTrigger = 0 }: CallLogsPageProps) {
  // State variables matching URL parameters
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [range, setRange] = useState<string>("7days"); // Default preset
  const [searchInput, setSearchInput] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Call data states
  const [logs, setLogs] = useState<CallRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Export states
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // References for scrolling
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Parse URL query parameters on mount to hydrate filter state
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("page");
    const l = params.get("limit");
    const r = params.get("range");
    const s = params.get("search");
    const sb = params.get("sortBy");
    const so = params.get("sortOrder");

    if (p) setPage(Math.max(1, parseInt(p) || 1));
    if (l) setLimit(parseInt(l) || 50);
    if (r) setRange(r);
    if (s) {
      setSearchInput(s);
      setSearch(s);
    }
    if (sb) setSortBy(sb);
    if (so) setSortOrder(so === "asc" ? "asc" : "desc");
  }, []);

  // Update URL query parameters whenever the search or pagination state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("view", "call-logs");
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("range", range);
    params.set("search", search);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [page, limit, range, search, sortBy, sortOrder]);

  // Debounce search input (400ms delay)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset to first page on search query change
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Fetch call logs from endpoint
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("shoption_admin_token");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(
          `/api/call-logs?page=${page}&limit=${limit}&range=${range}&search=${encodeURIComponent(
            search
          )}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
          { headers }
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("You do not have access to these logs.");
          }
          throw new Error(`Error ${res.status}: Failed to fetch logs.`);
        }

        const payload = await res.json();
        setLogs(payload.data || []);
        setPagination(
          payload.pagination || {
            page: 1,
            limit: 50,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        console.error("Fetch Call Logs Failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load call logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, limit, range, search, sortBy, sortOrder, refreshTrigger]);

  // Helper formatting functions
  const formatDateTime = (dateVal: Date | string) => {
    if (!dateVal) return "-";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, "0");
    return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
  };

  const formatDuration = (seconds: number) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const hrsStr = hrs > 0 ? String(hrs).padStart(2, "0") + ":" : "";
    const minsStr = String(mins).padStart(2, "0");
    const secsStr = String(secs).padStart(2, "0");
    return `${hrsStr}${minsStr}:${secsStr}`;
  };

  // Toggle sort order
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(columnKey);
      setSortOrder("desc"); // Default to desc order on new sort column selection
    }
    setPage(1);
  };

  // Handle exports via inline fetching and blob download
  const handleExport = async (format: "excel" | "pdf") => {
    if (format === "excel") setIsExportingExcel(true);
    else setIsExportingPdf(true);

    try {
      const token = localStorage.getItem("shoption_admin_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(
        `/api/call-logs/export?format=${format}&range=${range}&search=${encodeURIComponent(
          search
        )}`,
        { headers }
      );

      if (!res.ok) {
        throw new Error(`Export failed. Code: ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `call-logs-${range || "all"}-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : "pdf"
        }`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      if (format === "excel") setIsExportingExcel(false);
      else setIsExportingPdf(false);
    }
  };

  // Page index range selector calculation
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // Smooth scroll view triggers
  const executeScrollToTableTop = (targetPage: number) => {
    setPage(targetPage);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* 1. Header Filter & Tools Row */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div className="flex flex-col gap-0.5 text-left">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text">Get organization Data</h2>
            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {pagination.total.toLocaleString()} Total
            </span>
          </div>
          <p className="text-xs text-text-secondary font-semibold">
            Monitor calling statistics, search customer contact numbers, and audit recording schedules.
          </p>
        </div>

        {/* Dynamic Controls Layout */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          {/* A. Preset Selector Tab Pills */}
          <div className="flex bg-slate-900/60 rounded-full p-1 border border-slate-800/40 shrink-0">
            {[
              { id: "today", label: "Today" },
              { id: "7days", label: "7 Days" },
              { id: "month", label: "Month" },
              { id: "6months", label: "6 Months" },
              { id: "1year", label: "1 Year" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setRange(preset.id);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none border-0 bg-transparent ${range === preset.id
                  ? "bg-primary text-white shadow-sm font-bold"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
                  }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* B. Debounced Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search agent name or number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-850 bg-slate-900/40 text-xs outline-none transition focus:border-primary font-semibold text-text placeholder:text-text-secondary/40"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary/50 hover:text-text cursor-pointer border-0 bg-transparent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* C. Export Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleExport("excel")}
              disabled={isExportingExcel || loading || logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 disabled:opacity-35 text-xs font-bold transition-all text-text flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed border-0"
              title="Export all matching records to Excel"
            >
              {isExportingExcel ? (
                <div className="w-3.5 h-3.5 border-2 border-text-secondary border-t-text rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                </svg>
              )}
              Export Excel
            </button>

            <button
              onClick={() => handleExport("pdf")}
              disabled={isExportingPdf || loading || logs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 disabled:opacity-35 text-xs font-bold transition-all text-text flex items-center gap-2 cursor-pointer shadow-sm disabled:cursor-not-allowed border-0"
              title="Export all matching records to PDF"
            >
              {isExportingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-text-secondary border-t-text rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                </svg>
              )}
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-text-secondary/55 text-left italic font-medium -mt-2">
        ℹ️ Excel and PDF exports download the full list of matching records.
      </div>

      {/* 2. Main Card Container containing the Table */}
      <div
        ref={tableContainerRef}
        className="bg-card border border-slate-800/40 rounded-2xl shadow-2xl overflow-hidden flex-1 flex flex-col min-h-0 scroll-mt-20"
      >
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full divide-y divide-slate-800/35 text-left text-xs font-semibold border-collapse">
            <thead className="text-text-secondary uppercase tracking-wider font-bold bg-card/95 sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(255,255,255,0.02)]">
              <tr>
                <th className="px-5 py-3.5 bg-card min-w-[50px] select-none text-[10px]">#</th>
                <th
                  onClick={() => handleSort("agent_name")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Agent / Caller Name
                    {sortBy === "agent_name" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("phone_number")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Contact Number
                    {sortBy === "phone_number" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("call_type")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Direction
                    {sortBy === "call_type" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("call_status")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Status
                    {sortBy === "call_status" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("created_at")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Start Time
                    {sortBy === "created_at" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
                <th className="px-5 py-3.5 bg-card text-[10px]">End Time</th>
                <th
                  onClick={() => handleSort("duration_seconds")}
                  className="px-5 py-3.5 bg-card cursor-pointer hover:text-text hover:bg-slate-800/20 select-none text-[10px] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Duration
                    {sortBy === "duration_seconds" && (
                      <span className="text-primary">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/35 bg-card">
              {loading ? (
                // Skeletons Shimmer Loading state
                Array.from({ length: Math.min(10, limit) }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-6" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-24" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-slate-800/60 rounded-full w-16" /></td>
                    <td className="px-5 py-4"><div className="h-5 bg-slate-800/60 rounded-full w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-32" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-32" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-800/60 rounded-xs w-14" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-warning font-semibold">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {error}
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                // Empty search result layout
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="w-12 h-12 text-text-secondary/30" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18M2.25 13.5l1.625-7.312A2.25 2.25 0 016.08 4.5h11.84a2.25 2.25 0 012.205 1.688L21.75 13.5m-18 0V19.5A2.25 2.25 0 006 21.75h12a2.25 2.25 0 002.25-2.25V13.5" />
                      </svg>
                      <div className="font-bold text-sm text-text">No call logs found</div>
                      <div className="text-xs max-w-sm">
                        No call records match your current date filter preset or search criteria. Try modifying your filters.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((row, idx) => {
                  const recordIndex = (page - 1) * limit + idx + 1;
                  const isIncoming = (row.call_type || "").toLowerCase() === "incoming";

                  // Status matching logic
                  const status = (row.call_status || "").toLowerCase();
                  let statusBadgeClass = "bg-slate-800/40 text-text-secondary border-slate-700/50";
                  if (status === "answered" || status === "dialed") {
                    statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  } else if (status === "missed call" || status === "missed") {
                    statusBadgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                  } else if (status === "dropped call" || status === "dropped") {
                    statusBadgeClass = "bg-slate-500/10 text-text-secondary border-slate-500/20";
                  }

                  const startDate = new Date(row.created_at);
                  const endDate = new Date(startDate.getTime() + (row.duration_seconds || 0) * 1000);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-primary/6 transition-colors duration-150 odd:bg-card even:bg-white/2"
                    >
                      {/* Row # */}
                      <td className="px-5 py-3.5 text-text-secondary/70 font-mono text-left">{recordIndex}</td>

                      {/* Agent Name */}
                      <td className="px-5 py-3.5 font-medium text-text text-left">
                        {row.agent_name || <span className="text-text-secondary/40 italic">Unknown User</span>}
                      </td>

                      {/* Contact Number */}
                      <td className="px-5 py-3.5 text-text-secondary font-semibold font-mono text-left text-xs">
                        {row.phone_number || "-"}
                      </td>

                      {/* Direction */}
                      <td className="px-5 py-3.5 text-left">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase border ${isIncoming
                            ? "bg-primary/15 text-primary border-primary/10"
                            : "bg-ai-accent/15 text-ai-accent border-ai-accent/10"
                            }`}
                        >
                          {row.call_type}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-left">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border ${statusBadgeClass}`}
                        >
                          {row.call_status}
                        </span>
                      </td>

                      {/* Start Time */}
                      <td className="px-5 py-3.5 text-text-secondary/90 font-medium text-left text-xs whitespace-nowrap">
                        {formatDateTime(row.created_at)}
                      </td>

                      {/* End Time */}
                      <td className="px-5 py-3.5 text-text-secondary/70 font-medium text-left text-xs whitespace-nowrap">
                        {formatDateTime(endDate)}
                      </td>

                      {/* Duration */}
                      <td className="px-5 py-3.5 text-left font-mono font-bold text-text-secondary text-xs tabular-nums tracking-wider">
                        {formatDuration(row.duration_seconds)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Pagination Control Footer */}
        {logs.length > 0 && (
          <div className="border-t border-slate-800/40 px-5 py-4 bg-slate-950/20 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
            {/* Left showing stats */}
            <div className="text-text-secondary font-semibold text-xs order-2 md:order-1">
              Showing{" "}
              <span className="text-text">
                {Math.min(pagination.total, (page - 1) * limit + 1)}
              </span>{" "}
              –{" "}
              <span className="text-text">
                {Math.min(pagination.total, page * limit)}
              </span>{" "}
              of <span className="text-text font-bold">{pagination.total.toLocaleString()}</span>{" "}
              records
            </div>

            {/* Right pagination controls */}
            <div className="flex flex-wrap items-center gap-4 order-1 md:order-2">
              {/* Rows Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-text-secondary text-[11px] font-semibold">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-primary text-text font-semibold cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page selectors */}
              <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                  onClick={() => executeScrollToTableTop(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-800 text-text-secondary hover:text-text disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed bg-transparent"
                  title="Previous Page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                {/* Number selector buttons list */}
                {getPageNumbers().map((pageNum, idx) => {
                  const isEllipsis = typeof pageNum === "string";
                  const isCurrent = pageNum === page;

                  if (isEllipsis) {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2.5 py-1 text-text-secondary/60 text-xs font-bold"
                      >
                        {pageNum}
                      </span>
                    );
                  }

                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => executeScrollToTableTop(pageNum as number)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${isCurrent
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/10"
                        : "bg-transparent text-text-secondary border-slate-850 hover:border-slate-700 hover:text-text"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() => executeScrollToTableTop(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-800 text-text-secondary hover:text-text disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed bg-transparent"
                  title="Next Page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
