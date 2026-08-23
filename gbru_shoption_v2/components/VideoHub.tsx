"use client";
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import Navbar from './Navbar';
import AppDownloadBanner from './AppDownloadBanner';
import Footer from './Footer';

const stats = [
  {
    id: 1,
    icon: (
      <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h1v2H9V7zm0 4h1v2H9v-2zm0 4h1v2H9v-2zm4-8h1v2h-1V7zm0 4h1v2h-1v-2zm0 4h1v2h-1v-2z"></path>
      </svg>
    ),
    value: '50+',
    label: 'Exhibition attended'
  },
  {
    id: 2,
    icon: (
      <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    ),
    value: '2M+',
    label: 'Farmers Reached'
  },
  {
    id: 3,
    icon: (
      <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 2l7 5v10l-7 5-7-5V7l7-5z"></path>
      </svg>
    ),
    value: '15+',
    label: 'State Covered'
  },
  {
    id: 4,
    icon: (
      <svg className="w-8 h-8 text-[#006B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
    ),
    value: '5Cr+',
    label: 'Products In Field'
  }
];

const events = [
  { id: 1, title: 'Kisan Expo 2025', location: 'Surat, Gujarat', date: '20-22 JAN 2025', image: '/assets/youtube-thumbnail.png' },
  { id: 2, title: 'Startup Awards 2026', location: 'Delhi', date: '8-9 JULY 2026', image: '/assets/Awards P1.jpg.jpeg' },
  { id: 3, title: 'Dealer Meet 2026', location: 'Pune, Maharashtra', date: 'UPCOMING', image: '/assets/dealer_meet.JPG' },
];

const actionVideos = [
  { id: 1, title: 'Seeder And Action', location: 'India', duration: '02:00', category: 'Farmer Reviews', videoUrl: 'https://www.youtube.com/embed/rCvgxwas0Tk?autoplay=1', thumbnail: 'https://img.youtube.com/vi/rCvgxwas0Tk/hqdefault.jpg' },
  { id: 2, title: 'Mobile Auto And Action', location: 'India', duration: '01:45', category: 'Farmer Reviews', videoUrl: 'https://www.youtube.com/embed/D7pufaAYXwg?autoplay=1', thumbnail: 'https://img.youtube.com/vi/D7pufaAYXwg/hqdefault.jpg' },
  { id: 3, title: 'Sprayer in Action', location: 'Maharashtra', duration: '02:30', category: 'Farmer Reviews', videoUrl: 'https://www.youtube.com/embed/3rhBieQevLA?autoplay=1', thumbnail: 'https://img.youtube.com/vi/3rhBieQevLA/hqdefault.jpg' },
  { id: 4, title: 'Solar Camera In Action', location: 'Tamil Nadu', duration: '01:45', category: 'Farmer Reviews', videoUrl: 'https://www.youtube.com/embed/7gGJHSmBGOM?autoplay=1', thumbnail: 'https://img.youtube.com/vi/7gGJHSmBGOM/hqdefault.jpg' },
  { id: 5, title: 'Seeder Demo', location: 'Tamil Nadu', duration: '01:45', category: 'Product Demo', hideFromAll: true, videoUrl: 'https://www.youtube.com/embed/pT6hfgZrlUI?autoplay=1', thumbnail: 'https://img.youtube.com/vi/pT6hfgZrlUI/hqdefault.jpg' },
];

const initialTestimonials = [
  { id: 1, image: '/assets/farmer_review (1).jpg' },
  { id: 2, image: '/assets/farmer_review (2).jpg' },
  { id: 3, image: '/assets/farmer_review (3).jpg' },
];

const allTestimonials = [
  { id: 1, image: '/assets/farmer_review (1).jpg' },
  { id: 2, image: '/assets/farmer_review (2).jpg' },
  { id: 3, image: '/assets/farmer_review (3).jpg' },
  { id: 4, image: '/assets/farmer_review (1).jpg' },
  { id: 5, image: '/assets/farmer_review (2).jpg' },
  { id: 6, image: '/assets/farmer_review (3).jpg' },
];

