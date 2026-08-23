"use client";

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const sections = [
  { id: 'intro', title: 'Introduction' },
  { id: 'collection', title: '1. Collection of Information' },
  { id: 'use-of-data', title: '2. Use of User Data' },
  { id: 'disclosure', title: '3. Disclosure of User Data' },
  { id: 'right-to-update', title: '4. Right to Update' },
  { id: 'cookies', title: '5. Cookies' },
  { id: 'minors', title: '6. Minors' },
  { id: 'security-measures', title: '7. Security Measures' },
  { id: 'grievance-officer', title: '8. Grievance Officer' }
];

export default function PrivacyPolicyPage() {
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
      rootMargin: '-20% 0px -60% 0px', // Highlights as section enters view
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
      const offset = 120; // offset for the sticky header
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
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
              <div id="intro" className="scroll-mt-32 flex flex-col gap-3">
                <span className="text-xs text-zinc-400 font-semibold">
                  This policy shall come into force with effect from 00:00 hours of 26th July 2019
                </span>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption recognizes the importance of privacy as well as the importance of maintaining the confidentiality of personal information. This Privacy Policy applies to all products and services provided by Shoption and sets out how Shoption may collect, use and disclose information in relation to Users of the Platform. If you link to other web sites, please review the privacy policies posted on their sites. Please read this privacy policy before using the platform or submitting any personal information. By using the platform, you are accepting the practices described in this Privacy Policy. Any changes to this Privacy Policy will be posted and restated on the Platform. Once posted on the Platform the new Privacy Policy will be effective immediately. Your continued use of the Platform shall be deemed to be your acceptance to the provisions of the Privacy Policy. Certain features of the Platform may be unavailable. You are encouraged to review the Privacy Policy whenever you visit the platform to make sure that you understand how any personal information you provide will be used. Shoption’s web site and its mobile application(s) (each a “Platform”) allows the user(s)s to avail all the services available on platform. User may use Shoption's services and products via a mobile device either through mobile applications or mobile optimized websites. This Privacy Policy also applies to such use of Shoption’s services and products. All capitalized terms not defined in this document shall have the meanings ascribed to them in the Terms Of Use of the Platform, which can be found here. Contracting entity shall be Shoption Private Limited (herein after referred to as ‘Shoption’ ‘Platform’ ‘we’ ‘us’ or ‘our’).
                </p>
              </div>

              {/* Collection of Information */}
              <div id="collection" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  1. Collection of Information
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption does not collect more information from User than is necessary for platform to provide user(s) with Platform’s services and to protect user(s) account. Information including, but not limited to, user(s) name, address(s), phone number(s), WhatsApp number(s), email address(s), gender, date and/or year of birth, contact book, browsing history, cookies, location and user(s) preferences ("Registration Information") may be collected at the time of user(s) registration and transaction(s) on the Platform. 
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  In connection with any communication or transaction and payment services or any other services that you may avail using the Platform, information, including but not limited to, bank account numbers, billing and delivery information, credit/debit card numbers and expiration dates and tracking information from Cheque or money orders ("Account Information") may be collected, among other things, to facilitate the sale and purchase as well as the settlement of services transacted on or through the Platform. 
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption record and retain details of User(s) activities on the Platform. Information relating to communication or transactions including, but not limited to, the types and specifications of the goods, pricing and delivery information, any dispute records and any information disclosed in any communication forum provided by us and/or other affiliated companies of Shoption (“Activities Information”) may be collected as and when the communication and / or transactions are conducted through the Platform. 
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption record and retain records of users’ browsing or buying activities on Platform including but not limited to IP addresses, browsing patterns and user behavioral patterns. In addition, we gather statistical information about the Platform and visitors to the Platform including, but not limited to, IP addresses, browser software, operating system, software and hardware attributes, pages viewed, number of sessions and unique visitors (together "Browsing Information"). 
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed font-medium">
                  Registration Information, Account Information, Activities Information, and Browsing Information are collectively referred to as User Data. It is mandatory for Users of the Platform to provide certain categories of User Data (as specified at the time of collection). In the event that Users do not provide any or sufficient User Data marked as mandatory, Shoption may not be able to complete the registration process or provide such Users with Shoption’s products or services.
                </p>
              </div>

              {/* Use of User Data */}
              <div id="use-of-data" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  2. Use of User Data
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  If you provide any User Data to Shoption, you are deemed to have authorized Shoption to collect, retain and use that user data for the following purposes:
                </p>
                <ul className="list-disc list-inside text-zinc-600 text-sm space-y-2.5 pl-2">
                  <li>Verification of User(s) identity</li>
                  <li>Processing user(s) registration as a user(s), providing user(s) with a log-in ID for the platform and maintaining and managing user(s) registration</li>
                  <li>Providing user(s) with customer service and responding to user(s) queries, feedback, claims or disputes</li>
                  <li>To facilitate communication between user(s) on the Platform and / or processing user(s) transaction(s) on the Platform</li>
                  <li>Performing research or statistical analysis in order to improve the content and layout of the Platform, to improve Shoption’s product offerings and services and for marketing and promotional purposes</li>
                  <li>Subject to applicable law, Shoption (including our affiliated companies and their designated service providers may use user(s) name, phone number(s), residential address(s), email address(s), fax number(s) and other data ("Marketing Data") to provide notices, surveys, product alerts, communications and other marketing materials to user(s) relating to products and services offered by GBRU or GBRU’s affiliated companies</li>
                  <li>If user(s) voluntarily submit any user(s) information or other information to the Platform for publication on the Platform through the publishing tools, then user(s) are deemed to have given consent to the publication of such information on the Platform</li>
                  <li>Making such disclosures as may be required for any of the above purposes or as required by law, regulations and guidelines or in respect of any investigations, claims or potential claims brought on or against us or against third parties.</li>
                </ul>
              </div>

              {/* Disclosure of User Data */}
              <div id="disclosure" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  3. Disclosure of User Data
                </h2>
                <ul className="list-decimal list-inside text-zinc-600 text-sm space-y-3.5 pl-2 leading-relaxed">
                  <li>
                    User(s) further agrees that when necessary Shoption may disclose and transfer User Data to Shoption’s affiliated companies and designated third party service providers (including but not limited to data entry, database management, promotions, products and services alerts, delivery services, payment extension services, authentication and verification services and logistics services) ("Service Providers"). These Service Providers are under a duty of confidentiality to Shoption and are only permitted to use User Data in connection with the purposes specified in clause 2 herein above.
                  </li>
                  <li>
                    When necessary Shoption may also disclose and transfer User Data to our professional advisers, law enforcement agencies, insurers, government and regulatory and other organizations.
                  </li>
                  <li>
                    All voluntary information uploaded by you on the Platform (including without limitation information about your products, images, remarks, feedbacks etc.) may be made publicly available on the Platform and therefore accessible by any internet user(s). Any voluntary information that user(s) disclose to Shoption becomes public information and user(s) relinquishes any proprietary rights (including but not limited to the rights of confidentiality and copyright) in such information. User(s) should exercise caution when deciding to include personal or proprietary information in the voluntary information that user(s) submits to Shoption or uploads on the Platform.
                  </li>
                  <li>
                    Shoption may share User Data with third parties, including without limitation, banks, financial institutions, credit agencies, or vendors to enable such third parties to offer their products or services to such Users. While Shoption shall endeavor to have in place internal procedures to keep user(s) data secure from intruders, there is no guarantee that such measures/procedures can eliminate all of the risks of theft, loss or misuse.
                  </li>
                  <li>
                    Shoption may establish relationships with other parties and websites to offer user(s) the benefit of products and services which Shoption does not offer. Shoption may offer you access to these other parties and/or their websites. This Privacy Policy does not apply to the products and services enabled or facilitated by such third parties. The Privacy Policies of those other parties may differ from Shoption, and Shoption has no control over the information that user(s) may submit to those third parties. User(s) should read the relevant Privacy Policy for those Service Providers before responding to and availing any offers, products or services advertised or provided by those Service Providers.
                  </li>
                  <li>
                    Shoption may Collect Data in form of files for maintaining user profile and for profile verification purpose and in shoption app we also have complaint section in that section users uploads supporting files as reference.
                  </li>
                </ul>
              </div>

              {/* Right to update User Data */}
              <div id="right-to-update" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  4. Right to update User Data
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Under the applicable laws, user(s) have the right of access to personal information held by Shoption and to request updating / correcting the information.
                </p>
              </div>

              {/* Cookies */}
              <div id="cookies" className="scroll-mt-32 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  5. Cookies
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption uses "cookies" to store specific information about User(s) and track User(s) visits to the Sites. A "cookie" is a small amount of data that is sent to User’s browser and stored on User’s device. If User(s) does not deactivate or erase the cookie, each time User(s) uses the same device to access the Platform, our services will be notified of User visit to the Platform and in turn Shoption may have knowledge of User(s) visit and the pattern of User’s usage.
                </p>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Generally, Shoption use cookies to identify User(s) and enable Shoption to:
                </p>
                <ul className="list-disc list-inside text-zinc-600 text-sm space-y-2.5 pl-2">
                  <li>Access User’s Registration Information or Account Information so user(s) do not have to re-enter it</li>
                  <li>Gather statistical information about usage by user(s)</li>
                  <li>Research visiting patterns and help target advertisements based on user(s) interests</li>
                  <li>Track progress and participation on the Platform</li>
                </ul>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  User(s) can determine if and how a cookie will be accepted by configuring the browser which is installed in User’s device. If User(s) choose, User(s) can change those configurations. If User(s) reject all Cookies by choosing the cookie-disabling function, User(s) may be required to re-enter information on the Platform more often and certain features of the Platform may be unavailable.
                </p>
              </div>

              {/* Minors */}
              <div id="minors" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  6. Minors
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  The Platform and its contents are not targeted to minors (those under the age of 18). However, Shoption have no way of distinguishing the age of individuals who access our Platform. If a minor has provided Shoption with personal information without parental or guardian consent, the parent or guardian should contact Shoption’s Legal Department to remove the information.
                </p>
              </div>

              {/* Security Measures */}
              <div id="security-measures" className="scroll-mt-32 flex flex-col gap-3">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/25 pb-2">
                  7. Security Measures
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Shoption employs commercially reasonable security methods to prevent unauthorized access to the Platform, to maintain data accuracy and to ensure the correct use of the information Shoption hold. No data transmission over the internet or any wireless network can be guaranteed to be perfectly secure. As a result, while Shoption tries to protect the information Shoption holds, Shoption cannot guarantee the security of any information the User(s) transmits to Shoption and User(s) do so at their own risk.
                </p>
              </div>

              {/* Grievance Officer */}
              <div id="grievance-officer" className="scroll-mt-32 flex flex-col gap-4 bg-[#F8F9FA] p-6 rounded-2xl border border-zinc-200/50">
                <h2 className="text-xl font-bold text-[#0F291B] border-b border-[#0D9740]/20 pb-2">
                  8. Grievance Officer
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  In accordance with Information Technology Act 2000 and rules made there under, the name and contact details of the Grievance Officer are provided below:
                </p>
                <div className="text-zinc-600 text-sm flex flex-col gap-2 mt-2">
                  <p><strong className="text-[#0F291B]">Name:</strong> Mr. Omkar Kale</p>
                  <p><strong className="text-[#0F291B]">Address:</strong> Shoption, 5th floor, C- Building, Vatika, Panchshil Tech Park-1, Shasrinagar, Yerwada, Pune – 411006</p>
                  <p><strong className="text-[#0F291B]">Phone:</strong> +91-9114151617</p>
                  <p><strong className="text-[#0F291B]">Email:</strong> <a href="mailto:grievance-officer@shoption.in" className="text-[#0D9740] hover:underline">grievance-officer@shoption.in</a></p>
                  <p><strong className="text-[#0F291B]">Availability:</strong> Mon - Sat (10:00 AM - 07:00 PM)</p>
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
