import type { FunnelResponse } from '../types';

interface FunnelChartProps {
  data: FunnelResponse | null;
}

const stages = [
  { key: 'login', label: '1. User Login', icon: '🔑' },
  { key: 'product_view', label: '2. Product View', icon: '👁️' },
  { key: 'add_to_cart', label: '3. Add to Cart', icon: '🛒' },
  { key: 'checkout_started', label: '4. Checkout Started', icon: '💳' },
  { key: 'purchase', label: '5. Purchase Completed', icon: '🎉' },
];

export default function FunnelChart({ data }: FunnelChartProps) {
  // Check if data is populated
  const hasRealData = data && Object.values(data).some((val) => typeof val === 'number' && val > 0);

  // Use real data if present, or elegant baseline fallback
  const fallbackValues = {
    login: 450,
    product_view: 320,
    add_to_cart: 195,
    checkout_started: 110,
    purchase: 48,
  };

  const values = stages.map((stage) => {
    const val = hasRealData
      ? (data?.[stage.key as keyof FunnelResponse] ?? 0)
      : fallbackValues[stage.key as keyof typeof fallbackValues];
    return { ...stage, value: val };
  });

  const maxValue = Math.max(...values.map((stage) => stage.value), 1);

  const dropOffs = values.map((stage, index) => {
    if (index === 0) return 0;
    return Math.max(values[index - 1].value - stage.value, 0);
  });

  const dropOffPercentages = values.map((stage, index) => {
    if (index === 0 || values[index - 1].value === 0) return 0;
    return Math.round((dropOffs[index] / values[index - 1].value) * 100);
  });

  const highestDropOffIndex = dropOffs.indexOf(Math.max(...dropOffs));
  const highestDropOffStage =
    highestDropOffIndex > 0
      ? `${stages[highestDropOffIndex - 1].label.replace(/^\d+\.\s*/, '')} → ${stages[highestDropOffIndex].label.replace(/^\d+\.\s*/, '')}`
      : null;

  const totalLost = dropOffs.reduce((sum, d) => sum + d, 0);

  const overallConversion =
    values[0].value > 0
      ? ((values[values.length - 1].value / values[0].value) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft transition-all duration-300">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-[#DDD3C6]/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F665E]">
              Conversion Funnel
            </span>
            {!hasRealData && (
              <span className="rounded-full bg-[#B89B72]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#8C6D43]">
                Preview Mode
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-bold text-[#3E362E]">Primary Conversion Journey</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#DDD3C6] bg-[#F8F4ED] px-4 py-1.5 text-xs font-semibold text-[#3E362E]">
          <span className="h-2 w-2 rounded-full bg-[#7A9E7E] animate-pulse" />
          <span>Overall Conv. Rate: <strong className="text-[#3E362E]">{overallConversion}%</strong></span>
        </div>
      </div>

      <div className="space-y-6">
        {values.map((stage, index) => {
          const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const dropOff = dropOffs[index];
          const dropPct = dropOffPercentages[index];
          const stepConv =
            index === 0
              ? 100
              : values[index - 1].value > 0
              ? Math.round((stage.value / values[index - 1].value) * 100)
              : 0;

          return (
            <div key={stage.key} className="group">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-[#3E362E]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{stage.icon}</span>
                    <span className="font-bold text-[#3E362E]">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-extrabold text-[#3E362E]">
                      {stage.value.toLocaleString()} <span className="text-xs text-[#6F665E] font-normal">users</span>
                    </span>
                    {index > 0 && (
                      <span className="rounded-full bg-[#F8F4ED] border border-[#DDD3C6] px-2.5 py-0.5 text-xs font-semibold text-[#6F665E]">
                        {stepConv}% step conv.
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="relative h-6 overflow-hidden rounded-xl border border-[#DDD3C6] bg-[#F5F1EA] p-0.5 shadow-inner">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-[#B89B72] to-[#8C6D43] transition-all duration-700 ease-out group-hover:brightness-110 flex items-center justify-end pr-3"
                    style={{ width: `${Math.max(width, 4)}%` }}
                  >
                    {width > 20 && (
                      <span className="text-[10px] font-extrabold text-white uppercase tracking-wider">
                        {Math.round(width)}% of top
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Drop-off connector card */}
              {index < values.length - 1 && (
                <div className="my-2.5 ml-6 flex items-center gap-3 text-xs">
                  <div className="h-5 w-0.5 bg-[#DDD3C6]" />
                  <div className="flex items-center gap-2 rounded-full border border-[#E5D9CB] bg-[#F8F4ED] px-3 py-1 text-[#6F665E]">
                    <span className="font-bold text-[#8A4236]">↓ Lost {dropOffs[index + 1].toLocaleString()} users</span>
                    <span className="text-[#9B8F7E]">({dropOffPercentages[index + 1]}% drop-off)</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights Summary */}
      <div className="mt-8 border-t border-[#DDD3C6] pt-6">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#6F665E]">
          Funnel Insights & Performance
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {highestDropOffStage && (
            <div className="rounded-2xl border border-[#E5D9CB] bg-[#F8F4ED] p-4 transition-all hover:border-[#B89B72]/50">
              <p className="text-xs text-[#6F665E] font-medium">Highest Drop-off Point</p>
              <p className="mt-1 text-sm font-extrabold text-[#3E362E]">{highestDropOffStage}</p>
            </div>
          )}
          <div className="rounded-2xl border border-[#E5D9CB] bg-[#F8F4ED] p-4 transition-all hover:border-[#B89B72]/50">
            <p className="text-xs text-[#6F665E] font-medium">Total Funnel Churn</p>
            <p className="mt-1 text-sm font-extrabold text-[#8A4236]">{totalLost.toLocaleString()} users</p>
          </div>
          <div className="rounded-2xl border border-[#E5D9CB] bg-[#F8F4ED] p-4 transition-all hover:border-[#B89B72]/50">
            <p className="text-xs text-[#6F665E] font-medium">Overall Conversion Rate</p>
            <p className="mt-1 text-sm font-extrabold text-[#3F6A44]">{overallConversion}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
