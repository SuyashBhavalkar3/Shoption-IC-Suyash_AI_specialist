import type { ModularFunnelData } from '../types';
import { formatEventName } from '../utils/format';

interface ModularFunnelWidgetProps {
  data: ModularFunnelData;
}

export default function ModularFunnelWidget({ data }: ModularFunnelWidgetProps) {
  const { name, stages, kpis } = data;

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft hover:shadow-md transition-all duration-300 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-[#E5D9CB] pb-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[#B89B72]" />
          <h3 className="text-lg font-bold text-[#3E362E]">{name}</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-3xl border border-[#E5D9CB] bg-[#F8F4ED] p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F665E]">Total Events</span>
          <span className="text-lg font-extrabold text-[#3E362E] mt-1.5 block">{kpis.total_events.toLocaleString()}</span>
        </div>
        <div className="rounded-3xl border border-[#E5D9CB] bg-[#F8F4ED] p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F665E]">Unique Users</span>
          <span className="text-lg font-extrabold text-[#3E362E] mt-1.5 block">{kpis.unique_users.toLocaleString()}</span>
        </div>
        <div className="rounded-3xl border border-[#E5D9CB] bg-[#F8F4ED] p-4">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#6F665E]">Lost Users</span>
          <span className="text-lg font-extrabold text-[#B97A6A] mt-1.5 block">{kpis.lost_users.toLocaleString()}</span>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage, idx) => {
          const prevStage = idx > 0 ? stages[idx - 1] : null;
          const stageConversion = prevStage && prevStage.count > 0 
            ? Math.round((stage.count / prevStage.count) * 100) 
            : 100;
          const dropOff = prevStage ? Math.max(0, prevStage.count - stage.count) : 0;
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;

          return (
            <div key={stage.event_name} className="relative">
              {idx > 0 && dropOff > 0 && (
                <div className="pl-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#B97A6A]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  <span>Lost {dropOff.toLocaleString()} users ({100 - stageConversion}% drop)</span>
                </div>
              )}
              {idx > 0 && dropOff === 0 && (
                <div className="pl-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#7A9E7E]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>100% Retained</span>
                </div>
              )}

              <div className="rounded-3xl border border-[#E5D9CB] bg-[#F8F4ED] p-4 hover:bg-[#F2ECD9] transition-colors duration-150">
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="font-bold text-[#3E362E] flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#DDD3C6] text-[#3E362E] text-[10px] font-extrabold">
                      {idx + 1}
                    </span>
                    {formatEventName(stage.event_name)}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-[#6F665E] block font-medium">Events</span>
                      <span className="font-extrabold text-[#3E362E] text-sm">{stage.count.toLocaleString()}</span>
                    </div>
                    <div className="text-right border-l border-[#E5D9CB] pl-3">
                      <span className="text-xs text-[#6F665E] block font-medium">Users</span>
                      <span className="font-extrabold text-[#3E362E] text-sm">{stage.unique_users.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-[#EAE3D9] overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-[#B89B72] transition-all duration-500" 
                    style={{ width: `${Math.max(widthPercentage, 1)}%` }} 
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
