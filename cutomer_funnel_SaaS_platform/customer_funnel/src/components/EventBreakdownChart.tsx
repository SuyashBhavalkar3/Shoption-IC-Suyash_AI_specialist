import type { EventItem } from '../types';

interface EventBreakdownChartProps {
  events: EventItem[];
}

export default function EventBreakdownChart({ events }: EventBreakdownChartProps) {
  // Count frequency per event type
  const counts: Record<string, number> = {};
  events.forEach((e) => {
    const name = e.event_name || 'unknown';
    counts[name] = (counts[name] || 0) + 1;
  });

  // Fallback demo distribution if events list is empty
  const hasEvents = Object.keys(counts).length > 0;
  const displayCounts = hasEvents
    ? counts
    : {
        product_view: 320,
        add_to_cart: 195,
        checkout_started: 110,
        login: 85,
        purchase: 42,
      };

  const total = Object.values(displayCounts).reduce((a, b) => a + b, 0);

  const sortedEvents = Object.entries(displayCounts).sort((a, b) => b[1] - a[1]);

  const colorPalette = [
    '#B89B72', // Primary Warm Gold
    '#8C6D43', // Deep Amber
    '#7A9E7E', // Soft Sage Green
    '#D97706', // Warm Orange
    '#6F665E', // Warm Taupe
  ];

  return (
    <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft transition-all duration-300">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F665E]">
            Event Breakdown
          </span>
          {!hasEvents && (
            <span className="rounded-full bg-[#B89B72]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#8C6D43]">
              Sample
            </span>
          )}
        </div>
        <h2 className="mt-1 text-2xl font-bold text-[#3E362E]">Distribution by Event Type</h2>
      </div>

      <div className="space-y-4">
        {sortedEvents.map(([name, count], idx) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
          const color = colorPalette[idx % colorPalette.length];

          const formattedName = name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div key={name} className="group cursor-default">
              <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#3E362E]">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125"
                    style={{ backgroundColor: color }}
                  />
                  <span>{formattedName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#6F665E] font-medium">{count.toLocaleString()} events</span>
                  <span className="rounded-full bg-[#F8F4ED] border border-[#DDD3C6] px-2 py-0.5 text-[11px] font-bold text-[#3E362E]">
                    {percentage}%
                  </span>
                </div>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F5F1EA] border border-[#DDD3C6]/60">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
