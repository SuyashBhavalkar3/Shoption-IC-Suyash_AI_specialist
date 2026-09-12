import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MaintenanceData {
  uat_customer_funnel?: boolean;
  message?: string;
  expectedEndTime?: string;
}

export const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maintenance, setMaintenance] = useState<MaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string>('');

  useEffect(() => {
    // If db is not initialized (missing build-time env vars), resolve loading immediately
    if (!db) {
      setLoading(false);
      return;
    }

    // Safety fallback: Ensure loading spinner resolves after 2.5s maximum
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    // Listen to real-time docSnap pushed from collection 'maintenance' -> document 'mode'
    const maintenanceRef = doc(db, 'maintenance', 'mode');

    const unsubscribe = onSnapshot(
      maintenanceRef,
      (docSnap) => {
        clearTimeout(timer);
        if (docSnap.exists()) {
          const data = docSnap.data() as MaintenanceData;
          setMaintenance(data);
        } else {
          setMaintenance(null);
        }
        setLastCheckTime(new Date().toLocaleTimeString());
        setLoading(false);
      },
      () => {
        clearTimeout(timer);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLastCheckTime(new Date().toLocaleTimeString());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#07090e] text-gray-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div className="absolute h-full w-full animate-ping rounded-full bg-amber-500/20"></div>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg shadow-amber-500/50"></div>
          </div>
          <p className="text-sm font-medium tracking-wide text-gray-400">Verifying System Status...</p>
        </div>
      </div>
    );
  }

  // Whenever docSnap is pushed and uat_customer_funnel is true, show maintenance page
  const isMaintenanceActive =
    maintenance?.uat_customer_funnel === true ||
    String(maintenance?.uat_customer_funnel).toLowerCase() === 'true';

  if (isMaintenanceActive) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#07090e] text-gray-100 selection:bg-amber-500 selection:text-black font-sans flex flex-col justify-between p-6 sm:p-10">

        {/* Glowing Background Elements */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-amber-600/20 via-orange-500/10 to-indigo-600/20 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-40 right-10 h-[400px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />

        {/* Main Center Content */}
        <main className="relative z-10 my-auto flex flex-col items-center text-center max-w-3xl mx-auto py-12">

          {/* Animated Hero Icon / Pulse */}
          <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-3xl bg-amber-500/20 duration-1000"></div>
            <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent p-5 shadow-2xl backdrop-blur-xl">
              <svg
                className="h-12 w-12 text-amber-400 animate-spin-slow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mb-4 inline-flex items-center space-x-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Scheduled Maintenance Underway</span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            We are upgrading your system
          </h1>

          {/* Message Description */}
          <p className="mb-10 text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
            {maintenance?.message ||
              "We're currently performing scheduled maintenance to enhance system speed, security, and analytics pipeline performance. We will be back shortly!"}
          </p>

          {/* Feature Highlight Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10 text-left">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md hover:border-amber-500/30 transition-all">
              <div className="text-amber-400 text-xl mb-2">⚡</div>
              <h3 className="font-semibold text-white text-sm mb-1">Performance Boost</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Upgrading analytics queries & indexing speed.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md hover:border-amber-500/30 transition-all">
              <div className="text-amber-400 text-xl mb-2">🛡️</div>
              <h3 className="font-semibold text-white text-sm mb-1">Security Audit</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Applying routine security patches & token checks.</p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md hover:border-amber-500/30 transition-all">
              <div className="text-amber-400 text-xl mb-2">🔄</div>
              <h3 className="font-semibold text-white text-sm mb-1">Auto Restore</h3>
              <p className="text-xs text-gray-400 leading-relaxed">Access will automatically unlock once complete.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full justify-center">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition-all active:scale-95 disabled:opacity-75"
            >
              <svg
                className={`h-4 w-4 text-black ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? 'Checking Connection...' : 'Check Connection Status'}</span>
            </button>
          </div>

        </main>

        {/* Footer */}
        <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.08] pt-6 text-xs text-gray-500 space-y-3 sm:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} Shoption Inc. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              <span>DocSnap Push Enabled</span>
            </span>
          </div>
        </footer>

      </div>
    );
  }

  return <>{children}</>;
};
