import React from "react";
import Image from "next/image";

export default function Stats() {
  const statItems = [
    { value: "50 Cr+", label: "Products in Field" },
    { value: "Pan India", label: "Support Network" },
    { value: "Every 12 Km", label: "Our Presence" },
    { value: "Service & Spare", label: "Fast Support" },
  ];

  // Mobile-specific compact cards (Figma design)
  const mobileStatItems = [
    { value: "50k+", label: "Farmers Served" },
    { value: "24h", label: "Fast Delivery" },
    { value: "PAN", label: "India Support" },
    { value: "10k+", label: "Spare Parts" },
  ];

  return (
    <>
      {/* ── MOBILE: Figma Impact stats redesign (167px height, dark green background) ── */}
      <section 
        className="block lg:hidden w-full text-white py-4 px-4 overflow-hidden border-t border-b border-[#0D9740]/10 flex flex-col justify-between"
        style={{
          background: "#072011",
          height: "167px"
        }}
      >
        {/* Header */}
        <div>
          <h2 className="font-roboto font-bold text-[14px] leading-tight text-white/95">
            Our Impact
          </h2>
          <h3 className="font-roboto font-bold text-[14px] leading-tight text-white/90">
            In Numbers
          </h3>
        </div>

        {/* Numbers Row */}
        <div className="flex items-center justify-between w-full mt-2 relative">
          
          {/* Stat 1 */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            {/* Box Package Icon */}
            <div className="text-white mb-1.5 h-6 flex items-center justify-center">
              <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="font-roboto font-bold text-[12px] leading-tight text-white">5 Cr+</span>
            <span className="font-roboto font-normal text-[8px] leading-tight text-white/80 mt-0.5">Products in<br />Indian Fields</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 border-l border-dotted border-white/20" />

          {/* Stat 2 */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            {/* Map Pointer Icon */}
            <div className="text-white mb-1.5 h-6 flex items-center justify-center">
              <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="font-roboto font-bold text-[12px] leading-tight text-white">PAN India</span>
            <span className="font-roboto font-normal text-[8px] leading-tight text-white/80 mt-0.5">services</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 border-l border-dotted border-white/20" />

          {/* Stat 3 */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            {/* Farmer/Presence Icon */}
            <div className="text-white mb-1.5 h-6 flex items-center justify-center">
              <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-roboto font-bold text-[12px] leading-tight text-white">Our Presence</span>
            <span className="font-roboto font-normal text-[8px] leading-tight text-white/80 mt-0.5">Every 12 KM</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 border-l border-dotted border-white/20" />

          {/* Stat 4 */}
          <div className="flex-1 flex flex-col items-center text-center px-1">
            {/* Support Headphone Image Logo */}
            <div className="mb-1.5 h-6 flex items-center justify-center">
              <Image
                src="/assets/headset.png"
                alt="Headset"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <span className="font-roboto font-bold text-[12px] leading-tight text-white">Fast</span>
            <span className="font-roboto font-normal text-[8px] leading-tight text-white/80 mt-0.5">Service & Spare<br />Support</span>
          </div>

        </div>
      </section>

      {/* ── DESKTOP: New White Card Layout (overlapping viewports) ── */}
      <section className="hidden lg:flex w-full bg-[#EAF5EE] px-4 lg:px-[64px] pb-12 justify-center">
        <div className="max-w-[1152px] w-full bg-white rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.1)] flex items-center justify-between px-8 py-6 relative z-20 -mt-[54px]">
          {statItems.map((item, idx) => (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center justify-center text-center px-4 flex-1">
                <h2 className="font-roboto font-bold text-[24px] lg:text-[28px] text-[#00A859] leading-none tracking-tight">
                  {item.value}
                </h2>
                <p className="font-roboto font-medium text-[12px] lg:text-[14px] text-zinc-500 mt-2">
                  {item.label}
                </p>
              </div>
              {/* Divider for all but the last item */}
              {idx < statItems.length - 1 && (
                <div className="w-[1px] h-10 bg-zinc-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
