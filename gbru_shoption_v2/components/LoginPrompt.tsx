"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="p-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-[#006B21]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Login Required
          </h3>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-zinc-200 text-zinc-600 font-bold rounded-xl hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => router.push('/login')}
              className="flex-1 py-3 bg-[#006B21] text-white font-bold rounded-xl hover:bg-[#005a1b] transition-colors shadow-md"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
