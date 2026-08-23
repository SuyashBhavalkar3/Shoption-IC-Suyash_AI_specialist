"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

const farmerReviews = [
  { src: "/assets/farmer_review (1).jpg", alt: "Farmer Review 1" },
  { src: "/assets/farmer_review (2).jpg", alt: "Farmer Review 2" },
  { src: "/assets/farmer_review (3).jpg", alt: "Farmer Review 3" },
  { src: "/assets/farmer_review (4).jpg", alt: "Farmer Review 4" },
  { src: "/assets/farmer_review (5).jpg", alt: "Farmer Review 5" },
  { src: "/assets/farmer_review (6).jpg", alt: "Farmer Review 6" },
  { src: "/assets/farmer_review (7).jpg", alt: "Farmer Review 7" },
  { src: "/assets/farmer_review (8).jpg", alt: "Farmer Review 8" },
  { src: "/assets/farmer_review (9).jpg", alt: "Farmer Review 9" },
  { src: "/assets/farmer_review (10).jpg", alt: "Farmer Review 10" },
];

const reviews = [
  {
    quote: "“GBRU power weeder has made my work much easier. Strong, reliable and very fuel efficient.”",
    name: "Ramesh Yadav",
    loc: "Karnal, Haryana",
    avatar: "/assets/avatar_ramesh.png",
  },
  {
    quote: "“Spray pump quality is top notch. Battery backup is excellent and pressure is very strong.”",
    name: "Suresh Patel",
    loc: "Anand, Gujarat",
    avatar: "/assets/avatar_suresh.png",
  },
  {
    quote: "“Seeder works perfectly in all types of soil. Very happy with the performance.”",
    name: "Mahendra Singh",
    loc: "Jaipur, Rajasthan",
    avatar: "/assets/avatar_mahendra.png",
  },
  {
    quote: "“Solar products from GBRU are durable and very useful for our farm security.”",
    name: "Balwinder Singh",
    loc: "Ludhiana, Punjab",
    avatar: "/assets/avatar_balwinder.png",
  },
];

