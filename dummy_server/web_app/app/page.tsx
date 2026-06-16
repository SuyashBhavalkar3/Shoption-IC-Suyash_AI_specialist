"use client";

import { useEffect, useState } from "react";

interface WebhookEvent {
  id: number;
  timestamp: string;
  event_type: string;
  phone_number: string | null;
  duration: number | null;
  payload: any;
  signature_verified: boolean;
}

export default function Home() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const API_URL = "https://dummy-server-opa2.onrender.com/api/calls";

  const fetchEvents = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const result = await response.json();
      if (result.status === "success") {
        setEvents(result.data);
        setTotal(result.total);
        setError(null);
      } else {
        throw new Error(result.message || "Failed to fetch events");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        "Could not connect to the hosted webhook consumer at dummy-server-opa2.onrender.com."
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const clearDatabase = async () => {
    if (!confirm("Are you sure you want to clear all webhook logs? This cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(API_URL, { method: "DELETE" });
      if (response.ok) {
        setEvents([]);
        setTotal(0);
        setSelectedEvent(null);
      } else {
        alert("Failed to clear database.");
      }
    } catch (err) {
      alert("Error contacting server to clear database.");
    }
  };

  // Poll for new events
  useEffect(() => {
    fetchEvents(true);
  }, []);

  useEffect(() => {
    let interval: any;
    if (polling) {
      interval = setInterval(() => {
        fetchEvents(false);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [polling]);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate metrics
  const totalCalls = events.length;
  const verifiedCount = events.filter((e) => e.signature_verified).length;
  const verificationRate = totalCalls > 0 ? Math.round((verifiedCount / totalCalls) * 100) : 0;

  const callsWithDuration = events.filter(
    (e) => e.duration !== null && typeof e.duration === "number"
  );
  const totalDuration = callsWithDuration.reduce((acc, curr) => acc + (curr.duration || 0), 0);
  const avgDuration =
    callsWithDuration.length > 0 ? Math.round(totalDuration / callsWithDuration.length) : 0;

  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            LeadLens Analytics Hub
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Real-time Webhook Receiver & Client Signature Verification Dashboard
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Polling Indicator */}
          <button
            onClick={() => setPolling(!polling)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${polling
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${polling ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`}
            />
            {polling ? "Live Polling Active" : "Polling Paused"}
          </button>

          <button
            onClick={() => fetchEvents(true)}
            className="px-4 py-1.5 rounded-lg text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 font-medium transition-all"
          >
            Refresh
          </button>

          <button
            onClick={clearDatabase}
            className="px-4 py-1.5 rounded-lg text-sm bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-medium transition-all"
          >
            Clear Logs
          </button>
        </div>
      </header>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <span className="font-semibold">Connection Issue:</span> {error}
          </div>
          <button
            onClick={() => fetchEvents(true)}
            className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 transition-all font-medium text-xs whitespace-nowrap self-start sm:self-auto"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-xl hover:border-indigo-500/30 transition-all duration-300 group">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider group-hover:text-indigo-400 transition-colors">
            Total Webhooks
          </p>
          <p className="text-3xl font-bold mt-2 text-white">{total}</p>
          <p className="text-xs text-zinc-400 mt-1">Logged in local sqlite</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-xl hover:border-purple-500/30 transition-all duration-300 group">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider group-hover:text-purple-400 transition-colors">
            Avg Call Duration
          </p>
          <p className="text-3xl font-bold mt-2 text-white">{avgDuration}s</p>
          <p className="text-xs text-zinc-400 mt-1">From call event payloads</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-300 group">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
            Security Verified
          </p>
          <p className="text-3xl font-bold mt-2 text-emerald-400">
            {verifiedCount} <span className="text-zinc-500 text-sm font-medium">/ {totalCalls}</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">Valid SHA256 Signatures</p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 backdrop-blur-xl hover:border-pink-500/30 transition-all duration-300 group">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider group-hover:text-pink-400 transition-colors">
            Verification Rate
          </p>
          <p className="text-3xl font-bold mt-2 text-white">{verificationRate}%</p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${verificationRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* Webhook Logs List */}
        <section className={`lg:col-span-7 rounded-2xl border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden ${selectedEvent ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-950/20">
            <h2 className="font-semibold text-lg text-white">Incoming Event Stream</h2>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
              Auto-updating
            </span>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              {loading ? (
                <div className="flex justify-center items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-2">Fetching logs...</span>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-zinc-400 text-base mb-1">No webhooks received yet</p>
                  <p className="text-sm">Send a POST webhook request to https://dummy-server-opa2.onrender.com/webhook</p>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-zinc-950/45 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">ID / Time</th>
                    <th className="py-3.5 px-5">Event</th>
                    <th className="py-3.5 px-5">Phone Number</th>
                    <th className="py-3.5 px-5">Duration</th>
                    <th className="py-3.5 px-5">Signature</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {events.map((event) => {
                    const eventTime = new Date(event.timestamp).toLocaleTimeString();
                    const isSelected = selectedEvent?.id === event.id;
                    return (
                      <tr
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`hover:bg-zinc-800/20 cursor-pointer transition-colors duration-250 ${isSelected ? "bg-indigo-500/10 hover:bg-indigo-500/15" : ""
                          }`}
                      >
                        <td className="py-4 px-5">
                          <span className="text-zinc-500 block text-xs font-mono">#{event.id}</span>
                          <span className="text-white text-xs">{eventTime}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-indigo-300 border border-zinc-700 capitalize">
                            {event.event_type || "call"}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-zinc-300">
                          {event.phone_number || "—"}
                        </td>
                        <td className="py-4 px-5 text-zinc-300">
                          {event.duration !== null ? `${event.duration}s` : "—"}
                        </td>
                        <td className="py-4 px-5">
                          {event.signature_verified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${isSelected
                                ? "bg-indigo-500 text-white border-indigo-400"
                                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                              }`}
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Selected Webhook Inspector Sidebar */}
        {selectedEvent && (
          <section className="lg:col-span-5 rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl overflow-hidden shadow-2xl animate-fade-in flex flex-col">
            <div className="p-5 border-b border-white/5 bg-zinc-950/40 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">Event Detail Inspector</h3>
                <span className="text-xs text-zinc-400 font-mono">ID: #{selectedEvent.id}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Event Properties Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm border-b border-white/5 pb-4">
                <div>
                  <span className="text-zinc-500 block text-xs uppercase font-semibold">Event Timestamp</span>
                  <span className="text-white mt-1 block">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs uppercase font-semibold">Security Signature</span>
                  <span
                    className={`mt-1 font-semibold inline-block ${selectedEvent.signature_verified ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    {selectedEvent.signature_verified
                      ? "✓ Successfully Verified"
                      : "✗ Invalid or Missing"}
                  </span>
                </div>
              </div>

              {/* Raw JSON Code block */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-500 text-xs uppercase font-semibold">Raw JSON Payload</span>
                  <button
                    onClick={() =>
                      copyToClipboard(JSON.stringify(selectedEvent.payload, null, 2), selectedEvent.id)
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md transition-all"
                  >
                    {copiedId === selectedEvent.id ? "Copied!" : "Copy Payload"}
                  </button>
                </div>
                <div className="rounded-xl border border-white/5 bg-zinc-950 p-4 overflow-x-auto max-h-96">
                  <pre className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
