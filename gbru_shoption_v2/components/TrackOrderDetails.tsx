"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Truck, Home, Phone, MessageCircle, Wrench, Users, Package, Zap, Shield, ExternalLink, Smartphone, History, Bell, Calendar, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { useShoptionSetting } from "@/hooks/useShoptionSetting";

export default function TrackOrderDetails() {
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  const triggerPrintInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-8 flex-1 flex flex-col gap-8">

        {/* Back Link */}
        <Link
          href="/track-order"
          className="flex items-center gap-1.5 text-sm font-bold text-[#0D9740] hover:underline self-start"
        >
          ← Back to Tracking
        </Link>

        {/* Product & Details Header Card */}
        <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col lg:flex-row justify-between items-stretch gap-6 relative">

          <div className="flex flex-col md:flex-row items-stretch gap-6 flex-1">
            {/* Product Image */}
            <div className="relative w-full md:w-[120px] h-[120px] rounded-[16px] overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0">
              <Image
                src="/assets/gbru_tractor_main.png"
                alt="GBRU Pro-Series 5000"
                fill
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between py-1">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[#0F291B] text-[18px] leading-tight">
                  GBRU Pro-Series 5000
                </h3>
                <p className="text-xs text-zinc-500">
                  Premium Multi-Purpose Agricultural Tractor
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-500 font-medium">
                  <span>Order ID: <span className="text-[#0F291B] font-bold">#GBRU2026052901</span></span>
                  <span className="h-3 w-px bg-zinc-300"></span>
                  <span className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold py-0.5 px-2.5 rounded-[4px]">
                    Full Payment
                  </span>
                </div>
              </div>

              {/* Delivery Details row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 pt-3 border-t border-zinc-100 text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-500">Delivery Address</span>
                  <span className="font-bold text-[#0F291B]">Ramesh Kumar</span>
                  <span className="text-zinc-600 text-[11px]">Khanna, Ludhiana, Punjab - 141401</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-zinc-500">Expected Delivery</span>
                  <span className="font-extrabold text-[#0D9740] text-[15px] mt-0.5">
                    June 2-5, 2026
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Download Action */}
          <div className="flex items-start justify-end">
            <button
              onClick={triggerPrintInvoice}
              className="h-10 px-5 border border-zinc-300 hover:bg-zinc-50 rounded-[10px] text-[#374151] font-bold text-xs flex items-center gap-2 shadow-sm transition-all whitespace-nowrap mt-2 group"
            >
              <div className="flex flex-col items-center justify-center w-4 h-4 shrink-0 text-[#374151] transition-transform group-hover:-translate-y-[1px]">
                <div className="relative flex flex-col items-center">
                  <div className="w-[2px] h-[6px] bg-current rounded-[1px]" />
                  <div className="w-[6px] h-[6px] border-[2px] border-t-0 border-l-0 border-current rotate-45 -mt-[4px]" />
                </div>
                <div className="w-[10px] h-[2px] bg-current mt-[3px] rounded-full" />
              </div>
              Invoice
            </button>
          </div>

        </div>

        {/* Main Grid Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left Column (Order Journey Vertical Timeline) ── */}
          <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-[24px] p-6 lg:p-8 shadow-sm">
            <h3 className="font-bold text-[#0F291B] text-lg mb-8">
              Order Journey
            </h3>

            {/* Vertical timeline */}
            <div className="relative pl-8 flex flex-col gap-8 border-l border-zinc-200 ml-4">

              {/* Step 1: Confirmed */}
              <div className="relative">
                <div className="absolute left-[-57px] top-[-10px] w-[54px] h-[54px] flex items-center justify-center bg-white z-10">
                  <Image src="/assets/order_journey1.png" alt="Order Confirmed" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#0F291B]">Order Confirmed</span>
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Your order has been confirmed.
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">
                    May 29, 2026 - 2:30 PM
                  </span>
                </div>
              </div>

              {/* Step 2: Processing */}
              <div className="relative">
                <div className="absolute left-[-57px] top-[-10px] w-[54px] h-[54px] flex items-center justify-center bg-white z-10">
                  <Image src="/assets/order_journey2.png" alt="Processing" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#0F291B]">Processing</span>
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Order is being prepared for dispatch.
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">
                    May 29, 2026 - 3:15 PM
                  </span>
                </div>
              </div>

              {/* Step 3: Packed */}
              <div className="relative">
                <div className="absolute left-[-57px] top-[-10px] w-[54px] h-[54px] flex items-center justify-center bg-white z-10">
                  <Image src="/assets/order_journey2.png" alt="Packed" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#0F291B]">Packed</span>
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Product has been packed and ready.
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1">
                    May 30, 2026 - 10:00 AM
                  </span>
                </div>
              </div>

              {/* Step 4: Dispatched (Active / Highlighted) */}
              <div className="relative">
                <div className="absolute left-[-57px] top-[-10px] w-[54px] h-[54px] flex items-center justify-center bg-white z-10">
                  <Image src="/assets/order_journey3.png" alt="Dispatched" fill className="object-contain" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#0F291B]">Dispatched</span>
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    Package dispatched from warehouse.
                  </span>
                  <span className="text-[10px] text-[#DFB33F] font-bold mt-1">
                    May 30, 2026 - 2:45 PM
                  </span>
                </div>
              </div>

              {/* Step 5: In Transit */}
              <div className="relative">
                <div className="absolute left-[-50px] top-[-3px] w-[40px] h-[40px] flex items-center justify-center bg-[#F7F9F8] border-[1.5px] border-zinc-200 rounded-[12px] z-10 text-[#6B7280]">
                  <MapPin className="w-[18px] h-[18px] shrink-0 stroke-[2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-zinc-400">In Transit</span>
                  <span className="text-[10px] text-zinc-400 leading-normal">
                    On the way to your location.
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Expected: May 31, 2026
                  </span>
                </div>
              </div>

              {/* Step 6: Out for Delivery */}
              <div className="relative">
                <div className="absolute left-[-50px] top-[-3px] w-[40px] h-[40px] flex items-center justify-center bg-[#F7F9F8] border-[1.5px] border-zinc-200 rounded-[12px] z-10 text-[#6B7280]">
                  <Truck className="w-[18px] h-[18px] shrink-0 stroke-[2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-zinc-400">Out for Delivery</span>
                  <span className="text-[10px] text-zinc-400 leading-normal">
                    Out for delivery to your address.
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Expected: June 2, 2026
                  </span>
                </div>
              </div>

              {/* Step 7: Delivered */}
              <div className="relative">
                <div className="absolute left-[-50px] top-[-3px] w-[40px] h-[40px] flex items-center justify-center bg-[#F7F9F8] border-[1.5px] border-zinc-200 rounded-[12px] z-10 text-[#6B7280]">
                  <Home className="w-[18px] h-[18px] shrink-0 stroke-[2]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-zinc-400">Delivered</span>
                  <span className="text-[10px] text-zinc-400 leading-normal">
                    Successfully delivered.
                  </span>
                  <span className="text-[10px] text-zinc-400 mt-1">
                    Expected: June 2, 2026
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ── Right Column (Delivery Information & Actions) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">

            {/* Delivery Info Box */}
            <div className="bg-[#0F2F20] text-white rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
              <h4 className="font-bold text-[16px] border-b border-white/10 pb-3">
                Delivery Information
              </h4>

              <div className="flex flex-col gap-5 text-xs">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#1C412E] rounded-[14px] flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-white stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1B8AD] text-[11px] leading-none">Delivery Partner</span>
                    <span className="font-bold text-[13px] leading-tight">GBRU Logistics</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#1C412E] rounded-[14px] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-white stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1B8AD] text-[11px] leading-none">Tracking Number</span>
                    <span className="font-bold text-[13px] leading-tight">GBRU2026PB1234</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                  <div className="w-11 h-11 bg-[#1C412E] rounded-[14px] flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-white stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1B8AD] text-[11px] leading-none">Expected Delivery</span>
                    <span className="font-bold text-[13px] leading-tight">June 2-5, 2026</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-1">
                  <div className="w-11 h-11 bg-[#324523] rounded-[14px] flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-[#FBBF24] stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1B8AD] text-[11px] leading-none">Free Installation</span>
                    <span className="font-bold text-[13px] leading-tight">Scheduled after delivery</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#094827] rounded-[14px] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#22C55E] stroke-[1.5]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#A1B8AD] text-[11px] leading-none">24/7 Support</span>
                    <span className="font-bold text-[13px] leading-tight">1800-XXX-GBRU</span>
                  </div>
                </div>
              </div>

              {/* Sub-notice */}
              <div className="bg-white/5 border border-white/10 rounded-[14px] p-3 text-[11px] text-[#A1B8AD] leading-relaxed flex items-start gap-2">
                <span>💡</span>
                <span>Our expert will call you before delivery to confirm the best delivery time.</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
              <h4 className="font-bold text-[#0F291B] text-sm">Quick Actions</h4>

              <div className="flex flex-col gap-3">
                {whatsappEnabled === 1 && (
                  <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full h-14 border border-zinc-200 hover:bg-zinc-50 rounded-[14px] text-[13px] font-bold text-[#2C332F] flex items-center justify-start px-3 gap-3 shadow-sm transition-all"
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-zinc-200 shrink-0">
                      <Image src="/assets/nova.jpeg" alt="Nova" width={36} height={36} className="object-cover w-full h-full" />
                    </div>
                    Chat with Nova
                  </a>
                )}
                <button className="w-full h-14 border border-zinc-200 hover:bg-zinc-50 rounded-[14px] text-[13px] font-bold text-[#2C332F] flex items-center justify-start px-3 gap-3 shadow-sm transition-all">
                  <div className="w-9 h-9 bg-[#EEF2EF] rounded-[10px] flex items-center justify-center shrink-0">
                    <Phone className="w-[18px] h-[18px] text-[#164227] stroke-[2]" />
                  </div>
                  Talk to Expert
                </button>
                <button
                  onClick={triggerPrintInvoice}
                  className="w-full h-14 border border-zinc-200 hover:bg-zinc-50 rounded-[14px] text-[13px] font-bold text-[#2C332F] flex items-center justify-start px-3 gap-3 shadow-sm transition-all"
                >
                  <div className="w-9 h-9 bg-[#EEF2EF] rounded-[10px] flex items-center justify-center shrink-0">
                    <Download className="w-[18px] h-[18px] text-[#164227] stroke-[2]" />
                  </div>
                  Download Invoice
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Need Help? Card */}
        <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
          <h3 className="font-bold text-[#0F291B] text-lg">Need Help?</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Talk to GBRU Expert */}
            <div className="bg-[#F0F3F1] hover:bg-[#e7ebe9] rounded-[16px] p-4 flex items-center gap-4 cursor-pointer transition-colors border border-black/5">
              <div className="w-[42px] h-[42px] bg-[#1E4D2E] rounded-[12px] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#1E4D2E]">Talk to GBRU Expert</span>
                <span className="text-xs text-[#6B7280]">Get instant help from our specialists</span>
              </div>
            </div>

            {/* Chat with Nova Assistance */}
            {whatsappEnabled === 1 && (
              <a 
                href={whatsappLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-[#EBF7EF] hover:bg-[#dcf3e4] rounded-[16px] p-4 flex items-center gap-4 cursor-pointer transition-colors border border-black/5"
              >
                <div className="w-[42px] h-[42px] rounded-full overflow-hidden flex items-center justify-center border border-zinc-200 shrink-0">
                  <Image src="/assets/nova.jpeg" alt="Nova" width={42} height={42} className="object-cover w-full h-full" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold text-sm text-[#0D9740]">Chat with Nova</span>
                  <span className="text-xs text-[#6B7280]">Get AI support on WhatsApp</span>
                </div>
              </a>
            )}

            {/* Raise Service Request */}
            <div className="bg-[#FDF8EB] hover:bg-[#faeed1] rounded-[16px] p-4 flex items-center gap-4 cursor-pointer transition-colors border border-black/5">
              <div className="w-[42px] h-[42px] bg-[#DFB33F] rounded-[12px] flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#DFB33F]">Raise Service Request</span>
                <span className="text-xs text-[#6B7280]">Schedule installation or service</span>
              </div>
            </div>

            {/* Installation Support */}
            <div className="bg-[#F0F3F1] hover:bg-[#e7ebe9] rounded-[16px] p-4 flex items-center gap-4 cursor-pointer transition-colors border border-black/5">
              <div className="w-[42px] h-[42px] bg-[#566C59] rounded-[12px] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white stroke-[2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#566C59]">Installation Support</span>
                <span className="text-xs text-[#6B7280]">Book your free installation</span>
              </div>
            </div>

          </div>

          <div className="bg-[#F8F9FA] rounded-[14px] p-4 text-center text-xs text-zinc-500 font-medium">
            Average Response Time: <span className="font-bold text-[#0D9740]">2 Minutes</span> • Our team is here to support you at every step
          </div>
        </div>

        {/* Why Farmers Trust GBRU section */}
        <div className="bg-[#F8F9FA] rounded-[24px] p-6 lg:p-8 flex flex-col gap-8 border border-zinc-100">
          <h3 className="font-bold text-[#0F291B] text-lg text-center">Why Farmers Trust GBRU</h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center text-xs">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-[44px] h-[44px] bg-[#EEF2EF] rounded-[14px] flex items-center justify-center mb-1.5 shrink-0">
                <MapPin className="w-5 h-5 text-[#164227] stroke-[1.5]" />
              </div>
              <span className="font-bold text-[#164227] text-[18px] leading-tight">18,000+</span>
              <span className="text-[#889691] text-[10px]">Service Locations</span>
              <span className="text-[#2C332F] text-[11px] font-bold mt-1">PAN India Support</span>
            </div>
            
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-[44px] h-[44px] bg-[#EEF2EF] rounded-[14px] flex items-center justify-center mb-1.5 shrink-0">
                <Wrench className="w-5 h-5 text-[#164227] stroke-[1.5]" />
              </div>
              <span className="font-bold text-[#164227] text-[18px] leading-tight">&lt; 30 min</span>
              <span className="text-[#889691] text-[10px]">Response Time</span>
              <span className="text-[#2C332F] text-[11px] font-bold mt-1">Service Every 12 KM</span>
            </div>
            
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-[44px] h-[44px] bg-[#EEF2EF] rounded-[14px] flex items-center justify-center mb-1.5 shrink-0">
                <Package className="w-5 h-5 text-[#164227] stroke-[1.5]" />
              </div>
              <span className="font-bold text-[#164227] text-[18px] leading-tight">Genuine</span>
              <span className="text-[#889691] text-[10px]">Availability</span>
              <span className="text-[#2C332F] text-[11px] font-bold mt-1">Genuine Spares</span>
            </div>
            
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-[44px] h-[44px] bg-[#EEF2EF] rounded-[14px] flex items-center justify-center mb-1.5 shrink-0">
                <Zap className="w-5 h-5 text-[#164227] stroke-[1.5]" />
              </div>
              <span className="font-bold text-[#164227] text-[18px] leading-tight">2 min</span>
              <span className="text-[#889691] text-[10px]">Avg. Response</span>
              <span className="text-[#2C332F] text-[11px] font-bold mt-1">Fast Support</span>
            </div>
            
            <div className="flex flex-col items-center gap-0.5 col-span-2 md:col-span-1">
              <div className="w-[44px] h-[44px] bg-[#EEF2EF] rounded-[14px] flex items-center justify-center mb-1.5 shrink-0">
                <Shield className="w-5 h-5 text-[#164227] stroke-[1.5]" />
              </div>
              <span className="font-bold text-[#164227] text-[18px] leading-tight">5 Years</span>
              <span className="text-[#889691] text-[10px]">Comprehensive</span>
              <span className="text-[#2C332F] text-[11px] font-bold mt-1">Warranty Protection</span>
            </div>
          </div>
        </div>

        {/* Manage Everything in Shoption App Card */}
        <div className="bg-[#0B3A22] text-white rounded-[8px] flex flex-col md:flex-row items-center justify-between gap-6 px-8 pt-8 pb-0 shadow-sm relative mt-4 overflow-visible md:pr-16">
          <div className="flex flex-col gap-6 flex-1 z-10 mb-8 md:mb-12">
            <div className="bg-[#1F4632] text-[#EEF2EF] text-[11px] font-semibold py-1.5 px-4 rounded-full inline-block w-fit">
              App Experience
            </div>
            
            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-[28px] md:text-[32px] leading-tight max-w-sm">
                Manage Everything in Shoption App
              </h3>
              <p className="text-[13px] text-[#A1B8AD] leading-relaxed max-w-md">
                Your complete agricultural equipment management ecosystem in one powerful app
              </p>
            </div>

            {/* 2-column feature checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-6 mt-4 text-[12px] max-w-md">
              
              {/* Row 1 */}
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <Package className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Real-Time Tracking</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Live updates on your order status</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <Wrench className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Service Requests</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Book service appointments instantly</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <Shield className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Warranty Management</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Complete warranty documentation</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <Bell className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Instant Notifications</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Get notified about every update</span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <History className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Product History</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Access all your purchase records</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 bg-[#194029] rounded-[10px] flex items-center justify-center shrink-0">
                  <Smartphone className="w-[18px] h-[18px] text-[#EEF2EF]" />
                </div>
                <div className="flex flex-col leading-snug gap-0.5">
                  <span className="font-bold text-white text-[13px]">Spare Support</span>
                  <span className="text-[#A1B8AD] text-[11px] leading-relaxed">Order genuine spare parts</span>
                </div>
              </div>
              
              {/* Row 4 (Buttons) */}
              <div className="mt-2">
                <button className="bg-white text-[#0B3A22] font-bold text-[13px] h-12 px-5 rounded-[12px] flex items-center justify-center gap-2 transition-all hover:bg-zinc-100 w-full sm:w-auto">
                  <ExternalLink className="w-4 h-4" /> Open in Shoption <span>→</span>
                </button>
              </div>
              <div className="mt-2">
                <button className="border border-white/20 text-white font-bold text-[13px] h-12 px-5 rounded-[12px] flex items-center justify-center gap-2 transition-all hover:bg-white/5 bg-[#17452D] w-full sm:w-auto">
                  <Smartphone className="w-4 h-4" /> Download App
                </button>
              </div>
            </div>
          </div>

          {/* Smartphone graphics */}
          <div className="relative w-[280px] h-[340px] md:w-[320px] md:h-[420px] flex-shrink-0 z-10 self-center md:self-end mt-8 md:mt-0 -translate-y-8 md:-translate-y-12">
            <Image
              src="/assets/app.png"
              alt="Shoption App Mockup"
              fill
              className="object-contain object-bottom"
            />
            {/* Floating Bell */}
            <div className="absolute top-[0px] md:top-[-5px] right-[14px] md:right-[38px] w-16 h-16 z-20 drop-shadow-xl rounded-[16px]">
              <Image src="/assets/bell.png" alt="Notification" fill className="object-contain" />
            </div>
            {/* Floating Shield */}
            <div className="absolute bottom-[0px] md:bottom-[0px] left-[10px] md:left-[38px] w-16 h-16 z-20 drop-shadow-xl rounded-[16px]">
              <Image src="/assets/shield.png" alt="Warranty" fill className="object-contain" />
            </div>
          </div>
        </div>

      </main>


    </div>
  );
}
