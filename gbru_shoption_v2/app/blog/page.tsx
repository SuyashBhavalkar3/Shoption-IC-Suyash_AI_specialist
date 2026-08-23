"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const blogPosts = [
  {
    id: 1,
    title: 'Modern Drip Irrigation: A Game Changer for Indian Farmers',
    category: 'Irrigation',
    date: 'August 5, 2026',
    readTime: '5 min read',
    image: '/assets/cat_irrigation.png',
    excerpt: 'Discover how modern drip irrigation systems optimize water usage, reduce fertilizer waste, and boost crop yields significantly for Indian agriculture.',
    content: `Drip irrigation, also known as trickle irrigation, is a modern method of micro-irrigation that has revolutionized farming worldwide, especially in arid and semi-arid regions of India. Unlike traditional flood irrigation, which wastes up to 60% of water through evaporation and run-off, drip irrigation delivers water and nutrients directly to the plant's roots.

How Drip Irrigation Works:
A network of valves, pipes, tubing, and emitters allows water to drip slowly to the roots of plants, either onto the soil surface or directly onto the root zone. This targeted delivery ensures that every drop of water is utilized efficiently.

Key Benefits:
1. High Water Efficiency: Saves up to 70% of water compared to traditional flood methods.
2. Improved Crop Yields: Consistent moisture levels ensure healthier crop growth and up to 50% higher yields.
3. Reduced Fertilizer Runoff: Nutrients can be mixed directly with water (fertigation), feeding the plant roots directly and preventing chemical runoff.
4. Minimized Weed Growth: Water is only applied where the crops are, leaving surrounding soil dry and preventing weeds from thriving.

With climate change causing unpredictable rainfall, adopting drip irrigation is no longer just an option but a necessity for sustainable farming in India.`
  },
  {
    id: 2,
    title: 'How IoT is Revolutionizing Smart Farming in India',
    category: 'Smart Farming',
    date: 'July 28, 2026',
    readTime: '6 min read',
    image: '/assets/precision_farming_support.png',
    excerpt: 'Explore the future of farming with smart automation. From automated motor controllers to real-time soil moisture monitoring.',
    content: `The integration of the Internet of Things (IoT) in agriculture is ushering in a new era of precision farming. By using smart sensors, automated controllers, and data analytics, farmers can now monitor and manage their fields with unprecedented precision.

Smart Automation Devices:
GBRU Dry-Run Auto and mobile motor starters are leading examples of how IoT is helping farmers. Instead of walking long distances at night to turn on water pumps, farmers can now control their pumps remotely via their smartphones or let the sensors automate the process.

Why IoT Matters:
1. Resource Optimization: Smart sensors measure soil moisture, temperature, and humidity, ensuring irrigation pumps only run when necessary.
2. Equipment Protection: Features like dry-run and single-phasing protection prevent expensive pump motors from burning out due to fluctuations or dry wells.
3. Real-Time Alerts: Receive instant SMS or app notifications if there is a power cut, water outage, or equipment failure.

IoT technology bridges the gap between traditional labor and modern efficiency, helping Indian farmers save time, protect their investments, and maximize productivity.`
  },
  {
    id: 3,
    title: 'Understanding Soil Health: Essential Nutrients for Higher Crop Yields',
    category: 'Soil Science',
    date: 'July 15, 2026',
    readTime: '4 min read',
    image: '/assets/farm.png',
    excerpt: 'A comprehensive guide to understanding soil pH levels, NPK nutrients, and organic fertilization methods to keep your fields fertile.',
    content: `Soil is the foundation of successful farming. Healthy soil contains a rich balance of organic matter, microorganisms, and essential nutrients that crops need to thrive. Understanding and maintaining soil health is critical for long-term farm productivity.

Essential Soil Nutrients (NPK):
1. Nitrogen (N): Vital for leaf growth and green coloring.
2. Phosphorus (P): Promotes root development and flower/fruit production.
3. Potassium (K): Strengthens plant disease resistance and overall crop quality.

Steps to Maintain Soil Health:
- Soil Testing: Test your soil every season to check pH levels and nutrient deficiencies before applying fertilizers.
- Crop Rotation: Rotate different families of crops to naturally restore nitrogen and disrupt pest cycles.
- Add Organic Matter: Use compost, green manure, and mulching to improve soil structure and water retention.

Investing in soil health ensures your land remains fertile and productive for generations to come.`
  },
  {
    id: 4,
    title: 'Solar Energy in Agriculture: Powering the Future of Farms',
    category: 'Sustainability',
    date: 'July 02, 2026',
    readTime: '5 min read',
    image: '/assets/cat_solar_security.png',
    excerpt: 'Learn how solar-powered water pumps and green energy micro-grids are cutting electricity costs and securing reliable irrigation for rural farmers.',
    content: `Solar energy is transforming rural India by providing clean, reliable, and cost-effective power to agricultural fields. For decades, farmers have struggled with erratic grid electricity and rising diesel prices. Solar energy offers a sustainable solution.

Applications of Solar in Farming:
- Solar Water Pumps: Directly powered by solar panels, these pumps irrigate fields during the day, eliminating the need to wait for nighttime grid power.
- Solar Fencing & Security: Powering security cameras and fencing systems to protect crops from wild animals and theft.

Major Advantages:
1. Zero Fuel Costs: Sun energy is free, drastically reducing dependency on expensive diesel generators.
2. Day-Time Irrigation: Farmers no longer need to venture out into dark fields at night to irrigate.
3. Environmental Friendly: Reduces carbon footprint and promotes clean energy usage.

With government subsidies like PM-KUSUM, transitioning to solar power has become highly accessible and rewarding for farmers across India.`
  }
];

