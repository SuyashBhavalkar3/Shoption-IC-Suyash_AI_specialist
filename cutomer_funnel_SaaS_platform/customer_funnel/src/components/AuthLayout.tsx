import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F1EA] text-[#3E362E]">
      <div className="hidden md:flex w-1/2 p-12 flex-col justify-center gap-10 bg-[#EAE3D9]">
        <div className="max-w-lg">
          <div className="inline-flex items-center gap-4 rounded-3xl bg-[#FFFDF9] border border-[#DDD3C6] px-4 py-3 shadow-soft">
            <div className="w-12 h-12 rounded-3xl bg-[#B89B72] flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6h18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Funnel Analytics</h1>
              <p className="text-sm text-[#6F665E]">Track customer journeys. Measure conversions.</p>
            </div>
          </div>

          <h2 className="text-3xl font-semibold mt-6 mb-4 text-[#3E362E]">Understand your funnel</h2>
          <p className="text-[#6F665E] mb-6">Measure drop-offs and optimize revenue with enterprise-grade analytics built for product teams.</p>

          <ul className="space-y-4 text-base">
            <li className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#B89B72] mt-2" />
              <span className="text-[#6F665E]">Event-level analytics with flexible segmentation</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#B89B72] mt-2" />
              <span className="text-[#6F665E]">Real-time funnel reporting</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#B89B72] mt-2" />
              <span className="text-[#6F665E]">Secure role-based access</span>
            </li>
          </ul>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-8">
            <div className="rounded-3xl bg-[#FFFDF9] border border-[#DDD3C6] p-4 shadow-soft">
              <div className="text-sm font-semibold text-[#3E362E] mb-2">Faster insights</div>
              <div className="text-sm text-[#6F665E]">Cut funnel analysis time by up to 40% with integrated reporting.</div>
            </div>
            <div className="rounded-3xl bg-[#FFFDF9] border border-[#DDD3C6] p-4 shadow-soft">
              <div className="text-sm font-semibold text-[#3E362E] mb-2">Team-ready</div>
              <div className="text-sm text-[#6F665E]">Share dashboards, track customers, and align growth teams in one place.</div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center gap-4 text-sm text-[#6F665E]">
          <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
            <rect x="2" y="8" width="60" height="40" rx="6" stroke="#DDD3C6" strokeWidth="1.5" fill="#FFFDF9" />
            <path d="M8 40L22 24L36 32L48 16" stroke="#B89B72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="text-sm font-semibold text-[#3E362E]">Funnel Analytics</div>
            <div className="text-xs text-[#6F665E]">Analytics platform for growth teams</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="bg-[#FFFDF9] border border-[#DDD3C6] rounded-[32px] shadow-soft p-8 ring-1 ring-[#DDD3C6]/70">
            {children}
          </div>

          <div className="mt-6 text-center text-sm text-[#6F665E]">
            Don't have an account? <span className="font-semibold text-[#B89B72]">Contact Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
