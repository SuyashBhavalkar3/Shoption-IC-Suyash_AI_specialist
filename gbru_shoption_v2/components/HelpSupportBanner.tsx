"use client";

import React from "react";
import Image from "next/image";
import { useShoptionSetting } from "@/hooks/useShoptionSetting";

export default function HelpSupportBanner() {
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  return (
    <>
      {/* ================================================================= */}
      {/* DESKTOP LAYOUT — hidden on mobile (md and below) */}
      {/* ================================================================= */}
      <div className="hidden xl:block w-full bg-[#F9F9FA] py-10 px-4 md:px-8 mt-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left text */}
          <div>
            <h2 className="text-2xl md:text-[28px] font-medium text-[#006B21] mb-2">
              Need Help Choosing Equipment?
            </h2>
            <p className="text-base text-[#006B21]/80 font-normal">
              Our agriculture specialists are ready to guide you to the perfect tool for your farm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="tel:+919226514174"
              className="flex items-center gap-2 bg-[#006B21] hover:bg-[#005a1b] transition-colors text-white font-bold py-3.5 px-6 rounded-full text-base shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Expert Call
            </a>

            {whatsappEnabled === 1 && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#F0FAF2] hover:bg-[#e4f5e8] border border-[#006B21]/20 transition-colors py-2 px-4 rounded-full text-base shadow-sm"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#006B21]/20">
                  <Image
                    src="/assets/nova.jpeg"
                    alt="Nova Logo"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-[#0F291B] font-bold text-sm leading-tight">Chat with Nova</span>
                  <span className="text-[#006B21] font-medium text-[10px] leading-none mt-0.5 uppercase tracking-wider">AI Support</span>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE LAYOUT — hidden on md+ */}
      {/* ================================================================= */}
      <div className="flex xl:hidden w-full bg-[#F9F9FA] px-4 py-4 justify-center">
        <div
          className="flex w-full max-w-[358px] rounded-[24px] overflow-hidden p-3.5 items-stretch justify-between shadow-sm border border-[#E5E7EB]"
          style={{ background: "#F0FAF2", height: "124px" }}
        >
          {/* Left Side Info */}
          <div className="flex flex-col flex-1 text-left justify-between pr-1">
            <div className="flex flex-col gap-0.5">
              <h2 className="font-roboto font-bold text-[#1F2937] text-[16px] leading-tight">
                Need any Help?
              </h2>
              <p className="font-roboto font-normal text-[#4A4A4A] text-[12px] leading-[14px]">
                Talk to expert
              </p>
            </div>

            <div className="flex items-center gap-1 text-[#006B21] font-bold text-[12px] leading-none my-1">
              <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              +91 91 14 15 16 17
            </div>

            <a
              href="tel:+919114151617"
              className="bg-[#1E532E] hover:bg-[#163e22] text-white font-roboto font-bold text-[11px] py-1.5 px-3 rounded-full text-center shadow-sm w-fit transition-colors"
            >
              call now
            </a>
          </div>

          {/* Vertical Divider */}
          <div className="flex flex-col items-center justify-center relative px-2">
            <div className="w-[1px] h-full border-l border-dashed border-zinc-300" />
            <span
              className="absolute bg-[#F0FAF2] font-roboto font-medium text-zinc-400 text-[11px] px-1"
              style={{ top: "calc(50% - 8px)" }}
            >
              or
            </span>
          </div>

          {/* Right Side WhatsApp Option */}
          {whatsappEnabled === 1 && (
            <div className="flex items-center justify-center pl-1 shrink-0">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[56px] h-[56px] rounded-full bg-white flex items-center justify-center shadow-md transition-transform hover:scale-105 border border-[#006B21]/20 p-1"
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <Image
                    src="/assets/nova.jpeg"
                    alt="Chat with Nova"
                    width={46}
                    height={46}
                    className="object-cover w-full h-full"
                  />
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
