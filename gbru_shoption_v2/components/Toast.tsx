"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, duration]); // React hook lint issue fix

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Matches the animation duration
  };

  const getIcon = () => {
    switch (type) {
      case "success": return <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>;
      case "error": return <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><XCircle className="w-6 h-6 text-red-600" /></div>;
      case "warning": return <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>;
      case "info": return <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4"><Info className="w-6 h-6 text-blue-600" /></div>;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success": return "bg-emerald-600 hover:bg-emerald-700";
      case "error": return "bg-red-600 hover:bg-red-700";
      case "warning": return "bg-amber-600 hover:bg-amber-700";
      case "info": return "bg-blue-600 hover:bg-blue-700";
    }
  };

  return (
    <div
      className={`
        pointer-events-auto w-full bg-white overflow-hidden rounded-[24px] 
        shadow-2xl border border-zinc-100 flex flex-col p-6
        transition-all duration-300 ease-in-out transform
        ${isClosing ? "opacity-0 scale-95 translate-y-4" : "opacity-100 scale-100 translate-y-0"}
      `}
    >
      <div className="absolute top-4 right-4">
        <button
          onClick={handleClose}
          className="rounded-full p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 focus:outline-none transition-colors"
        >
          <span className="sr-only">Close</span>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="text-center mt-2">
        {getIcon()}
        
        <h3 className="text-xl font-bold text-zinc-900 mb-2">
          {type === "error" ? "Error" : type === "success" ? "Success" : type === "warning" ? "Warning" : "Notification"}
        </h3>
        
        {message && (
          <p className="text-[15px] text-zinc-600 leading-relaxed break-words whitespace-pre-wrap mb-6 max-h-[40vh] overflow-y-auto px-2">
            {message}
          </p>
        )}

        <button
          onClick={handleClose}
          className={`w-full py-3.5 px-4 rounded-xl text-white font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
        >
          Okay, Got it
        </button>
      </div>
    </div>
  );
}
