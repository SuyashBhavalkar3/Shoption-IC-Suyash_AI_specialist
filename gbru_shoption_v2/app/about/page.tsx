import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'About Us - GBRU',
  description: 'Founded with a clear purpose to modernize Indian agriculture and make advanced farming solutions accessible to every farmer.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#204123] to-[#185A46] text-white py-16 px-4 md:py-24">
          <div className="max-w-[1280px] w-full mx-auto text-center flex flex-col gap-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">About Us</h1>
            <p className="text-sm md:text-base text-zinc-200/90 max-w-2xl mx-auto leading-relaxed">
              Founded with a clear purpose to modernize Indian agriculture and make advanced farming solutions accessible to every farmer.
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16">
          <div className="bg-white border border-zinc-200/80 rounded-[32px] p-8 md:p-12 shadow-sm flex flex-col gap-6 max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0D9740]">Who We Are</h2>
            <p className="text-zinc-600 text-sm md:text-base leading-relaxed">
              As a forward-thinking agri-tech company, we design and deliver innovative, technology-driven products that enhance crop productivity, simplify operations, and strengthen the agricultural supply chain. Our goal is to empower farmers with reliable tools that bring efficiency, sustainability, and long-term value to their fields.
            </p>
          </div>
        </section>

        {/* Vision & Mission Section */}
        <section className="bg-[#F8F9FA] py-16 border-y border-zinc-100">
          <div className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Vision */}
            <div className="bg-white border border-zinc-200/60 rounded-[24px] p-8 shadow-sm flex flex-col gap-4 hover:border-[#0D9740] transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#EBF5EE] text-[#0D9740] flex items-center justify-center font-bold text-lg">👁️</div>
              <h3 className="text-xl font-bold text-[#0F291B]">Our Vision</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Our vision is to be a global leader in modern agricultural solutions, trusted by farmers across the world. We strive to create a future where technology and sustainability go hand in hand, ensuring food security and economic growth for generations to come.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-white border border-zinc-200/60 rounded-[24px] p-8 shadow-sm flex flex-col gap-4 hover:border-[#0D9740] transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-[#EBF5EE] text-[#0D9740] flex items-center justify-center font-bold text-lg">🚀</div>
              <h3 className="text-xl font-bold text-[#0F291B]">Our Mission</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Our mission is to revolutionize agriculture by providing high-quality, efficient, and sustainable farming equipment. We aim to empower farmers with innovative tools that increase productivity, reduce labour challenges, and support long-term environmental balance.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-[#0F291B] tracking-tight mb-4">Our Core Values</h2>
          <p className="text-zinc-500 text-sm max-w-xl mx-auto mb-12">
            The principles that guide our everyday work to serve the agricultural ecosystem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Value 1 */}
            <div className="bg-white border border-zinc-200/70 rounded-[24px] p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-3xl">🌾</span>
              <h4 className="font-bold text-[#0F291B] text-sm">Farmer Empowerment</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">Empowering farmers with reliable tools that simplify everyday labor challenges.</p>
            </div>

            {/* Value 2 */}
            <div className="bg-white border border-zinc-200/70 rounded-[24px] p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-3xl">🌱</span>
              <h4 className="font-bold text-[#0F291B] text-sm">Sustainable Innovation</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">Designing modern tech-driven tools that support long-term eco balance.</p>
            </div>

            {/* Value 3 */}
            <div className="bg-white border border-zinc-200/70 rounded-[24px] p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-3xl">🛡️</span>
              <h4 className="font-bold text-[#0F291B] text-sm">Product Quality & Reliability</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">Strict quality control to ensure long-lasting durability in the fields.</p>
            </div>

            {/* Value 4 */}
            <div className="bg-white border border-zinc-200/70 rounded-[24px] p-6 shadow-sm flex flex-col items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-3xl">🌍</span>
              <h4 className="font-bold text-[#0F291B] text-sm">Global Vision & Local Focus</h4>
              <p className="text-zinc-500 text-xs leading-relaxed">Bringing global tech standards adapted perfectly for local farms.</p>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-[#F8F9FA] py-16 border-t border-zinc-100">
          <div className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-[#0F291B] tracking-tight mb-2">Why Choose Us?</h2>
            <p className="text-zinc-500 text-sm max-w-xl mx-auto mb-12">Our Commitment to Quality and Service</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Point 1 */}
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#0D9740] shadow-sm border border-zinc-150">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <h4 className="font-bold text-[#0F291B] text-sm">Quality Assurance</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  All our products undergo rigorous quality checks to ensure durability and performance.
                </p>
              </div>

              {/* Point 2 */}
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#0D9740] shadow-sm border border-zinc-150">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h4 className="font-bold text-[#0F291B] text-sm">Fast and Reliable Delivery</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  We offer fast and reliable delivery across India, ensuring your equipment arrives on time.
                </p>
              </div>

              {/* Point 3 */}
              <div className="flex flex-col items-center gap-3 text-center px-4">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#0D9740] shadow-sm border border-zinc-150">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <h4 className="font-bold text-[#0F291B] text-sm">Warranty and Support</h4>
                <p className="text-zinc-500 text-xs leading-relaxed">
                  Our products come with comprehensive warranty and dedicated support to address any issues.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founders Message Section */}
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-20">
          <h2 className="text-3xl font-extrabold text-[#0F291B] tracking-tight text-center mb-12">From The Founders</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Founder 1 */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] overflow-hidden shadow-sm flex flex-col hover:border-[#0D9740] transition-colors duration-300">
              <div className="bg-[#183525] pt-6 px-6 pb-0 flex justify-center h-[320px] overflow-hidden relative">
                <img
                  src="/assets/sharad_sir.png"
                  alt="Sharad R. Kale"
                  className="h-full object-contain object-bottom"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow gap-4">
                <p className="text-zinc-600 text-xs md:text-sm leading-relaxed italic">
                  I am deeply honored to be recognized as the Best Entrepreneur of the Year in Agritech. This milestone reflects the trust of farmers and the relentless dedication of our team at Shoption & GBRU. Our mission has always been to revolutionise agriculture through smarter, tech-driven solutions that empower farmers and drive sustainable growth. Now, as we expand our vision with state of-the-art manufacturing setups and strategic acquisitions, we are taking another bold step toward strengthening the agri ecosystem and creating deeper impact across rural India. Grateful to all our stakeholders for their continued belief and support together, we are shaping a future of efficient, innovative, and resilient farming.
                </p>
                <div>
                  <h4 className="font-bold text-[#0F291B] text-base">Sharad R. Kale</h4>
                  <span className="text-xs text-zinc-400 font-medium">Founder & CEO</span>
                </div>
              </div>
            </div>

            {/* Founder 2 */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] overflow-hidden shadow-sm flex flex-col hover:border-[#0D9740] transition-colors duration-300">
              <div className="bg-[#183525] pt-6 px-6 pb-0 flex justify-center h-[320px] overflow-hidden relative">
                <img
                  src="/assets/somnath_sir.jpg"
                  alt="Somnath Shendge"
                  className="h-full object-contain object-bottom"
                />
              </div>
              <div className="p-6 flex flex-col justify-between flex-grow gap-4">
                <p className="text-zinc-600 text-xs md:text-sm leading-relaxed italic">
                  At Shoption & GBRU, our vision of innovation goes beyond technology it is about solving real problems faced by farmers every day. Every product we build starts with a simple question: how can we make farming smarter, safer, and more productive? From IOT-based automation to next-generation agricultural tools, we are focused on delivering affordable, reliable, and practical solutions that create measurable impact in the lives of farmers. True innovation happens when technology listens to the farmer and that belief continues to drive everything we do at Shoption & GBRU.
                </p>
                <div>
                  <h4 className="font-bold text-[#0F291B] text-base">Somnath Shendge</h4>
                  <span className="text-xs text-zinc-400 font-medium">Co-Founder</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
