"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GbRUOnField() {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const stats = [
    { value: "50+", label: "Exhibitions Attended" },
    { value: "2M+", label: "Farmers Reached" },
    { value: "15+", label: "States Covered" },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* Background: Green Grass Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/green_grass.png"
          alt="Green Grass Background"
          fill
          className="object-cover"
          style={{ objectPosition: "center 20%" }}
          priority
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.3) 65%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* MOBILE LAYOUT — Figma Exact                   */}
      {/* ══════════════════════════════════════════════ */}
      <div
        className="block xl:hidden relative z-10 w-full"
        style={{
          maxWidth: "391px",
          margin: "0 auto",
          paddingTop: "48px",
          paddingRight: "19.54px",
          paddingBottom: "36.64px",
          paddingLeft: "19.54px",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-roboto font-bold text-[#0F291B] text-[24px] leading-tight">
            GBRU on the Field
          </h2>
          <p className="font-roboto text-[#374151] text-[12px] mt-1">
            Experience our technology live at exhibitions across India.
          </p>
        </div>

        {/* Video Grid Area (Flex Row) */}
        <div 
          className="flex w-full justify-between items-stretch" 
          style={{ 
            height: "240.56px", 
            gap: "14.66px" 
          }}
        >
          {/* Column 1: Live Demo Highlights Video */}
          <div
            onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/w5p5uD50hxM?autoplay=1")}
            className="relative rounded-[12px] overflow-hidden shadow-lg cursor-pointer group bg-black/10 flex-1"
            style={{
              height: "240.56px",
              width: "50%",
              minWidth: "0",
            }}
          >
            <Image
              src="/assets/gbru_field_live_demo.png"
              alt="Live Demo Highlights"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/15" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="font-roboto font-bold text-white text-[11px] drop-shadow leading-tight block">
                Live Demo Highlights
              </span>
            </div>
          </div>

          {/* Column 2: Stacked Subgrid layout */}
          <div 
            className="flex flex-col justify-between flex-1" 
            style={{ 
              height: "240.56px",
              gap: "12px",
              width: "50%",
              minWidth: "0",
            }}
          >
            {/* Row 1: 2 Mini Side-by-Side Videos */}
            <div className="grid grid-cols-2 gap-2" style={{ height: "100px" }}>
              {/* Mini Video 1 (Punjab Agri Expo) */}
              <div className="relative rounded-[8px] overflow-hidden bg-black/10">
                <Image
                  src="/assets/gbru_field_punjab_expo.png"
                  alt="Punjab Agri Expo"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="font-roboto font-bold text-white text-[8px] drop-shadow leading-tight block truncate">
                    Punjab Agri Expo
                  </span>
                </div>
              </div>

              {/* Mini Video 2 (Kisan Mela Booth) */}
              <div className="relative rounded-[8px] overflow-hidden bg-black/10">
                <Image
                  src="/assets/gbru_field_kisan_mela.png"
                  alt="Kisan Mela Booth"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="font-roboto font-bold text-white text-[8px] drop-shadow leading-tight block truncate">
                    Kisan Mela Booth
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Farmer Workshop 2024 Video */}
            <div 
              className="relative rounded-[10px] overflow-hidden bg-black/10"
              style={{ height: "128.56px" }}
            >
              <Image
                src="/assets/gbru_field_workshop.png"
                alt="Farmer Workshop"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-2 left-2 right-2">
                <span className="font-roboto font-bold text-white text-[10px] drop-shadow leading-tight block">
                  Farmer Workshop 2024
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Cards below */}
        <div className="flex justify-between w-full mt-6" style={{ gap: "6px" }}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              style={{
                width: "112.42px",
                height: "47.15px",
                borderRadius: "4.89px",
                borderWidth: "0.31px",
                borderColor: "rgba(15, 41, 27, 0.12)",
                padding: "4px",
                gap: "2px",
              }}
            >
              <span className="font-roboto font-bold text-[#0F291B] text-[13px] leading-none">
                {stat.value}
              </span>
              <span className="font-roboto text-[#6B7280] text-[8px] leading-none truncate w-full">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden xl:flex relative z-10 w-full flex-col items-center pt-10 sm:pt-12 pb-12 sm:pb-16 px-4 sm:px-6 xl:px-0">
        {/* Header */}
        <h2 className="font-roboto font-bold text-[#0F291B] text-[30px] sm:text-[40px] leading-tight text-center mb-3 max-w-3xl">
          GBRU on the Field
        </h2>
        <p className="font-roboto text-[#374151] text-[15px] sm:text-[16px] text-center mb-0 max-w-2xl">
          Experience our technology live at exhibitions across India.
        </p>

        {/* Grid layout */}
        <div
          className="grid mt-[28px] w-[1152px]"
          style={{
            height: "627.25px",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(2, 1fr)",
            gap: "24px",
          }}
        >
          <div
            onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/w5p5uD50hxM?autoplay=1")}
            className="relative rounded-[20px] overflow-hidden shadow-xl cursor-pointer group"
            style={{ gridColumn: "1 / 3", gridRow: "1 / 3" }}
          >
            <Image
              src="/assets/gbru_field_live_demo.png"
              alt="Live Demo Highlights"
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-[#2D722F] ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="font-roboto font-semibold text-white text-[15px] drop-shadow">
                Live Demo Highlights
              </span>
            </div>
          </div>

          <div className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group" style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}>
            <Image src="/assets/gbru_field_punjab_expo.png" alt="Punjab Agri Expo" fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
            <div className="absolute bottom-3 left-3"><span className="font-roboto font-semibold text-white text-[13px] drop-shadow">Punjab Agri Expo</span></div>
          </div>

          <div className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group" style={{ gridColumn: "4 / 5", gridRow: "1 / 2" }}>
            <Image src="/assets/gbru_field_kisan_mela.png" alt="Kisan Mela Booth" fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
            <div className="absolute bottom-3 left-3"><span className="font-roboto font-semibold text-white text-[13px] drop-shadow">Kisan Mela Booth</span></div>
          </div>

          <div className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group" style={{ gridColumn: "3 / 5", gridRow: "2 / 3" }}>
            <Image src="/assets/gbru_field_workshop.png" alt="Farmer Workshop 2024" fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
            <div className="absolute bottom-3 left-3"><span className="font-roboto font-semibold text-white text-[13px] drop-shadow">Farmer Workshop 2024</span></div>
          </div>
        </div>

        {/* View More Button */}
        <Link href="/videos" className="bg-[#0D9740] hover:bg-[#0a7d34] text-white font-roboto font-semibold text-[15px] shadow-md transition-all duration-300 hover:scale-105 active:scale-95 mt-8 sm:mt-10 w-full sm:w-[226px] h-14 sm:h-16 rounded-full px-8 sm:px-[67px] flex items-center justify-center">
          View More
        </Link>

        {/* Stats Bar */}
        <div className="w-full max-w-[1152px] grid grid-cols-3 gap-5 mt-10">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center shadow-md border border-white/70 rounded-[16px] min-h-[142px] px-6 py-8 gap-1"
            >
              <span className="font-roboto font-bold text-[#0F291B] text-[36px] leading-tight">
                {stat.value}
              </span>
              <span className="font-roboto text-[#6B7280] text-[14px] font-medium text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Lightbox Modal */}
      {activeVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4 animate-fade-in"
          onClick={() => setActiveVideoUrl(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 transition-colors text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold z-10"
              onClick={() => setActiveVideoUrl(null)}
            >
              ✕
            </button>
            <iframe
              width="100%"
              height="100%"
              src={activeVideoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </section>
  );
}

