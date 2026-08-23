"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function SearchBar({
  className = "",
  placeholder = "Search tools, products....",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data?.message?.data?.data) {
          setResults(data.message.data.data);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = () => {
    if (query.trim()) {
      setIsOpen(false);
      // Currently, you might not have a specific search results page, 
      // but if you do, it could route to /all_products?q=...
      router.push(`/all_products?search=${encodeURIComponent(query)}`);
    }
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="font-extrabold text-[#0F291B]">{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearchSubmit();
        }}
        onFocus={() => {
          if (query.trim() && results.length > 0) setIsOpen(true);
        }}
        className="w-full h-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/50 font-roboto font-semibold text-[12px] leading-none rounded-full pl-4 pr-10 border border-white/20 focus:border-[#FFC700] focus:outline-none transition-all duration-200"
      />
      <button 
        onClick={handleSearchSubmit}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#FFC700] transition-colors duration-200 cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-32px)] md:w-[500px] bg-white rounded-lg shadow-xl border border-zinc-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500 text-center flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin text-[#0D9740]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col py-2">
              {results.map((item, idx) => (
                <Link
                  key={idx}
                  href={`/products/view_product?item_code=${item.item_code}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-[#EBF5EE] transition-colors group cursor-pointer"
                >
                  <div className="w-5 h-5 flex-shrink-0 text-zinc-400 group-hover:text-[#0D9740]">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 truncate">
                      {highlightMatch(item.item_name)}
                    </p>
                  </div>
                  {item.custom_image_1 && (
                    <div className="w-8 h-8 relative rounded overflow-hidden border border-zinc-100 flex-shrink-0">
                      <Image src={item.custom_image_1} alt={item.item_name} fill className="object-cover" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-zinc-500 text-center">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
