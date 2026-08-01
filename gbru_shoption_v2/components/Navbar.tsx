"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/", active: true },
    { name: "All Products", href: "/products", active: false },
    { name: "Categories", href: "/categories", active: false },
    { name: "Video Hub", href: "/videos", active: false },
    { name: "Contact Us", href: "/contact", active: false },
  ];

  return (
    <nav 
      className="w-full text-white border-b border-white/10 sticky top-0 z-50 shadow-lg"
      style={{ background: "linear-gradient(90deg, #204123 0%, #185A46 49.52%, #204123 100%)" }}
    >
      <div className="max-w-[1280px] w-full mx-auto pl-[21px] pr-[47px]">
        <div className="flex items-center justify-between lg:justify-start h-[72px]">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center lg:mr-[142px]">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/gbru_header_logo.png"
                alt="GBRU Logo"
                width={92}
                height={51}
                className="h-[51px] w-[92px] object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-between w-[448px] h-[34px] lg:mr-[44px]">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative py-1 font-roboto font-semibold text-[12px] leading-none transition-colors duration-200 hover:text-[#FFC700] ${
                  link.active ? "text-[#FFC700]" : "text-white/90"
                }`}
              >
                {link.name}
                {link.active && (
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[120%] h-[3px] bg-[#FFC700] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center relative w-[260px] h-[35px] lg:mr-[26px]">
            <input
              type="text"
              placeholder="Search tools, products...."
              className="w-full h-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/50 font-roboto font-semibold text-[12px] leading-none rounded-full pl-4 pr-10 border border-white/20 focus:border-[#FFC700] focus:outline-none transition-all duration-200"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-[#FFC700] transition-colors duration-200 cursor-pointer">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex items-center">
            {/* Language Selector */}
            <button className="flex items-center justify-center gap-[3.99px] w-[45.99px] h-[24px] font-roboto font-semibold text-[12px] leading-none hover:text-[#FFC700] transition-colors duration-200 cursor-pointer mr-[31px]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span>EN</span>
            </button>

            {/* Sign Up Button */}
            <Link
              href="/signup"
              className="flex items-center justify-center gap-1 w-[78px] h-[22px] bg-[#FFC700] hover:bg-[#e6b300] text-black font-roboto font-semibold text-[11px] leading-none rounded-[4px] transition-all duration-200 shadow-md hover:scale-[1.02] mr-[25px]"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Sign up</span>
            </Link>

            {/* Cart Icon */}
            <Link href="/cart" className="relative hover:scale-110 transition-transform duration-200 w-[20px] h-[23px] flex items-center justify-center">
              <Image
                src="/assets/header_cart_logo.png"
                alt="Cart"
                width={20}
                height={23}
                className="h-[23px] w-[20px] object-contain"
              />
            </Link>
          </div>

          {/* Mobile Right Controls (Hamburger & Cart) */}
          <div className="flex lg:hidden items-center space-x-4">
            {/* Search Toggle / Input on medium screen */}
            <div className="hidden sm:flex md:hidden items-center relative max-w-[180px]">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-white/10 text-white placeholder-white/50 text-xs rounded-full py-1.5 pl-3 pr-8 border border-white/20 focus:outline-none"
              />
              <svg
                className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Mobile Cart */}
            <Link href="/cart" className="p-1 hover:scale-105 transition-transform duration-200">
              <Image
                src="/assets/header_cart_logo.png"
                alt="Cart"
                width={22}
                height={22}
                className="h-[22px] w-auto object-contain"
              />
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#FFC700] hover:bg-white/10 focus:outline-none transition-colors duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer/Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#0A331E] border-t border-white/10 px-4 pt-2 pb-6 space-y-4 animate-fadeIn">
          {/* Mobile Search (Visible on small mobile viewports) */}
          <div className="relative sm:hidden">
            <input
              type="text"
              placeholder="Search tools, products...."
              className="w-full bg-white/10 text-white placeholder-white/50 text-sm rounded-full py-2.5 pl-4 pr-10 border border-white/20 focus:outline-none"
            />
            <svg
              className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Links */}
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2.5 rounded-md text-base font-semibold transition-colors ${
                  link.active
                    ? "text-[#FFC700] bg-white/5"
                    : "text-white hover:text-[#FFC700] hover:bg-white/5"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 my-4 pt-4 flex flex-col gap-4">
            {/* Language Selection Mobile */}
            <button className="flex items-center space-x-2 px-3 py-1.5 text-base font-semibold hover:text-[#FFC700] transition-colors duration-200 w-fit cursor-pointer">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span>English (EN)</span>
            </button>

            {/* Sign Up Mobile */}
            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center space-x-2 bg-[#FFC700] hover:bg-[#e6b300] text-black font-bold py-3 rounded-[6px] transition-colors duration-200 shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>Sign up</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
