'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContext';

const OtpContent = () => {
  const { showToast } = useToast();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Registration States
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);
  const [registrationName, setRegistrationName] = useState('');
  const [registering, setRegistering] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const mobileNo = searchParams.get('mobile_no');
  const txnId = searchParams.get('txn_id');
  const desktopRefs = useRef<(HTMLInputElement | null)[]>([]);
  const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!mobileNo) {
      router.replace('/signup');
    }
  }, [mobileNo, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index: number, value: string, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    if (cleaned.length > 1) {
      if (cleaned.length >= 6) {
        // Paste or autofill of the full OTP
        const newOtp = [...otp];
        const pasteVal = cleaned.slice(0, 6);
        for (let i = 0; i < 6; i++) {
          newOtp[i] = pasteVal[i];
        }
        setOtp(newOtp);
        refs.current[5]?.focus();
        return;
      } else {
        // Overwrite existing cell value
        const newestChar = cleaned.slice(-1);
        const newOtp = [...otp];
        newOtp[index] = newestChar;
        setOtp(newOtp);
        if (index < 5) {
          refs.current[index + 1]?.focus();
        }
        return;
      }
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    if (index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
        if (index > 0) {
          refs.current[index - 1]?.focus();
        }
      } else if (index > 0) {
        newOtp[index - 1] = '';
        setOtp(newOtp);
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handlePendingCart = async (userObj: any) => {
    const pendingItemStr = localStorage.getItem("gbru_pending_cart_item");
    if (!pendingItemStr) {
      if (userObj?.brand_ambassador && userObj.brand_ambassador.trim() !== "") {
        router.push('/ambassador_dashboard');
      } else if (userObj?.role?.toLowerCase() === 'farmer') {
        router.push('/dashboard');
      } else if (userObj?.role?.toLowerCase() === 'dealer') {
        router.push('/dealer_profile');
      } else {
        router.push('/profile');
      }
      return;
    }

    try {
      const pendingItem = JSON.parse(pendingItemStr);
      const mobile_no = userObj.customer_id?.split('-')[1] || userObj.user_id || userObj.mobile_no || mobileNo;
      if (!mobile_no) {
        localStorage.removeItem("gbru_pending_cart_item");
        router.push('/cart');
        return;
      }

      // Add to cart
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          items: [pendingItem]
        })
      });

      const resJson = await res.json();
      if (resJson.message?.status) {
        setToastType("success");
        setToastMessage(`${pendingItem.item_name || "Product"} added to cart successfully!`);
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (e) {

    } finally {
      localStorage.removeItem("gbru_pending_cart_item");
      router.push('/cart');
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6 || !mobileNo) {
      setToastType("error");
      setToastMessage('Please enter a valid 6-digit OTP.');
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile_no: mobileNo, otp: otpValue }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.isNewUser) {
          setShowRegistrationPopup(true);
        } else if (data.user?.role?.toLowerCase() === 'dealer') {
          // Do not save user session for dealers, redirect directly
          router.replace('/dealer_profile');
        } else {
          // Save user details securely in localStorage for farmers/others
          const userToSave = { ...data.user, mobile_no: mobileNo };
          localStorage.setItem('gbru_user', JSON.stringify(userToSave));
          localStorage.setItem('mobile_no', mobileNo);
          localStorage.removeItem("gbru_applied_coupon");
          localStorage.removeItem("gbru_applied_ambassador");

          // Run pending cart action
          await handlePendingCart(userToSave);
        }
      } else {
        setToastType("error");
        setToastMessage(data.message || data.error || 'Invalid OTP. Please try again.');
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (error) {

      setToastType("error");
      setToastMessage('An error occurred during verification. Please try again.');
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleShortRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationName.trim()) {
      setToastType("error");
      setToastMessage("Please enter your name");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch('/api/lead-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNo, name: registrationName.trim() }),
      });
      const data = await response.json();

      if (data?.message?.status && data.message.lead) {
        const basicUser = {
          Customer_name: registrationName.trim(),
          mobile_no: mobileNo,
          role: "Farmer",
          status: "ACTIVE",
          is_completed: false,
          lead_id: data.message.lead
        };

        // Fetch full user details (to obtain generated api_key / api_secret from ERP)
        let finalUserObj: any = basicUser;
        try {
          const detailsRes = await fetch('/api/user-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_no: mobileNo || '' })
          });
          if (detailsRes.ok) {
            const detailsData = await detailsRes.json();
            if (detailsData?.message?.status && detailsData?.message?.data) {
              finalUserObj = { ...basicUser, ...detailsData.message.data };
            }
          }
        } catch (_) { }

        localStorage.setItem('gbru_user', JSON.stringify(finalUserObj));
        localStorage.setItem('mobile_no', mobileNo || '');
        setShowRegistrationPopup(false);

        // Run pending cart action
        await handlePendingCart(finalUserObj);
      } else {
        setToastType("error");
        setToastMessage(data?.message?.message || data?.error || "Failed to create lead. Please try again.");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      setToastType("error");
      setToastMessage("An error occurred during registration. Please try again.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setRegistering(false);
    }
  };

  const handleResendOtp = async () => {
    if (!mobileNo) return;
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no: mobileNo }),
      });
      const data = await response.json();
      if (data.message?.status || data.success) { // checking both depending on route return structure
        setToastType("success");
        setToastMessage(`OTP sent successfully check ${mobileNo}`);
        setTimeLeft(24); // Reset countdown
        setTimeout(() => setToastMessage(''), 2500); // Clear toast message
      } else {
        setToastType("error");
        setToastMessage(data.message?.message || data.error || 'Failed to resend OTP.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (error) {

      setToastType("error");
      setToastMessage('An error occurred. Please try again.');
      setTimeout(() => setToastMessage(''), 3000);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600&family=Manrope:wght@600&family=Roboto:wght@400;500;600&display=swap');
        
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
              Verify Your Number
            </h2>

            <p
              className="text-[#666666] mb-1"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                lineHeight: '21px'
              }}
            >
              Enter the 6-digit code sent to <span className="font-semibold text-black">{mobileNo ? `+91 ${mobileNo}` : '+91 98765 43210'}</span>
            </p>

            <button
              onClick={() => router.back()}
              className="text-[#006B21] hover:underline mb-6 w-fit block font-semibold text-sm"
              style={{
                fontFamily: 'Roboto, sans-serif'
              }}
            >
              Edit Number
            </button>

            <form className="flex flex-col">
              {/* OTP Input Fields */}
              <div className="flex mb-6 w-full justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { desktopRefs.current[index] = el; }}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value, desktopRefs)}
                    onKeyDown={(e) => handleKeyDown(index, e, desktopRefs)}
                    className="flex-1 max-w-[44px] h-12 sm:max-w-[48px] sm:h-14 md:w-[54px] md:h-[60px] text-center text-xl font-semibold border rounded-lg outline-none transition-all focus:border-[#006B21] focus:ring-1 focus:ring-[#006B21] text-[#1A1A1A]"
                    style={{
                      borderColor: digit ? '#006B21' : '#E5E5E5',
                      backgroundColor: '#F9F9F9',
                      borderWidth: digit ? '2px' : '1px'
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={loading}
                className={`w-full text-white rounded-lg shadow-[0_4px_12px_rgba(0,107,33,0.25)] transition-opacity hover:opacity-90 flex items-center justify-center mb-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{
                  height: '56px',
                  background: '#006B21',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 600,
                  fontSize: '20px',
                  lineHeight: '24px'
                }}
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="text-center w-full mb-4">
                <p
                  className="text-[#6B7280]"
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '15px',
                    lineHeight: '21px'
                  }}
                >
                  OTP valid for 10 min
                </p>
              </div>

              <div className="text-center w-full">
                <p
                  className="text-[#6B7280]"
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontWeight: 400,
                    fontSize: '15px'
                  }}
                >
                  Didn't receive the code?{' '}
                  {timeLeft > 0 ? (
                    <span className="text-[#9CA3AF]">
                      Resend OTP in 00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-[#006B21] font-medium hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-[#D9D9D9] flex justify-center items-center w-full">
              <Link
                href="/help-centre"
                className="flex items-center gap-2 text-[#4A4A4A] hover:text-[#006B21] transition-colors"
                style={{ fontSize: '15px', fontFamily: 'Roboto, sans-serif', fontWeight: 500 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </Link>
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
          href="/login"
          className="absolute top-6 left-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-50 text-white"
          title="Back to Login"
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
            Verify Your Number
          </h2>
          <p
            className="text-white/95 text-[12px] leading-relaxed mb-1 font-normal"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Enter the 6-digit code sent to <span className="font-semibold text-white">{mobileNo ? `+91 ${mobileNo}` : '+91 98765 43210'}</span>
          </p>

          <button
            onClick={() => router.back()}
            className="text-white hover:underline mb-6 w-fit block font-semibold text-xs opacity-90"
            style={{ fontFamily: 'Roboto, sans-serif' }}
          >
            Edit Number
          </button>

          <form className="flex flex-col space-y-4">
            {/* OTP Inputs */}
            <div className="flex gap-2 mb-4 w-full justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { mobileRefs.current[index] = el; }}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value, mobileRefs)}
                  onKeyDown={(e) => handleKeyDown(index, e, mobileRefs)}
                  className="w-[42px] h-[48px] text-center text-lg font-semibold border rounded-[10px] outline-none transition-all text-zinc-800"
                  style={{
                    borderColor: digit ? '#006B21' : '#E5E5E5',
                    backgroundColor: '#F9F9F9',
                    borderWidth: digit ? '2px' : '1px'
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className={`w-full text-white rounded-[14px] transition-all active:scale-[0.98] font-bold text-base flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              style={{
                height: '48px',
                background: '#006B21',
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div className="flex items-center justify-between w-full pt-1 text-[11px] text-white/90">
              <span>OTP valid for 10 min</span>

              {timeLeft > 0 ? (
                <span>Resend in 00:{timeLeft.toString().padStart(2, '0')}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="font-bold underline hover:text-white"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>

          {/* Bottom Divider */}
          <div className="w-full border-t border-white/20 mt-8 pt-6 flex flex-col items-center">
            <Link
              href="/help-centre"
              className="text-white/90 hover:text-white transition-colors text-xs font-semibold"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>

      {/* Short Registration Popup */}
      {showRegistrationPopup && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2E6F18] to-[#4F8D14] p-6 relative">
              <button
                onClick={() => router.push('/dashboard')}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Join GBRU Today
              </h3>
              <p className="text-white/90 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Interested in a short registration? Get started in seconds!
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={handleShortRegistration} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-[#1A1A1A]" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={registrationName}
                    onChange={(e) => setRegistrationName(e.target.value)}
                    className="h-12 px-4 border border-zinc-200 rounded-xl text-[15px] text-[#1A1A1A] focus:outline-none focus:border-[#0D9740] focus:ring-1 focus:ring-[#0D9740] transition-all bg-[#F9F9F9]"
                  />
                </div>


                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="px-6 py-2.5 border border-zinc-200 text-zinc-600 font-bold text-sm rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registering}
                    className={`px-8 py-2.5 bg-[#006B21] text-white font-bold text-sm rounded-xl hover:bg-[#005a1b] transition-colors shadow-[0_4px_12px_rgba(0,107,33,0.25)] flex items-center justify-center ${registering ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {registering ? 'Processing...' : 'Proceed'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Otp = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OtpContent />
    </Suspense>
  );
};

export default Otp;
