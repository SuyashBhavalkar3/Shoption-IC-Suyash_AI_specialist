'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Login = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  const handleGetOtp = async () => {
    if (mobileNumber.length !== 10) {
      setToastType("error");
      setToastMessage('Please enter a valid 10-digit mobile number.');
      setTimeout(() => setToastMessage(""), 2500);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_no: mobileNumber }),
      });
      
      const data = await response.json();
      
      if (data.message?.status) {
        // Redirect to OTP page immediately
        router.push(`/otp?mobile_no=${mobileNumber}&txn_id=${data.message.txn_id}`);
      } else {
        setToastType("error");
        setToastMessage(data.message?.message || data.error || 'Failed to send OTP. Please try again.');
        setTimeout(() => setToastMessage(""), 2500);
      }
    } catch (error) {
      
      setToastType("error");
      setToastMessage('An error occurred. Please try again.');
      setTimeout(() => setToastMessage(""), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600&family=Manrope:wght@600&family=Roboto:wght@400;600&display=swap');
        
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .toast-animate {
          animation: fadeOut 2.5s forwards;
        }
      `}} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] ${toastType === "error" ? "bg-red-600" : "bg-[#006B21]"} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 toast-animate`}
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toastType === "error" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP VIEW LAYOUT (Unchanged) */}
      {/* ========================================================================= */}
      <div 
        className="hidden md:flex min-h-screen items-center justify-center p-4 bg-cover bg-center relative"
        style={{ backgroundImage: "url('/assets/caroussel-2.jpg')" }}
      >
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 md:top-10 md:left-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-50 text-gray-800 hover:text-[#006B21]"
          title="Back to Home"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-xl shadow-2xl overflow-hidden h-[650px]">
          {/* Left Side (Green Gradient) */}
          <div className="w-[45%] relative p-10 flex flex-col bg-gradient-to-b from-[#2E6F18] via-[#4F8D14] to-[#C99C15] overflow-hidden">
            {/* Logo */}
            <div className="mb-10 relative z-10">
              <Image 
                src="/assets/gbru_header_logo.png" 
                alt="GBRU Logo" 
                width={120} 
                height={50} 
                className="object-contain"
              />
            </div>

            {/* Welcome Text */}
            <h1 
              className="text-white mb-8 relative z-10"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '30px',
                letterSpacing: '0px'
              }}
            >
              Welcome to GBRU - Your<br />Partner in Smarter Farming.
            </h1>

            {/* Feature List */}
            <ul className="space-y-4 mb-10 relative z-10">
              {[
                { text: '10k+ Farmers Trust Us', icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
                { text: 'Secure Payments', icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
                { text: '24/7 Technical Support', icon: <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-white">
                  {item.icon}
                  <span 
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '12px',
                      letterSpacing: '0.6px'
                    }}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Farmer Image */}
            <div className="mt-auto relative z-10 flex-1 flex items-end justify-center rounded-xl overflow-hidden">
              <Image 
                src="/assets/farmer.png" 
                alt="Farmer" 
                width={300} 
                height={250} 
                className="object-cover rounded-xl shadow-lg border border-white/20 w-full h-auto max-h-[260px]"
              />
            </div>
            
            {/* Subtle glow overlay for styling */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent z-0"></div>
          </div>

          {/* Right Side (Form) */}
          <div className="w-[55%] px-16 py-12 flex flex-col justify-center bg-white h-full">
            <h2 
              className="text-[#1A1A1A] mb-3"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 600,
                fontSize: '24px',
                lineHeight: '33.6px'
              }}
            >
              Login to your account
            </h2>
            
            <p 
              className="text-[#666666] mb-10"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px'
              }}
            >
              Access your dashboard, machinery status, and irrigation tools.
            </p>

            <form className="flex flex-col space-y-6">
              <div className="flex flex-col space-y-2">
                <label 
                  className="text-[#666666] uppercase"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 600,
                    fontSize: '10px',
                    letterSpacing: '0.5px'
                  }}
                >
                  MOBILE NUMBER
                </label>
                
                <div className="flex items-center border border-[#E5E5E5] rounded-lg overflow-hidden h-12 focus-within:border-[#006B21] transition-colors">
                  <div className="flex items-center justify-center px-4 bg-[#F9F9F9] border-r border-[#E5E5E5] h-full">
                    <span className="text-[#333333] font-medium text-sm">+91</span>
                    <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <input 
                    type="tel" 
                    placeholder="Enter 10 digit number" 
                    className="flex-1 px-4 py-2 outline-none text-sm text-[#333333] placeholder-gray-400"
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGetOtp}
                disabled={loading}
                className={`w-full text-white rounded-lg shadow-[0_4px_12px_rgba(0,107,33,0.25)] transition-opacity hover:opacity-90 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{
                  height: '56px',
                  background: '#006B21',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: '24px'
                }}
              >
                {loading ? 'Sending OTP...' : 'Get OTP'}
              </button>

              <div className="text-center w-full pt-1">
                <p 
                  className="text-[#4A4A4A]"
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px'
                  }}
                >
                  We'll send a 6-digit code to verify your number.
                </p>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-[#D9D9D9] w-full flex flex-col space-y-4">
              <Link 
                href="/help-centre" 
                className="text-[#4A4A4A] text-left hover:text-[#006B21] transition-colors" 
                style={{ fontSize: '15px', fontFamily: 'Roboto, sans-serif', fontWeight: 400 }}
              >
                Help Center
              </Link>
              <div className="flex justify-center w-full">
                <Link 
                  href="/privacy-policy" 
                  className="text-[#6B7280] hover:text-[#006B21] transition-colors border-b border-[#6B7280] hover:border-[#006B21]" 
                  style={{ fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: 500, paddingBottom: '1px' }}
                >
                  Privacy Policy & Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW LAYOUT (Figma Redesign) */}
      {/* ========================================================================= */}
      <div 
        className="md:hidden min-h-screen flex flex-col items-center px-6 pt-3 pb-8 relative overflow-y-auto"
        style={{ background: 'linear-gradient(135deg, #006B21 0%, #EAB308 100%)' }}
      >
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-50 text-white"
          title="Back to Home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        {/* Top Header Logo */}
        <div className="mt-2 mb-6 flex justify-center w-full">
          <div className="relative w-[160px] h-[68px]">
            <Image 
              src="/assets/gbru_header_logo.png" 
              alt="GBRU Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Farmer Image Card */}
        <div 
          className="relative rounded-[32px] overflow-hidden shadow-2xl border border-white/10 mt-0 mb-6 bg-black/10 flex-shrink-0"
          style={{
            width: "262px",
            height: "237px",
            maxWidth: "320px",
          }}
        >
          <Image 
            src="/assets/farmer.png" 
            alt="GBRU Farmer" 
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-[340px] flex flex-col text-left">
          <h2 
            className="text-white mb-2 font-bold text-[24px]"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Login to your account
          </h2>
          <p 
            className="text-white/95 text-[12px] leading-relaxed mb-6 font-normal"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Access your dashboard, machinery status, and irrigation tools.
          </p>

          <form className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label 
                className="text-white/90 text-[10px] font-bold tracking-wider"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                MOBILE NUMBER
              </label>
              
              <div className="flex items-center bg-[#F9F9F9] rounded-[14px] overflow-hidden h-[52px] border border-white/20 shadow-inner">
                <div className="flex items-center justify-center px-4 border-r border-[#E5E5E5] h-full text-zinc-800">
                  <span className="font-semibold text-sm">+91</span>
                  <svg className="w-3.5 h-3.5 ml-1.5 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <input 
                  type="tel" 
                  placeholder="Enter 10 digit number" 
                  className="flex-1 px-4 py-2 outline-none text-sm bg-transparent text-zinc-800 placeholder-zinc-400 font-medium"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGetOtp}
              disabled={loading}
              className={`w-full text-white rounded-[14px] transition-all active:scale-[0.98] font-bold text-base flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={{
                height: '48px',
                background: '#006B21',
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              {loading ? 'Sending OTP...' : 'Get OTP'}
            </button>

            <div className="text-center w-full pt-1">
              <p 
                className="text-white/80 text-[11px]"
                style={{ fontFamily: 'Roboto, sans-serif' }}
              >
                We'll send a 6-digit code to verify your number.
              </p>
            </div>
          </form>

          {/* Bottom Divider */}
          <div className="w-full border-t border-white/20 mt-8 pt-6 flex flex-col items-center space-y-3">
            <Link 
              href="/help-centre" 
              className="text-white/90 hover:text-white transition-colors text-xs font-semibold" 
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Help Center
            </Link>
            <Link 
              href="/privacy-policy" 
              className="text-white/85 hover:text-white transition-colors text-[11px] font-medium" 
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Privacy Policy & Terms
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
