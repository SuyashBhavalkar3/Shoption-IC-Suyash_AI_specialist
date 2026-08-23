"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "./Navbar";
import { Package, MapPin, Banknote, Bell, Headphones, Phone, CreditCard, ChevronLeft, ChevronRight, Calendar, BadgeCheck } from "lucide-react";
import Footer from "./Footer";

interface Order {
  order_id: string;
  date: string;
  total_amount: number | string;
  received_amount: number | string;
  pending_amount: number | string;
  payupreferedmode?: string;
  payupreferedamount?: number | string;
  unsettled_amount?: number | string;
  payment_type?: string;
  status?: string;
}

interface UserDetails {
  Customer_name: string;
  address: string;
  status: string;
  role: string;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterMode, setFilterMode] = useState<"all_time" | "financial_year" | "prev_financial_year" | "custom">("all_time");
  const [fromDate, setFromDate] = useState("2025-04-01");
  const [toDate, setToDate] = useState("");

  // Custom calendar state variables
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // User profile details
  const [userName, setUserName] = useState("Prakash");
  const [userMobile, setUserMobile] = useState("+91 98765 43210");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState("");
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getFinancialYearRange = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const start = today.getMonth() >= 3 ? `${yyyy}-04-01` : `${yyyy - 1}-04-01`;
    const end = today.getMonth() >= 3 ? `${yyyy + 1}-03-31` : `${yyyy}-03-31`;
    return { start, end };
  };

  const getPrevFinancialYearRange = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const start = today.getMonth() >= 3 ? `${yyyy - 1}-04-01` : `${yyyy - 2}-04-01`;
    const end = today.getMonth() >= 3 ? `${yyyy}-03-31` : `${yyyy - 1}-03-31`;
    return { start, end };
  };

  const fetchOrdersWithRange = async (rangeFrom: string, rangeTo: string) => {
    try {
      setLoading(true);
      setError("");

      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        setError("User not logged in");
        return;
      }

      const parsed = JSON.parse(stored);
      const mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1];

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile_no,
          order_id: null,
          from_date: rangeFrom,
          to_date: rangeTo,
          page_size: 200,
          page: 1,
        })
      });

      const data = await res.json();
      const orderList = Array.isArray(data?.message?.data?.data)
        ? data.message.data.data
        : Array.isArray(data?.message?.data)
          ? data.message.data
          : Array.isArray(data?.data)
            ? data.data
            : null;

      if (res.ok && orderList) {
        setOrders(orderList);
      } else {
        setError(data?.error || data?.message?.message || data?.msg || "Failed to fetch orders");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterModeChange = async (mode: "all_time" | "financial_year" | "prev_financial_year" | "custom") => {
    setFilterMode(mode);

    if (mode === "all_time") {
      setFromDate("2025-01-01");
      setToDate(getTodayDate());
      await fetchOrdersWithRange("2025-01-01", getTodayDate());
      return;
    }

    if (mode === "financial_year") {
      const { start, end } = getFinancialYearRange();
      setFromDate(start);
      setToDate(end);
      await fetchOrdersWithRange(start, end);
      return;
    }

    if (mode === "prev_financial_year") {
      const { start, end } = getPrevFinancialYearRange();
      setFromDate(start);
      setToDate(end);
      await fetchOrdersWithRange(start, end);
      return;
    }
  };

  const applyCustomRange = async (start: string, end: string) => {
    setFilterMode("custom");
    await fetchOrdersWithRange(start, end);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateString,
        dateObj: new Date(year, month, day)
      });
    }
    return days;
  };

  const handleCalendarDayClick = (dateString: string) => {
    if (!fromDate || (fromDate && toDate)) {
      setFromDate(dateString);
      setToDate("");
    } else {
      if (new Date(dateString) < new Date(fromDate)) {
        setToDate(fromDate);
        setFromDate(dateString);
        void applyCustomRange(dateString, fromDate);
      } else {
        setToDate(dateString);
        void applyCustomRange(fromDate, dateString);
      }
      setShowCalendar(false);
    }
  };

  const changeCalendarMonth = (offset: number) => {
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1);
    if (nextMonth < new Date(2025, 3, 1)) {
      return;
    }
    setCalendarMonth(nextMonth);
  };

  const isDateInRange = (dateString: string) => {
    if (!fromDate || !toDate) return false;
    const d = new Date(dateString);
    return d >= new Date(fromDate) && d <= new Date(toDate);
  };

  useEffect(() => {
    void fetchOrdersWithRange("2025-01-01", getTodayDate());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = () => {
    const stored = localStorage.getItem("gbru_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1] || "";
        if (mobile_no && mobile_no.includes("@")) {
          mobile_no = mobile_no.split("@")[0];
        }
        const fallbackName = parsed.Customer_name || parsed.customer_name;
        setUserMobile(mobile_no.startsWith("+91") ? mobile_no : `+91 ${mobile_no}`);
        setProfileImage(parsed.profile_image || null);
        return mobile_no;
      } catch (e) { }
    }
    return "";
  };

  useEffect(() => {
    const mobile_no = loadProfile();
    if (mobile_no) {
      fetch('/api/user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_no })
      })
        .then(res => res.json())
        .then(data => {
          if (data?.message?.status && data?.message?.data) {
            const ud = data.message.data;
            const trueName = ud.Customer_name || ud.customer_name || "User";
            setUserName(trueName.split(" ")[0]);
            setUserMobile(mobile_no.startsWith("+91") ? mobile_no : `+91 ${mobile_no}`);
            if (ud.profile_image) {
              setProfileImage(ud.profile_image);
              // Cache to localStorage
              const stored = localStorage.getItem("gbru_user");
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  parsed.profile_image = ud.profile_image;
                  localStorage.setItem("gbru_user", JSON.stringify(parsed));
                } catch (_) { }
              }
            }
          }
        })
        .catch(() => { });
    }
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile();
    };
    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  // Filter orders by search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    return order.order_id?.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const handlePayNow = async (orderId: string, amount: number) => {
    setPayingOrderId(orderId);
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        setToastType("error");
        setToastMessage("User not logged in");
        setTimeout(() => setToastMessage(""), 3000);
        return;
      }
      const parsed = JSON.parse(stored);
      let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1];
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const email = parsed.user_id && parsed.user_id.includes("@") ? parsed.user_id : (parsed.email || "");

      const res = await fetch("/api/orders/pay-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          order_id: orderId,
          amount: amount,
          email
        })
      });
      const data = await res.json();
      if (data.status && data.token && data.actionUrl) {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.actionUrl;

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = "token";
        hidden.value = data.token;
        form.appendChild(hidden);

        document.body.appendChild(form);
        form.submit();
      } else {
        setToastType("error");
        setToastMessage(data.error || data.message || "Failed to initiate payment.");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {

      setToastType("error");
      setToastMessage("An error occurred while initiating payment.");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setPayingOrderId(null);
    }
  };

  // Calculate statistics
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => Number(o.pending_amount) > 0).length;
  const deliveredOrdersCount = orders.filter((o) => Number(o.pending_amount) === 0).length;

  return (
    <div className="min-h-screen bg-[#F9FBF9] font-roboto flex flex-col">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-4 lg:py-8 flex-1 flex flex-col gap-4 lg:gap-8">

        {/* ============================================ */}
        {/* MOBILE HEADER — visible only on mobile       */}
        {/* ============================================ */}
        <div className="block lg:hidden w-full" style={{ padding: "12px 20px 16px 20px" }}>
          {/* Header row: avatar + name */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <div className="w-20 h-20 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 flex items-center justify-center overflow-hidden shadow-sm">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold uppercase">
                    {userName && userName !== "Loading..." ? userName.charAt(0) : "U"}
                  </span>
                )}
              </div>
              <div className="absolute bottom-[2px] right-[2px] bg-[#0D8534] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm">
                <BadgeCheck className="w-[14px] h-[14px] text-white stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-[22px] font-bold text-[#1F2937] leading-tight flex items-center gap-1.5">
                Hello, {userName} <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="text-[12px] text-zinc-500 font-medium leading-tight mt-0.5">
                Manage your account and orders easily
              </p>
            </div>
          </div>

          {/* Subheader: phone + edit button */}
          <div className="mt-4 flex flex-col gap-3">
            <span className="text-[14px] text-[#374151] font-semibold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-zinc-600" /> {userMobile}
            </span>
            <Link
              href="/user-profile"
              className="w-full h-10 flex items-center justify-center border border-[#0D9740] hover:bg-[#0D9740]/[0.02] text-[#0D9740] font-bold text-xs rounded-lg transition-all"
            >
              Edit Profile
            </Link>
          </div>

          {/* Mobile Account Shortcuts — small icon row */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full justify-between">
            <Link
              href="/orders"
              className="bg-[#E8F3EB] border border-[#0D9740]/20 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-white text-[#0D9740] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">My Purchased Orders</span>
            </Link>
            <Link
              href="/user-profile"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">My Address</span>
            </Link>
            <Link
              href="/payments"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Payments</span>
            </Link>
            <Link
              href="/user-profile"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Notifications</span>
            </Link>
            <Link
              href="/help-centre"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Help</span>
            </Link>
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP HEADER + SHORTCUTS — lg and above   */}
        {/* ============================================ */}
        {/* 1. User Profile summary Header */}
        <div className="hidden lg:flex bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 flex items-center justify-center overflow-hidden text-2xl font-bold uppercase shadow-sm">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userName && userName !== "Loading..." ? userName.charAt(0) : "U"
                )}
              </div>
              <div className="absolute bottom-[2px] right-[2px] bg-[#0FA84D] text-white w-[20px] h-[20px] rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm translate-x-[3px] translate-y-[3px]">
                <BadgeCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold text-[#0F291B] flex items-center gap-1.5 leading-snug">
                Hello, {userName} 👋
              </h1>
              <span className="text-xs text-zinc-500">
                Manage your account and orders easily
              </span>
              <span className="text-[11px] text-[#0FA84D] font-semibold mt-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {userMobile}
              </span>
            </div>
          </div>

          <Link
            href="/user-profile"
            className="h-10 px-6 border border-[#0D9740]/60 hover:bg-[#0D9740]/[0.02] text-[#0D9740] font-bold text-xs rounded-[10px] shadow-sm transition-all flex items-center justify-center"
          >
            Edit Profile
          </Link>
        </div>

        {/* 2. Account Shortcuts Grid — desktop only */}
        <div className="hidden lg:flex flex-col gap-4">
          <h3 className="font-bold text-[#0F291B] text-sm tracking-wide uppercase">
            Account Shortcuts
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">

            {/* Shortcut: My Orders */}
            <Link
              href="/orders"
              className="bg-[#D3E7D9] border border-[#1E532E]/30 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white text-emerald-700 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-[#0F291B]">My Purchased Orders</span>
            </Link>

            {/* Shortcut: Addresses */}
            <Link
              href="/user-profile"
              className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-[#0F291B]">My Address</span>
            </Link>

            {/* Shortcut: Payments */}
            <Link
              href="/payments"
              className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Banknote className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-[#0F291B]">Payments</span>
            </Link>

            {/* Shortcut: Notifications */}
            <Link
              href="/user-profile"
              className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-[#0F291B]">Notifications</span>
            </Link>

            {/* Shortcut: Support */}
            <Link
              href="/help-centre"
              className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-[#0F291B]">Help</span>
            </Link>

          </div>
        </div>

        {/* 3. My Orders Header with Search bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/user-profile" className="text-zinc-500 hover:text-[#1E532E] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h2 className="text-2xl lg:text-3xl font-bold text-[#0F291B] font-roboto">My Purchased Orders</h2>
            </div>
            <p className="text-zinc-500 text-sm font-medium">Track your purchases, payments and deliveries in one place.</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:max-w-xs shrink-0">
            <input
              type="text"
              placeholder="Search Order ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-[#1E532E] font-medium text-zinc-800 placeholder-zinc-400 shadow-sm"
            />
            <svg className="w-5 h-5 text-zinc-400 absolute right-3.5 top-3.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Date range filters */}
        <div className="bg-white border border-[#CDE5D2] rounded-[24px] p-4 lg:p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleFilterModeChange("all_time")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterMode === "all_time" ? "bg-[#1E532E] text-white border-[#1E532E]" : "bg-white text-[#1E532E] border-[#CDE5D2]"}`}
              >
                All Time
              </button>
              <button
                onClick={() => void handleFilterModeChange("financial_year")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterMode === "financial_year" ? "bg-[#1E532E] text-white border-[#1E532E]" : "bg-white text-[#1E532E] border-[#CDE5D2]"}`}
              >
                Current Financial Year
              </button>
              <button
                onClick={() => void handleFilterModeChange("prev_financial_year")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterMode === "prev_financial_year" ? "bg-[#1E532E] text-white border-[#1E532E]" : "bg-white text-[#1E532E] border-[#CDE5D2]"}`}
              >
                Previous Financial Year
              </button>
              <button
                onClick={() => setFilterMode("custom")}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${filterMode === "custom" ? "bg-[#1E532E] text-white border-[#1E532E]" : "bg-white text-[#1E532E] border-[#CDE5D2]"}`}
              >
                Custom Range
              </button>
            </div>

            <div className="text-xs text-zinc-500 font-medium">
              Use a preset or pick your own dates
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-between h-12 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-[#1F2937] hover:border-[#1E532E] transition-colors shadow-sm text-left"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>
                  {fromDate && toDate
                    ? `${new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : fromDate
                      ? `From: ${new Date(fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Select end date)`
                      : "Select Custom Date Range"}
                </span>
              </div>
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {showCalendar && (
              <div className="absolute left-0 mt-2 z-50 bg-white border border-[#CDE5D2] rounded-3xl p-5 shadow-2xl w-full max-w-[340px]">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => changeCalendarMonth(-1)}
                    disabled={calendarMonth.getFullYear() === 2025 && calendarMonth.getMonth() <= 3}
                    className={`p-1.5 rounded-full transition-colors ${calendarMonth.getFullYear() === 2025 && calendarMonth.getMonth() <= 3 ? 'text-zinc-300 cursor-not-allowed' : 'hover:bg-emerald-50 text-emerald-800'}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-extrabold text-[#0F291B] capitalize">
                    {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => changeCalendarMonth(1)}
                    className="p-1.5 hover:bg-emerald-50 rounded-full text-emerald-800 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Days header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <span key={day} className="text-[11px] font-bold text-zinc-400 uppercase">{day}</span>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(calendarMonth).map((d, index) => {
                    if (!d) return <div key={`empty-${index}`} />;

                    const isSelectedFrom = fromDate === d.dateString;
                    const isSelectedTo = toDate === d.dateString;
                    const inRange = isDateInRange(d.dateString);
                    const isHovered = hoveredDate && d.dateString > fromDate && d.dateString <= hoveredDate && !toDate;

                    return (
                      <button
                        type="button"
                        key={d.dateString}
                        onClick={() => handleCalendarDayClick(d.dateString)}
                        onMouseEnter={() => !toDate && setHoveredDate(d.dateString)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`h-9 w-9 text-xs font-semibold rounded-lg flex items-center justify-center transition-all
                          ${isSelectedFrom || isSelectedTo
                            ? "bg-[#1E532E] text-white shadow-md font-bold scale-105"
                            : inRange || isHovered
                              ? "bg-emerald-50 text-emerald-900 rounded-none"
                              : "hover:bg-zinc-100 text-[#1F2937]"}`}
                      >
                        {d.day}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setShowCalendar(false);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="px-4 py-1.5 text-xs font-extrabold bg-[#1E532E] hover:bg-[#153B21] text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Statistics cards — hidden on mobile, shown on md+ */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Orders Card */}
          <div className="bg-white border border-[#CDE5D2] rounded-[24px] p-6 text-left shadow-sm space-y-4">
            <span className="text-zinc-500 text-sm font-bold font-roboto">Total Orders</span>
            <div className="text-4xl font-extrabold text-[#0F291B] font-roboto">
              {loading ? "..." : totalOrdersCount}
            </div>
          </div>

          {/* Pending Card */}
          <div className="bg-white border border-[#CDE5D2] rounded-[24px] p-6 text-left shadow-sm space-y-4">
            <span className="text-zinc-500 text-sm font-bold font-roboto">Pending</span>
            <div className="text-4xl font-extrabold text-[#0F291B] font-roboto">
              {loading ? "..." : pendingOrdersCount}
            </div>
          </div>

          {/* Delivered Card */}
          <div className="bg-white border border-[#CDE5D2] rounded-[24px] p-6 text-left shadow-sm space-y-4">
            <span className="text-zinc-500 text-sm font-bold font-roboto">Delivered</span>
            <div className="text-4xl font-extrabold text-[#0F291B] font-roboto">
              {loading ? "..." : deliveredOrdersCount}
            </div>
          </div>
        </div>

        {/* 5. Orders Listing */}
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="animate-spin h-10 w-10 text-[#1E532E]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-rose-500 font-semibold">{error}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 font-medium">No matching orders found.</div>
          ) : (
            filteredOrders.map((order, idx) => {
              const pendingAmt = Number(order.pending_amount || 0);
              const preferredModeStr = String(order.payupreferedmode || order.payment_type || "Online").toLowerCase();
              const isFullPayment = !preferredModeStr.includes("cash") && !preferredModeStr.includes("cod") && preferredModeStr !== "pay later";
              const isBookingPaid = Number(order.received_amount || 0) >= Number(order.payupreferedamount || 0);
              const payAmt = isFullPayment ? pendingAmt : (!isBookingPaid ? Number(order.payupreferedamount || 0) : 0);
              const isCancelled = String(order.status || "").toLowerCase().includes("cancel");
              const showListPayButton = payAmt > 10 && !isCancelled;

              return (
                <div key={order.order_id || idx}>

                  {/* ============================================================ */}
                  {/* MOBILE CARD — Figma spec: 358w, br-24, p-16, gap-10, border  */}
                  {/* ============================================================ */}
                  <div className="block md:hidden bg-white border border-zinc-200 rounded-[24px] p-4 flex flex-col" style={{ gap: "10px" }}>

                    {/* Top row: Order ID + Status badge */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[17px] font-bold text-[#0F291B] font-roboto tracking-tight">
                            #{order.order_id}
                          </h4>
                          {order.status && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {order.status}
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-zinc-400 font-medium mt-0.5 block">
                          {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                        </span>
                      </div>

                      {/* Status badge */}
                      {isFullPayment ? (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-[#1a5c2a] text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] flex-shrink-0" />
                          FULL PAYMENT
                        </span>
                      ) : isBookingPaid ? (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-[#1a5c2a] text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] flex-shrink-0" />
                          BOOKED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-orange-50 text-[#b84c00] text-[11px] font-bold px-3 py-1 rounded-full border border-orange-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E65100] flex-shrink-0" />
                          BOOK NOW
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-zinc-100" />

                    {/* Amount rows */}
                    <div className="flex flex-col" style={{ gap: "0px" }}>
                      {/* Total Amount */}
                      <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                        <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Total Amount</span>
                        <span className="text-[18px] font-bold text-[#0F291B]">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                      </div>

                      {/* Received Amount */}
                      <div className="flex items-center justify-between py-3 border-b border-zinc-100">
                        <span className="text-[11px] font-bold text-zinc-400 tracking-wide uppercase">Received Amount</span>
                        <span className="text-[18px] font-bold text-[#0D9740]">
                          ₹{Number(Number(order.received_amount || 0) > Number(order.total_amount) ? order.total_amount : (order.received_amount || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Pending Amount */}
                      <div className="flex items-center justify-between py-3">
                        <span className={`text-[11px] font-bold tracking-wide uppercase ${pendingAmt > 0 ? "text-red-500" : "text-zinc-400"}`}>Pending Amount</span>
                        <span className={`text-[18px] font-bold ${pendingAmt > 0 ? "text-red-500" : "text-[#0F291B]"}`}>
                          ₹{Number(Number(order.total_amount || 0) - Number(Number(order.received_amount || 0) > Number(order.total_amount) ? order.total_amount : (order.received_amount || 0))).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Pay Now Button */}
                    <div className="flex flex-col gap-2 mt-1">
                      {showListPayButton && (
                        <button
                          disabled={payingOrderId === order.order_id}
                          onClick={() => handlePayNow(order.order_id, payAmt)}
                          className="w-full min-h-[52px] py-3 bg-[#1B5E20] hover:bg-[#154a19] disabled:opacity-60 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2.5 px-4 text-center"
                        >
                          {payingOrderId === order.order_id ? (
                            "Processing..."
                          ) : (
                            <span className="text-[14px] leading-snug">
                              {isFullPayment ? "Pay Pending" : "Pay Booking Deposit"} (₹{payAmt.toLocaleString("en-IN")})
                            </span>
                          )}
                        </button>
                      )}

                      {/* View Details */}
                      <Link
                        href={`/orders/${order.order_id}`}
                        className="w-full min-h-[52px] py-3 border-2 border-[#1B5E20] text-[#1B5E20] hover:bg-[#1B5E20]/5 font-bold text-[16px] rounded-2xl transition-all flex items-center justify-center"
                      >
                        View Details
                      </Link>

                      {/* Help */}
                      <Link
                        href="/help-centre"
                        className="flex items-center justify-center gap-1.5 text-[#1B5E20] text-[13px] font-semibold py-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help
                      </Link>
                    </div>
                  </div>

                  {/* ============================================================ */}
                  {/* DESKTOP CARD — original layout, unchanged                    */}
                  {/* ============================================================ */}
                  <div className="hidden md:flex bg-white border border-[#CDE5D2] rounded-[32px] p-6 md:p-8 flex-col md:flex-row justify-between items-stretch gap-6 md:gap-0 shadow-sm">
                    {/* Column 1: Order Meta */}
                    <div className="flex-1 flex flex-col justify-between text-left space-y-4">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 block mb-1">ORDER ID</span>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-bold text-[#0F291B] font-roboto">#{order.order_id}</h4>
                          {order.status && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {order.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-bold text-zinc-400 block mb-1">ORDER DATE</span>
                        <span className="text-sm font-semibold text-zinc-700">{order.date ? order.date.split(" ")[0] : ""}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {isFullPayment ? (
                          <div className="inline-flex items-center gap-1.5 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs font-extrabold w-fit uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                            <span>Full Payment</span>
                          </div>
                        ) : isBookingPaid ? (
                          <div className="inline-flex items-center gap-1.5 bg-[#E8F5E9] text-[#2E7D32] px-3 py-1 rounded-full text-xs font-extrabold w-fit uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                            <span>Booked (COD)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-[#FFF3E0] text-[#E65100] px-3 py-1 rounded-full text-xs font-extrabold w-fit uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />
                            <span>Book Now (COD)</span>
                          </div>
                        )}
                        <div className="text-zinc-500 text-xs font-medium">
                          Preferred Payment Mode: <span className="font-bold text-zinc-700">{order.payupreferedmode || "Online"}</span>
                        </div>
                        {Number(order.payupreferedamount || 0) > 0 && (
                          <div className="text-zinc-500 text-xs font-medium mt-1">
                            Preferred Payment Amount: <span className="font-bold text-[#0D9740]">₹{Number(order.payupreferedamount).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 2: Financial Details */}
                    <div className="flex-1 flex flex-col justify-center gap-4 md:border-l md:border-r md:border-zinc-150 md:px-8 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold font-roboto">TOTAL AMOUNT</span>
                        <span className="text-lg font-bold text-[#0D9740]">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="h-[1px] bg-zinc-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold font-roboto">RECEIVED AMOUNT</span>
                        <span className="text-lg font-bold text-[#0D9740]">
                          ₹{Number(Number(order.received_amount || 0) > Number(order.total_amount) ? order.total_amount : (order.received_amount || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-[1px] bg-zinc-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold font-roboto">PENDING AMOUNT</span>
                        <span className="text-lg font-bold text-[#0D9740]">
                          ₹{Number(Number(order.total_amount || 0) - Number(Number(order.received_amount || 0) > Number(order.total_amount) ? order.total_amount : (order.received_amount || 0))).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-[1px] bg-zinc-100" />
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-xs font-bold font-roboto">UNSETTLED AMOUNT</span>
                        <span className="text-lg font-bold text-[#0D9740]">₹{Number(order.unsettled_amount || 0).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Column 3: CTAs */}
                    <div className="flex-1 flex flex-col justify-center items-stretch md:items-center gap-3 md:pl-8">
                      {showListPayButton && (
                        <button
                          disabled={payingOrderId === order.order_id}
                          onClick={() => handlePayNow(order.order_id, payAmt)}
                          className="w-full md:max-w-[200px] text-white bg-[#1E532E] hover:bg-[#153B21] font-bold py-3.5 rounded-2xl transition-all duration-200 font-roboto text-sm flex items-center justify-center"
                        >
                          {payingOrderId === order.order_id ? (
                            <span className="flex items-center gap-1.5 justify-center">
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span>{isFullPayment ? "Pay Pending" : "Pay Booking Deposit"} (₹{payAmt.toLocaleString("en-IN")})</span>
                          )}
                        </button>
                      )}
                      <Link
                        href={`/orders/${order.order_id}`}
                        className="w-full md:max-w-[200px] border border-[#1E532E] hover:bg-[#1E532E]/5 text-[#1E532E] font-bold py-3.5 rounded-2xl transition-all duration-200 font-roboto text-sm flex items-center justify-center"
                      >
                        View Details
                      </Link>
                      <Link
                        href="/help-centre"
                        className="inline-flex items-center justify-center gap-1 text-[#1E532E] hover:text-[#153B21] transition-colors text-xs font-bold mt-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Help</span>
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] ${toastType === "error" ? "bg-red-600" : "bg-[#006B21]"} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-down`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {toastType === "error" ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span className="font-medium font-inter">{toastMessage}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}
export const dynamic = 'force-dynamic';
