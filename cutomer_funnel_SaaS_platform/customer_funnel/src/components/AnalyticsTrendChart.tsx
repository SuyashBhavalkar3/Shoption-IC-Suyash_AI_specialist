import { useState } from 'react';
import type { EventItem } from '../types';

interface AnalyticsTrendChartProps {
  events: EventItem[];
  days: number;
}

export default function AnalyticsTrendChart({ events, days }: AnalyticsTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'total' | 'users' | 'purchases'>('total');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Group events by day for the selected period
  const dayLabels: string[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }

  // Calculate daily data arrays
  const dailyData = dayLabels.map((_, idx) => {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - (days - 1 - idx));
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const dayEvents = events.filter((e) => {
      if (!e.created_at) return false;
      const eventDateStr = new Date(e.created_at).toISOString().split('T')[0];
      return eventDateStr === targetDateStr;
    });

    const total = dayEvents.length;
    const users = new Set(dayEvents.map((e) => e.user_id || e.anonymous_id || e.id)).size;
    const purchases = dayEvents.filter((e) => 
      e.event_name === 'purchase' || e.event_name === 'checkout_completed'
    ).length;

    return { date: dayLabels[idx], total, users, purchases };
  });

  // Fallback pattern generator if actual real events are empty (so chart always looks active)
  const isDataEmpty = dailyData.every((d) => d.total === 0);
  const chartPoints = dailyData.map((d, i) => {
    if (!isDataEmpty) {
      return activeMetric === 'total' ? d.total : activeMetric === 'users' ? d.users : d.purchases;
    }
    // Realistic fallback wave for visual demo state
    const base = activeMetric === 'total' ? 45 : activeMetric === 'users' ? 28 : 12;
    const wave = Math.sin(i * 0.4) * (base * 0.35) + Math.cos(i * 0.2) * (base * 0.2);
    return Math.max(2, Math.round(base + wave));
  });

  const maxValue = Math.max(...chartPoints, 10);
  const chartHeight = 180;
  const chartWidth = 700;

  // Build SVG smooth path string using bezier curves
  const points = chartPoints.map((val, idx) => {
    const x = (idx / (chartPoints.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxValue) * (chartHeight - 30) - 15;
    return { x, y, val, label: dayLabels[idx] };
  });

  const pathD = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cx = (prev.x + point.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
  }, '');

  const areaD = `${pathD} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="rounded-[32px] border border-[#DDD3C6] bg-[#FFFDF9] p-6 shadow-soft transition-all duration-300">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6F665E]">Analytics Trend</span>
            {isDataEmpty && (
              <span className="rounded-full bg-[#B89B72]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#8C6D43]">
                Preview Mode
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-bold text-[#3E362E]">Event Volume & Activity</h2>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex rounded-full border border-[#DDD3C6] bg-[#F8F4ED] p-1 text-xs font-semibold text-[#6F665E]">
          <button
            onClick={() => setActiveMetric('total')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeMetric === 'total' ? 'bg-[#B89B72] text-white shadow-sm' : 'hover:text-[#3E362E]'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveMetric('users')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeMetric === 'users' ? 'bg-[#B89B72] text-white shadow-sm' : 'hover:text-[#3E362E]'
            }`}
          >
            Unique Users
          </button>
          <button
            onClick={() => setActiveMetric('purchases')}
            className={`rounded-full px-4 py-1.5 transition-all ${
              activeMetric === 'purchases' ? 'bg-[#B89B72] text-white shadow-sm' : 'hover:text-[#3E362E]'
            }`}
          >
            Purchases
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B89B72" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#B89B72" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#B89B72" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => (
            <line
              key={idx}
              x1="0"
              y1={chartHeight * ratio}
              x2={chartWidth}
              y2={chartHeight * ratio}
              stroke="#DDD3C6"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
          ))}

          {/* Area Fill */}
          <path d={areaD} fill="url(#trendGradient)" />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke="#B89B72"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* Interactive Hover Dots */}
          {points.map((pt, idx) => (
            <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? '7' : '4'}
                className="fill-[#FFFDF9] stroke-[#B89B72] transition-all duration-200"
                strokeWidth={hoveredIndex === idx ? '3.5' : '2'}
              />
            </g>
          ))}

          {/* Active Highlight Line */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1="0"
              x2={hoveredPoint.x}
              y2={chartHeight}
              stroke="#B89B72"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div
            className="absolute pointer-events-none rounded-xl border border-[#DDD3C6] bg-[#3E362E] px-3 py-2 text-white shadow-xl text-xs z-10 transition-all duration-150"
            style={{
              left: `${Math.min(Math.max(10, (hoveredPoint.x / chartWidth) * 100), 85)}%`,
              top: `${Math.max(10, (hoveredPoint.y / chartHeight) * 100 - 25)}%`,
            }}
          >
            <p className="font-bold text-[#E5D9CB]">{hoveredPoint.label}</p>
            <p className="text-sm font-extrabold text-white mt-0.5">
              {hoveredPoint.val.toLocaleString()} {activeMetric}
            </p>
          </div>
        )}
      </div>

      {/* X-Axis Date Labels */}
      <div className="mt-4 flex justify-between text-xs text-[#6F665E] font-medium border-t border-[#DDD3C6]/60 pt-3">
        <span>{dayLabels[0]}</span>
        <span>{dayLabels[Math.floor(dayLabels.length / 2)]}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
