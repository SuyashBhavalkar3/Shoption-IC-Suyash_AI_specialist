import type { AnalyticsOverview } from '../types';

interface StatsCardsProps {
  overview: AnalyticsOverview | null;
}

export default function StatsCards({ overview }: StatsCardsProps) {
  const totalEvents = overview?.total_events ?? 0;
  const uniqueUsers = overview?.unique_users ?? 0;
  const purchases = overview?.purchases ?? 0;

  // Calculate conversion rate %
  const conversionRate = uniqueUsers > 0 
    ? ((purchases / uniqueUsers) * 100).toFixed(1) 
    : '0.0';

  const cards = [
    {
      label: 'Total Events',
      value: totalEvents,
      formatted: totalEvents.toLocaleString(),
      change: '+14.8%',
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#B89B72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      sparkline: [20, 35, 25, 45, 30, 55, 70],
    },
    {
      label: 'Unique Users',
      value: uniqueUsers,
      formatted: uniqueUsers.toLocaleString(),
      change: '+8.2%',
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#B89B72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 100 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      sparkline: [15, 20, 30, 25, 40, 48, 62],
    },
    {
      label: 'Purchases Completed',
      value: purchases,
      formatted: purchases.toLocaleString(),
      change: '+22.4%',
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#B89B72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      sparkline: [5, 12, 8, 18, 15, 28, 35],
    },
    {
      label: 'Funnel Conversion Rate',
      value: conversionRate,
      formatted: `${conversionRate}%`,
      change: '+3.1%',
      isPositive: true,
      icon: (
        <svg className="w-5 h-5 text-[#B89B72]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      sparkline: [12, 14, 13, 16, 18, 22, 25],
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-[28px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F665E]">
              {card.label}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F8F4ED] border border-[#DDD3C6]/60 transition-transform group-hover:scale-110">
              {card.icon}
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-[#3E362E] tracking-tight">{card.formatted}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#7A9E7E]/15 px-2.5 py-0.5 text-xs font-bold text-[#3F6A44]">
              {card.change}
            </span>
          </div>

          {/* Mini Sparkline SVG */}
          <div className="mt-4 h-8 w-full">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 100 30">
              <path
                d={card.sparkline.reduce((acc, val, i) => {
                  const x = (i / (card.sparkline.length - 1)) * 100;
                  const y = 30 - (val / 80) * 25;
                  return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
                }, '')}
                fill="none"
                stroke="#B89B72"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
