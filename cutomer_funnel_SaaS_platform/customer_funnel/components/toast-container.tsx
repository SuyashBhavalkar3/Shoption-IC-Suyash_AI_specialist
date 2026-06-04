'use client';

import { useApp } from '@/lib/context/app-context';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = 'bg-slate-800';
        let Icon = Info;

        if (toast.type === 'success') {
          bgColor = 'bg-emerald-600';
          Icon = CheckCircle;
        } else if (toast.type === 'error') {
          bgColor = 'bg-rose-600';
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`${bgColor} text-white px-4 py-3 rounded shadow-lg pointer-events-auto flex items-center justify-between gap-3 animate-slide-in duration-200 transition-all`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
