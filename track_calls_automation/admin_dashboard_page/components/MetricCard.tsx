import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string | number;
  note: string;
  icon: ReactNode;
};

export default function MetricCard({ title, value, note, icon }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#04693F] to-[#015C96]" />
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      </div>
      
      <div className="mt-4">
        <span className="text-3xl font-bold bg-gradient-to-r from-[#04693F] to-[#015C96] bg-clip-text text-transparent">
          {value}
        </span>
      </div>
      
      <div className="mt-2 text-xs text-slate-400 font-medium">
        {note}
      </div>
    </div>
  );
}
