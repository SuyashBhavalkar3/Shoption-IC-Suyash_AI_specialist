"use client";

import React from "react";
import Image from "next/image";

export default function FloatingNovaButton() {
  const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_LINK || "#";

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] w-14 h-14 md:w-16 md:h-16 bg-white rounded-full shadow-[0_4px_20px_rgba(0,168,89,0.3)] flex items-center justify-center overflow-hidden border-2 border-[#00A859] hover:scale-110 transition-transform cursor-pointer"
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
  );
}
