"use client";

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sections = [
  { id: 'cancellation', title: '1. Refund & Cancellation' },
  { id: 'returns', title: '2. Return & Refund Policy' },
  { id: 'pick-up', title: '3. Return Pick-Up' }
];

export default function ReturnsPage() {
  const [activeSection, setActiveSection] = useState('cancellation');
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Scroll Spy: Update active section based on intersection observer
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el && observer.current) {
        observer.current.observe(el);
      }
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#204123] to-[#185A46] text-white py-12 px-4 text-center">
          <div className="max-w-[1280px] w-full mx-auto flex flex-col gap-3">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Refund & Return Policy</h1>
            <p className="text-xs md:text-sm text-zinc-200/90 max-w-xl mx-auto leading-relaxed">
              Effective Date: July 26, 2019
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16">
          <div className="flex flex-col lg:flex-row gap-10 items-start max-w-6xl mx-auto">
            
            {/* Left Sidebar Table of Contents */}
            <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-28 bg-white border border-zinc-200/80 rounded-[24px] shadow-sm p-5">
              <h3 className="text-[10px] font-bold text-zinc-400 tracking-wider mb-4 px-1 uppercase">TABLE OF CONTENTS</h3>
              <div className="flex flex-col gap-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left px-4 py-2.5 rounded-lg text-xs transition-all flex items-center relative ${
                      activeSection === section.id
                        ? "text-[#0F291B] bg-[#EBF5EE] font-bold"
                        : "text-zinc-600 hover:text-[#0F291B] hover:bg-zinc-50 font-medium"
                    }`}
                  >
                    {activeSection === section.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#0D9740] rounded-r-full" />
                    )}
                    {section.title}
                  </button>
                ))}
              </div>
            </aside>

            {/* Right Text Content Panel */}
            <div className="flex-1 bg-white border border-zinc-200/80 rounded-[32px] p-6 md:p-10 shadow-sm flex flex-col gap-10 text-left">
              
              {/* Refund & Cancellation */}
              <div id="cancellation" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Refund & Cancellation Policy
                </h2>
                <ul className="list-decimal list-inside text-zinc-600 text-sm space-y-3 pl-2 leading-relaxed">
                  <li>
                    Order(s) can be cancelled anytime before making payment, once payment is done order can not be cancelled.
                  </li>
                  <li>
                    Order(s) cancellation can be done anytime before making payment by clicking cancel order button.
                  </li>
                </ul>
              </div>

              {/* Return & Refund Policy */}
              <div id="returns" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Return & Refund Policy
                </h2>
                <ul className="list-decimal list-inside text-zinc-600 text-sm space-y-3 pl-2 leading-relaxed mb-4">
                  <li>
                    We do not accept any return of product however replacement of product can be done if in case of wrong product delivered or confirmed faulty by manufacturer as per service policy of manufacturer;
                  </li>
                  <li>
                    All items to be replaced must be unused and in their original condition with all original tags and packaging intact.
                  </li>
                  <li>
                    For replacement of your order, please follow the following steps.
                  </li>
                </ul>
                
                {/* Steps container */}
                <div className="bg-[#F8F9FA] p-5 rounded-2xl border border-zinc-200/50 flex flex-col gap-3 pl-6">
                  <h4 className="font-bold text-xs text-[#0F291B] uppercase tracking-wider mb-1">Steps for Replacement:</h4>
                  <ol className="list-decimal list-inside text-zinc-600 text-sm space-y-2.5">
                    <li>Login to Your account;</li>
                    <li>Go to My Orders;</li>
                    <li>Select the items that you want to replace;</li>
                    <li>Click on <strong className="text-[#0F291B]">“Replace”</strong>;</li>
                    <li>Fill in the appropriate reason for replacement;</li>
                    <li>You will receive a replacement confirmation via email;</li>
                    <li>You will get a replacement once your order is picked up & checked for quality subject to applicable exceptions or replacement charges as per manufacturers policy of replacement;</li>
                  </ol>
                </div>
              </div>

              {/* Return Pick-Up */}
              <div id="pick-up" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Return Pick-Up
                </h2>
                <ul className="list-disc list-inside text-zinc-600 text-sm space-y-4 pl-2 leading-relaxed">
                  <li>
                    We send the replacement pick-up request to our logistics partners as soon as we receive the replacement request from you;
                  </li>
                  <li>
                    Our logistics partner will pick up the product/s within 3-4 days of receiving the request.
                  </li>
                  <li>
                    Our logistics partner shall make two attempts to pick up the product/s. If the item is not picked up in the second attempt, the replacement shall be considered complete at our end.
                  </li>
                  <li>
                    Please keep the shipment ready as detailed above and ensure that You return all items for which the request was raised. If you fail to do so, the replacement option may not be available to You in the future, the discretion of which shall lie completely with the company.
                  </li>
                  <li>
                    If you receive a message that <strong className="text-red-600 bg-red-50 px-1 rounded">‘Pickup service is not available’</strong>, we request you to send the product to our warehouse using a courier company available in your location. Please ensure that the products are in unused condition with their original packaging and tags intact. Also, please ensure that you insert the “Return Slip” which is a part of the invoice along with the product that is shipped. In the absence of the return slip in the courier, we will not be able to process the replacement. After sending the shipment, please upload the shipment details through the ‘My Returns’ functionality on our website;
                  </li>
                  <li>
                    You will see a message <strong className="text-[#0F291B] bg-emerald-50 px-1 rounded">‘Self-ship details pending’</strong> for returns where you are yet to submit the shipment details. Please note it is mandatory to submit the self-ship details to get a refund for the returned item. Once we receive the returned items in our warehouse, we will refund the amount of the items and also the amount that you spent on sending the item to our warehouse.
                  </li>
                  <li>
                    When you get to see the message <strong className="text-zinc-700 font-semibold bg-zinc-50 px-1 rounded">‘Pickup service is not available’</strong> message, please send the product/s to our warehouse address mentioned in the return slip.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
