"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function Hero() {
  const [carouselIndex, setCarouselIndex] = useState(1); // 0, 1, 2

  const carouselImages = [
    "/assets/caroussel-2.jpg", // Left
    "/assets/caroussel-3.jpg", // Center (Product Poster)
    "/assets/caroussel-1.jpg", // Right
  ];

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev === 2 ? 0 : prev + 1));
  };

  // Get index positions for left, center, right styling
  const getPositionClass = (idx: number) => {
    const relativeIndex = (idx - carouselIndex + 3) % 3;
    if (relativeIndex === 0) return "left";
    if (relativeIndex === 1) return "center";
    return "right";
  };

  const features = [
    {
      title: "Durable Build",
      desc: "Long lasting performance",
      icon: (
        <svg className="w-4 h-4 text-[#00A859]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: "High Performance",
      desc: "More efficiency, better output",
      icon: (
        <svg className="w-4 h-4 text-[#00A859]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: "Easy Maintenance",
      desc: "Simple servicing, low maintenance",
      icon: (
        <svg className="w-4 h-4 text-[#00A859]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
    },
    {
      title: "Farmer Trusted",
      desc: "Used by thousands of happy farmers",
      icon: (
        <svg className="w-4 h-4 text-[#00A859]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-cover bg-center h-[553px] flex items-center text-white"
      style={{ backgroundImage: "url('/assets/home_hero_bg.png')" }}
    >
      {/* Backdrop blur overlay for the background image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backdropFilter: "blur(0.1px)" }}
      />
      {/* Soft white overlay descending from left to right */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.1) 100%)"
        }}
      />

      {/* Left side glow filter (dissolved radial gradient) */}
      <div
        className="absolute z-0 pointer-events-none hidden lg:block"
        style={{
          width: "550px",
          height: "650px",
          top: "-50px",
          left: "-150px",
          background: "radial-gradient(circle at 40% 50%, rgba(248, 240, 218, 0.95) 0%, rgba(227, 209, 179, 0.45) 55%, rgba(255, 255, 255, 0) 100%)",
          opacity: 0.95,
          filter: "blur(60px)",
        }}
      />

      {/* Main Container - width 1152px, centered */}
      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-4 lg:px-[64px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full">

          {/* Left Column (Hero Content) */}
          <div className="lg:col-span-6 flex flex-col justify-between lg:h-[466px]">
            {/* Top Text Content */}
            <div className="space-y-2.5 font-roboto">
              <h3 className="text-xl md:text-2xl lg:text-[28px] font-bold tracking-wide w-full lg:w-[564px] lg:max-w-[576px] lg:h-[56px] flex items-center gap-1.5 leading-tight">
                <span className="text-[#2D722F]">गब्रू हो साथ</span> <span className="text-[#2D722F]">,</span> <span className="text-[#0F291B]">तो टेंशन की क्या बात !</span>
              </h3>
              <h1 className="text-3xl md:text-4xl lg:text-[48px] font-extrabold leading-[1.1] tracking-tight text-[#0F291B]">
                Right tool.<br />
                <span 
                  className="bg-clip-text text-transparent bg-cover"
                  style={{ backgroundImage: "linear-gradient(90deg, #2D722F 0%, #768F0F 100%)" }}
                >
                  Better Farming.
                </span>
              </h1>
              <p className="text-[#0F291B]/80 max-w-lg font-roboto font-normal text-[15px] lg:text-[18px] leading-[22px] lg:leading-[28px] tracking-normal">
                High-performance machinery designed for the modern farmer. Durable, efficient, and backed by pan-India support.
              </p>
            </div>

            {/* Bottom Actions Content */}
            <div className="space-y-5 mt-6 lg:mt-0">
              {/* Buttons */}
              <div className="flex flex-wrap gap-[16px]">
                <button className="bg-[#0D9740] hover:bg-[#0b8036] text-white font-roboto font-bold text-[14px] leading-none w-[185px] h-[58px] min-h-[48px] rounded-[32px] pt-[16px] pr-[32px] pb-[16px] pl-[32px] flex items-center justify-center transition-all duration-200 hover:scale-[1.02] cursor-pointer shadow-lg">
                  Explore Products
                </button>
                <button className="flex items-center justify-center gap-[7.99px] bg-white border border-[#2B7832] text-[#2B7832] font-roboto font-bold text-[14px] leading-none w-[185px] h-[58px] min-h-[48px] rounded-[32px] pt-[16px] pr-[32px] pb-[16px] pl-[32px] transition-all duration-200 cursor-pointer shadow-md">
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#2B7832" strokeWidth="2.5" fill="none" />
                    <path d="M10 8.5V15.5L15.5 12L10 8.5Z" fill="#2B7832" />
                  </svg>
                  Watch Demo
                </button>
              </div>

              {/* Feature Pill Card (White pill bottom left) */}
              <div
                className="bg-white/95 backdrop-blur-md text-[#0F291B] rounded-[33px] shadow-2xl border border-white/20 w-full lg:w-[606px] lg:h-[82px] lg:ml-[-30px] flex flex-row gap-[15px] pt-[23px] pr-[14px] pb-[13px] pl-[17px] items-center justify-between"
              >
                {features.map((item, i) => (
                  <div key={i} className="flex items-center space-x-1.5 min-w-0">
                    <div className="flex-shrink-0 p-1 bg-[#00A859]/10 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex flex-col justify-center">
                      <h4 className="text-[10px] font-bold text-[#0F291B] truncate leading-none">{item.title}</h4>
                      <p className="text-[8px] text-black/60 font-semibold leading-none truncate mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (Carousel & YouTube Video Box) */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center space-y-8">

            {/* Photo Carousel wrapper - Width 671px, Height 257px */}
            <div className="relative w-full max-w-[671px] h-[320px] flex items-center justify-center overflow-visible">

              {/* Carousel Track */}
              <div className="relative w-full h-[288px] flex items-center justify-center">
                {carouselImages.map((imgUrl, idx) => {
                  const pos = getPositionClass(idx);

                  if (pos === "center") {
                    return (
                      <div
                        key={idx}
                        className="absolute z-20 w-[300px] sm:w-[420px] md:w-[512px] h-[180px] sm:h-[240px] md:h-[288px] transition-all duration-500 ease-in-out transform scale-100 opacity-100 shadow-2xl rounded-2xl overflow-hidden border-2 border-white/20"
                      >
                        <Image
                          src={imgUrl}
                          alt="Machinery Carousel Center"
                          fill
                          className="object-cover"
                          sizes="(max-w-768px) 300px, 512px"
                          priority
                        />
                      </div>
                    );
                  }

                  const isLeft = pos === "left";
                  return (
                    <div
                      key={idx}
                      className={`absolute z-10 hidden sm:block w-[140px] md:w-[181px] h-[140px] md:h-[184px] transition-all duration-500 ease-in-out transform opacity-100 overflow-hidden rounded-xl border border-white/10 ${isLeft
                        ? "translate-x-[-120px] md:translate-x-[-220px]"
                        : "translate-x-[120px] md:translate-x-[220px]"
                        }`}
                    >
                      <Image
                        src={imgUrl}
                        alt="Machinery Carousel Side"
                        fill
                        className="object-cover"
                        sizes="181px"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-0 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/45 border border-white/10 hover:bg-[#00A859] transition-all text-white cursor-pointer hover:scale-105"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={handleNext}
                className="absolute right-0 z-30 flex items-center justify-center w-10 h-10 rounded-full bg-black/45 border border-white/10 hover:bg-[#00A859] transition-all text-white cursor-pointer hover:scale-105"
                aria-label="Next image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* YouTube Video Box properties - Flex row of 3 cards */}
            <div className="flex flex-wrap lg:flex-nowrap justify-center gap-3 w-full max-w-[500px]">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="relative group w-[154.6px] h-[131.01px] max-w-[169.77px] rounded-[11.32px] overflow-hidden border-[0.71px] border-white/10 p-[11.32px] flex flex-col gap-[2.69px] bg-neutral-800/80 backdrop-blur-md shadow-xl transition-transform duration-300 hover:scale-[1.03] text-left"
                >
                  {/* Video Thumbnail Wrapper (132x75, rounded 6px) */}
                  <div className="relative w-[132px] h-[75px] rounded-[6px] overflow-hidden bg-black flex-shrink-0 z-10">
                    <Image
                      src="/assets/youtube-thumbnail.png"
                      alt="YouTube Video Thumbnail"
                      fill
                      className="object-cover z-0"
                    />
                    {/* Play Button Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10 group-hover:bg-black/25 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer">
                        <svg className="w-2.5 h-2.5 fill-[#0F291B] ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Info text at the bottom left */}
                  <div className="relative z-20 font-roboto text-left flex flex-col justify-center min-w-0 mt-0.5">
                    <span className="block text-[8px] text-white/50 uppercase tracking-wider font-semibold leading-none">watch our</span>
                    <span className="block text-[10px] text-white font-bold leading-tight mt-0.5 truncate">Kisan Expo 2025</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
