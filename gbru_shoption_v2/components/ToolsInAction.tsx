"use client";

import React, { useState } from "react";
import Image from "next/image";

interface VideoItem {
  id: number;
  title: string;
  thumbnail: string;
  videoUrl: string;
}

export default function ToolsInAction() {
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  const videos: VideoItem[] = [
    {
      id: 1,
      title: "spray pump in action",
      thumbnail: "/assets/Tufaan2.0.png",
      videoUrl: "https://www.youtube.com/embed/3rhBieQevLA?autoplay=1",
    },
    {
      id: 2,
      title: "solar camera in action",
      thumbnail: "/assets/Solar Camera-3.jpg",
      videoUrl: "https://www.youtube.com/embed/7gGJHSmBGOM?autoplay=1",
    },
    {
      id: 3,
      title: "mobile auto in action",
      thumbnail: "/assets/Mobile Auto-4.jpg",
      videoUrl: "https://www.youtube.com/embed/DX5_nQpXYjA?autoplay=1",
    },
    {
      id: 4,
      title: "seeder in action",
      thumbnail: "/assets/16 teeth seeder png.png",
      videoUrl: "https://www.youtube.com/embed/fGxiAGA4uf0?autoplay=1",
    },
  ];

  return (
    <section className="max-w-[1280px] mx-auto w-full lg:py-10 pt-1 pb-10 px-4 lg:px-8">
      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (Unchanged) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex gap-6 items-stretch">
        {/* Left Green Block */}
        <div className="w-[28%] bg-[#008A3D] rounded-3xl p-8 flex flex-col justify-between text-white min-h-[250px]">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold font-roboto leading-tight mb-3">
              See Tools in Action
            </h2>
            <p className="text-base lg:text-lg text-white/95 leading-relaxed font-medium">
              Watch real farmers using GBRU tools in their fields.
            </p>
          </div>
          <a
            href="/videos"
            className="mt-6 bg-white hover:bg-zinc-50 transition-colors text-[#008A3D] font-bold py-3.5 px-6 rounded-full text-center text-xs w-fit shadow-md flex items-center justify-center gap-2"
          >
            Watch All Videos
            <span>→</span>
          </a>
        </div>

        {/* Right 4 Videos Grid */}
        <div className="flex-1 grid grid-cols-4 gap-4">
          {videos.map((vid) => (
            <div key={vid.id} className="flex flex-col group cursor-pointer">
              {/* Thumbnail Container */}
              <div 
                onClick={() => setActiveVideoUrl(vid.videoUrl)}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
              >
                {vid.thumbnail.startsWith('http') ? (
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className={`w-full h-full ${vid.id === 1 || vid.id === 4 ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-105 ${vid.id === 1 || vid.id === 4 ? "bg-white" : ""}`}
                  />
                ) : (
                  <Image
                    src={vid.thumbnail}
                    alt={vid.title}
                    fill
                    className={`${vid.id === 1 || vid.id === 4 ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-105 ${vid.id === 1 || vid.id === 4 ? "bg-white" : ""}`}
                  />
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                    <svg className="w-5 h-5 text-[#008A3D] ml-0.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="mt-3 text-xs font-bold text-center text-[#1A1A1A] group-hover:text-[#008A3D] transition-colors leading-tight">
                {vid.title}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (Figma Redesign) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden w-full text-left">
        {/* Header Text */}
        <div className="mb-6 px-1 flex flex-col">
          <h2 
            className="font-roboto font-normal text-[#1F2937] text-[16px] leading-[24px] tracking-normal"
            style={{ fontStyle: 'normal' }}
          >
            Farmers' Stories
          </h2>
          <p 
            className="font-roboto font-normal text-[#4A4A4A] text-[16px] leading-[24px] tracking-normal"
            style={{ fontStyle: 'normal' }}
          >
            Real results from across the nation.
          </p>
        </div>

        {/* Scroll Container */}
        <div className="w-full overflow-x-auto -mx-4 px-4 pb-4 scrollbar-none snap-x snap-mandatory">
          <div className="flex gap-4 w-max pr-10">
            
            {/* See Tools in Action Green Card */}
            <div 
              className="bg-[#0D9740] rounded-[24px] p-6 flex flex-col justify-between text-white snap-center"
              style={{
                width: "238px",
                height: "298px",
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <h3 className="font-roboto font-bold text-white text-[28px] leading-[34px] tracking-tight">
                  See Tools in<br />Action
                </h3>
              </div>
              <div className="flex flex-col gap-4">
                <a
                  href="/videos"
                  className="bg-white text-[#0D9740] font-bold text-xs py-3 px-5 rounded-full shadow-md flex items-center justify-center gap-1.5 w-fit"
                >
                  Watch All Videos
                  <span className="text-[14px] leading-none">→</span>
                </a>
                <p className="text-[11px] text-white/90 leading-normal font-medium">
                  Watch real farmers using GBRU tools in their fields.
                </p>
              </div>
            </div>

            {/* Video Cards List */}
            {videos.map((vid) => (
              <div 
                key={vid.id}
                onClick={() => setActiveVideoUrl(vid.videoUrl)}
                className="relative rounded-[24px] overflow-hidden bg-black/10 shadow-lg cursor-pointer snap-center group flex-shrink-0"
                style={{
                  width: "280px",
                  height: "350px",
                }}
              >
                {/* Thumbnail Image */}
                {vid.thumbnail.startsWith('http') ? (
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className={`w-full h-full ${vid.id === 1 || vid.id === 4 ? "object-contain" : "object-cover"} ${vid.id === 1 || vid.id === 4 ? "bg-white" : ""}`}
                  />
                ) : (
                  <Image
                    src={vid.thumbnail}
                    alt={vid.title}
                    fill
                    className={`${vid.id === 1 || vid.id === 4 ? "object-contain" : "object-cover"} ${vid.id === 1 || vid.id === 4 ? "bg-white" : ""}`}
                  />
                )}
                
                {/* Dark gradient overlay for bottom titles */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                    <svg className="w-5 h-5 text-[#0D9740] ml-0.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Info Text */}
                <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-1.5">
                  <span className="text-[#FFB703] font-bold text-[10px] tracking-wider uppercase">
                    CASE STUDY
                  </span>
                  <h4 className="text-white font-roboto font-bold text-[15px] leading-tight capitalize">
                    {vid.title}
                  </h4>
                </div>
              </div>
            ))}

          </div>
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
