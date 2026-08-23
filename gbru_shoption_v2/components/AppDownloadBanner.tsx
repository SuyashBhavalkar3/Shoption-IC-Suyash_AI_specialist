"use client";

import React from "react";
import Image from "next/image";

export default function AppDownloadBanner() {
  return (
    <>
      {/* ================================================================= */}
      {/* DESKTOP LAYOUT — hidden on mobile */}
      {/* ================================================================= */}
      <div className="hidden xl:flex w-full max-w-[1280px] mx-auto lg:h-[266px] relative flex-col lg:flex-row">
        {/* Left Side (Dark Green) */}
        <div className="w-full lg:w-[10639px] lg:h-[266px] bg-[#0F2F20] lg:absolute lg:-left-[9999px] lg:pl-[9999px] lg:top-0 lg:z-20 rounded-r-none lg:rounded-tr-[28px] lg:rounded-br-[26px] lg:rounded-l-none py-8 px-6 lg:pr-6 flex flex-col justify-between">
          <h2 className="text-white text-xl lg:text-[28px] font-bold leading-tight">
            Our Impact<br />In Numbers
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 items-start gap-4 mt-6 lg:mt-0">
            <div className="flex flex-col border-r border-dashed border-white/15 pr-2 last:border-r-0">
              <Image src="/assets/logo1.png" alt="Products" width={32} height={32} className="mb-2 object-contain h-8 w-auto object-left" />
              <h3 className="text-white font-extrabold text-base mb-0.5 leading-none">5 Cr+</h3>
              <p className="text-[#A1B8AD] text-[10px] leading-tight mt-1">Products in<br />Indian Fields</p>
            </div>
            <div className="flex flex-col border-r border-dashed border-white/15 pr-2 last:border-r-0">
              <Image src="/assets/logo2.png" alt="PAN India" width={32} height={32} className="mb-2 object-contain h-8 w-auto object-left" />
              <h3 className="text-white font-extrabold text-base mb-0.5 leading-none">PAN India</h3>
              <p className="text-[#A1B8AD] text-[10px] leading-tight mt-1">services</p>
            </div>
            <div className="flex flex-col border-r border-dashed border-white/15 pr-2 last:border-r-0">
              <Image src="/assets/logo3.png" alt="Presence" width={32} height={32} className="mb-2 object-contain h-8 w-auto object-left" />
              <h3 className="text-white font-extrabold text-base mb-0.5 leading-none">Our Presence</h3>
              <p className="text-[#A1B8AD] text-[10px] leading-tight mt-1">Every 12 KM</p>
            </div>
            <div className="flex flex-col last:border-r-0">
              <Image src="/assets/logo4.png" alt="Support" width={32} height={32} className="mb-2 object-contain h-8 w-auto object-left" />
              <h3 className="text-white font-extrabold text-base mb-0.5 leading-none">Fast</h3>
              <p className="text-[#A1B8AD] text-[10px] leading-tight mt-1">Service & Spare<br />Support</p>
            </div>
          </div>
        </div>

        {/* Right Side (Light Green) */}
        <div className="w-full lg:w-[10721px] lg:h-[266px] bg-[#E9F2EC] lg:absolute lg:left-[559px] lg:top-0 lg:z-10 py-6 px-6 lg:pl-[100px] lg:pr-[10000px] flex flex-col justify-center text-left overflow-visible">
          <h2 className="text-[#1A1A1A] text-lg lg:text-[22px] font-bold mb-2 leading-tight max-w-md relative z-10 font-roboto top-[-12px]">
            Track, Manage, Grow With<br />Shoption App
          </h2>
          <p className="text-[#4A4A4A] font-semibold text-xs lg:text-sm mb-4 relative z-10">
            Track Order, Warranty, Services& More.
          </p>
          <div className="bg-white rounded-2xl py-3 px-5 flex flex-col sm:flex-row gap-4 w-full sm:w-fit shadow-md relative z-20 mb-6 lg:mb-0 border border-gray-100 top-[12px]">
            <a href="https://play.google.com/store/apps/details?id=com.shoption.app" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-[32px] w-auto" />
            </a>
            <a href="https://apps.apple.com/in/app/shoption-for-irrigation-shops/id1544284156" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-[32px] w-auto" />
            </a>
          </div>
          <div className="relative lg:absolute bottom-auto lg:bottom-[0px] right-auto lg:left-[360px] w-[240px] sm:w-[280px] lg:w-[380px] z-30 select-none pointer-events-none overflow-visible mx-auto lg:mx-0 mt-4 lg:mt-0">
            <Image
              src="/assets/holding_phone.png"
              alt="Shoption App in hand"
              width={350}
              height={500}
              className="object-contain w-full h-auto -scale-x-100"
              priority
            />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE LAYOUT — hidden on md+ */}
      {/* ================================================================= */}
      <div
        className="flex xl:hidden w-full overflow-hidden relative items-center justify-between text-left px-5"
        style={{ background: "#E9F2EC", height: "167px" }}
      >
        {/* Left Side Texts & Download Badges */}
        <div className="flex flex-col justify-between py-4 z-10 flex-1 pr-3 h-full">
          <div>
            <h2 className="font-roboto font-bold text-[#000000] text-[15px] leading-tight">
              Track, Manage, Grow With<br />Shoption App
            </h2>
            <p className="font-roboto font-medium text-[#4A4A4A] text-[11px] leading-normal mt-1.5">
              Track Order, Warranty, Services& More.
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-white/95 rounded-[12px] p-1.5 w-fit shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-zinc-100">
            <a
              href="https://play.google.com/store/apps/details?id=com.shoption.app"
              target="_blank"
              rel="noopener noreferrer"
              className="active:opacity-80 transition-opacity"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Play Store"
                className="h-[20px] w-auto object-contain"
              />
            </a>
            <a
              href="https://apps.apple.com/in/app/shoption-for-irrigation-shops/id1544284156"
              target="_blank"
              rel="noopener noreferrer"
              className="active:opacity-80 transition-opacity"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="App Store"
                className="h-[20px] w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Right Side Phone Mockup */}
        <div className="relative w-[130px] h-[167px] shrink-0 self-end">
          <div className="absolute bottom-[-10px] right-[-10px] w-[140px] h-[177px]">
            <Image
              src="/assets/holding_phone.png"
              alt="Phone mockup"
              fill
              className="object-contain -scale-x-100"
              priority
            />
          </div>
        </div>
      </div>
    </>
  );
}
