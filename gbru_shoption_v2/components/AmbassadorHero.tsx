"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AmbassadorHero() {
  const [userName, setUserName] = useState("Prakash");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("gbru_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj.first_name) {
            setUserName(userObj.first_name);
          } else if (userObj.customer_name) {
            setUserName(userObj.customer_name.split(" ")[0]);
          }
        } catch (e) { }
      }
    }
  }, []);

  return (
    <div className="w-full bg-white px-4 sm:px-6 xl:px-8 py-4 xl:py-6">
      <section className="relative w-full max-w-[1400px] mx-auto overflow-hidden bg-cover bg-right xl:bg-center min-h-[450px] xl:min-h-[553px] flex items-center text-white rounded-[24px] xl:rounded-[40px]"
        style={{ backgroundImage: "url('/assets/brand.png')" }}
      >
        {/* Dark gradient overlay to make text readable */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.4) 40%, rgba(0, 0, 0, 0) 100%)"
          }}
        />

        {/* Soft dark overlay — mobile only */}
        <div
          className="block xl:hidden absolute inset-0 z-0 pointer-events-none"
          style={{
            background: "rgba(0, 0, 0, 0.50)"
          }}
        />

        <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 xl:px-[64px] py-12 xl:py-0">
          <div className="flex flex-col gap-4 xl:gap-5 xl:w-[600px] h-full justify-center">

            {/* Top text */}
            <h3
              className="w-full text-white font-bold text-[24px] xl:text-[36px] leading-tight"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              गब्रू हो साथ , तो टेंशन की क्या बात!
            </h3>

            {/* Welcome back label */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-[28px] h-[28px] xl:w-[32px] xl:h-[32px] rounded-full bg-[#F5B800] flex items-center justify-center">
                <svg className="w-4 h-4 xl:w-5 xl:h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </div>
              <span className="text-white text-[16px] xl:text-[20px] font-medium opacity-90 tracking-wide">
                Welcome back Ambassador
              </span>
            </div>

            {/* You are a GBRU Brand Ambassador */}
            <div className="flex flex-col mt-2 xl:mt-4 gap-1">
              <h2 className="text-white text-[24px] xl:text-[36px] font-bold leading-tight font-roboto">
                You are a GBRU
              </h2>
              <div className="flex items-center gap-2.5">
                <Image
                  src="/assets/broch.png"
                  alt="Brand Ambassador Badge"
                  width={44}
                  height={44}
                  className="w-8 h-8 xl:w-11 xl:h-11 object-contain drop-shadow-md"
                />
                <h1 className="text-[#F5B800] text-[32px] xl:text-[48px] font-bold leading-tight font-roboto">
                  Brand Ambassador
                </h1>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-white text-[15px] xl:text-[18px] font-medium leading-snug mt-2 xl:mt-4 xl:max-w-[480px]">
              Thankyou for helping farmers grow smarter and stronger with gbru
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-6 xl:mt-8">
              <a
                href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-50 text-[#0F291B] font-bold py-2 px-6 rounded-full text-[14px] xl:text-[15px] shadow-lg border border-zinc-200"
              >
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center bg-white border border-emerald-400 shrink-0">
                  <img src="/assets/nova.jpeg" alt="Nova" className="object-cover w-full h-full" />
                </div>
                Chat With Nova
              </a>
              <Link href="/rewards">
                <button className="bg-[#FFD100] hover:bg-[#e6be00] transition-colors text-[#0F291B] font-bold py-3.5 px-8 rounded-full text-[14px] xl:text-[15px] shadow-lg">
                  Ambassador Benefit
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
