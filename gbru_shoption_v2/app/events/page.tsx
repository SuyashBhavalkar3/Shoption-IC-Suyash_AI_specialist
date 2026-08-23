import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Events & Invites - GBRU',
  description: 'Stay updated on upcoming GBRU agriculture events, workshops, exhibitions, and invites.',
};

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col justify-between">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16 flex-grow flex flex-col items-center justify-center text-center">
        <div className="bg-white border border-zinc-200/80 rounded-[32px] p-8 md:p-12 shadow-sm max-w-xl w-full flex flex-col items-center gap-6">
          
          {/* Calendar Icon Badge */}
          <div className="w-20 h-20 rounded-full bg-[#EBF5EE] flex items-center justify-center text-[#0D9740] shadow-sm mb-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F291B] tracking-tight">
              Events & Invites
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
              Stay tuned for our upcoming exhibitions, farmer workshops, and product launch invitations.
            </p>
          </div>

          <div className="w-full bg-[#F4F6F4] rounded-2xl p-6 text-left border border-zinc-200/40">
            <h3 className="font-bold text-[#0F291B] text-sm mb-1.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DFB33F] animate-ping shrink-0" />
              No Active Events
            </h3>
            <p className="text-zinc-600 text-xs leading-relaxed">
              We do not have any active events or exhibition invites scheduled at the moment. Keep checking this space—we will post invitations and event updates here.
            </p>
          </div>

          <Link
            href="/"
            className="w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow hover:shadow-md mt-2 flex items-center justify-center gap-1.5"
          >
            ← Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
