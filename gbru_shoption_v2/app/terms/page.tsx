"use client";

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

const sections = [
  { id: 'intro', title: 'Introduction' },
  { id: 'general', title: 'I. General Terms' },
  { id: 'buyer', title: 'II. Buyer Terms' },
  { id: 'seller', title: 'III. Seller Terms' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'force-majeure', title: 'Force Majeure' },
  { id: 'intellectual-property', title: 'Intellectual Property' },
  { id: 'notices', title: 'Notices' },
  { id: 'miscellaneous', title: 'Miscellaneous' }
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('intro');
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Terms of Use</h1>
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
              
              {/* Intro */}
              <div id="intro" className="scroll-mt-32 flex flex-col gap-4">
                <span className="text-xs text-zinc-400 font-semibold">
                  This policy shall come into force with effect from 00:00 hours of 26th July 2019
                </span>
                
                <Link 
                  href="/privacy-policy" 
                  className="inline-flex items-center text-xs font-bold text-[#0D9740] hover:underline"
                >
                  🔒 Click here to refer to our Privacy Policy
                </Link>

                <p className="text-zinc-600 text-sm leading-relaxed mt-2">
                  The following demonstrates User Agreement (here-in-after referred to as an "Agreement") between Shoption Private Limited (“Shoption”, “We”, “Our”, “Us”) a company duly registered under the provisions of the Indian Companies Act 2013 with its registered office at Office address and the Website www.shoption.in and the mobile application (hereinafter referred to as "Platform") and the users of the Platform ("You", "Your, "User", "Users", “User(s)”, ”Seller”,”Seller(s)”, “Buyer”,”Buyer(s)”).
                </p>
                
                <p className="text-zinc-600 text-sm leading-relaxed">
                  This document and such other rules and policies of the Platform (including but not limited to Return & Undelivered Shipment Policy, Privacy Policy , Product Listing Policy , Infringement Policy , Anti-Counterfeiting Policy ) as may be amended from time to time are collectively referred to below as the “Terms”. We reserve the right, at our sole discretion, to change, modify, add or remove portions of these Terms, at any time without any prior written notice to you. By accessing, browsing, or otherwise using the Platform or using the Services, including following the posting of changes, User agrees to accept and be bound by the Terms (as may be amended from time to time). It is your responsibility to review these Terms periodically for any updates and/or changes. Please do not use the Services or access the Platform if you do not accept the Terms or are unable to be bound by the Terms.
                </p>

                <p className="text-zinc-600 text-sm leading-relaxed">
                  This document is an electronic record in terms of Information Technology Act, 2000 and rules there under as applicable and the amended provisions pertaining to electronic records in various statutes as amended by the Information Technology Act, 2000. This electronic record is generated by a computer system and does not require any physical or digital signatures.
                </p>
              </div>

              {/* General Terms */}
              <div id="general" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  I. General Terms
                </h2>
                <h3 className="font-bold text-[#0F291B] text-sm">1. Application and Acceptance of the Terms</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Your use of the Platform and Shoption’s service(s), feature(s), functionality, software and product(s) (collectively the “Service(s)” hereinafter) is subject to the terms and conditions contained in this document as well as the Return & Undelivered Shipment Policy, Privacy Policy , Product Listing Policy , Infringement Policy , Anti-Counterfeiting Policy and any other rules and policies of the Platform that Shoption may publish from time to time. You must read Shoption’s, Privacy Policy and Credit Line Policy, which governs the collection, use, and disclosure of personal information about User(s). You accept the terms of the Privacy Policy and agree to the use of the personal information about you in accordance with the Privacy Policy.
                </p>

                <h3 className="font-bold text-[#0F291B] text-sm">2. Provision of Services</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  You must register on the Platform in order to access and use the Service(s). Further, Shoption reserves the right, without prior notice, to restrict access to or use of certain Service(s) (or any features within the Service(s)) subject to other conditions that Shoption may impose in its discretion.
                  In case you avail service(s) while accessing the Platform, that may be supported and/or provided by third party service provider(s), for all such services your contracting entity will be such third party service provider(s), as the case may be. Shoption disclaims all liability for any claims that may arise pursuant to your use of service(s) provided by such third party service provider(s).
                </p>

                <h3 className="font-bold text-[#0F291B] text-sm">3. User Eligibility</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  User(s) means any individual or business entity/organization that legally operates in India or in other countries, uses and has the right to use the services provided by Platform. Our services are available only to those individuals or companies who can form legally binding contracts under the applicable law i.e. Indian Contract Act, 1872. As a minor if you wish to purchase or sell an item on the Platform such purchase or sale may be made by Your legal guardian or parents who have registered as users of the Platform.
                </p>

                <h3 className="font-bold text-[#0F291B] text-sm">4. User Accounts and Verification</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  User must be registered on the Platform to access or avail the Services for its commercial purposes. Except with Shoption’s approval, one user may only register one account on the Platform. Shoption may cancel or terminate a user’s account if Shoption has reasons to suspect that the user has concurrently registered or controlled two or more accounts.
                </p>
              </div>

              {/* Buyer Terms */}
              <div id="buyer" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  II. Buyer Terms
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  The provisions of this section II shall be applicable only to Buyer(s). These Buyer Terms shall be read in conjunction with the General Terms and in the event of any conflict between the General Terms and Buyer Terms, the provisions of Buyer Terms shall supersede and prevail.
                </p>
                <h3 className="font-bold text-[#0F291B] text-sm">1. Buyer’s Responsibilities, Representations and Warranties</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  You represent, warrant and agree that you will use the Platform and Service(s) for business purposes only, and you will not use or access the Platform for your personal purposes. Any Product(s) that you purchase shall be for commercial purposes and not for personal consumption.
                </p>
                <h3 className="font-bold text-[#0F291B] text-sm">2. Payments by Buyers</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Upon placing the Order(s) on Platform, Buyer(s) will make full payment for the Product(s) purchased by using any of the modes of payment made available by us on the Platform, from time to time. Buyer(s) acknowledges that it is solely responsible for the transaction(s) / payment(s) made to the Seller(s) for the Product(s) purchased.
                </p>
              </div>

              {/* Seller Terms */}
              <div id="seller" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  III. Seller Terms
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  The provision of this Section III shall be applicable only to a Seller(s). These Seller Terms shall be read in conjunction with the General Terms and in the event of any conflict between the General Terms and Seller Terms, the terms of Seller Terms shall supersede and prevail.
                </p>
                <h3 className="font-bold text-[#0F291B] text-sm">1. Seller’s Obligations, Representations and Warranties</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  You represent, warrant and agree that you have full power and authority to offer your products for sale. You shall be solely responsible for obtaining all necessary licenses and permissions regarding any User Content that you submit, post or display, ensuring that it does not infringe or violate any third party rights.
                </p>
                <h3 className="font-bold text-[#0F291B] text-sm">2. Counterfeit & Product Authenticity</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  In the event the listing(s) of the seller(s) are found to be of counterfeit product(s), We may take all actions such as but not limited to suspending or terminating the account of the seller(s), removing listings, and withholding payments.
                </p>
              </div>

              {/* Limitation of Liability */}
              <div id="liability" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Limitation of Liability
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  To the maximum extent permitted by law, the Service(s) provided by Shoption on or through the Platform are provided "as is", "as available" and “with all faults”, and Shoption hereby expressly disclaims any and all warranties, express or implied, including but not limited to, any warranties of condition, quality, durability, performance, accuracy, reliability, merchantability or fitness for a particular purpose.
                </p>
              </div>

              {/* Force Majeure */}
              <div id="force-majeure" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Force Majeure
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Under no circumstances shall Shoption be held liable for any losses, delay or failure or disruption of the content or services delivered through the Platform resulting directly or indirectly from acts of nature, forces or causes beyond our reasonable control, including without limitation, internet failures, electrical power failures, strikes, labor disputes, governmental actions, curfews, lock-down, or order of courts.
                </p>
              </div>

              {/* Intellectual Property Rights */}
              <div id="intellectual-property" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Intellectual Property Rights
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption is the sole owner or lawful licensee of all the rights and interests in the Platform and the Platform Content. All title, ownership and intellectual property rights in the Platform and Platform Content shall remain with Shoption or licensors of the Platform Content. "Shoption" and related icons and logos are registered trademarks of Shoption Private Limited.
                </p>
              </div>

              {/* Notices */}
              <div id="notices" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Notices
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  All legal notices or demands to or upon Shoption shall be made in writing and sent to Shoption personally, by courier, certified mail, or facsimile to our Attn: Legal Department. The notices shall be effective when they are received by Shoption in any of the above-mentioned manner.
                </p>
              </div>

              {/* Miscellaneous Provisions */}
              <div id="miscellaneous" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  Miscellaneous Provisions
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Unless otherwise communicated to you by Shoption, the Terms constitute the entire agreement between User and Shoption and govern the User’s use of the Platform and any of the Service(s), superseding any prior written or oral agreements in relation to the use of the Platform.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