export default function Testimonials() {
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoggedIn(!!localStorage.getItem("gbru_user"));
    }
  }, []);

  return (
    <section className="w-full bg-white flex flex-col items-center lg:py-10 lg:mt-0 mt-[20px] pb-2 px-2 sm:px-6 lg:px-0 overflow-hidden">
      {/* ========================================================================= */}
      {/* TESTIMONIAL IMAGES GRID FOR LOGGED IN MOBILE USER */}
      {/* ========================================================================= */}
      {isLoggedIn && (
        <div className="lg:hidden w-full mb-10 text-left px-1">
          {/* Main static container div */}
          <div
            className="relative rounded-[24px] border-none overflow-hidden mx-auto"
            style={{
              width: "278px",
              height: "239px",
              background: "linear-gradient(180deg, rgba(255, 255, 255, 0.51) 46.48%, rgba(73, 144, 2, 0.408) 100%)"
            }}
          >
            {/* Header Text inside Main Div */}
            <div className="absolute top-[20px] left-0 right-0 flex flex-col items-center gap-1.5 px-4 z-10">
              <h2
                className="font-roboto font-bold text-[#0F291B] text-[16px] text-center"
                style={{
                  lineHeight: "9.68px",
                  fontStyle: 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Testimonial
              </h2>
              <p
                className="font-roboto font-medium text-[#374151] text-[12px] text-center"
                style={{
                  lineHeight: "9.68px",
                  fontStyle: 'normal',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Trusted by Farmers, Proven in the Field
              </p>
            </div>

            {/* Horizontally scrollable container inside spanning the full card viewport */}
            <div
              className="absolute inset-0 overflow-x-auto pb-4 scrollbar-none flex gap-4 snap-x snap-mandatory px-4"
              style={{
                paddingTop: "77px",
              }}
            >
              {farmerReviews.map((review, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden bg-white snap-center flex-shrink-0"
                  style={{
                    width: "111px",
                    height: "111px",
                    borderRadius: "5.14px",
                    borderWidth: "0.5px",
                    borderColor: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <Image
                    src={review.src}
                    alt={review.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Testimonial Rounded Box (Desktop Only) ── */}
      <div
        className="hidden lg:flex relative w-full max-w-[1206px] rounded-[32px] lg:rounded-[47px] overflow-hidden border border-[#CDE5D2] flex-col items-center py-10 px-4 lg:px-6 bg-no-repeat transition-all duration-500"
        style={{
          background: "linear-gradient(135deg, #F0FAF2 0%, #DCEFE0 100%)",
        }}
      >
        {/* Background grass pattern with higher opacity to show rich green tones */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.45] mix-blend-multiply">
          <Image
            src="/assets/green_grass.png"
            alt="Grass Texture"
            fill
            className="object-cover"
            style={{ objectPosition: "center 60%" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Header */}
          <h2
            className="text-[#0F291B] flex items-center justify-center mb-3"
            style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 700,
              fontSize: "48px",
              lineHeight: "32px",
              letterSpacing: "0px",
              textAlign: "center"
            }}
          >
            Testimonial
          </h2>
          <p
            className="text-[#374151] flex items-center justify-center max-w-xl mb-8"
            style={{
              fontFamily: "Roboto, sans-serif",
              fontWeight: 500,
              fontSize: "30px",
              lineHeight: "32px",
              letterSpacing: "0px",
              textAlign: "center"
            }}
          >
            Trusted by Farmers, Proven in the Field
          </p>

          {/* Flyers Row */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 w-full max-w-[1152px] mb-10 transition-all duration-500">
            {farmerReviews.slice(0, visibleCount).map((review, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden shadow-lg border border-white/60 bg-white animate-in zoom-in-95 duration-500 aspect-square rounded-[16px]"
              >
                <Image
                  src={review.src}
                  alt={review.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Mobile Testimonials (Spacious single column stack) */}
          <div className="lg:hidden flex flex-col gap-6 w-full max-w-[340px] mb-10 px-4">
            {farmerReviews.slice(0, visibleCount).map((review, idx) => (
              <div
                key={idx}
                className="relative overflow-hidden shadow-lg border border-white/60 bg-white aspect-square rounded-[24px] w-full"
              >
                <Image
                  src={review.src}
                  alt={review.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* View More Button */}
          {visibleCount < farmerReviews.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="bg-[#0D9740] hover:bg-[#0a7d34] text-white font-roboto font-semibold text-[15px] shadow-md transition-all duration-300 hover:scale-105 active:scale-95 h-14 px-8 rounded-full"
            >
              View More
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom What Farmers Say Section ── */}
      <div className="w-full max-w-[1206px] flex flex-col items-center mt-8 px-4 sm:px-6 lg:px-0">
        <h3
          className="font-roboto font-bold text-center flex items-center justify-center mb-8 text-[#1F2937] text-[22px] sm:text-[28px]"
        >
          What Farmers Say
        </h3>

        {/* Reviews Horizontal Row */}
        <div className="lg:hidden w-full relative">
          <div
            className="w-full -mx-4 px-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth scrollbar-none"
            onScroll={(e) => {
              const target = e.currentTarget;
              const scrollLeft = target.scrollLeft;
              const width = target.clientWidth - 32; // adjusted for padding
              const newIndex = Math.round(scrollLeft / width);
              if (newIndex >= 0 && newIndex < reviews.length) {
                // We use a small local state for current slide tracking
                const activeDot = document.getElementById(`review-dot-${newIndex}`);
                if (activeDot) {
                  reviews.forEach((_, i) => {
                    const dot = document.getElementById(`review-dot-${i}`);
                    if (dot) {
                      dot.style.width = i === newIndex ? "24px" : "8px";
                      dot.style.backgroundColor = i === newIndex ? "#006B21" : "#CDE5D2";
                    }
                  });
                }
              }
            }}
          >
            <div className="flex gap-4 w-max">
              {reviews.map((review, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5E7EB] rounded-[16px] p-5 flex flex-col justify-between shadow-sm transition-all duration-300 min-w-[280px] max-w-[280px] snap-center"
                  style={{ minHeight: "180px" }}
                >
                  <p className="font-roboto text-[#374151] text-[14px] leading-relaxed mb-6 font-normal">
                    {review.quote}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200">
                      <Image
                        src={review.avatar}
                        alt={review.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-roboto font-bold text-[#0F291B] text-[14px]">
                        {review.name}
                      </span>
                      <span className="font-roboto text-[#6B7280] text-[12px]">
                        {review.loc}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="flex items-center justify-center gap-2 mt-18 pb-2">
            {reviews.map((_, i) => (
              <div
                key={i}
                id={`review-dot-${i}`}
                className="transition-all duration-300"
                style={{
                  width: i === 0 ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  backgroundColor: i === 0 ? "#006B21" : "#CDE5D2",
                }}
              />
            ))}
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E5E7EB] rounded-[16px] p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              style={{ minHeight: "180px" }}
            >
              {/* Quote */}
              <p className="font-roboto text-[#374151] text-[14px] leading-relaxed mb-6 font-normal">
                {review.quote}
              </p>

              {/* User Meta */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200">
                  <Image
                    src={review.avatar}
                    alt={review.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-roboto font-bold text-[#0F291B] text-[14px]">
                    {review.name}
                  </span>
                  <span className="font-roboto text-[#6B7280] text-[12px]">
                    {review.loc}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
