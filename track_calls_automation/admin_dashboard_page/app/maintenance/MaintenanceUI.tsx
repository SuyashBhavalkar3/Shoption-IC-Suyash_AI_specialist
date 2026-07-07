"use client";

import { motion } from "framer-motion";
import { Wrench, Settings, RefreshCw } from "lucide-react";

export default function MaintenanceUI() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(59, 130, 246, 0.15) 0%, rgba(10, 15, 30, 0) 65%)",
        }}
      />

      {/* Header */}
      <header className="w-full h-18 flex items-center px-8 py-5 z-10 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            LL
          </div>
          <span className="font-semibold text-white tracking-tight">LeadLens ERP</span>
          <span className="text-[10px] uppercase font-semibold tracking-widest text-blue-400 border-l border-white/15 pl-3">
            Admin Console
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="max-w-lg w-full text-center space-y-8">

          {/* Animated Icon */}
          <div className="relative inline-flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, ease: "linear", repeat: Infinity }}
              className="p-9 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400/50 shadow-[0_0_60px_rgba(59,130,246,0.1)]"
            >
              <Settings size={84} />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 7, ease: "linear", repeat: Infinity }}
              className="absolute p-4 rounded-full bg-[#0E1528] border border-white/10 text-cyan-400 shadow-xl"
            >
              <Wrench size={30} />
            </motion.div>
          </div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <div className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 mb-2">
              Scheduled Maintenance
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Admin Panel Offline
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
              The LeadLens Admin ERP is currently undergoing scheduled maintenance. Access will be restored shortly.
            </p>
          </motion.div>

          {/* Status Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#0E1528] border border-white/8 shadow-inner"
          >
            <RefreshCw className="text-blue-400 animate-spin shrink-0" size={16} />
            <div className="text-left space-y-0.5">
              <span className="text-xs font-semibold text-white block">System Update in Progress</span>
              <span className="text-[11px] text-gray-500 block">Core services restarting...</span>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 text-center relative z-10">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} LeadLens Analytics Inc. &mdash; Admin Portal
        </p>
      </footer>
    </div>
  );
}
