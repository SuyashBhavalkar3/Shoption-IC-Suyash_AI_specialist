"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Star, MessageCircle, ShoppingCart, Truck, AlertTriangle } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Chat on WhatsApp",
    desc: "Seamless direct communication.",
  },
  {
    icon: ShoppingCart,
    title: "Place Order & Payments",
    desc: "Direct transactions in the chat",
  },
  {
    icon: Truck,
    title: "Track Your Order",
    desc: "Real-time updates on deliveries",
  },
  {
    icon: AlertTriangle,
    title: "Raise and Track Complaints",
    desc: "Quick issue resolutions and updates",
  },
];

export default function BoostBusinessWithNova() {
  const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_LINK || "#";

  return (
    <section className="w-full bg-white py-10 md:py-12 flex justify-center items-center px-4 select-none">
      <div
        className="relative w-full max-w-[1206px] min-h-[380px] rounded-[36px] overflow-hidden flex flex-col lg:flex-row items-center justify-between p-6 lg:p-10 shadow-sm bg-cover"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), url('/assets/nova_bg.jpg')",
          backgroundColor: "#E6F5EC",
          backgroundPosition: "center 30%",
        }}
      >
        {/* Left Content */}
        <div className="relative z-10 flex flex-col text-left max-w-full lg:max-w-[720px] gap-4">
          
          {/* Star Badge */}
          <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <Star className="w-3.5 h-3.5 text-[#00A859] fill-[#00A859]" />
            <span className="text-[10px] font-bold text-[#00A859] tracking-wide">
              Your Smart Communication Partner
            </span>
          </div>

          <h2 
            className="text-[#1A2E35]"
            style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              lineHeight: "34px",
              letterSpacing: "-0.68px",
              verticalAlign: "middle"
            }}
          >
            Simplify your shopping<br />
            experience with<br />
            <span 
              className="text-[#00A859] uppercase align-middle"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 700,
                fontSize: "42px",
                lineHeight: "42px",
                letterSpacing: "0px"
              }}
            >
              NOVA
            </span>
          </h2>

          {/* Features White Card */}
          <div className="bg-white rounded-[20px] p-4 grid grid-cols-2 gap-x-3 gap-y-5 sm:flex sm:flex-row items-start justify-between shadow-sm w-full font-roboto mt-2">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1 px-1">
                <div className="w-9 h-9 rounded-full border border-green-100 flex items-center justify-center mb-2 text-[#00A859]">
                  <f.icon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-[11px] font-bold text-[#1A2E35] leading-tight mb-1 min-h-[22px] flex items-center justify-center">
                  {f.title}
                </h3>
                <p className="text-[9px] font-normal text-zinc-400 leading-normal max-w-[120px]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Subtext */}
          <p className="text-sm font-medium text-zinc-500 font-sans tracking-wide mt-2">
            AI-Powered Commerce & Customer Assistant
          </p>

          {/* Chat Button */}
          <div className="flex mt-2">
            <a
              href={`${whatsappLink}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between bg-[#00A859] hover:bg-[#00904C] text-white rounded-full pl-1.5 pr-5 py-1.5 transition-all shadow-md shadow-green-600/20 w-fit gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image src="/assets/nova1.png" alt="Nova" width={36} height={36} className="object-cover" />
              </div>
              <span className="font-bold text-[12px] uppercase tracking-wider font-roboto">Chat with Nova</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>

        </div>

        {/* Right Illustration */}
        <div className="relative z-10 flex justify-center items-center w-full lg:w-auto mt-8 lg:mt-0">
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] lg:w-[440px] lg:h-[440px] flex-shrink-0">
            <Image
              src="/assets/nova1.png"
              alt="Nova AI Assistant"
              fill
              className="object-contain object-bottom drop-shadow-xl animate-float"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}
