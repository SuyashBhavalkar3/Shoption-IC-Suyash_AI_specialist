"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import SearchBar from "./SearchBar";
import ProfilePop from "./profile_pop";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const pathname = usePathname() || "/";
  const [currentHash, setCurrentHash] = useState("");

  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showMobileLang, setShowMobileLang] = useState(false);
  const [activeLang, setActiveLang] = useState("en");

  const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "ur", name: "اردو (Urdu)" },
    { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
    { code: "as", name: "অসমীয়া (Assamese)" },
    { code: "mai", name: "मैथिली (Maithili)" },
    { code: "gom", name: "कोंकणी (Konkani)" },
    { code: "ne", name: "नेपाली (Nepali)" },
    { code: "sd", name: "सिंधी (Sindhi)" },
    { code: "doi", name: "डोगरी (Dogri)" },
    { code: "mni", name: "মণিপুরী (Manipuri)" },
    { code: "brx", name: "बोडो (Bodo)" },
    { code: "sa", name: "संस्कृतम् (Sanskrit)" }
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("gbru_selected_lang");
      if (stored) {
        setActiveLang(stored);
      } else {
        const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
        if (match && match[1]) {
          setActiveLang(match[1]);
        }
      }
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    const cookieVal = `/en/${langCode}`;
    const host = window.location.hostname;
    const parts = host.split('.');
    const expired = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
    const domains = ["", host, `.${host}`];
    if (parts.length > 2) {
      const parent = parts.slice(-2).join('.');
      domains.push(parent);
      domains.push(`.${parent}`);
    }

    // Delete ALL existing googtrans cookies across every domain scope first
    domains.forEach(dom => {
      document.cookie = `googtrans=; ${expired}; path=/;${dom ? ` domain=${dom};` : ""}`;
    });

    // Write the single correct cookie
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${host};`;
    if (parts.length > 2) {
      const parentDomain = parts.slice(-2).join('.');
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${parentDomain};`;
    }

    localStorage.setItem("gbru_selected_lang", langCode);
    setActiveLang(langCode);
    setShowLangDropdown(false);
    window.location.reload();
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const handleHashChange = () => {
        setCurrentHash(window.location.hash);
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const stored = localStorage.getItem("gbru_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setLoggedInUser(parsed);
          } catch (_) {}
        }
      };

      loadUser();

      // Listen to profile updates
      window.addEventListener("profileUpdate", loadUser);

      // Fetch cart count
      const stored = localStorage.getItem("gbru_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const fetchCartCount = async () => {
            try {
              const mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1];
              if (!mobile_no) return;

              const res = await fetch("/api/cart/count", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mobile_no }),
              });
              const data = await res.json();
              if (data?.message?.status && data.message.data) {
                setCartCount(data.message.data.count || 0);
              }
            } catch (err) {}
          };

          fetchCartCount();

          const handleCartUpdate = () => {
            fetchCartCount();
          };
          window.addEventListener("cartUpdate", handleCartUpdate);
          return () => {
            window.removeEventListener("cartUpdate", handleCartUpdate);
            window.removeEventListener("profileUpdate", loadUser);
          };
        } catch (e) {}
      }
    }
  }, []);

  const isHome = pathname === "/";

  const navLinks = [
    { name: "Home", href: "/", active: pathname === "/" },
    { name: "All Products", href: "/products", active: pathname.startsWith("/products") || pathname.startsWith("/all_products") },
    { name: "Categories", href: "/categories", active: pathname.startsWith("/categories") },
    { name: "Video Hub", href: "/videos", active: pathname.startsWith("/videos") },
    { name: "Contact Us", href: "/help-centre#contact-us", active: pathname === "/help-centre" && currentHash === "#contact-us" },
    { name: "Gallery", href: "/gallery", active: pathname.startsWith("/gallery") },
  ];

  return (
    <nav
      className="w-full text-white border-b border-white/10 sticky top-0 z-50 shadow-lg"
      style={{ background: "linear-gradient(90deg, #204123 0%, #185A46 49.52%, #204123 100%)" }}
    >
      <div className="max-w-[1280px] w-full mx-auto pl-[21px] pr-4 sm:pr-6 lg:pr-[47px]">
        <div className="flex items-center justify-between h-[64px] xl:h-[72px]">

          {/* Desktop Logo Section */}
          <div className="hidden xl:flex flex-shrink-0 items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/assets/gbru_header_logo.png"
                alt="GBRU Logo"
                width={92}
                height={51}
                className="h-[51px] w-[92px] object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center justify-between gap-[28px] h-[34px]">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative py-1 font-roboto font-semibold text-[12px] leading-none transition-colors duration-200 hover:text-[#FFC700] whitespace-nowrap ${link.active ? "text-[#FFC700]" : "text-white/90"
                  }`}
              >
                {link.name}
                {link.active && (
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[120%] h-[3px] bg-[#FFC700] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden xl:flex items-center relative w-[260px] h-[35px]">
            <SearchBar className="w-full h-full" placeholder="Search tools, products...." />
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden xl:flex items-center">
            {/* Language Selector Dropdown */}
            {true && (
              <div className="relative mr-[31px]">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center justify-center gap-1 font-roboto font-semibold text-[12px] leading-none hover:text-[#FFC700] transition-colors duration-200 cursor-pointer text-white"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <span className="uppercase">{activeLang}</span>
                </button>

                {showLangDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowLangDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-[#0A331E]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-xl py-2 z-50 max-h-[300px] overflow-y-auto">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-white/10 hover:text-[#FFC700] transition-colors ${
                            activeLang === lang.code ? "text-[#FFC700] bg-white/5" : "text-white/90"
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sign Up / User Profile Button */}
            {loggedInUser ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-white/20 hover:bg-white/10 text-white font-roboto font-semibold text-[11px] leading-none rounded-[4px] transition-all duration-200 mr-[25px] hover:scale-[1.02]"
              >
                <span>{loggedInUser.Customer_name?.split(" ")[0] || "Profile"}</span>
                <svg
                  className="w-3 h-3 text-[#FFC700]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="flex items-center justify-center gap-1 w-[78px] h-[22px] bg-[#FFC700] hover:bg-[#e6b300] text-black font-roboto font-semibold text-[11px] leading-none rounded-[4px] transition-all duration-200 shadow-md hover:scale-[1.02] mr-[25px]"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Sign up</span>
              </button>
            )}

            {/* Cart Icon */}
            <Link href="/cart" className="flex items-end hover:scale-105 transition-transform duration-200 group mr-2">
              <div className="relative flex justify-center w-[40px] h-[40px]">
                <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h3.5l2 11h11l2.5-7.5" />
                  <circle cx="9" cy="19" r="1.2" fill="white" stroke="white" />
                  <circle cx="17" cy="19" r="1.2" fill="white" stroke="white" />
                </svg>
                <span className="absolute top-[2px] left-[4px] right-0 text-center text-[#FF9900] font-bold text-[17px] font-sans leading-none flex items-center justify-center notranslate">
                  {cartCount}
                </span>
              </div>
              <span className="text-white font-bold text-[15px] -ml-1 pb-1 tracking-wide">Cart</span>
            </Link>
          </div>

          {/* Mobile Right Controls (Hamburger & Cart) */}
          <div className="flex xl:hidden items-center justify-between w-full h-[64px]">
            
            {/* Hamburger Button (Leftmost) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-[#FFC700] hover:bg-white/10 focus:outline-none transition-colors duration-200 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* GBRU logo centered */}
            <div className="flex items-center justify-center">
              <Link href="/">
                <Image
                  src="/assets/gbru_header_logo.png"
                  alt="GBRU Logo"
                  width={80}
                  height={44}
                  className="h-[44px] w-[80px] object-contain"
                  priority
                />
              </Link>
            </div>

            {/* Right side controls (Search & Cart) */}
            <div className="flex items-center space-x-3.5">
              {/* Mobile Search Icon Toggle */}
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="text-white hover:text-[#FFC700] p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Mobile Cart */}
              <Link href="/cart" className="flex items-end p-1 hover:scale-105 transition-transform duration-200 group">
                <div className="relative flex justify-center w-[30px] h-[30px]">
                  <svg className="w-full h-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 3h3.5l2 11h11l2.5-7.5" />
                    <circle cx="9" cy="19" r="1.2" fill="white" stroke="white" />
                    <circle cx="17" cy="19" r="1.2" fill="white" stroke="white" />
                  </svg>
                  <span className="absolute top-[1px] left-[3px] right-0 text-center text-[#FF9900] font-bold text-[13px] font-sans leading-none flex items-center justify-center notranslate">
                    {cartCount}
                  </span>
                </div>
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Drawer/Menu */}
      {isOpen && (
        <div className="xl:hidden bg-[#0A331E] border-t border-white/10 px-4 pt-2 pb-6 space-y-4 animate-fadeIn">
          {/* Mobile Search (Visible on small mobile viewports) */}
          <div className="relative sm:hidden h-[40px]">
            <SearchBar className="w-full h-full" placeholder="Search tools, products...." />
          </div>

          {/* Links */}
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`px-3 py-2.5 rounded-md text-base font-semibold transition-colors ${link.active
                  ? "text-[#FFC700] bg-white/5"
                  : "text-white hover:text-[#FFC700] hover:bg-white/5"
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 my-4 pt-4 flex flex-col gap-4">
            {/* Language Selection Mobile */}
            {true && (
              <div className="w-full">
                <button
                  onClick={() => setShowMobileLang(!showMobileLang)}
                  className="flex items-center justify-between w-full px-3 py-2 text-base font-semibold hover:text-[#FFC700] transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                    <span>
                      Language: {LANGUAGES.find((l) => l.code === activeLang)?.name || "English"}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showMobileLang ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showMobileLang && (
                  <div className="mt-2 ml-4 pl-3 border-l border-white/10 flex flex-col gap-1.5 max-h-[220px] overflow-y-auto">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsOpen(false);
                        }}
                        className={`text-left py-2 text-sm font-medium hover:text-[#FFC700] transition-colors ${
                          activeLang === lang.code ? "text-[#FFC700]" : "text-white/70"
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sign Up Mobile */}
            {loggedInUser ? (
              <button
                onClick={() => {
                  setIsProfileOpen(true);
                  setIsOpen(false);
                }}
                className="flex items-center justify-center space-x-2 bg-[#FFC700] hover:bg-[#e6b300] text-black font-bold py-3 rounded-[6px] transition-colors duration-200 shadow-md w-full cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{loggedInUser.Customer_name?.split(" ")[0] || "Profile"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/signup");
                }}
                className="flex items-center justify-center space-x-2 bg-[#FFC700] hover:bg-[#e6b300] text-black font-bold py-3 rounded-[6px] transition-colors duration-200 shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>Sign up</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile Slider */}
      <ProfilePop
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={() => {
          localStorage.removeItem("gbru_user");
          localStorage.removeItem("mobile_no");
          localStorage.removeItem("gbru_applied_coupon");
          localStorage.removeItem("gbru_applied_ambassador");
          setLoggedInUser(null);
          setIsProfileOpen(false);
          window.location.href = '/';
        }}
      />
    </nav>
  );
}
