"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FieldExperiences() {
  const playlist = [
    {
      title: "GBRU Spray Pumps",
      subtitle: "Our Farmer Review",
      desc: "See what our Gbru user are saying",
      duration: "03:41",
      category: "Information",
      thumbnail: "/assets/Tufaan2.0.png",
      videoUrl: "https://www.youtube.com/embed/3rhBieQevLA?autoplay=1",
    },
    {
      title: "GBRU Solar Camera",
      subtitle: "solar camera in action",
      desc: "In-depth review of our farm security monitoring system",
      duration: "08:20",
      category: "Reviews",
      thumbnail: "/assets/Solar Camera-3.jpg",
      videoUrl: "https://www.youtube.com/embed/7gGJHSmBGOM?autoplay=1",
    },
    {
      title: "GBRU Mobile Auto",
      subtitle: "mobile auto in action",
      desc: "Learn how the smart auto controller automates water pumps",
      duration: "02:58",
      category: "Information",
      thumbnail: "/assets/Mobile Auto-4.jpg",
      videoUrl: "https://www.youtube.com/embed/DX5_nQpXYjA?autoplay=1",
    },
    {
      title: "GBRU Seeder",
      subtitle: "seeder in action",
      desc: "See how the seeder makes planting faster and easier",
      duration: "04:15",
      category: "Exclusive Video",
      thumbnail: "/assets/16 teeth seeder png.png",
      videoUrl: "https://www.youtube.com/embed/fGxiAGA4uf0?autoplay=1",
    },
  ];

  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  return (
    <>
      {/* ══════════════════════════════════════════════ */}
      {/* MOBILE LAYOUT — Figma Exact                   */}
      {/* ══════════════════════════════════════════════ */}
      <section
        className="flex lg:hidden flex-col relative w-full bg-white overflow-hidden"
        style={{
          paddingTop: "20px",
          paddingLeft: "20px",
          paddingRight: "20px",
          paddingBottom: "20px",
          gap: "32px",
        }}
      >
        {/* Header Row */}
        <div className="relative z-10 w-full max-w-[1180px] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="text-left font-roboto max-w-2xl">
            <h2 className="text-[#0F291B] text-[28px] sm:text-[32px] lg:text-[40px] font-bold leading-tight">
              Field Experiences
            </h2>
            <p className="text-zinc-700 text-sm lg:text-base font-medium mt-1 max-w-md">
              Watch our equipment transform traditional farming.
            </p>
          </div>
          <Link
            href="/videos"
            className="text-black font-roboto font-bold text-sm cursor-pointer hover:underline transition-colors duration-200 self-start sm:self-auto"
          >
            View All Videos
          </Link>
        </div>

        {/* Main Console Box (Translucent green container overlaying outer background) */}
        <div
          className="relative z-10 w-full max-w-[1180px] rounded-[24px] lg:rounded-[34px] overflow-hidden backdrop-blur-[0.1px] pt-6 pb-6 px-4 sm:px-5 lg:pt-[113px] lg:pr-[32px] lg:pb-[32px] lg:pl-[20px] shadow-2xl border border-white/20"
          style={{ background: "linear-gradient(180deg, rgba(0, 168, 62, 0.5) 0%, rgba(34, 197, 94, 0.5) 100%)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between w-full">
            <div>
              <h2 className="text-[#0F291B] text-[22px] font-bold leading-tight font-roboto">
                Field Experiences
              </h2>
              <p className="text-zinc-700 text-[12px] font-medium mt-0.5">
                Watch our equipment transform traditional farming.
              </p>
            </div>
            <Link
              href="/videos"
              className="text-black font-roboto font-bold text-[12px] cursor-pointer hover:underline whitespace-nowrap mt-1"
            >
              View All Videos
            </Link>
          </div>

          {/* Inner Green Card — 358×346, border-radius 12px */}
          <div
            className="w-full overflow-hidden shadow-xl"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(180deg, rgba(0, 190, 106, 0.85) 0%, rgba(0, 117, 43, 0.92) 100%)",
              padding: "12px",
            }}
          >
            {/* Video Grid Area (Flex Row matching GbRUOnField) */}
            <div 
              className="flex w-full justify-between items-stretch" 
              style={{ 
                height: "240.56px", 
                gap: "10px" 
              }}
            >
              {/* Column 1: Main Video */}
              <div
                onClick={() => setActiveVideoUrl(playlist[0].videoUrl)}
                className="relative rounded-[10px] overflow-hidden shadow-lg cursor-pointer group bg-black/10 flex-1"
                style={{
                  height: "240.56px",
                  width: "50%",
                  minWidth: "0",
                }}
              >
                <Image
                  src={playlist[0].thumbnail}
                  alt={playlist[0].title}
                  fill
                  className={`object-cover ${playlist[0].title.includes("Seeder") || playlist[0].title.includes("Spray Pumps") ? "bg-white object-contain" : ""}`}
                />
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/25 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="font-roboto font-bold text-white text-[11px] drop-shadow leading-tight block">
                    {playlist[0].title}
                  </span>
                  <span className="font-roboto font-medium text-white/90 text-[9px] drop-shadow leading-tight block mt-0.5">
                    {playlist[0].duration}
                  </span>
                </div>
              </div>

              {/* Column 2: Stacked Subgrid layout */}
              <div 
                className="flex flex-col justify-between flex-1" 
                style={{ 
                  height: "240.56px",
                  gap: "10px",
                  width: "50%",
                  minWidth: "0",
                }}
              >
                {/* Row 1: 2 Mini Side-by-Side Videos */}
                <div className="grid grid-cols-2 gap-2" style={{ height: "100px" }}>
                  {/* Mini Video 1 */}
                  <div 
                    className="relative rounded-[8px] overflow-hidden bg-black/10 cursor-pointer group"
                    onClick={() => setActiveVideoUrl(playlist[1].videoUrl)}
                  >
                    <Image
                      src={playlist[1].thumbnail}
                      alt={playlist[1].title}
                      fill
                      className={`object-cover ${playlist[1].title.includes("Seeder") || playlist[1].title.includes("Spray Pumps") ? "bg-white object-contain" : ""}`}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <span className="font-roboto font-bold text-white text-[8px] drop-shadow leading-tight block truncate">
                        {playlist[1].title}
                      </span>
                    </div>
                  </div>

                  {/* Mini Video 2 */}
                  <div 
                    className="relative rounded-[8px] overflow-hidden bg-black/10 cursor-pointer group"
                    onClick={() => setActiveVideoUrl(playlist[2].videoUrl)}
                  >
                    <Image
                      src={playlist[2].thumbnail}
                      alt={playlist[2].title}
                      fill
                      className={`object-cover ${playlist[2].title.includes("Seeder") || playlist[2].title.includes("Spray Pumps") ? "bg-white object-contain" : ""}`}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <span className="font-roboto font-bold text-white text-[8px] drop-shadow leading-tight block truncate">
                        {playlist[2].title}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Bottom Right Video */}
                <div 
                  className="relative rounded-[10px] overflow-hidden bg-black/10 cursor-pointer group"
                  style={{ height: "130.56px" }}
                  onClick={() => setActiveVideoUrl(playlist[3].videoUrl)}
                >
                  <Image
                    src={playlist[3].thumbnail}
                    alt={playlist[3].title}
                    fill
                    className={`object-cover ${playlist[3].title.includes("Seeder") || playlist[3].title.includes("Spray Pumps") ? "bg-white object-contain" : ""}`}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-3 h-3 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="font-roboto font-bold text-white text-[10px] drop-shadow leading-tight block">
                      {playlist[3].title}
                    </span>
                    <span className="font-roboto font-medium text-white/90 text-[8px] drop-shadow leading-tight block mt-0.5">
                      {playlist[3].duration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════ */}
      {/* DESKTOP LAYOUT — original, unchanged           */}
      {/* ══════════════════════════════════════════════ */}
      <section
        className="hidden lg:flex relative w-full bg-cover bg-no-repeat bg-white pt-4 pb-8 px-4 sm:px-6 lg:h-[818px] lg:pt-[18px] lg:pr-[50px] lg:pb-[18px] lg:pl-[50px] flex-col items-center gap-4 lg:gap-[27px] overflow-hidden"
        style={{
          backgroundImage: "url('/assets/field_experience_bg_drone.png')",
          backgroundPosition: "center calc(100% + 250px)",
        }}
      >
        {/* Header Row */}
        <div className="relative z-10 w-full max-w-[1180px] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div className="text-left font-roboto max-w-2xl">
            <h2 className="text-[#0F291B] text-[28px] sm:text-[32px] lg:text-[40px] font-bold leading-tight">
              Field Experiences
            </h2>
            <p className="text-zinc-700 text-sm lg:text-base font-medium mt-1 max-w-md">
              Watch our equipment transform traditional farming.
            </p>
          </div>
          <Link
            href="/videos"
            className="text-black font-roboto font-bold text-sm cursor-pointer hover:underline transition-colors duration-200 self-start sm:self-auto"
          >
            View All Videos
          </Link>
        </div>

        {/* Main Console Box */}
        <div
          className="relative z-10 w-full max-w-[1180px] rounded-[24px] lg:rounded-[34px] overflow-hidden backdrop-blur-[0.1px] pt-6 pb-6 px-4 sm:px-5 lg:pt-[40px] lg:px-[40px] lg:pb-[40px] shadow-2xl border border-white/20"
          style={{ background: "linear-gradient(180deg, rgba(0, 168, 62, 0.5) 0%, rgba(34, 197, 94, 0.5) 100%)" }}
        >
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Grid layout matching GbRUOnField */}
            <div
              className="grid w-full"
              style={{
                height: "627.25px",
                gridTemplateColumns: "repeat(4, 1fr)",
                gridTemplateRows: "repeat(2, 1fr)",
                gap: "24px",
              }}
            >
              {/* Main Video (Left half) */}
              <div
                onClick={() => setActiveVideoUrl(playlist[0].videoUrl)}
                className="relative rounded-[20px] overflow-hidden shadow-xl cursor-pointer group bg-black/10"
                style={{ gridColumn: "1 / 3", gridRow: "1 / 3" }}
              >
                <Image
                  src={playlist[0].thumbnail}
                  alt={playlist[0].title}
                  fill
                  className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${playlist[0].title.includes("Seeder") || playlist[0].title.includes("Spray Pumps") ? "bg-white" : ""}`}
                />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-[#2D722F] ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="font-roboto font-bold text-white text-[20px] drop-shadow">{playlist[0].title}</h3>
                  <p className="text-white/90 font-roboto text-sm mt-1 drop-shadow">{playlist[0].desc}</p>
                </div>
                <span className="absolute top-4 right-4 bg-black/75 px-2.5 py-0.5 rounded text-[12px] font-bold text-white tracking-wide">
                  {playlist[0].duration}
                </span>
              </div>

              {/* Top Right 1 */}
              <div 
                className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group bg-black/10" 
                style={{ gridColumn: "3 / 4", gridRow: "1 / 2" }}
                onClick={() => setActiveVideoUrl(playlist[1].videoUrl)}
              >
                <Image src={playlist[1].thumbnail} alt={playlist[1].title} fill className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${playlist[1].title.includes("Seeder") || playlist[1].title.includes("Spray Pumps") ? "bg-white" : ""}`} />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h3 className="font-roboto font-semibold text-white text-[15px] drop-shadow leading-tight">{playlist[1].title}</h3>
                  <p className="text-white/80 font-roboto text-[11px] mt-0.5 drop-shadow truncate">{playlist[1].subtitle}</p>
                </div>
                <span className="absolute top-3 right-3 bg-black/75 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide">
                  {playlist[1].duration}
                </span>
              </div>

              {/* Top Right 2 */}
              <div 
                className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group bg-black/10" 
                style={{ gridColumn: "4 / 5", gridRow: "1 / 2" }}
                onClick={() => setActiveVideoUrl(playlist[2].videoUrl)}
              >
                <Image src={playlist[2].thumbnail} alt={playlist[2].title} fill className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${playlist[2].title.includes("Seeder") || playlist[2].title.includes("Spray Pumps") ? "bg-white" : ""}`} />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h3 className="font-roboto font-semibold text-white text-[15px] drop-shadow leading-tight">{playlist[2].title}</h3>
                  <p className="text-white/80 font-roboto text-[11px] mt-0.5 drop-shadow truncate">{playlist[2].subtitle}</p>
                </div>
                <span className="absolute top-3 right-3 bg-black/75 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-wide">
                  {playlist[2].duration}
                </span>
              </div>

              {/* Bottom Right */}
              <div 
                className="relative rounded-[16px] overflow-hidden shadow-lg cursor-pointer group bg-black/10" 
                style={{ gridColumn: "3 / 5", gridRow: "2 / 3" }}
                onClick={() => setActiveVideoUrl(playlist[3].videoUrl)}
              >
                <Image 
                  src={playlist[3].thumbnail} 
                  alt={playlist[3].title} 
                  fill 
                  className={`object-cover transition-transform duration-500 group-hover:scale-105 ${playlist[3].title.includes("Seeder") || playlist[3].title.includes("Spray Pumps") ? "bg-white" : "object-center"}`} 
                  style={playlist[3].title.includes("Seeder") ? { objectPosition: "center 90%" } : {}}
                />
                <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/25" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                    <svg className="w-6 h-6 text-[#2D722F] ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="font-roboto font-semibold text-white text-[18px] drop-shadow leading-tight">{playlist[3].title}</h3>
                  <p className="text-white/80 font-roboto text-[13px] mt-0.5 drop-shadow truncate">{playlist[3].desc}</p>
                </div>
                <span className="absolute top-4 right-4 bg-black/75 px-2 py-0.5 rounded text-[12px] font-bold text-white tracking-wide">
                  {playlist[3].duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Lightbox Modal — shared for mobile & desktop */}
      {activeVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4"
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
            />
          </div>
        </div>
      )}
    </>
  );
}
