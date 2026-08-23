"use client";
import React from "react";
import Image from "next/image";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Profile = () => {
  return (
    <div className="min-h-screen bg-white font-roboto flex flex-col">
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap');
        .font-roboto { font-family: 'Roboto', sans-serif; }
      `}} />
      <Navbar />
      
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col lg:flex-row justify-between gap-8 overflow-hidden">
        
        {/* Left Side: Form */}
        <div className="w-full lg:w-[50%] flex flex-col justify-center">
          <h1 className="text-[#006B21] text-3xl md:text-[40px] font-bold leading-tight mb-4">
            Share your location details, we'll show prices<br />suited to your area <Image src="/assets/crop.png" alt="Crop" width={40} height={40} className="inline-block -mt-2 ml-1" />
          </h1>
          <p className="text-[#4A4A4A] text-lg mb-10">
            Providing your location allows GBRU best pricing according to your area.
          </p>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Name</label>
                <input 
                  type="text" 
                  placeholder="Add your name" 
                  className="bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Your email address</label>
                <input 
                  type="email" 
                  placeholder="name@gmail.com" 
                  className="bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
                />
              </div>

              {/* State */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">State</label>
                <div className="relative">
                  <select defaultValue="" className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none appearance-none transition-colors">
                    <option value="" disabled>Select State</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="karnataka">Karnataka</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* District */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">District</label>
                <div className="relative">
                  <select defaultValue="" className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none appearance-none transition-colors">
                    <option value="" disabled>Select District</option>
                    <option value="pune">Pune</option>
                    <option value="mumbai">Mumbai</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Tehsil */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Tehsil</label>
                <div className="relative">
                  <select defaultValue="" className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none appearance-none transition-colors">
                    <option value="" disabled>Select Tehsil</option>
                    <option value="haveli">Haveli</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Pincode */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Pincode</label>
                <input 
                  type="text" 
                  placeholder="6-digit PIN" 
                  maxLength={6}
                  className="bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
                />
              </div>

              {/* Marketplace */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Marketplace</label>
                <div className="relative">
                  <select defaultValue="" className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none appearance-none transition-colors">
                    <option value="" disabled>Select Marketplace</option>
                    <option value="market1">Market 1</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Village */}
              <div className="flex flex-col gap-2">
                <label className="text-[#4A4A4A] font-semibold text-sm">Village</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search for your village or panchayat" 
                    className="w-full bg-[#F3F6FA] text-[#1A1A1A] pl-11 pr-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="text-[#4A4A4A] font-semibold text-sm">Address Line 1</label>
              <input 
                type="text" 
                placeholder="address line 1" 
                className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
              />
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-[#4A4A4A] font-semibold text-sm">Address Line 2</label>
              <input 
                type="text" 
                placeholder="address line 2" 
                className="w-full bg-[#F3F6FA] text-[#1A1A1A] px-4 py-3.5 rounded-xl border border-transparent focus:border-[#006B21] focus:bg-white outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-10 pb-6 flex justify-end">
              <button 
                type="button"
                className="bg-[#006B21] hover:bg-[#005a1b] text-white font-semibold text-base sm:text-lg py-3.5 px-8 sm:px-12 rounded-full flex items-center gap-3 transition-colors shadow-lg w-full sm:w-auto justify-center transform translate-x-12 sm:translate-x-20 lg:translate-x-24"
              >
                Continue 
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Image with Glassmorphism Card */}
        <div className="w-full lg:w-[40%] relative rounded-[32px] overflow-hidden min-h-[360px] sm:min-h-[500px] lg:h-[650px] shadow-2xl self-start lg:mt-4">
          <Image 
            src="/assets/sprayer.png" 
            alt="Farmer spraying field" 
            fill 
            className="object-cover"
            priority
          />
          
          {/* Glassmorphism Overlay Card */}
          <div className="absolute bottom-4 left-4 right-4 lg:bottom-10 lg:left-10 lg:right-10 rounded-2xl overflow-hidden border border-white/40 shadow-xl"
               style={{
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                 backdropFilter: 'blur(12px)',
                 WebkitBackdropFilter: 'blur(12px)',
               }}>
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
              {/* Map/Location Icon Container */}
              <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full bg-[#E8F3EB] border-4 border-white/50 flex-shrink-0 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                {/* Simulated map graphic using SVG */}
                <svg className="w-full h-full text-[#006B21] opacity-70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              
              {/* Text Content */}
              <div className="flex flex-col text-[#1A1A1A]">
                <p className="text-[#006B21] font-bold text-xs tracking-wider mb-1">REGIONAL CONTEXT</p>
                <h3 className="text-xl md:text-2xl font-bold mb-1">Precision Farming Support</h3>
                <p className="text-sm md:text-base text-[#4A4A4A] font-medium leading-tight">
                  We'll check your location to give you the best price
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default Profile;
