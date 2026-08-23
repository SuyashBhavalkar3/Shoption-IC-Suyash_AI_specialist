"use client";

import React from "react";
import Image from "next/image";

export default function AppDownload() {
  return (
    <section className="relative w-full py-8 px-4 sm:px-6 lg:px-[37px] flex items-center justify-center overflow-hidden bg-white">
      {/* Inner Box (Container) */}
      <div
        className="relative w-full max-w-[1206px] min-h-[641px] rounded-[28px] lg:rounded-[47px] overflow-hidden border border-[#CDE5D2] flex flex-col lg:flex-row p-6 sm:p-8 lg:p-[48px] bg-no-repeat"
        style={{
          background: "linear-gradient(135deg, #E6F3E6 0%, #D2EAD6 100%)"
        }}
      >
        {/* Soft Leaves Background Asset at Bottom */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/green_leaves.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center bottom -400px"
          }}
        />

        {/* Left Column (Logo, Title, Features grid, Download buttons) */}
        <div className="relative z-10 w-full lg:w-[550px] flex flex-col justify-start h-full text-left">
          {/* Logo & Title Header */}
          <div className="flex flex-col">
            <div className="relative w-[283px] h-[56px] mb-[20px]">
              <Image
                src="/assets/shoption_logo.png"
                alt="Shoption Logo"
                fill
                className="object-contain object-left brightness-50 contrast-125"
              />
            </div>
            <h2 
              className="text-[#111111]"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 400,
                fontSize: "24px",
                lineHeight: "30px",
                letterSpacing: "-0.96px",
                textAlign: "left"
              }}
            >
              Gbru ( गब्रू ) Powered by Shoption
            </h2>
            <p 
              className="text-[#111111] mt-1"
              style={{
                fontFamily: "Roboto, sans-serif",
                fontWeight: 400,
                fontSize: "24px",
                lineHeight: "30px",
                letterSpacing: "-0.96px",
                textAlign: "left"
              }}
            >
              Our Shoption App tracks order, request service, check<br />
              warranty and get spare parts- all in Shoption App.
            </p>
          </div>

          {/* 2x2 Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 w-full lg:w-[420px] mt-[30px] mb-[40px]">
            {/* Card 1 */}
            <div className="bg-white rounded-[10px] flex items-center gap-3 shadow-sm px-3 py-3 min-h-[70px]">
              <div className="text-[#1E7134] flex-shrink-0">
                <svg className="w-8 h-8 text-[#006B21]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
                </svg>
              </div>
              <div className="text-left min-w-0">
                <h4 
                  className="text-[#111] mb-0.5"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "16.89px", lineHeight: "25.34px", letterSpacing: "0px" }}
                >
                  Track order
                </h4>
                <p 
                  className="text-zinc-600"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "10.14px", lineHeight: "12.67px", letterSpacing: "0px" }}
                >
                  Know where your order is anytime.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-[10px] flex items-center gap-3 shadow-sm px-3 py-3 min-h-[70px]">
              <div className="text-[#1E7134] flex-shrink-0">
                <div className="relative w-8 h-8">
                  <Image 
                    src="/assets/spare.png" 
                    alt="Spare Part Icon" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="text-left min-w-0">
                <h4 
                  className="text-[#111] mb-0.5"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "16.89px", lineHeight: "25.34px", letterSpacing: "0px" }}
                >
                  Spare Part
                </h4>
                <p 
                  className="text-zinc-600"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "10.14px", lineHeight: "12.67px", letterSpacing: "0px" }}
                >
                  spare part support instantly
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-[10px] flex items-center gap-3 shadow-sm px-3 py-3 min-h-[70px]">
              <div className="text-[#1E7134] flex-shrink-0">
                <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v-1a8 8 0 10-16 0v1" />
                  <rect x="18" y="12" width="4" height="6" rx="2" />
                  <rect x="2" y="12" width="4" height="6" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a3 3 0 003 3h4" />
                  <circle cx="12" cy="22" r="1.5" fill="currentColor" stroke="none"/>
                </svg>
              </div>
              <div className="text-left min-w-0">
                <h4 
                  className="text-[#111] mb-0.5"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "16.89px", lineHeight: "25.34px", letterSpacing: "0px" }}
                >
                  Expert help
                </h4>
                <p 
                  className="text-zinc-600"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "10.14px", lineHeight: "12.67px", letterSpacing: "0px" }}
                >
                  Connect with support instantly
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-[10px] flex items-center gap-3 shadow-sm px-3 py-3 min-h-[70px]">
              <div className="text-[#1E7134] flex-shrink-0">
                <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <h4 
                  className="text-[#111] mb-0.5"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "16.89px", lineHeight: "25.34px", letterSpacing: "0px" }}
                >
                  Warranty
                </h4>
                <p 
                  className="text-zinc-600"
                  style={{ fontFamily: "Roboto, sans-serif", fontWeight: 400, fontSize: "10.14px", lineHeight: "12.67px", letterSpacing: "0px" }}
                >
                  Check status
                </p>
              </div>
            </div>
          </div>

          {/* Download Badges */}
          <div className="mt-auto pb-4">
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center bg-white p-3 sm:px-6 sm:py-4 rounded-[24px] shadow-sm">
              {/* Google Play Store Badge */}
              <a
                href="https://play.google.com/store/apps/details?id=com.shoption.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-[8px] w-full sm:w-[155px] min-h-[48px] hover:bg-black/90 transition-all shadow-md"
              >
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 466 511.98" fill="none">
                  <path fill="#EA4335" d="M199.9 237.8L1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
                  <path fill="#FBBC04" d="M433.91 205.1L329.26 145.1l-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
                  <path fill="#34A853" d="M199.42 273.45L329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
                  <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
                </svg>
                <div className="text-left leading-[1.1]">
                  <div className="text-[9px] uppercase tracking-wide font-normal text-zinc-300">GET IT ON</div>
                  <div className="text-[14px] font-medium font-sans tracking-wide">Google Play</div>
                </div>
              </a>

              {/* Apple App Store Badge */}
              <a
                href="https://apps.apple.com/in/app/shoption-for-irrigation-shops/id1544284156"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-[8px] w-full sm:w-[155px] min-h-[48px] hover:bg-black/90 transition-all shadow-md"
              >
                <svg className="w-7 h-7 fill-white flex-shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39z" />
                </svg>
                <div className="text-left leading-[1.1]">
                  <div className="text-[8px] tracking-wide font-normal text-zinc-300">Available on the</div>
                  <div className="text-[15px] font-medium font-sans tracking-wide">App Store</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Middle Column (Mockup Phone in Hand) */}
        <div className="relative lg:absolute z-20 pointer-events-none w-full max-w-[360px] sm:max-w-[420px] lg:max-w-none lg:w-[1000px] lg:h-[1400px] lg:bottom-[-60px] lg:left-[240px] mx-auto mt-6 lg:mt-0">
          <Image
            src="/assets/phone_in_hand.png"
            alt="Phone Mockup in Hand"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>

        {/* Right Column (Specifications Card Panel) */}
        <div className="relative lg:absolute bg-[#F4F9F5] p-8 flex flex-col justify-start z-10 w-full lg:w-[280px] min-h-[500px] lg:h-[530px] lg:top-[55px] lg:right-[48px] rounded-[16px] mt-6 lg:mt-0">
          <div className="flex flex-col text-left mb-8">
            <h3 className="font-roboto font-bold text-[#14532D] text-[16px] leading-[22px]">
              Your Complete Farming Partner In Your Pocket
            </h3>

            {/* Checklist */}
            <ul className="space-y-[28px] mt-8">
              {[
                "Easy Order Tracking",
                "Quick Service",
                "Genuine Spare Parts",
                "Warranty Management",
                "Expert Support Anytime"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-[#111] font-roboto text-[14.5px] font-medium">
                  <div className="flex items-center text-[#2D722F] flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Logos branding */}
          <div className="flex flex-col items-center mt-auto">
            <div className="relative w-[70px] h-[30px] mb-1">
              <Image
                src="/assets/gbru_green.png"
                alt="GBRU Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[11px] font-roboto text-[#1E7134] font-bold tracking-wide mb-1">
              Powered by
            </span>
            <div className="relative w-[110px] h-[34px]">
              <Image
                src="/assets/shoption_logo.png"
                alt="Shoption Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