const VideoHub = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };
  const [activeVideoTab, setActiveVideoTab] = useState('All Videos');
  const [activeTab, setActiveTab] = useState('All Videos');
  const [showMoreTestimonials, setShowMoreTestimonials] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F5] font-roboto flex flex-col relative">
      <Navbar />

      {/* Hero Section */}
      <div
        className="relative w-full h-[600px] lg:h-[700px] bg-cover bg-center"
        style={{ backgroundImage: 'url("/assets/expo.png")' }}
      >
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />

        {/* Hero Content */}
        <div className="relative max-w-[1280px] mx-auto px-4 lg:px-8 h-full flex flex-col justify-center pb-24">
          <div className="max-w-2xl">
            <h1 className="text-5xl lg:text-7xl font-bold text-[#000000] mb-6 tracking-tight">
              GBRU Experience
            </h1>
            <h2 className="text-2xl lg:text-3xl font-bold text-[#000000] mb-6">
              Real Stories. Real Farmers. Real Impact.
            </h2>
            <p className="text-lg lg:text-xl text-[#000000CC] mb-10 leading-relaxed max-w-xl">
              See how GBRU products, events and services are making a difference in farms and lives across India.
            </p>

            <button
              onClick={() => setActiveVideoUrl('https://www.youtube.com/embed/O0YlF-F-0Rc?autoplay=1')}
              className="bg-[#006B21] hover:bg-[#005a1b] transition-colors text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 w-fit shadow-lg"
            >
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              Watch Highlights
            </button>
          </div>
        </div>
      </div>

      {/* Floating Stats Card */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full -mt-24 relative z-10 mb-16">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
            {stats.map((stat, idx) => (
              <div
                key={stat.id}
                className={`flex items-center gap-6 px-4 ${idx !== stats.length - 1 ? 'lg:border-r border-gray-200' : ''
                  } ${idx !== 0 ? 'lg:pl-10' : ''}`}
              >
                <div className="flex-shrink-0">
                  {stat.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-3xl lg:text-4xl font-bold text-[#000000] mb-1">
                    {stat.value}
                  </span>
                  <span className="text-sm text-[#4A4A4A] font-medium">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Story Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <div>
            <p className="text-sm font-bold tracking-widest text-[#006B21] uppercase mb-4">
              Featured Story
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1A1A1A] mb-6 leading-tight">
              Kisan Expo 2025<br />Pune
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-10 leading-relaxed max-w-lg">
              A grand gathering of farmers, experts and innovators. Showcasing advanced farming solutions for a better tomorrow.
            </p>

            <div className="flex flex-col gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E8F3EB] rounded-lg flex items-center justify-center flex-shrink-0 text-[#006B21]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <span className="font-bold text-[#1A1A1A]">1,200+ Farmers Interacted</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E8F3EB] rounded-lg flex items-center justify-center flex-shrink-0 text-[#006B21]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <span className="font-bold text-[#1A1A1A]">300+ Product Demonstrations</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#E8F3EB] rounded-lg flex items-center justify-center flex-shrink-0 text-[#006B21]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1v2H9V7zm0 4h1v2H9v-2zm0 4h1v2H9v-2zm4-8h1v2h-1V7zm0 4h1v2h-1v-2zm0 4h1v2h-1v-2z" /></svg>
                </div>
                <span className="font-bold text-[#1A1A1A]">25+ New Dealer Partnerships</span>
              </div>
            </div>

            <button
              onClick={() => setActiveVideoUrl('https://www.youtube.com/embed/o4ebDd6oCak?autoplay=1')}
              className="bg-[#005B28] hover:bg-[#004a20] transition-colors text-white font-bold py-4 px-8 rounded-full flex items-center gap-3 shadow-md w-fit"
            >
              Watch Full Highlights
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

          {/* Right Video Container */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl">
            {isPlaying ? (
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/o4ebDd6oCak?autoplay=1"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            ) : (
              <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
                <Image src="/assets/youtube-thumbnail.png" alt="Video Thumbnail" fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                    <svg className="w-10 h-10 text-[#005B28] ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Events & Exhibitions Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-16 w-full pt-16 pb-8">
        <div className="flex flex-col xl:flex-row gap-12 xl:gap-16 items-start relative">

          {/* Left Column */}
          <div className="w-full xl:w-1/4 flex flex-col justify-between xl:min-h-[320px]">
            <div>
              <p className="text-sm font-bold tracking-widest text-[#006B21] uppercase mb-4">
                Events & Exhibitions
              </p>
              <h2 className="text-3xl lg:text-[32px] font-bold text-[#1A1A1A] mb-6">
                Where We Show Up
              </h2>
              <p className="text-[#6B7280] leading-relaxed mb-8">
                GBRU is always <br />
                on the move, <br />
                connecting with <br />
                farmers where they are.
              </p>
            </div>

            <button className="border-2 border-[#006B21] text-[#006B21] hover:bg-[#006B21] hover:text-white transition-colors font-bold py-3 px-6 rounded-full w-fit flex items-center gap-2 mt-auto">
              View All Events
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>

          {/* Right Carousel/Grid */}
          <div className="w-full xl:w-3/4 relative">
            <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {events.map((event) => (
                <div key={event.id} className="w-[280px] bg-white rounded-2xl border border-gray-200 overflow-hidden flex-shrink-0 snap-start shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-[180px] w-full">
                    <Image src={event.image} alt={event.title} fill className={`object-cover ${event.id === 2 ? 'object-top' : 'object-center'}`} />
                  </div>
                  <div className="p-6 flex flex-col">
                    <h3 className="font-bold text-xl text-[#1A1A1A] mb-1">{event.title}</h3>
                    <p className="text-[#6B7280] mb-6">{event.location}</p>
                    <p className="text-xs font-bold text-[#006B21] uppercase">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel Arrows (Hidden on mobile/tablet) */}
            <button className="absolute left-[-20px] xl:left-[-56px] top-[45%] -translate-y-1/2 w-12 h-12 bg-white rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-800 hover:text-[#006B21] transition-colors z-10 hidden lg:flex">
              <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="absolute right-[-20px] xl:right-[-56px] top-[45%] -translate-y-1/2 w-12 h-12 bg-white rounded-full border border-gray-200 shadow-lg flex items-center justify-center text-gray-800 hover:text-[#006B21] transition-colors z-10 hidden lg:flex">
              <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

        </div>
      </div>

      {/* Watch GBRU In Action Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full py-16 text-center">
        <p className="text-sm font-bold tracking-widest text-[#006B21] uppercase mb-4">
          VIDEOS
        </p>
        <h2 className="text-3xl lg:text-[40px] font-bold text-[#1A1A1A] mb-8">
          Watch <span className="text-[#006B21]">GBRU</span> In Action
        </h2>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-4 mb-16 flex-wrap">
          {['All Videos', 'Farmer Reviews', 'Product Demo'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${activeTab === tab ? 'bg-[#005B28] text-white shadow-md' : 'bg-[#F3F4F6] text-[#4B5563] hover:bg-gray-200'} px-6 py-2.5 rounded-full font-bold transition-colors`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        <div className="flex overflow-x-auto gap-6 text-left pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {actionVideos.filter(video => (activeTab === 'All Videos' && !(video as any).hideFromAll) || video.category === activeTab).map(video => (
            <div key={video.id} className="flex flex-col group cursor-pointer flex-shrink-0 w-[260px] sm:w-[280px] snap-start" onClick={() => (video as any).videoUrl && setActiveVideoUrl((video as any).videoUrl)}>
              <div className="relative w-full aspect-video bg-gradient-to-b from-[#3a3a3a] to-black rounded-xl overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                {(video as any).thumbnail && (
                  <img src={(video as any).thumbnail} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity z-0" />
                )}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center group-hover:bg-black/80 transition-colors border border-white/20 shadow-lg">
                    <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              <h3 className="font-bold text-[#1A1A1A] text-[15px] leading-tight mb-1 group-hover:text-[#006B21] transition-colors">
                {video.title}
              </h3>
              <p className="text-xs text-[#9CA3AF]">{video.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full py-16 mb-16">
        <div
          className="w-full rounded-[48px] overflow-hidden relative py-20 px-8 flex flex-col items-center shadow-xl border border-gray-100"
          style={{
            backgroundColor: '#F3F4F0',
            backgroundImage: `url('/assets/farm.png')`,
            backgroundPosition: 'bottom',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Header */}
          <h2 className="text-4xl lg:text-[44px] font-bold text-[#2A3143] mb-4 relative z-10 text-center">
            Testimonial
          </h2>
          <p className="text-xl lg:text-2xl font-medium text-[#1A1A1A] mb-16 relative z-10 text-center">
            Trusted by Farmers, Proven in the Field
          </p>

          {/* Mobile Horizontal Scroll */}
          <div className="flex md:hidden w-full overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {allTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 w-[78vw] max-w-[320px] aspect-square relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-white/50 snap-center"
              >
                <Image src={testimonial.image} alt={`Farmer Review ${testimonial.id}`} fill className="object-cover" />
              </div>
            ))}
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 w-full relative z-10 max-w-5xl">
            {(showMoreTestimonials ? allTestimonials : initialTestimonials).map((testimonial) => (
              <div key={testimonial.id} className="w-full aspect-square relative rounded-3xl overflow-hidden shadow-2xl hover:scale-105 transition-transform duration-500 bg-white border border-white/50">
                <Image src={testimonial.image} alt={`Farmer Review ${testimonial.id}`} fill className="object-cover" />
              </div>
            ))}
          </div>

          {/* Desktop Button */}
          {!showMoreTestimonials && (
            <button
              onClick={() => setShowMoreTestimonials(true)}
              className="hidden md:inline-flex mt-20 bg-[#0FA84D] hover:bg-[#008A3D] text-white font-bold py-4 px-12 rounded-full shadow-lg relative z-10 transition-colors tracking-wide"
            >
              View More
            </button>
          )}
        </div>
      </div>

      {/* Impact & App Section */}
      <AppDownloadBanner />

      <Footer />

      {/* Video Lightbox Modal */}
      {activeVideoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999] p-4 animate-fade-in"
          onClick={() => setActiveVideoUrl(null)}
        >
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
            <button
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 transition-colors text-white w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold z-10"
              onClick={() => setActiveVideoUrl(null)}
            >
              ✕
            </button>
            <iframe
              width="100%"
              height="100%"
              src={activeVideoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}

    </div>
  );
};

export default VideoHub;
