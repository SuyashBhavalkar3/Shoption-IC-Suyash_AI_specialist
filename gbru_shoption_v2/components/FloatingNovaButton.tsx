"use client";

import React from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

export default function FloatingNovaButton() {
  const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_LINK || "#";
  const rawSupportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "+919226514174";
  const supportPhoneClean = rawSupportPhone.replace(/[^\d+]/g, "");
  const phoneCallLink = `tel:${supportPhoneClean}`;

  const handleCallSupportClick = () => {
    trackEvent("call_support", {
      phone_number: rawSupportPhone,
      source: "floating_button"
    });
  };

  const handleNovaSupportClick = () => {
    trackEvent("nova_support", {
      whatsapp_link: whatsappLink,
      source: "floating_button"
    });
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9999] flex flex-col items-center gap-3">
      {/* Phone Call Floating Button */}
      <a
        href={phoneCallLink}
        onClick={handleCallSupportClick}
        className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 text-white rounded-full shadow-[0_4px_16px_rgba(5,150,105,0.4)] flex items-center justify-center border-2 border-white hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        title={`Call Support (${rawSupportPhone})`}
      >
        <Phone className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-12 transition-transform" />
      </a>

      {/* WhatsApp Nova Floating Button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleNovaSupportClick}
        className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_4px_20px_rgba(0,168,89,0.35)] flex items-center justify-center overflow-hidden border-2 border-[#00A859] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
        title="Chat with NOVA"
      >
        <Image
          src="/assets/nova1.png"
          alt="Chat with NOVA"
          width={64}
          height={64}
          className="object-cover"
        />
      </a>
    </div>
  );
}
