"use client";

import React from "react";
import Image from "next/image";

const features = [
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon1.png" alt="Durable Equipment" fill className="object-contain" />
      </div>
    ),
    title: "Durable Equipment",
    desc: "Engineered to withstand harsh field conditions for years.",
  },
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon2.png" alt="Service Support" fill className="object-contain" />
      </div>
    ),
    title: "Service Support",
    desc: "On-field expert technicians available at your call.",
  },
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon3.png" alt="Fast Delivery" fill className="object-contain" />
      </div>
    ),
    title: "Fast Delivery",
    desc: "Rapid shipping network to get tools to you when you need them.",
  },
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon4.png" alt="Easy Usage" fill className="object-contain" />
      </div>
    ),
    title: "Easy Usage",
    desc: "Intuitive controls that anyone can master in minutes.",
  },
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon5.png" alt="Warranty" fill className="object-contain" />
      </div>
    ),
    title: "Warranty",
    desc: "Guaranteed performance with comprehensive warranty plans.",
  },
  {
    icon: (
      <div className="relative w-6 h-6 flex-shrink-0">
        <Image src="/assets/Icon6.png" alt="Spare Support" fill className="object-contain" />
      </div>
    ),
    title: "Spare Support",
    desc: "Genuine parts readily available for every model we sell.",
  },
];

export default function WhyGBRU() {
  return (
    <section
      className="relative w-full bg-white flex items-center justify-center py-0 xl:py-[44px]"
      style={{
        minHeight: "auto",
      }}
    >
      {/* Inner Div */}
      <div
        className="flex flex-col items-center w-full max-w-[1280px] h-auto xl:h-[560px] px-4 xl:px-[64px] gap-8 xl:gap-[64px]"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          {/* Title: Why GBRU */}
          <h2 className="flex items-center text-[#1E3A2F] gap-2">
            <span
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 700,
                fontSize: "48px",
                lineHeight: "56px",
                letterSpacing: "-0.96px",
                textAlign: "center"
              }}
            >
              Why
            </span>
            {/* Clip to hide tagline, show mascot + GBRU letters sized to match "Why" text */}
            <div style={{ width: "136px", height: "63px", overflow: "hidden", position: "relative", flexShrink: 0, top: "-8px" }}>
              <Image
                src="/assets/gbru_green.png"
                alt="GBRU"
                width={136}
                height={90}
                className="object-contain object-top"
              />
            </div>
          </h2>
          <p className="font-roboto text-[#3A3A3A] text-[16px] text-center w-full leading-relaxed">
            We combine heavy-duty materials with farmer-first designs to ensure you never stop<br />
            growing.
          </p>
        </div>

        {/* MOBILE: 2x3 grid card layout (Figma Exact) */}
        <div className="grid grid-cols-2 xl:hidden w-full px-3 justify-center animate-fade-in" style={{ gap: "11.46px" }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start bg-white border border-[#E5E7EB] relative text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              style={{
                width: "100%",
                minWidth: "0",
                height: "110px", 
                borderRadius: "15.28px",
                borderWidth: "0.48px",
                padding: "12px 10px",
                gap: "8.5px",
              }}
            >
              {/* Icon Box */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-[8px] bg-[#E8F5EE]"
                style={{ width: "32px", height: "32px" }}
              >
                {feature.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col min-w-0 justify-center">
                <span 
                  className="font-roboto text-[#1E3A2F]"
                  style={{
                    fontFamily: "Roboto",
                    fontWeight: 700,
                    fontSize: "12px",
                    lineHeight: "14.33px",
                    letterSpacing: "-0.11px",
                  }}
                >
                  {feature.title}
                </span>
                <span 
                  className="font-roboto text-[#6B7280] mt-1"
                  style={{
                    fontFamily: "Roboto",
                    fontWeight: 400,
                    fontSize: "9.64px",
                    lineHeight: "11.46px",
                    letterSpacing: "0px",
                  }}
                >
                  {feature.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP: Original Grid (3x2 layout - Unchanged) */}
        <div
          className="hidden xl:grid"
          style={{
            width: "1152px",
            height: "376px",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            rowGap: "24px",
            columnGap: "24px",
          }}
        >
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 bg-white border border-[#E5E7EB] hover:border-[#1E6B3C]/30 hover:shadow-sm transition-all duration-300"
              style={{
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              {/* Icon Box */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-[10px] bg-[#E8F5EE]"
                style={{ width: "48px", height: "48px" }}
              >
                {feature.icon}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1.5">
                <span className="font-roboto font-bold text-[#1E3A2F] text-[17px] leading-snug">
                  {feature.title}
                </span>
                <span className="font-roboto text-[#6B7280] text-[14px] leading-relaxed">
                  {feature.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

