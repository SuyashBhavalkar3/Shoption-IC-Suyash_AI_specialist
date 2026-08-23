"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useShoptionSetting } from "@/hooks/useShoptionSetting";

interface UserDetails {
  Customer_name: string;
  address: string;
  status: string;
  role: string;
  brand_ambassador?: string;
  profile_image?: string;
}

interface ProfilePopProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export default function ProfilePop({ isOpen, onClose, onLogout }: ProfilePopProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Sync profile details from localStorage/API
  const loadProfile = () => {
    const stored = localStorage.getItem("gbru_user");
    let mobile_no = "";
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        mobile_no = parsed.customer_id?.split('-')[1] || parsed.user_id || parsed.mobile_no || parsed.mobile;

        // Set local fallback immediately so the UI is responsive and never blank/error
        const fallbackName = parsed.customer_name || parsed.Customer_name || parsed.first_name || parsed.full_name || "Guest";
        setUser({
          Customer_name: fallbackName,
          address: parsed.address || "Address not set",
          role: parsed.role || "Farmer",
          status: parsed.status || "ACTIVE",
          brand_ambassador: parsed.brand_ambassador || parsed.brand_ambassador_name || "",
          profile_image: parsed.profile_image || ""
        });
      } catch (e) { }
    }
    return mobile_no;
  };

  useEffect(() => {
    if (!isOpen) {
      setHasFetched(false);
      return;
    }

    if (isOpen && !hasFetched) {
      const mobile_no = loadProfile();

      if (mobile_no) {
        setLoading(true);
        setHasFetched(true);
        fetch('/api/user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile_no })
        })
          .then(res => res.json())
          .then(data => {
            if (data?.message?.status && data?.message?.data) {
              setUser(data.message.data);
              // Cache profile image back to localStorage
              const stored = localStorage.getItem("gbru_user");
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  parsed.profile_image = data.message.data.profile_image;
                  localStorage.setItem("gbru_user", JSON.stringify(parsed));
                } catch (_) { }
              }
            }
            setLoading(false);
          })
          .catch(err => {
            setLoading(false);
          });
      }
    }
  }, [isOpen, hasFetched]);

  // Listen to live profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  if (!isOpen) return null;

  // Extract initials from Customer_name (e.g. "Soham Pawar" -> "SP")
  const getInitials = (name: string) => {
    if (!name) return "NA";
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = user ? getInitials(user.Customer_name) : "NA";
  const isVerified = user?.status === "ACTIVE";

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[999] transition-opacity"
        onClick={onClose}
      />

      {/* Slider Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[340px] bg-white z-[1000] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} rounded-l-3xl overflow-hidden`}
        style={{ fontFamily: 'Manrope, sans-serif' }}
      >
        {/* Header Section (Dark Green) */}
        <div className="bg-[#194028] pt-12 pb-8 flex flex-col items-center justify-center relative">

          {/* Close Button */}
          <button onClick={onClose} className="absolute top-6 left-6 text-white/70 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          {loading ? (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-[84px] h-[84px] rounded-full bg-white/20 mb-4" />
              <div className="w-32 h-6 bg-white/20 rounded mb-2" />
              <div className="w-24 h-4 bg-white/20 rounded" />
            </div>
          ) : user ? (
            <>
              {/* Avatar with Initials or Image */}
              <div className="relative mb-4">
                <div className="w-[88px] h-[88px] rounded-full bg-[#112d1b] border-4 border-white flex items-center justify-center text-white text-3xl font-bold uppercase shadow-sm overflow-hidden">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {/* Checkmark Badge */}
                {isVerified && (
                  <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#20C063] rounded-full border-2 border-[#194028] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-white text-[22px] font-bold mb-1 leading-tight capitalize">
                {user.Customer_name}
              </h2>
              <p className="text-white/70 text-[13px] font-medium mb-3 text-center px-4 max-w-[280px] truncate">
                {user.address}
              </p>

              {/* Verified Badge */}
              {isVerified && (
                <div className="flex items-center gap-1.5 text-[#20C063]">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[12px] font-bold tracking-wide">Verified {user.role || 'Farmer'}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-white">Failed to load user.</div>
          )}
        </div>

        {/* Menu Links */}
        <div className="flex-1 overflow-y-auto py-4 px-6 bg-white">
          <ul className="flex flex-col space-y-1">

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              label="My Profile"
              href="/user-profile"
              onClick={onClose}
            />

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
              label="Saved Products"
              href="/saved"
              onClick={onClose}
            />

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Rewards & Benefits"
              href="/rewards"
              showChevron
              onClick={onClose}
            />

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              label="My Purchased Orders"
              href="/orders"
              showChevron
              onClick={onClose}
            />

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              label="Events & Invites"
              href="/events"
              badge="NEW"
              onClick={onClose}
            />

            <MenuItem
              icon={<svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              label="Support & Help"
              href="/support-help"
              onClick={onClose}
            />

            {/* Action Cards (WhatsApp, Call, Ambassador) */}
            <div className="flex flex-col gap-3 mt-8 mb-2">
              {/* WhatsApp Card */}
              {whatsappEnabled === 1 && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white p-4 rounded-2xl hover:bg-gray-50 transition-colors group shadow-[0_2px_12px_rgb(0,0,0,0.06)] border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-[60px] h-[60px] rounded-full overflow-hidden flex items-center justify-center bg-white shrink-0 border border-gray-200">
                      <img src="/assets/nova.jpeg" alt="Nova" className="object-cover w-full h-full" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[#194028] font-bold text-[18px] leading-tight">Chat with Nova</span>
                      <span className="text-gray-400 font-medium text-[13px]">Support</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </a>
              )}

              {/* Call Card */}
              <a href="tel:+919226514174" className="flex items-center justify-between bg-white p-4 rounded-2xl hover:bg-gray-50 transition-colors group shadow-[0_2px_12px_rgb(0,0,0,0.06)] border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-[26px] h-[26px] text-[#194028]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#194028] font-bold text-[18px] leading-tight">Call</span>
                    <span className="text-gray-400 font-medium text-[13px]">Expert</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </a>

              {/* Ambassador Card */}
              <Link href="/support-help" onClick={onClose} className="flex items-center justify-between bg-white p-4 rounded-2xl hover:bg-gray-50 transition-colors group shadow-[0_2px_12px_rgb(0,0,0,0.06)] border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-[26px] h-[26px] text-[#194028]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#194028] font-bold text-[18px] leading-tight">Ambassador</span>
                    <span className="text-gray-400 font-medium text-[13px]">Help</span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>

            <div className="w-full border-t border-gray-100 my-2"></div>

            {/* Logout Button */}
            <li>
              <button
                onClick={() => {
                  setIsLoggingOut(true);
                  setTimeout(() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      localStorage.removeItem("gbru_user");
                      localStorage.removeItem("mobile_no");
                      localStorage.removeItem("gbru_applied_coupon");
                      localStorage.removeItem("gbru_applied_ambassador");
                      window.location.href = '/';
                    }
                    onClose();
                    setIsLoggingOut(false);
                  }, 2000);
                }}
                className="w-full flex items-center gap-4 py-4 px-2 text-[#EF4444] hover:bg-gray-50 rounded-lg transition-colors group"
              >
                <span className="text-[#EF4444] group-hover:scale-110 transition-transform">
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </span>
                <span className="text-[16px] font-semibold text-[#EF4444]">Logout</span>
              </button>
            </li>

          </ul>
        </div>
      </div>

      {/* Logout Success Popup */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0D9740] flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0F291B]">Logged out successfully</h3>
            <p className="text-zinc-500 text-sm">See you soon!</p>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({ icon, label, href, badge, showChevron, onClick }: { icon: React.ReactNode, label: string, href: string, badge?: string, showChevron?: boolean, onClick: () => void }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-4">
          <span className="text-[#768294] group-hover:text-[#194028] transition-colors">{icon}</span>
          <span className="text-[16px] font-semibold text-[#1a1a1a] group-hover:text-[#194028] transition-colors">{label}</span>
        </div>

        <div className="flex items-center gap-2">
          {badge && (
            <span className="bg-[#20C063] text-white text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide">
              {badge}
            </span>
          )}
          {showChevron && (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          )}
        </div>
      </Link>
    </li>
  );
}
