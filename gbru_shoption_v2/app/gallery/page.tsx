"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  category: "Life At Work" | "dealer_meet" | "events";
  src: string;
  description: string;
}

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = [
    { id: "all", label: "All" },
    { id: "farmers", label: "Farmers" },
    { id: "dealer_meet", label: "Dealer Meet" },
    { id: "events", label: "Events" },
  ];

  const [visibleCount, setVisibleCount] = useState<number>(8);

  // Fetch gallery assets dynamically from local subfolders
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch("/api/gallery");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setGalleryItems(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load gallery items", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const filteredItems = activeCategory === "all"
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  const displayedItems = filteredItems.slice(0, visibleCount);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev === 0 ? displayedItems.length - 1 : (prev ?? 0) - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev => (prev === displayedItems.length - 1 ? 0 : (prev ?? 0) + 1));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      {/* Hero Section - Split Screen Viewport */}
      <div className="relative w-full h-[580px] grid grid-cols-1 md:grid-cols-2 overflow-hidden select-none">
        {/* Left Half - Content & Background Image */}
        <div className="relative h-full w-full flex flex-col justify-end pb-12 md:pb-16 px-8 md:px-16 lg:px-24 text-white">
          <Image
            src="/gallery_assets/hero/hero_left_1.png"
            alt="Entrepreneur Star Awards"
            fill
            className="object-cover object-center z-0"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent z-10" />

          <div className="relative z-20 max-w-lg">
            <span className="text-[#0D9740] font-extrabold text-sm uppercase tracking-[0.25em] mb-4 block">
              GALLERY
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
              Moments That Build<br />Our Journey
            </h1>
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-10 font-normal">
              Explore the people, innovation, technology, products and partnerships that define the future of sustainable precision agriculture across the landscape of India.
            </p>

            <div className="flex gap-4">
              <div className="flex flex-col justify-center w-[150px] h-[86px] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 shadow-lg">
                <span className="text-[#0D9740] text-xs font-bold uppercase tracking-wider mb-1">Our Journey</span>
                <span className="text-white text-sm font-extrabold tracking-widest">PHOTOS</span>
              </div>
              <div className="flex flex-col justify-center w-[150px] h-[86px] rounded-2xl border border-white/10 bg-white/10 backdrop-blur-md px-5 shadow-lg">
                <span className="text-[#0D9740] text-xs font-bold uppercase tracking-wider mb-1">Across</span>
                <span className="text-white text-sm font-extrabold tracking-widest">INDIA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Half - Background Image Only */}
        <div className="relative h-full w-full hidden md:block">
          <Image
            src="/gallery_assets/hero/hero_right_2.jpg"
            alt="Agriculture Leadership Awards"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/10 to-black/30 pointer-events-none" />
        </div>
      </div>

      {/* Category Selection Tab Bar */}
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 mt-16">
        <div className="flex items-center gap-6 md:gap-10 border-b border-gray-100 pb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setLightboxIndex(null);
                setVisibleCount(8); // reset pagination when switching tabs
              }}
              className={`px-5 py-2.5 text-xs font-extrabold transition-all duration-300 cursor-pointer ${activeCategory === cat.id
                  ? "bg-[#006B21] text-white rounded-full shadow-md shadow-[#006B21]/15"
                  : "text-gray-500 hover:text-[#006B21]"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staggered Masonry Grid Gallery */}
      <div className="max-w-[1200px] mx-auto w-full px-6 md:px-8 py-10 flex-grow">
        {loading ? (
          <div className="text-center py-20 text-gray-400 font-bold text-sm">
            Loading Gallery Assets...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold text-sm">
            No gallery items found in this category.
          </div>
        ) : (
          <>
            {/* Multi-column layout for Pinterest-like staggered/masonry look */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance] box-border">
              {displayedItems.map((item, index) => {
                // Determine standard aspect ratio classes to maintain staggered layout look
                const isTall = index % 3 === 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(index)}
                    className="break-inside-avoid bg-gray-50 rounded-[24px] overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col border border-gray-100/50 cursor-pointer mb-6"
                  >
                    <div className={`relative w-full overflow-hidden bg-gray-100 ${isTall ? "h-[380px]" : "h-[240px]"}`}>
                      <Image
                        src={item.src}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md text-white">
                          <ZoomIn size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {filteredItems.length > visibleCount && (
              <div className="flex justify-center mt-12 mb-6">
                <button
                  onClick={() => setVisibleCount(prev => prev + 6)}
                  className="bg-[#006B21] hover:bg-[#005219] text-white font-bold text-sm px-8 py-3.5 rounded-full shadow-lg shadow-[#006B21]/15 transition-all duration-300 transform active:scale-95 cursor-pointer"
                >
                  Load More Moments
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Together, We're Building Call to Action (CTA) Viewport */}
      <div 
        className="w-full h-[400px] relative overflow-hidden flex flex-col items-center justify-center text-center px-6 select-none"
        style={{
          backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%), url('/gallery_assets/footer/footer.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-8 tracking-wide leading-tight">
            Together, We're Building the<br />Future of Agriculture
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="/products" 
              className="bg-[#1C4127] hover:bg-[#15311E] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Explore Products
            </a>
            <a 
              href="/help-centre" 
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-8 py-3.5 rounded-full border border-white/20 backdrop-blur-md transition-all duration-300 transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>

          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <button
              onClick={handlePrev}
              className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors cursor-pointer z-10"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors cursor-pointer z-10"
            >
              <ChevronRight size={28} />
            </button>

            <div
              className="relative w-full max-h-[70vh] aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filteredItems[lightboxIndex].src}
                alt={filteredItems[lightboxIndex].title}
                fill
                className="object-contain"
              />
            </div>

            <div
              className="w-full mt-4 text-center text-white px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold capitalize">{filteredItems[lightboxIndex].title}</h2>
              <span className="inline-block mt-2 text-[11px] font-bold uppercase text-[#FFC700] tracking-wide bg-white/10 px-2.5 py-0.5 rounded-full">
                {lightboxIndex + 1} of {filteredItems.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
