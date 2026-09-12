"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const [carouselIndex, setCarouselIndex] = useState(1); // 0, 1, 2 — desktop
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(1); // 0, 1, 2 — mobile auto-slide

  const carouselImages = [
    "/assets/carousel2.JPG",
    "/assets/carousel3.JPG",
    "/assets/expo.png",
  ];

  // Desktop handlers (manual)
  const handlePrev = () => {
    setCarouselIndex((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev === 2 ? 0 : prev + 1));
  };

  // Mobile auto-slide — advances every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setMobileCarouselIndex((prev) => (prev === 2 ? 0 : prev + 1));
      setCarouselIndex((prev) => (prev === 2 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Mobile manual handlers
  const handleMobilePrev = () => {
    setMobileCarouselIndex((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleMobileNext = () => {
    setMobileCarouselIndex((prev) => (prev === 2 ? 0 : prev + 1));
  };

  // Desktop: get position class
  const getPositionClass = (idx: number) => {
    const relativeIndex = (idx - carouselIndex + 3) % 3;
    if (relativeIndex === 0) return "left";
    if (relativeIndex === 1) return "center";
    return "right";
  };

  // Mobile: get position class (uses independent index)
  const getMobilePositionClass = (idx: number) => {
    const relativeIndex = (idx - mobileCarouselIndex + 3) % 3;
    if (relativeIndex === 0) return "left";
    if (relativeIndex === 1) return "center";
    return "right";
  };

  const features = [
    {
      title: "Durable Build",
      desc: "Long lasting performance",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#162A5A] w-6 h-6 flex-shrink-0"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
      ),
    },
    {
      title: "High Performance",
      desc: "More efficiency, better output",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#162A5A] w-6 h-6 flex-shrink-0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      ),
    },
    {
      title: "Easy Maintenance",
      desc: "Simple servicing, low maintenance",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#162A5A] w-6 h-6 flex-shrink-0"><line x1="21" y1="8" x2="14" y2="8"></line><line x1="10" y1="8" x2="3" y2="8"></line><line x1="21" y1="16" x2="12" y2="16"></line><line x1="8" y1="16" x2="3" y2="16"></line><line x1="14" y1="5" x2="14" y2="11"></line><line x1="8" y1="13" x2="8" y2="19"></line></svg>
      ),
    },
    {
      title: "Farmer Trusted",
      desc: "Used by thousands of happy farmers",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#162A5A] w-6 h-6 flex-shrink-0"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
      ),
    },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-cover bg-center xl:min-h-[553px] xl:py-0 flex items-center text-white"
      style={{ backgroundImage: "url('/assets/home_hero_bg.png')" }}
    >
      {/* Backdrop blur overlay for the background image */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backdropFilter: "blur(6px)" }}
      />
      {/* Soft white overlay descending from left to right — desktop only */}
      <div
        className="hidden xl:block absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0.05) 100%)"
        }}
      />
      {/* Subtle white overlay — mobile only (reduced opacity) */}
      <div
        className="block xl:hidden absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "rgba(255, 255, 255, 0.50)"
        }}
      />

      {/* Left side glow filter (dissolved radial gradient) */}
      <div
        className="absolute z-0 pointer-events-none hidden xl:block"
        style={{
          width: "550px",
          height: "650px",
          top: "-50px",
          left: "-150px",
          background: "radial-gradient(circle at 40% 50%, rgba(248, 240, 218, 0.7) 0%, rgba(227, 209, 179, 0.3) 55%, rgba(255, 255, 255, 0) 100%)",
          opacity: 0.6,
          filter: "blur(60px)",
        }}
      />

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT (Unchanged for Web/Desktop viewports) */}
      {/* ========================================================================= */}
      <div className="hidden xl:block relative z-10 max-w-[1280px] w-full mx-auto px-4 sm:px-6 xl:px-[64px] pb-[80px]">
        <div className="grid grid-cols-12 gap-8 items-center h-full">

          {/* Left Column (Hero Content) */}
          <div className="col-span-6 flex flex-col justify-between gap-8 h-[466px]">
            {/* Top Text Content */}
            <div className="space-y-2.5 font-roboto">
              <h3
                className="w-full xl:w-[564px] xl:max-w-[576px] flex items-center flex-wrap gap-1.5"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 700,
                  fontSize: '40px',
                  lineHeight: '56px',
                  letterSpacing: '-0.96px',
                  verticalAlign: 'middle'
                }}
              >
                <span className="text-[#2D722F]">गब्रू हो साथ</span> <span className="text-[#2D722F]">,</span> <span className="text-white">तो टेंशन की क्या बात !</span>
              </h3>
              <h1 className="text-3xl sm:text-4xl xl:text-[43.36px] font-semibold leading-tight tracking-normal text-[#0F291B] font-roboto">
                Right tool.<br />
                <span
                  className="bg-clip-text text-transparent bg-cover font-semibold inline-block mt-1"
                  style={{ backgroundImage: "linear-gradient(90deg, #2D722F 0%, #768F0F 100%)" }}
                >
                  Better Farming.
                </span>
              </h1>
              <p className="text-[#0F291B]/80 max-w-lg font-roboto font-normal text-[15px] xl:text-[18px] leading-[22px] xl:leading-[28px] tracking-normal">
                High-performance machinery designed for the modern<br />farmer. Durable, efficient, and backed by pan-India support.
              </p>
            </div>

            {/* Bottom Actions Content */}
            <div className="space-y-5 mt-6 xl:mt-0">
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                <Link href="/all_products" className="bg-[#0D9740] hover:bg-[#0b8036] text-white font-roboto font-bold text-[14px] leading-none w-full sm:w-[185px] h-[52px] sm:h-[58px] min-h-[48px] rounded-[32px] px-8 flex items-center justify-center transition-all duration-200 hover:scale-[1.02] cursor-pointer shadow-lg">
                  Explore Products
                </Link>
                <a
                  href="https://www.youtube.com/playlist?list=PLHXlLG4lLpM1RC3vTHQf8iDX5jAI707Jm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-[7.99px] bg-white border border-[#2B7832] text-[#2B7832] font-roboto font-bold text-[14px] leading-none w-full sm:w-[185px] h-[52px] sm:h-[58px] min-h-[48px] rounded-[32px] px-8 transition-all duration-200 cursor-pointer shadow-md"
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#2B7832" strokeWidth="2.5" fill="none" />
                    <path d="M10 8.5V15.5L15.5 12L10 8.5Z" fill="#2B7832" />
                  </svg>
                  Watch Demo
                </a>
              </div>

              {/* Feature Pill Card (Capsule bottom left) */}
              <div className="w-full xl:w-[620px] xl:ml-[-20px] z-20 relative">
                <Image
                  src="/assets/Frame 20.png"
                  alt="Features"
                  width={620}
                  height={80}
                  className="w-full h-auto rounded-r-[50px] rounded-l-none"
                />
              </div>
            </div>

          </div>

          {/* Right Column (Carousel & YouTube Video Box) */}
          <div className="col-span-6 flex flex-col items-center xl:items-end justify-center space-y-8">

            {/* Photo Carousel wrapper */}
            <div className="relative w-full max-w-[671px] h-[250px] sm:h-[320px] flex items-center justify-center overflow-visible">
              {/* Carousel Track */}
              <div className="relative w-full h-[220px] sm:h-[288px] flex items-center justify-center">
                {carouselImages.map((imgUrl, idx) => {
                  const pos = getPositionClass(idx);

                  if (pos === "center") {
                    return (
                      <div
                        key={idx}
                        className="absolute z-20 w-[260px] sm:w-[420px] md:w-[512px] h-[160px] sm:h-[240px] md:h-[288px] transition-all duration-500 ease-in-out transform scale-100 opacity-100 shadow-2xl rounded-2xl overflow-hidden border-2 border-white/20"
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
            <div className="flex justify-center gap-3 w-full max-w-[500px]">
              {[
                {
                  url: "https://www.youtube.com/shorts/5OV6SGKm8Rg",
                  thumbnail: "/assets/18teeth_thumbnail.png",
                  subtitle: "watch our",
                  title: "Gbru 18 teeth seeder"
                },
                {
                  url: "https://www.youtube.com/watch?v=fpZYENlnAZI",
                  thumbnail: "https://img.youtube.com/vi/fpZYENlnAZI/maxresdefault.jpg",
                  subtitle: "watch our",
                  title: "Gbru solar camera"
                },
                {
                  url: "https://www.youtube.com/watch?v=D7pufaAYXwg",
                  thumbnail: "https://img.youtube.com/vi/D7pufaAYXwg/maxresdefault.jpg",
                  subtitle: "watch our",
                  title: "Gbru mobile auto"
                }
              ].map((video, i) => (
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                  className="relative group w-[154.6px] h-[131.01px] max-w-[169.77px] rounded-[11.32px] overflow-hidden border-[0.71px] border-white/20 p-[11.32px] flex flex-col gap-[2.69px] bg-white/10 backdrop-blur-lg shadow-xl transition-transform duration-300 hover:scale-[1.03] text-left"
                >
                  <div className="relative w-[132px] h-[75px] rounded-[6px] overflow-hidden bg-black flex-shrink-0 z-10">
                    {video.thumbnail.startsWith('http') ? (
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover z-0" />
                    ) : (
                      <Image
                        src={video.thumbnail}
                        alt="YouTube Video Thumbnail"
                        fill
                        className="object-cover z-0"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/10 group-hover:bg-black/25 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 cursor-pointer">
                        <svg className="w-2.5 h-2.5 fill-[#0F291B] ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-20 font-roboto text-left flex flex-col justify-center min-w-0 mt-0.5">
                    <span className="block text-[8px] text-white/50 uppercase tracking-wider font-semibold leading-none">{video.subtitle}</span>
                    <span className="block text-[10px] text-white font-bold leading-tight mt-0.5 truncate">{video.title}</span>
                  </div>
                </a>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (Figma Mockup — Guest/Not Logged In) */}
      {/* ========================================================================= */}
      <div className="block xl:hidden relative z-10 w-full flex flex-col gap-6 text-center">
        <div className="max-w-[480px] mx-auto px-4 flex flex-col gap-6 w-full pt-2">
          {/* Title / Hero Header */}
        <div className="flex flex-col items-center pt-2">
          <h3
            className="mb-2 text-center"
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 700,
              fontSize: '24px',
              lineHeight: '32px',
              letterSpacing: '-0.48px',
              verticalAlign: 'middle'
            }}
          >
            <span className="text-[#2D722F]">गब्रू हो साथ</span> <span className="text-[#2D722F]">,</span> <span className="text-white">तो टेंशन की क्या बात !</span>
          </h3>
          <h1 className="text-2xl font-bold leading-snug">
            <span className="text-[#0F291B]">Right tool.</span>{" "}
            <span
              className="bg-clip-text text-transparent bg-cover font-bold"
              style={{ backgroundImage: "linear-gradient(90deg, #2D722F 0%, #768F0F 100%)" }}
            >
              Better Farming.
            </span>
          </h1>
        </div>

        {/* Mobile Carousel with Side Previews — matching figma mockup 2 */}
        <div className="relative w-full h-[220px] flex items-center justify-center overflow-hidden px-4">
          {carouselImages.map((imgUrl, idx) => {
            const pos = getMobilePositionClass(idx);

            if (pos === "center") {
              return (
                <div
                  key={idx}
                  className="absolute z-20 w-[78%] h-[150px] transition-all duration-500 ease-in-out rounded-2xl overflow-hidden shadow-xl border border-white/20 bg-transparent flex items-center justify-center"
                >
                  <Image
                    src={imgUrl}
                    alt="Carousel Center"
                    fill
                    className="object-contain"
                    priority
                    sizes="75vw"
                  />
                </div>
              );
            }

            const isLeft = pos === "left";
            return (
              <div
                key={idx}
                className={`absolute z-10 w-[12%] h-[155px] transition-all duration-500 ease-in-out rounded-xl overflow-hidden opacity-50 border border-white/10 bg-transparent flex items-center justify-center ${isLeft ? "left-4" : "right-4"}`}
              >
                <Image
                  src={imgUrl}
                  alt="Carousel Side"
                  fill
                  className="object-contain"
                  sizes="15vw"
                />
              </div>
            );
          })}

          {/* Left Arrow */}
          <button
            onClick={handleMobilePrev}
            className="absolute left-1 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white shadow"
            aria-label="Previous image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            onClick={handleMobileNext}
            className="absolute right-1 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-black/40 text-white shadow"
            aria-label="Next image"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* CTA Buttons — side by side */}
        <div className="flex gap-2 sm:gap-3 px-3 sm:px-5 mt-5">
          <Link
            href="/all_products"
            className="flex-1 bg-[#0D9740] text-white font-roboto font-bold text-[12px] min-[375px]:text-[13px] sm:text-[14px] h-[44px] sm:h-[50px] rounded-full flex items-center justify-center shadow-lg whitespace-nowrap px-1"
          >
            Explore Products
          </Link>
          <a
            href="https://www.youtube.com/playlist?list=PLHXlLG4lLpM1RC3vTHQf8iDX5jAI707Jm"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-white border-2 border-[#2B7832] text-[#2B7832] font-roboto font-bold text-[12px] min-[375px]:text-[13px] sm:text-[14px] h-[44px] sm:h-[50px] rounded-full shadow-sm whitespace-nowrap px-1"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#2B7832" strokeWidth="2.5" />
              <path d="M10 8.5V15.5L15.5 12L10 8.5Z" fill="#2B7832" />
            </svg>
            Watch Demo
          </a>
        </div>

        {/* Video Cards — full width 3-column grid */}
        <div className="grid grid-cols-3 gap-2 px-3 mt-5">
          {[
            {
              url: "https://www.youtube.com/shorts/5OV6SGKm8Rg",
              thumbnail: "/assets/18teeth_thumbnail.png",
              subtitle: "WATCH OUR",
              title: "Gbru 18 teeth seeder",
            },
            {
              url: "https://www.youtube.com/watch?v=fpZYENlnAZI",
              thumbnail: "https://img.youtube.com/vi/fpZYENlnAZI/maxresdefault.jpg",
              subtitle: "WATCH OUR",
              title: "Gbru solar camera",
            },
            {
              url: "https://www.youtube.com/watch?v=D7pufaAYXwg",
              thumbnail: "https://img.youtube.com/vi/D7pufaAYXwg/maxresdefault.jpg",
              subtitle: "WATCH OUR",
              title: "Gbru mobile auto",
            },
          ].map((video, i) => (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              key={i}
              className="relative group rounded-xl overflow-hidden flex flex-col bg-white/10 backdrop-blur-sm border border-white/15 shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-[90px] overflow-hidden bg-black">
                {video.thumbnail.startsWith("http") ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <Image src={video.thumbnail} alt="Thumbnail" fill className="object-cover" sizes="33vw" />
                )}
                <span className="absolute bottom-1.5 right-1.5 text-[9px] text-white font-bold bg-black/75 rounded px-1 py-0.5 leading-none">1:30</span>
                <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl">
                    <svg className="w-4 h-4 fill-black ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Label */}
              <div className="px-2 py-2">
                <span className="block text-[8px] text-white/60 uppercase font-semibold tracking-wide leading-none">{video.subtitle}</span>
                <span className="block text-[11px] text-white font-bold leading-tight mt-1">{video.title}</span>
              </div>
            </a>
          ))}
        </div>

        </div> {/* Close max-w-[480px] wrapper */}

        {/* Features Image — mobile */}
        <div className="w-full px-4 py-4 mt-2">
          <div className="max-w-[480px] mx-auto">
            <Image
              src="/assets/Frame 20.png"
              alt="Features"
              width={620}
              height={80}
              className="w-full h-auto rounded-r-[20px] rounded-l-none"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
