"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface CategoryItem {
  category_id: string;
  category_name: string;
  custom_category_id: number;
  custom_image_path: string;
  product_count: number;
}

const advantages = [
  {
    id: 1,
    title: 'Certified Quality',
    desc: 'Every machine and tool undergoes rigorous stress testing for heavy-duty field use.',
    icon: '/assets/icon5.png'
  },
  {
    id: 2,
    title: 'Expert Installation',
    desc: 'On-site setup and technical training by our team across India.',
    icon: '/assets/logo7.png'
  },
  {
    id: 3,
    title: 'Lifetime Support',
    desc: 'Access to 24/7 technical assistance for the life of your equipment.',
    icon: '/assets/icon2.png'
  }
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) {
          throw new Error("Failed to load categories.");
        }
        const json = await res.json();
        
        // Parse category list from ERP response wrapper
        if (json.message?.status && Array.isArray(json.message?.data?.data)) {
          setCategories(json.message.data.data);
        } else {
          throw new Error("Invalid response format.");
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white font-roboto flex flex-col">
      <Navbar />

      {/* Header Section */}
      <div className="w-full bg-[#F9F9F9] pt-10 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#4A4A4A] mb-8 uppercase">
            <Link href="/" className="hover:text-[#006B21]">Home</Link>
            <span>&gt;</span>
            <span className="text-[#1A1A1A]">Categories</span>
          </div>

          <h1 className="text-3xl md:text-[40px] font-bold text-[#1A1A1A] mb-4 tracking-tight">
            Shop by Category
          </h1>
          <p className="text-[#4A4A4A] max-w-2xl text-sm md:text-base leading-relaxed">
            Discover our comprehensive range of professional-grade agricultural solutions. From
            precision irrigation systems to heavy-duty machinery, we provide the tools to empower
            India's modern farmers.
          </p>
        </div>
      </div>

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-12 flex flex-col justify-center min-h-[300px]">
        
        {loading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-[#006B21] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-zinc-500 font-medium">Fetching GBRU Category list...</span>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="text-red-500 text-3xl">⚠️</span>
            <h3 className="font-bold text-[#0F291B] text-lg">Failed to load categories</h3>
            <p className="text-zinc-500 text-xs max-w-xs">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError("");
                // Re-fetch logic
                window.location.reload();
              }}
              className="mt-2 bg-[#006B21] text-white font-bold text-xs py-2 px-4 rounded-full"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                href={`/products?category_id=${cat.category_id}&category_name=${encodeURIComponent(cat.category_name)}`}
                className="bg-white rounded-[18px] border border-[#E5E7EB] overflow-hidden hover:shadow-lg transition-shadow flex flex-col group cursor-pointer text-left pb-4"
              >
                {/* Image Container */}
                <div className="relative h-32 md:h-48 w-full bg-gray-50 overflow-hidden flex items-center justify-center p-3 border-b border-[#E5E7EB]">
                  {cat.custom_image_path ? (
                    <img
                      src={cat.custom_image_path}
                      alt={cat.category_name}
                      className="object-contain max-h-full max-w-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 md:p-5 flex flex-col flex-1 bg-white justify-between">
                  <div>
                    <h3 className="text-[#1F2937] font-roboto font-bold text-[14px] md:text-lg mb-1 leading-snug">
                      {cat.category_name}
                    </h3>
                    <span className="text-[10px] md:text-[11px] text-zinc-500 font-semibold mb-3 block">
                      {cat.product_count} Products
                    </span>
                  </div>
                  
                  {/* BROWSE button matching Figma mockups */}
                  <div 
                    className="w-full text-white font-roboto font-bold text-[11px] md:text-xs py-2 px-4 rounded-[6px] text-center uppercase tracking-wider transition-colors mt-2"
                    style={{ background: "#006B21" }}
                  >
                    BROWSE
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* GBRU Advantage Section */}
      <div className="w-full bg-[#F9FAFB] pt-10 pb-16">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          
          {/* Section Header */}
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-roboto font-bold text-[#1A1A1A] mb-3">
              The GBRU Advantage
            </h2>
            <div className="w-12 h-1 bg-[#006B21] rounded-full hidden md:block"></div>
          </div>

          {/* ── MOBILE VIEW: List Layout (Horizontal Split Cards) ── */}
          <div className="block md:hidden flex flex-col gap-4">
            
            {/* Card 1: Certified Quality */}
            <div className="w-full bg-[#F3F4F6]/50 rounded-[18px] p-5 flex items-start gap-4 border border-[#E5E7EB]">
              {/* Icon box container */}
              <div className="w-12 h-12 bg-[#E1EFEB] rounded-[10px] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#006B21] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-roboto font-bold text-[#111827] text-[15px] mb-1">
                  Certified Quality
                </h3>
                <p className="font-roboto font-normal text-[#4B5563] text-[13px] leading-relaxed">
                  Every machine and tool undergoes rigorous stress testing for heavy-duty field use.
                </p>
              </div>
            </div>

            {/* Card 2: Expert Installation */}
            <div className="w-full bg-[#F3F4F6]/50 rounded-[18px] p-5 flex items-start gap-4 border border-[#E5E7EB]">
              {/* Icon box container */}
              <div className="w-12 h-12 bg-[#E1EFEB] rounded-[10px] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#006B21] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-roboto font-bold text-[#111827] text-[15px] mb-1">
                  Expert Installation
                </h3>
                <p className="font-roboto font-normal text-[#4B5563] text-[13px] leading-relaxed">
                  On-site setup and technical training by our team across India.
                </p>
              </div>
            </div>

            {/* Card 3: Lifelong Support */}
            <div className="w-full bg-[#F3F4F6]/50 rounded-[18px] p-5 flex items-start gap-4 border border-[#E5E7EB]">
              {/* Icon box container */}
              <div className="w-12 h-12 bg-[#E1EFEB] rounded-[10px] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#006B21] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.435 19a2 2 0 01-1.807-1.143L16 16.5M15.565 19a2 2 0 001.807-1.143L18 16.5m-9.587-2.448l-1.09-1.924a1.996 1.996 0 010-1.856l1.09-1.924M14 6h.01M18 10a6 6 0 00-12 0v3a2 2 0 01-2 2h0a2 2 0 01-2-2v-3a10 10 0 0120 0v3a2 2 0 01-2 2h0a2 2 0 01-2-2v-3z" />
                </svg>
              </div>
              <div className="flex flex-col text-left">
                <h3 className="font-roboto font-bold text-[#111827] text-[15px] mb-1">
                  Lifelong Support
                </h3>
                <p className="font-roboto font-normal text-[#4B5563] text-[13px] leading-relaxed">
                  Access to 24/7 technical assistance for the life of your equipment.
                </p>
              </div>
            </div>

          </div>

          {/* ── DESKTOP VIEW: Grid Layout (Unchanged) ── */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            {advantages.map((adv) => (
              <div key={adv.id} className="bg-[#F3F4F5] rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                {/* Icon Container */}
                <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full overflow-hidden relative bg-[#D4E8DC]">
                  <Image src={adv.icon} alt={adv.title} fill className="object-contain p-5" />
                </div>

                <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
                  {adv.title}
                </h3>
                <p className="text-[#4A4A4A] text-sm leading-relaxed">
                  {adv.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
