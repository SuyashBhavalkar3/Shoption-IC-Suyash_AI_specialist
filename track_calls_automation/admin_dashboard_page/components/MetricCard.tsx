import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: string | number;
  note: string;
  icon: ReactNode;
};

export default function MetricCard({ title, value, note, icon }: MetricCardProps) {
  return (
    <div className="bg-[#0E1528] border border-slate-800/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#1F8FFF]/5 hover:border-slate-700/80 transition-all duration-300 relative overflow-hidden group">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1F8FFF] to-[#00E6B8]" />
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">{title}</span>
        {icon && <span className="text-[#94A3B8] opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>}
      </div>
      
      <div className="mt-4">
        <span className="text-3xl font-bold bg-gradient-to-r from-[#1F8FFF] to-[#00E6B8] bg-clip-text text-transparent">
          {value}
        </span>
      </div>
      
      <div className="mt-2 text-xs text-[#94A3B8]/60 font-medium">
        {note}
      </div>
    </div>
  );
}
