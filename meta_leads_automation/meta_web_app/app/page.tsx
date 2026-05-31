"use client";

import { useState, useEffect } from "react";

interface AdAccount {
  id: string;
  name: string;
  pageId: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  adName?: string;
}

interface FieldData {
  name: string;
  values: string[];
}

interface Lead {
  id: string;
  created_time: string;
  field_data: FieldData[];
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  ad_id?: string;
  ad_name?: string;
  platform?: string;
}

export default function Home() {
  const [view, setView] = useState<"accounts" | "campaigns">("accounts");
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  interface DateRangeState {
    fromDate?: string;
    fromHour?: string;
    fromMin?: string;
    fromPeriod?: string;
    toDate?: string;
    toHour?: string;
    toMin?: string;
    toPeriod?: string;
  }

  // Per-campaign state for date ranges and download status
  const [dateRanges, setDateRanges] = useState<{ [campaignId: string]: DateRangeState }>({});
  const [downloadingCampaignId, setDownloadingCampaignId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Fetch Ad Accounts on mount
  useEffect(() => {
    async function fetchAdAccounts() {
      try {
        setLoadingAccounts(true);
        setError(null);
        const res = await fetch("/api/ad-accounts");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load ad accounts");
        }
        const data = await res.json();
        setAdAccounts(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingAccounts(false);
      }
    }
    fetchAdAccounts();
  }, []);

  // Fetch Campaigns when entering campaign view
  const handleSelectAccount = async (account: AdAccount) => {
    setView("campaigns");
    try {
      setLoadingCampaigns(true);
      setError(null);
      const res = await fetch("/api/campaigns");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch campaigns");
      }
      const data = await res.json();
      setCampaigns(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleDateChange = (campaignId: string, field: keyof DateRangeState, value: string) => {
    setDateRanges((prev) => ({
      ...prev,
      [campaignId]: {
        ...prev[campaignId],
        [field]: value,
      },
    }));
  };

  // Helper to fetch leads for a campaign and filter them by date range
  const fetchFilteredLeadsForCampaign = async (campaignId: string, campaignName: string) => {
    setDownloadError(null);
    setDownloadingCampaignId(campaignId);
    try {
      const res = await fetch(`/api/leads?campaignId=${campaignId}&campaignName=${encodeURIComponent(campaignName)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch leads");
      }
      const data = await res.json();
      const rawLeads: Lead[] = data.data || [];

      // Filter leads by date and time
      const range = dateRanges[campaignId] || {};
      
      const parseCampaignDateTime = (r: DateRangeState, type: "from" | "to") => {
        const dateStr = type === "from" ? r.fromDate : r.toDate;
        if (!dateStr) return null;
        
        const hour = type === "from" ? (r.fromHour || "12") : (r.toHour || "11");
        const min = type === "from" ? (r.fromMin || "00") : (r.toMin || "59");
        const period = type === "from" ? (r.fromPeriod || "AM") : (r.toPeriod || "PM");
        
        let hourNum = parseInt(hour, 10);
        if (period === "PM" && hourNum !== 12) {
          hourNum += 12;
        } else if (period === "AM" && hourNum === 12) {
          hourNum = 0;
        }
        
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day, hourNum, parseInt(min, 10), 0, 0);
      };

      const start = parseCampaignDateTime(range, "from");
      const end = parseCampaignDateTime(range, "to");

      return rawLeads.filter((lead) => {
        if (!lead.created_time) return true;
        const leadDate = new Date(lead.created_time);

        if (start && leadDate < start) return false;
        if (end && leadDate > end) return false;

        return true;
      });
    } catch (err: any) {
      setDownloadError(err.message);
      return null;
    } finally {
      setDownloadingCampaignId(null);
    }
  };

  // CSV Helper functions
  const convertToCSV = (headers: string[], rows: string[][]) => {
    const escapeCSV = (val: string) => {
      const formatted = val.replace(/"/g, '""');
      return `"${formatted}"`;
    };
    return [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");
  };

  const triggerDownload = (csvContent: string, filename: string) => {
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Raw CSV
  const handleDownloadRaw = async (campaign: Campaign) => {
    const leads = await fetchFilteredLeadsForCampaign(campaign.id, campaign.name);
    if (!leads) return;

    if (leads.length === 0) {
      alert("No leads found for the selected date range.");
      return;
    }

    // Gather all unique dynamic fields to act as columns
    const uniqueFields = new Set<string>();
    leads.forEach((lead) => {
      lead.field_data?.forEach((fd) => {
        if (fd.name) uniqueFields.add(fd.name);
      });
    });
    const customHeaders = Array.from(uniqueFields);

    const headers = ["Lead ID", "Created Time", ...customHeaders];
    const rows = leads.map((lead) => {
      return [
        lead.id,
        lead.created_time,
        ...customHeaders.map((field) => {
          const matched = lead.field_data?.find((fd) => fd.name === field);
          return matched && matched.values ? matched.values.join(", ") : "";
        }),
      ];
    });

    const csv = convertToCSV(headers, rows);
    const safeName = campaign.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    triggerDownload(csv, `leads_raw_${safeName}.csv`);
  };

  // Export Sanitized CSV
  const handleDownloadSanitized = async (campaign: Campaign) => {
    const leads = await fetchFilteredLeadsForCampaign(campaign.id, campaign.name);
    if (!leads) return;

    if (leads.length === 0) {
      alert("No leads found for the selected date range.");
      return;
    }

    // Exact columns requested by user (no spell-correction, duplicate Coloumn 10 kept)
    const headers = [
      "Full Name",
      "Phone Number",
      "Email",
      "Campaign ID",
      "Source",
      "City",
      "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10",
      "Answer  1", "Answer  2", "Answer  3", "Answer  4", "Answer  5", "Answer  6", "Answer  7", "Answer  8", "Answer  9", "Answer  10",
      "Coloumn 1", "Coloumn 2", "Coloumn 3", "Coloumn 4", "Coloumn 5", "Coloumn 6", "Coloumn 7", "Coloumn 8", "Coloumn 9", "Coloumn 10", "Coloumn 10"
    ];

    const rows = leads.map((lead) => {
      const fieldData = lead.field_data || [];

      // Find standard mapping fields based on spec
      const findFieldVal = (patterns: string[]) => {
        const found = fieldData.find((fd) =>
          patterns.some((p) => fd.name?.toLowerCase().includes(p.toLowerCase()))
        );
        return found && found.values ? found.values.join(", ").trim() : "";
      };

      const nameVal = findFieldVal(["full_name", "name", "नाव", "नाम"]);
      const rawPhone = findFieldVal(["phone_number", "phone", "mobile", "contact", "नंबर", "फोन", "मोबाईल"]);
      
      // Clean phone: extract digits and take the last 10 characters
      const cleanPhone = (phoneStr: string) => {
        const digits = phoneStr.replace(/\D/g, "");
        return digits.length >= 10 ? digits.slice(-10) : digits;
      };
      const phoneVal = cleanPhone(rawPhone);
      
      // Generate email as phoneno@gmail.com
      const emailVal = phoneVal ? `${phoneVal}@gmail.com` : "";
      
      const cityVal = findFieldVal(["city", "town", "address", "पता", "शहर", "गाव", "गांव"]);

      // Identify custom questions (fields that are not standard)
      const standardKeywords = [
        "name", "नाव", "नाम",
        "phone", "mobile", "contact", "नंबर", "फोन", "मोबाईल",
        "email", "ईमेल",
        "city", "town", "address", "पता", "शहर", "गाव", "गांव",
        "zip", "postal", "pin", "पिन", "inbox_url"
      ];
      const customFields = fieldData.filter(
        (fd) => !standardKeywords.some((keyword) => fd.name?.toLowerCase().includes(keyword))
      );

      // Map Q1-Q10 and Answer 1-10
      const qValues: string[] = Array(10).fill("");
      const aValues: string[] = Array(10).fill("");

      customFields.slice(0, 10).forEach((fd, index) => {
        qValues[index] = fd.name ? fd.name.trim() : "";
        aValues[index] = fd.values ? fd.values.join(", ").trim() : "";
      });

      return [
        nameVal,                 // Full Name
        phoneVal,                // Phone Number
        emailVal,                // Email
        campaign.id,             // Campaign ID
        lead.platform || "Meta", // Source (maps to platform ig/fb)
        cityVal,                 // City
        ...qValues,              // Q1 to Q10
        ...aValues,              // Answer 1 to Answer 10
        lead.ad_name || campaign.adName || campaign.name, // Coloumn 1 (ad name or campaign name)
        "",                      // Coloumn 2
        "",                      // Coloumn 3
        "",                      // Coloumn 4
        "",                      // Coloumn 5
        "",                      // Coloumn 6
        "",                      // Coloumn 7
        "",                      // Coloumn 8
        "",                      // Coloumn 9
        "",                      // Coloumn 10
        ""                       // Coloumn 10 (repeated)
      ];
    });

    const csv = convertToCSV(headers, rows);
    const safeName = campaign.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    triggerDownload(csv, `leads_sanitized_${safeName}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view === "campaigns" && (
              <button
                onClick={() => setView("accounts")}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer mr-2"
                title="Go back to Ad Accounts"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20">
              <svg className="h-6 w-6 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-300 via-emerald-300 to-green-400 bg-clip-text text-transparent">
                Meta Leads Automation
              </h1>
              <p className="text-xs text-slate-400">Automated Lead Retrieval & Export</p>
            </div>
          </div>
          <div className="text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Live
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {error && (
          <div className="text-red-400 text-sm py-3 px-4 bg-red-950/30 rounded-xl border border-red-900/50">
            ⚠️ {error}
          </div>
        )}

        {downloadError && (
          <div className="text-red-400 text-sm py-3 px-4 bg-red-950/30 rounded-xl border border-red-900/50">
            ⚠️ {downloadError}
          </div>
        )}

        {/* View 1: Ad Account Selection */}
        {view === "accounts" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Select Ad Account</h2>
              <p className="text-sm text-slate-400 mt-1">Choose the Meta ad account to view active lead campaigns.</p>
            </div>

            {loadingAccounts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-32 bg-slate-800/40 animate-pulse rounded-2xl border border-slate-800"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {adAccounts.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleSelectAccount(account)}
                    className="group bg-slate-950/40 hover:bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
                        Meta Ad Account
                      </div>
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                        {account.name}
                      </h3>
                    </div>
                    <div className="text-xs text-slate-500 font-mono tracking-tight select-all">
                      ID: {account.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* View 2: Campaign Display List */}
        {view === "campaigns" && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-100">GBRU Ads Campaigns</h2>
                <p className="text-sm text-slate-400 mt-1">Select a campaign and date range to extract lead CSV exports.</p>
              </div>
            </div>

            {loadingCampaigns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-64 bg-slate-800/40 animate-pulse rounded-2xl border border-slate-800"></div>
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="p-16 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
                No campaigns found for this ad account.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map((campaign) => {
                  const range = dateRanges[campaign.id] || {};
                  const isDownloading = downloadingCampaignId === campaign.id;

                  return (
                    <div
                      key={campaign.id}
                      className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between gap-6"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            campaign.status === "ACTIVE" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/45" : "bg-slate-900 text-slate-400 border border-slate-800"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${campaign.status === "ACTIVE" ? "bg-emerald-400" : "bg-slate-400"}`}></span>
                            {campaign.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {campaign.id}</span>
                        </div>
                        <h3 className="text-md font-bold text-slate-100 leading-snug line-clamp-2">
                          {campaign.adName || campaign.name}
                        </h3>
                      </div>

                      {/* Date Range Selectors */}
                      <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-900">
                        {/* From Section */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            From Date & Time
                          </label>
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="date"
                              value={range.fromDate || ""}
                              onChange={(e) => handleDateChange(campaign.id, "fromDate", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-850 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono cursor-pointer"
                            />
                            <div className="grid grid-cols-3 gap-1">
                              <select
                                value={range.fromHour || ""}
                                onChange={(e) => handleDateChange(campaign.id, "fromHour", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">HH</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <select
                                value={range.fromMin || ""}
                                onChange={(e) => handleDateChange(campaign.id, "fromMin", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">MM</option>
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <select
                                value={range.fromPeriod || ""}
                                onChange={(e) => handleDateChange(campaign.id, "fromPeriod", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">AM/PM</option>
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* To Section */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            To Date & Time
                          </label>
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="date"
                              value={range.toDate || ""}
                              onChange={(e) => handleDateChange(campaign.id, "toDate", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-850 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono cursor-pointer"
                            />
                            <div className="grid grid-cols-3 gap-1">
                              <select
                                value={range.toHour || ""}
                                onChange={(e) => handleDateChange(campaign.id, "toHour", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">HH</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                              <select
                                value={range.toMin || ""}
                                onChange={(e) => handleDateChange(campaign.id, "toMin", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">MM</option>
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <select
                                value={range.toPeriod || ""}
                                onChange={(e) => handleDateChange(campaign.id, "toPeriod", e.target.value)}
                                className="bg-slate-900 border border-slate-850 text-slate-100 rounded-lg p-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono cursor-pointer"
                              >
                                <option value="">AM/PM</option>
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Export buttons */}
                      <div className="flex flex-col gap-2 pt-2">
                        <button
                          onClick={() => handleDownloadRaw(campaign)}
                          disabled={isDownloading}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 font-semibold rounded-xl text-xs transition-all border border-slate-700/60 disabled:opacity-40 cursor-pointer"
                        >
                          {isDownloading ? (
                            <span className="h-3 w-3 rounded-full border-2 border-slate-500 border-t-white animate-spin"></span>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          Download Raw CSV
                        </button>
                        <button
                          onClick={() => handleDownloadSanitized(campaign)}
                          disabled={isDownloading}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {isDownloading ? (
                            <span className="h-3 w-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                          ) : (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          Download Sanitized CSV
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-6 px-6 text-center text-xs text-slate-500 bg-slate-950/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Shoption IC. All rights reserved.</p>
          <p className="text-slate-600">Meta API Version v23.0</p>
        </div>
      </footer>
    </div>
  );
}
