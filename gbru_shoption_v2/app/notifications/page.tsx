"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BellOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7F5] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/user-profile" 
              className="p-2 bg-white rounded-full border border-zinc-200/60 shadow-sm hover:shadow hover:bg-zinc-50 transition-all text-zinc-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F291B] tracking-tight">
              Notifications
            </h1>
          </div>
        </div>
        <div className="md:hidden mb-6">
          <Link href="/user-profile" className="w-full h-10 flex items-center justify-center border border-[#0D9740] text-[#0D9740] font-bold text-xs rounded-lg transition-all bg-white">
            Edit Profile
          </Link>
        </div>

        {/* Empty State Card */}
        <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 md:p-24 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <BellOff className="w-12 h-12 text-emerald-600/80" strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-[#0F291B] mb-3">
            No notifications yet
          </h2>
          <p className="text-zinc-500 max-w-md mx-auto leading-relaxed mb-8">
            When you have important updates, alerts, or messages from GBRU about your orders and profile, they will appear here.
          </p>
          
          <Link 
            href="/products" 
            className="inline-flex items-center justify-center px-8 py-3.5 bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold rounded-[14px] shadow-sm hover:shadow transition-all"
          >
            Explore Products
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
