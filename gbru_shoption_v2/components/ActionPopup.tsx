"use client";

import React from "react";

interface ActionPopupProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
}

export default function ActionPopup({
  isOpen,
  title,
  message,
  type = "error",
  onClose,
}: ActionPopupProps) {
  if (!isOpen) return null;

  const accent =
    type === "error" ? "bg-red-500" : type === "success" ? "bg-[#0D9740]" : "bg-[#1E532E]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-[24px] bg-white shadow-2xl overflow-hidden">
        <div className={`h-1.5 w-full ${accent}`} />
        <div className="p-6 sm:p-7 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${type === "error" ? "bg-red-50 text-red-500" : "bg-emerald-50 text-[#0D9740]"}`}>
            {type === "error" ? (
              <span className="text-2xl font-bold">!</span>
            ) : (
              <span className="text-2xl font-bold">✓</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-[#0F291B]">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">{message}</p>
          <button
            onClick={onClose}
            className={`mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold text-white transition-colors ${accent} hover:opacity-95`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
