"use client";

import React, { useState } from 'react';

const sections = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'orders-tracking', title: 'Orders & Tracking' },
  { id: 'payments', title: 'Payments' },
  { id: 'returns-refunds', title: 'Returns & Refunds' },
  { id: 'my-account', title: 'My Account' },
  { id: 'contact-us', title: 'Contact Us' }
];

export default function HelpCentre() {
  const [activeSection, setActiveSection] = useState('getting-started');

  React.useEffect(() => {
    const checkHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash === '#contact-us') {
          setActiveSection('contact-us');
        }
      }
    };

    checkHash();

    // Fallback checks for Next.js router transitions
    const timer1 = setTimeout(checkHash, 100);
    const timer2 = setTimeout(checkHash, 300);
    const timer3 = setTimeout(checkHash, 600);

    window.addEventListener('hashchange', checkHash);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto pb-20">
      <div className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 flex flex-col gap-6">
        {/* Title */}
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-[36px] font-extrabold text-[#0D9740] tracking-tight">
            Help Centre
          </h1>
          <p className="text-[#6B7280] text-sm">
            Find answers to common questions about orders, payments, returns, and your account.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white border border-zinc-200/80 rounded-[24px] shadow-sm p-5 sticky top-6">
              <h3 className="text-[10px] font-bold text-zinc-400 tracking-wider mb-4 px-1 uppercase">CONTENTS</h3>
              <div className="flex flex-col gap-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center relative ${activeSection === section.id
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

              <div className="mt-8 pt-6 border-t border-zinc-150 flex flex-col items-center text-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Talk to Shoption NOVA</span>
                <a
                  href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shadow-md transition-all active:scale-[0.95] mt-1 border border-zinc-200"
                >
                  <img
                    src="/assets/nova.jpeg"
                    alt="Shoption Nova"
                    className="w-full h-full object-cover"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm p-8 min-h-[500px]">
            {/* Getting Started */}
            {activeSection === 'getting-started' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">Getting Started</h2>
                </div>
                <hr className="border-zinc-100 mb-6" />
                <p className="text-sm text-zinc-600 mb-8">
                  New to Shoption? Here's everything you need to know to get started on India's largest irrigation and machinery B2B platform.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-zinc-200 rounded-xl p-5 hover:border-[#0D9740] transition-colors">
                    <h3 className="font-bold text-[#0F291B] mb-2 text-sm">Create an Account</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Register with your mobile number to access pricing, place orders, and manage your account.</p>
                  </div>
                  <div className="border border-zinc-200 rounded-xl p-5 hover:border-[#0D9740] transition-colors">
                    <h3 className="font-bold text-[#0F291B] mb-2 text-sm">Browse Products</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Explore categories like cables, pumps, pipes, and more. Use filters to find exactly what you need.</p>
                  </div>
                  <div className="border border-zinc-200 rounded-xl p-5 hover:border-[#0D9740] transition-colors">
                    <h3 className="font-bold text-[#0F291B] mb-2 text-sm">Add to Cart</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Select products and add them to your cart. Login is required to view prices and place orders.</p>
                  </div>
                  <div className="border border-zinc-200 rounded-xl p-5 hover:border-[#0D9740] transition-colors">
                    <h3 className="font-bold text-[#0F291B] mb-2 text-sm">Place an Order</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">Proceed to checkout, enter your delivery address, and complete payment to place your order.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Orders & Tracking */}
            {activeSection === 'orders-tracking' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">Orders & Tracking</h2>
                </div>
                <hr className="border-zinc-100 mb-8" />
                <div className="flex flex-col gap-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">01</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">How do I place an order?</strong> Add items to your cart, go to checkout, fill in your shipping details, and complete the payment. You'll receive a confirmation once the order is placed.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">02</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">How do I track my order?</strong> Go to My Account <span className="mx-1 text-zinc-300">→</span> Orders to view the status and tracking details of all your orders.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">03</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">Can I cancel an order?</strong> Orders can be cancelled before they are dispatched. Contact our support team immediately at +91 9114151617.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">04</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">What if my order is delayed?</strong> Delivery timelines may vary based on location. If your order is significantly delayed, please reach out to us via email or phone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payments */}
            {activeSection === 'payments' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">Payments</h2>
                </div>
                <hr className="border-zinc-100 mb-6" />
                <p className="text-sm text-zinc-600 mb-6">
                  Shoption supports multiple secure payment methods for your convenience.
                </p>
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-zinc-600">UPI (Google Pay, PhonePe, Paytm, etc.)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-zinc-600">Net Banking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-zinc-600">Credit & Debit Cards (Visa, Mastercard, RuPay)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-zinc-600">EMI options on select orders</span>
                  </div>
                </div>

                <div className="bg-[#EBF5EE] border border-[#0D9740]/20 rounded-xl p-4 flex gap-3 text-sm text-[#0D9740]">
                  <div className="shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                  </div>
                  <p className="text-[#1A4D2E] text-xs leading-relaxed">
                    All transactions on Shoption are secured with SSL encryption. We never store your card details.
                  </p>
                </div>
              </div>
            )}

            {/* Returns & Refunds */}
            {activeSection === 'returns-refunds' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">Returns & Refunds</h2>
                </div>
                <hr className="border-zinc-100 mb-8" />
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">01</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">Return Policy:</strong> Items can be returned within 7 days of delivery if they are damaged, defective, or incorrect. Items must be unused and in original packaging.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">02</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">How to initiate a return?</strong> Contact our support team at contact@Shoption.in with your order ID and reason for return. Our team will guide you through the process.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-[#1A4D2E] text-white flex items-center justify-center font-bold text-xs shrink-0">03</div>
                    <p className="text-sm text-zinc-600 leading-relaxed mt-1">
                      <strong className="text-[#0F291B] font-bold">Refund Timeline:</strong> Once the return is received and verified, refunds are processed within 5 7 business days to your original payment method.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700">
                  <div className="shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Returns are not accepted for items damaged due to misuse or items not in original condition.
                  </p>
                </div>
              </div>
            )}

            {/* My Account */}
            {activeSection === 'my-account' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">My Account</h2>
                </div>
                <hr className="border-zinc-100 mb-6" />
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <strong className="text-[#0F291B] font-bold">Login:</strong> Use your registered mobile number to log in via OTP.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <strong className="text-[#0F291B] font-bold">Order History:</strong> View all past and current orders under My Account <span className="mx-1 text-zinc-300">→</span> Orders.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <strong className="text-[#0F291B] font-bold">Saved Addresses:</strong> Add and manage multiple delivery addresses from your account.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <strong className="text-[#0F291B] font-bold">Profile Update:</strong> Update your name, business details, and contact information anytime.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 mt-0.5 rounded-full bg-[#0F291B] text-white flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      <strong className="text-[#0F291B] font-bold">Logout:</strong> You can securely log out from the account section at any time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Us */}
            {activeSection === 'contact-us' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-[#0D9740]">Contact Us</h2>
                </div>
                <hr className="border-zinc-100 mb-8" />
                <p className="text-sm text-zinc-600 mb-6">
                  Still need help? Our support team is available to assist you.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="border border-zinc-200 p-5 rounded-xl flex items-center gap-4 hover:border-[#0D9740] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F291B]">Phone Support</h4>
                      <p className="text-xs text-zinc-500 mt-1">+91 9226514174</p>
                    </div>
                  </div>
                  <div className="border border-zinc-200 p-5 rounded-xl flex items-center gap-4 hover:border-[#0D9740] transition-colors">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F291B]">Email Us</h4>
                      <p className="text-xs text-zinc-500 mt-1">contact@Shoption.in</p>
                    </div>
                  </div>

                  <a href="/support-help" className="mt-4 w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-1.5 duration-300">
                    Raise a Support Ticket Online →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
