"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useShoptionSetting } from "@/hooks/useShoptionSetting";

export default function TrackOrder() {
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");
  const [trackingResult, setTrackingResult] = useState<"idle" | "loading" | "success" | "notfound">("idle");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !mobile) return;
    setTrackingResult("loading");
    setTimeout(() => {
      // Mock order match
      if (orderId.includes("2026")) {
        setTrackingResult("success");
      } else {
        setTrackingResult("notfound");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* ── Left Column (Graphic & Badges) ── */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[480px] aspect-square rounded-[32px] overflow-hidden bg-zinc-50 border border-zinc-100 shadow-sm p-4">
              <div className="relative w-full h-full rounded-[24px] overflow-hidden">
                <Image
                  src="/assets/caroussel-2.jpg"
                  alt="GBRU Tractor Field"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Floating Badge Top Right */}
              <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-[16px] py-2.5 px-4 shadow-lg border border-zinc-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm">
                  📞
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none">Live Support</span>
                  <span className="text-xs font-bold text-[#0F291B] mt-0.5">24/7 Available</span>
                </div>
              </div>

              {/* Floating Badge Bottom Left */}
              <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-[16px] py-2.5 px-4 shadow-lg border border-zinc-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm">
                  🔍
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none">Track Orders</span>
                  <span className="text-xs font-bold text-[#0F291B] mt-0.5">Real-Time Updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column (Form & Details) ── */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-[38px] lg:text-[44px] font-extrabold text-[#0F291B] tracking-tight leading-tight">
                Track Your <br className="hidden sm:inline" /> GBRU Order
              </h1>
              <p className="text-zinc-500 text-sm max-w-md">
                Check delivery status, support updates, and product journey instantly.
              </p>
            </div>

            {/* Tracking Form Card */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-5 max-w-[480px] w-full">
              <form onSubmit={handleTrack} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0F291B]">Order ID</label>
                  <input
                    type="text"
                    placeholder="e.g., #GBRU2026052901"
                    required
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0F291B]">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-[10px] bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
                >
                  🔍 Track Order <span>→</span>
                </button>
              </form>

              {/* Status Timelines based on track action */}
              {trackingResult === "loading" && (
                <div className="text-xs text-zinc-500 text-center font-semibold py-2">Searching database...</div>
              )}

              {trackingResult === "notfound" && (
                <div className="text-xs text-red-500 text-center font-bold py-2">✗ Order not found. Make sure Order ID contains "2026".</div>
              )}

              {trackingResult === "success" && (
                <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4 mt-2">
                  <div className="flex justify-between items-center bg-emerald-50 text-[#0D9740] rounded-[8px] p-2.5 text-xs font-bold">
                    <span>Status: In Transit</span>
                    <span>Expected: June 2-5, 2026</span>
                  </div>

                  {/* Step Timeline */}
                  <div className="flex flex-col gap-3 pl-2 mt-2">
                    <div className="flex gap-3">
                      <span className="text-[#0D9740] text-xs">●</span>
                      <div className="flex flex-col text-[11px] leading-tight">
                        <span className="font-bold text-[#0F291B]">Shipped from Warehouse</span>
                        <span className="text-zinc-400 mt-0.5">Ludhiana Hub • Today</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#0D9740] text-xs">●</span>
                      <div className="flex flex-col text-[11px] leading-tight">
                        <span className="font-bold text-[#0F291B]">Order Confirmed</span>
                        <span className="text-zinc-400 mt-0.5">Approved • Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alternate Login CTA */}
            <Link
              href="/login"
              className="max-w-[480px] w-full h-12 border border-zinc-300 hover:bg-zinc-50 rounded-[10px] text-zinc-700 font-bold text-xs flex items-center justify-center transition-all shadow-sm"
            >
              Login to view all your orders
            </Link>

            {/* Support Buttons Row */}
            <div className="max-w-[480px] w-full grid grid-cols-2 gap-4">
              {whatsappEnabled === 1 ? (
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 bg-white hover:bg-zinc-50 border border-zinc-200 text-[#0F291B] font-bold text-xs rounded-[10px] flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <div className="w-[24px] h-[24px] rounded-full overflow-hidden flex items-center justify-center border border-zinc-200 shrink-0">
                    <img src="/assets/nova.jpeg" alt="Nova" className="object-cover w-full h-full" />
                  </div>
                  Chat with Nova
                </a>
              ) : (
                <div />
              )}
              <button className="h-12 bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold text-xs rounded-[10px] flex items-center justify-center gap-2 shadow-sm transition-all">
                📞 Talk to Expert
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
