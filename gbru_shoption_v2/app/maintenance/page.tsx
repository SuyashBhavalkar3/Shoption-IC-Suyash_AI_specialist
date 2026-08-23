"use client";

import React from "react";
import { useShoptionSetting } from "@/hooks/useShoptionSetting";

export default function MaintenancePage() {
  const { whatsappLink } = useShoptionSetting();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0D9740]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center z-10 flex flex-col items-center gap-6">
        {/* Animated Gears Logo */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Main big gear */}
          <div className="absolute animate-[spin_12s_linear_infinite] text-[#0D9740]/90">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>
          </div>
          {/* Smaller overlapping counter-rotating gear */}
          <div className="absolute -top-1 -right-1 animate-[spin_8s_linear_infinite] [animation-direction:reverse] text-[#1E532E]/80">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
            </svg>
          </div>
          {/* Center glowing dot */}
          <div className="absolute w-4 h-4 bg-white rounded-full border-2 border-[#0D9740] shadow-[0_0_12px_rgba(13,151,64,0.3)] animate-pulse" />
        </div>

        {/* Brand Header */}
        <div className="flex flex-col gap-1 mt-2">
          <span className="text-[#0D9740] font-extrabold tracking-widest text-xs uppercase">GBRU Shoption</span>
          <h1 className="text-[#0F291B] font-roboto font-extrabold text-3xl sm:text-4xl tracking-tight leading-none">
            Under Maintenance
          </h1>
        </div>

        {/* Context description */}
        <p className="text-zinc-600 text-sm font-semibold leading-relaxed px-4">
          We are currently performing essential database optimizations and system enhancements to make your farming shopping experience even better.
        </p>

        {/* Estimated status indicator */}
        <div className="bg-white border border-[#CDE5D2] rounded-[24px] px-5 py-4 w-full flex items-center justify-between text-left mt-2 shadow-sm">
          <div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider">Estimated Back Time</p>
            <p className="text-[#0F291B] text-sm font-extrabold mt-0.5">Soon</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0D9740] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0D9740]"></span>
            </span>
            <span className="text-zinc-700 text-xs font-bold">Upgrading...</span>
          </div>
        </div>

        {/* Chat with Nova */}
        <div className="flex flex-col items-center gap-1.5 text-xs text-zinc-400 mt-4">
          <p className="font-semibold">Need urgent assistance?</p>
          <a
            href={`${whatsappLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#0D9740]/10 hover:bg-[#0D9740]/20 px-4 py-2 rounded-full transition-colors mt-1"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#0D9740]/30 flex-shrink-0">
              <img
                src="/assets/nova.jpeg"
                alt="Nova"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-[#0D9740]">Chat with Nova</span>
          </a>
        </div>
      </div>
    </div>
  );
}