export default function BlogPage() {
  const [activePost, setActivePost] = useState<any>(null);

  const handleBackToGrid = () => {
    setActivePost(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-[#204123] to-[#185A46] text-white py-16 px-4 text-center">
          <div className="max-w-[1280px] w-full mx-auto flex flex-col gap-4">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-[#FFC700] bg-white/10 px-3 py-1.5 rounded-full w-max mx-auto">
              GBRU Knowledge Hub
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              {activePost ? 'Knowledge Hub' : 'Agricultural Blog'}
            </h1>
            <p className="text-sm md:text-base text-zinc-200/90 max-w-2xl mx-auto leading-relaxed">
              {activePost 
                ? 'Read detailed guides and articles below' 
                : 'Expert insights, tips, and modern farming techniques to empower your agricultural journey.'
              }
            </p>
          </div>
        </section>

        {/* Dynamic Content Section */}
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16">
          {activePost ? (
            /* Detailed Post View */
            <div className="max-w-3xl mx-auto bg-white border border-zinc-200/80 rounded-[32px] overflow-hidden shadow-sm p-6 md:p-10 flex flex-col gap-6">
              <button 
                onClick={handleBackToGrid}
                className="w-max text-xs font-bold text-[#0D9740] hover:text-[#08632a] flex items-center gap-1.5 transition-colors"
              >
                ← Back to Articles
              </button>

              <div className="h-64 md:h-[400px] w-full overflow-hidden rounded-2xl bg-zinc-100">
                <img
                  src={activePost.image}
                  alt={activePost.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold px-3 py-1.5 rounded-full">
                    {activePost.category}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-semibold">
                    <span>{activePost.date}</span>
                    <span>•</span>
                    <span>{activePost.readTime}</span>
                  </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F291B] leading-tight">
                  {activePost.title}
                </h2>

                <hr className="border-zinc-100 my-2" />

                <div className="text-zinc-600 text-sm md:text-base leading-relaxed whitespace-pre-line flex flex-col gap-4">
                  {activePost.content}
                </div>
              </div>

              <button 
                onClick={handleBackToGrid}
                className="w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow hover:shadow-md mt-6 flex items-center justify-center gap-1.5"
              >
                ← Back to Articles
              </button>
            </div>
          ) : (
            /* Blog Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {blogPosts.map((post) => (
                <article 
                  key={post.id} 
                  className="bg-white border border-zinc-200/80 rounded-[28px] overflow-hidden shadow-sm flex flex-col hover:shadow-md hover:border-[#0D9740]/40 transition-all duration-300 group cursor-pointer"
                  onClick={() => {
                    setActivePost(post);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  {/* Post Image Container */}
                  <div className="h-56 w-full overflow-hidden relative bg-zinc-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Category Badge */}
                    <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#0F291B] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col justify-between flex-grow gap-4">
                    <div className="flex flex-col gap-2">
                      {/* Meta info */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-semibold">
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                      {/* Title */}
                      <h3 className="text-lg font-bold text-[#0F291B] group-hover:text-[#0D9740] transition-colors leading-snug">
                        {post.title}
                      </h3>
                      {/* Excerpt */}
                      <p className="text-zinc-500 text-xs md:text-sm leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Read More Link */}
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0D9740] group-hover:underline flex items-center gap-1">
                        Read Article <span>→</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
