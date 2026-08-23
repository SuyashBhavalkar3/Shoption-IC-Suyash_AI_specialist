"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, MapPin, Banknote, Bell, Headphones, ClipboardList, CheckCircle2, XCircle, Home, Plus, Edit3, Trash2, HelpCircle, MessageSquare, Phone, BadgeCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "./ToastContext";
import { useShoptionSetting } from "@/hooks/useShoptionSetting";
import { getPlaceNames } from "@/utils/addressUtils";

function SearchableDropdown<T>({
  label,
  value,
  options,
  disabled = false,
  placeholder,
  getLabel,
  getValue,
  onSelect,
}: {
  label: string;
  value: string;
  options: T[];
  disabled?: boolean;
  placeholder: string;
  getLabel: (item: T) => string;
  getValue: (item: T) => string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((item) =>
    getLabel(item).toLowerCase().includes(query.toLowerCase())
  );

  const selectedItem = options.find((item) =>
    getValue(item) === value || getLabel(item) === value
  );

  return (
    <div className="relative notranslate">
      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-11 px-3 border border-zinc-200 rounded-xl bg-white text-left ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#0D9740]"} flex items-center justify-between gap-2 text-sm text-[#0F291B]`}
      >
        <span className={`${selectedItem ? "text-[#0F291B]" : "text-zinc-400"}`}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <span className="text-zinc-400">⌄</span>
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-3xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-200">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="w-full h-11 px-3 border border-zinc-200 rounded-xl text-sm text-[#0F291B] outline-none focus:border-[#0D9740]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <button
                  key={getValue(item)}
                  type="button"
                  onClick={() => {
                    onSelect(getValue(item));
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#F3F9F3] text-sm text-[#0F291B]"
                >
                  {getLabel(item)}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-zinc-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  // Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editingAddressName, setEditingAddressName] = useState<string | null>(null);

  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // User States
  const [userName, setUserName] = useState("Loading...");
  const [userFullName, setUserFullName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [fullPaymentCount, setFullPaymentCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  // Form states for profile edit
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");

  // Address states
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tahsils, setTahsils] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    pin: "",
    marketplace: "",
    city: "",
    district: "",
    state: "",
    address1: "",
    address2: "",
    saveAddress: false,
  });

  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    const fetchUserAndAddresses = async () => {
      try {
        const stored = localStorage.getItem("gbru_user");
        if (!stored) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);
        let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1];
        if (mobile_no && mobile_no.includes("@")) {
          mobile_no = mobile_no.split("@")[0];
        }

        const fallbackName = parsed.Customer_name || parsed.customer_name || parsed.first_name || parsed.full_name || parsed.username || "User";
        setUserFullName(fallbackName);
        setUserName(fallbackName.split(" ")[0]);
        setUserPhone(`+91 ${mobile_no}`);
        setTempName(fallbackName);
        setTempPhone(`+91 ${mobile_no}`);
        if (parsed.profile_image) {
          setProfileImage(parsed.profile_image);
        }

        // 1. Fetch User Details
        const res = await fetch('/api/user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile_no })
        });

        let data;
        if (res.ok) {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch (e) {

          }
        }

        if (data?.message?.status && data?.message?.data) {
          const ud = data.message.data;
          setUserFullName(ud.Customer_name || "");
          setUserName(ud.Customer_name ? ud.Customer_name.split(" ")[0] : "User");
          const phone = mobile_no;
          setUserPhone(`+91 ${phone}`);
          setTempName(ud.Customer_name || "");
          setTempPhone(`+91 ${phone}`);

          // Use profile_image from API response as the source of truth
          if (ud.profile_image) {
            setProfileImage(ud.profile_image);
            // Cache profile image back to localStorage
            const stored = localStorage.getItem("gbru_user");
            if (stored) {
              try {
                const parsedUserObj = JSON.parse(stored);
                parsedUserObj.profile_image = ud.profile_image;
                localStorage.setItem("gbru_user", JSON.stringify(parsedUserObj));
                window.dispatchEvent(new Event("profileUpdate"));
              } catch (_) { }
            }
          }
        }

        // 2. Fetch Shipping Addresses
        const api_key = parsed.key_details?.api_key || parsed.api_key;
        const api_secret = parsed.key_details?.api_secret || parsed.api_secret;

        const addressRes = await fetch("/api/shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no, api_key, api_secret })
        });

        if (addressRes.ok) {
          const text = await addressRes.text();
          try {
            const json = JSON.parse(text);
            if (json.message?.status && Array.isArray(json.message?.data)) {
              setSavedAddresses(json.message.data);
            }
          } catch (e) {

          }
        }

        // Fetch Orders for counts
        try {
          const ordersRes = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mobile_no,
              from_date: "2020-01-01",
              to_date: new Date().toISOString().split('T')[0],
              page_size: 200,
              page: 1
            })
          });
          if (ordersRes.ok) {
            const ordersJson = await ordersRes.json();
            if (ordersJson.message?.status && Array.isArray(ordersJson.message?.data?.data)) {
              const list: any[] = ordersJson.message.data.data;
              let full = 0;
              let booking = 0;
              let pending = 0;
              let delivered = 0;
              let cancelled = 0;
              list.forEach(o => {
                const isFull = o.payupreferedmode === "Full Payment" || String(o.payment_type || "").toLowerCase() === "full payment";
                if (isFull) {
                  full++;
                } else {
                  booking++;
                }

                const status = String(o.status || "").toLowerCase();
                if (status === "cancelled") {
                  cancelled++;
                } else if (status === "delivered" || status === "completed") {
                  delivered++;
                } else {
                  pending++;
                }
              });
              setFullPaymentCount(full);
              setBookingCount(booking);
              setPendingCount(pending);
              setDeliveredCount(delivered);
              setCancelledCount(cancelled);
            }
          }
        } catch (err) {

        }
      } catch (err) {

      } finally {
        setLoading(false);
      }
    };

    fetchUserAndAddresses();
  }, []);

  // Fetch states
  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch("/api/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.message?.status && Array.isArray(json.message?.data)) {
              const uniqueStates = Array.from(new Map(json.message.data.map((item: any) => [item.name, item])).values());
              setStates(uniqueStates);
            }
          } catch (e) {

          }
        }
      } catch (e) {

      }
    }
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    async function fetchDistricts() {
      if (!formData.state) {
        setDistricts([]);
        return;
      }
      try {
        const res = await fetch("/api/districts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state_id: formData.state })
        });
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.message?.status && Array.isArray(json.message?.data)) {
              const uniqueDistricts = Array.from(new Map(json.message.data.map((item: any) => [item.name, item])).values());
              setDistricts(uniqueDistricts);
            }
          } catch (e) {

          }
        }
      } catch (e) {

      }
    }
    fetchDistricts();
  }, [formData.state]);

  // Fetch tahsils when district changes
  useEffect(() => {
    async function fetchTahsils() {
      if (!formData.district) {
        setTahsils([]);
        return;
      }
      try {
        const res = await fetch("/api/tahsils", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ district_id: formData.district })
        });
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.message?.status && Array.isArray(json.message?.data)) {
              const uniqueTahsils = Array.from(new Map(json.message.data.map((item: any) => [item.name, item])).values());
              setTahsils(uniqueTahsils);
            }
          } catch (e) {

          }
        }
      } catch (e) {

      }
    }
    fetchTahsils();
  }, [formData.district]);

  // Fetch marketplaces when tehsil changes
  useEffect(() => {
    async function fetchMarketplaces() {
      if (!formData.city) {
        setMarketplaces([]);
        return;
      }
      try {
        const res = await fetch("/api/marketplaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tehsil_id: formData.city })
        });
        if (res.ok) {
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (json.message?.status && Array.isArray(json.message?.data)) {
              const uniqueMarketplaces = Array.from(new Map(json.message.data.map((item: any) => [item.name, item])).values());
              setMarketplaces(uniqueMarketplaces);
            }
          } catch (e) {

          }
        }
      } catch (e) {

      }
    }
    fetchMarketplaces();
  }, [formData.city]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restrict size to 1 MB (1 * 1024 * 1024 bytes)
    const MAX_SIZE = 1 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast("Photo size must be less than 1 MB.", "error");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split('-')[1];

      if (!mobile_no) return;

      const formData = new FormData();
      formData.append("mobile_no", mobile_no);
      formData.append("file", file);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData
      });

      const resJson = await res.json();
      if (resJson.message?.status) {
        // Fetch fresh user details to get the absolute CDN image URL
        const detailsRes = await fetch('/api/user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile_no })
        });

        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData?.message?.status && detailsData?.message?.data) {
            const ud = detailsData.message.data;
            if (ud.profile_image) {
              setProfileImage(ud.profile_image);
              parsed.profile_image = ud.profile_image;
              localStorage.setItem("gbru_user", JSON.stringify(parsed));
              window.dispatchEvent(new Event("profileUpdate"));
            }
          }
        }
      }
    } catch (err) {

    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobile || !formData.pin || !formData.marketplace || !formData.city || !formData.district || !formData.state || !formData.address1) {
      showToast("Please fill all required fields", "warning");
      return;
    }

    setIsSavingAddress(true);
    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) {
        showToast("Please login first", "error");
        return;
      }

      const user = JSON.parse(userStr);
      let mobile_no = user.mobile_no || user.user_id || user.customer_id;
      if (mobile_no && mobile_no.includes("@")) {
        mobile_no = mobile_no.split("@")[0];
      }
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;
      const email_id = user.user_id && user.user_id.includes("@") ? user.user_id : (user.email || "");

      const selectedMarketplace = marketplaces.find((item: any) => String(item.id) === formData.marketplace);
      const selectedTahsil = tahsils.find((item: any) => String(item.id) === formData.city);
      const selectedDistrict = districts.find((item: any) => String(item.id) === formData.district);
      const address_data: any = {
        address_title: formData.fullName,
        address_line1: formData.address1,
        address_line2: formData.address2 || "",
        marketplace: selectedMarketplace?.id || formData.marketplace,
        tahsil: selectedTahsil?.id || formData.city,
        district: selectedDistrict?.id || formData.district,
        state: formData.state,
        pincode: formData.pin,
        country: "India",
        email_id: email_id,
        phone: formData.mobile
      };

      if (editingAddressName) {
        address_data.name = editingAddressName;
      }

      const endpoint = editingAddressName ? "/api/shipping-address/update" : "/api/shipping-address/add";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, address_data })
      });

      const text_json = await res.text();
      let json;
      try {
        json = JSON.parse(text_json);
      } catch (e) {

        json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
      }
      if (res.ok && json.message?.status) {
        const returnedAddress = json.message.data;
        if (editingAddressName) {
          const updatedAddresses = savedAddresses.map(a =>
            a.name === editingAddressName ? returnedAddress : a
          );
          setSavedAddresses(updatedAddresses);
        } else {
          setSavedAddresses([...savedAddresses, returnedAddress]);
        }
        setShowAddAddressModal(false);
        setEditingAddressName(null);
        setFormData({
          fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "", saveAddress: false
        });
        showToast(editingAddressName ? "Address updated successfully" : "Address saved successfully", "success");
      } else {
        let errorMessage = json.error || json.message?.message || "Failed to save address";
        if (json._server_messages) {
          try {
            const serverMessages = JSON.parse(json._server_messages);
            if (serverMessages.length > 0) {
              const msgObj = JSON.parse(serverMessages[0]);
              if (msgObj.message) {
                errorMessage = msgObj.message.replace(/<[^>]*>?/gm, '');
              }
            }
          } catch (e) {
            // Ignore
          }
        }
        showToast(errorMessage, "error");
      }
    } catch (e) {

      showToast("Error saving address", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (name: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    // Optimistically remove from state for now
    const previousAddresses = [...savedAddresses];
    const updatedAddresses = savedAddresses.filter(a => a.name !== name);
    setSavedAddresses(updatedAddresses);

    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      let mobile_no = user.mobile_no || user.user_id || user.customer_id;
      if (mobile_no && mobile_no.includes("@")) {
        mobile_no = mobile_no.split("@")[0];
      }
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;

      const res = await fetch("/api/shipping-address/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, name })
      });

      const text_json = await res.text();
      let json;
      try {
        json = JSON.parse(text_json);
      } catch (e) {

        json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
      }
      if (!res.ok || !json.message?.status) {
        setSavedAddresses(previousAddresses);
        showToast(json.error || json.message?.message || "Failed to delete address", "error");
      } else {
        showToast("Address deleted successfully", "success");
      }
    } catch (e) {

      setSavedAddresses(previousAddresses);
      showToast("Error deleting address", "error");
    }
  };

  const handleMakePrimary = async (name: string) => {
    // Optimistically update UI
    const previousAddresses = [...savedAddresses];

    setSavedAddresses(prev => prev.map(a => ({
      ...a,
      is_primary: a.name === name ? 1 : 0
    })));

    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      let mobile_no = user.mobile_no || user.user_id || user.customer_id;
      if (mobile_no && mobile_no.includes("@")) {
        mobile_no = mobile_no.split("@")[0];
      }
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;

      const res = await fetch("/api/shipping-address/make-primary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, name })
      });

      const text_json = await res.text();
      let json;
      try {
        json = JSON.parse(text_json);
      } catch (e) {

        json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
      }
      if (!res.ok || !json.message?.status) {
        setSavedAddresses(previousAddresses);
        showToast(json.error || json.message?.message || "Failed to set primary address", "error");
      } else {
        showToast("Primary address updated", "success");
      }
    } catch (e) {

      setSavedAddresses(previousAddresses);
      showToast("Error setting primary address", "error");
    }
  };

  const openEditAddressModal = (addr: any) => {
    setEditingAddressName(addr.name);
    setFormData({
      fullName: addr.address_title || "",
      mobile: addr.phone || "",
      pin: addr.pincode || "",
      marketplace: addr.marketplace || "",
      city: addr.tahsil || "",
      district: addr.district || "",
      state: addr.state || "",
      address1: addr.address_line1 || "",
      address2: addr.address_line2 || "",
      saveAddress: false
    });
    setShowAddAddressModal(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-4 lg:py-8 flex-1 flex flex-col gap-4 lg:gap-8">

        {/* ========================================== */}
        {/* MOBILE LAYOUT (mockup) — visible on mobile screens only */}
        {/* ========================================== */}
        <div className="block lg:hidden w-full" style={{ padding: "12px 20px 16px 20px" }}>
          {/* Header row: Left profile pic, Right name/desc */}
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

          {/* Subheader action row: Left phone, Right edit button */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-[14px] text-[#374151] font-semibold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-zinc-600" /> {userPhone}
            </span>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="h-9 px-5 border border-[#0D9740] hover:bg-[#0D9740]/[0.02] text-[#0D9740] font-bold text-xs rounded-lg transition-all"
            >
              Edit Profile
            </button>
          </div>

          {/* Mobile Account Shortcuts — 5 icon cards inline */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full justify-between">
            <Link
              href="/orders"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">My Purchased Orders</span>
            </Link>
            <Link
              href="/addresses"
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
            {/* <Link
              href="/notifications"
              className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Notifications</span>
            </Link> */}
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

        {/* ========================================== */}
        {/* DESKTOP LAYOUT (Original) — untouched */}
        {/* ========================================== */}
        <div className="hidden lg:flex flex-col gap-8 w-full">
          {/* User Welcome Banner Card */}
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <div className="w-16 h-16 rounded-full border border-emerald-200 bg-emerald-100 text-emerald-700 flex items-center justify-center overflow-hidden shadow-sm">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold uppercase">
                      {userName && userName !== "Loading..." ? userName.charAt(0) : "U"}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-[2px] right-[2px] bg-[#0D8534] text-white w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm translate-x-1 translate-y-1">
                  <BadgeCheck className="w-[14px] h-[14px] text-white stroke-[2.5]" />
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
                  <Phone className="w-3 h-3" /> {userPhone}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setShowEditProfileModal(true);
              }}
              className="h-10 px-6 border border-[#0D9740]/60 hover:bg-[#0D9740]/[0.02] text-[#0D9740] font-bold text-xs rounded-[10px] shadow-sm transition-all"
            >
              Edit Profile
            </button>
          </div>

          {/* Account Shortcuts */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-[#0F291B] text-sm tracking-wide uppercase">
              Account Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Link
                href="/orders"
                className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><Package className="w-5 h-5" /></div>
                <span className="font-bold text-xs text-[#0F291B]">My Purchased Orders</span>
              </Link>
              <div
                onClick={() => {
                  const el = document.getElementById("saved-addresses");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><MapPin className="w-5 h-5" /></div>
                <span className="font-bold text-xs text-[#0F291B]">My Address</span>
              </div>
              <Link href="/payments" className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><Banknote className="w-5 h-5" /></div>
                <span className="font-bold text-xs text-[#0F291B]">Payments</span>
              </Link>
              <Link href="/notifications" className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><Bell className="w-5 h-5" /></div>
                <span className="font-bold text-xs text-[#0F291B]">Notifications</span>
              </Link>
              <Link href="/help-centre" className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex flex-col items-center gap-2.5 text-center shadow-sm hover:shadow transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center"><Headphones className="w-5 h-5" /></div>
                <span className="font-bold text-xs text-[#0F291B]">Help</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">

          {/* Left Column (Orders & Addresses) */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-8">

            {/* Order Summary */}
            <div className="bg-white border-0 sm:border border-zinc-200/80 rounded-none sm:rounded-[24px] p-0 sm:p-6 shadow-none sm:shadow-sm flex flex-col gap-3 sm:gap-6">
              {/* Header Container */}
              <div className="flex justify-between items-center px-5 sm:px-0 mt-1 sm:mt-0">
                <h3 className="font-bold text-[#1F2937] text-[18px] sm:text-[#0F291B] tracking-tight">Order Summary</h3>
                <Link
                  href="/orders"
                  className="text-xs sm:text-xs text-[#0D9740] font-bold hover:underline"
                >
                  View All Orders
                </Link>
              </div>

              {/* Status Cards scroller on mobile, grid on desktop */}
              <div className="flex sm:grid sm:grid-cols-3 gap-3 overflow-x-auto pb-4 sm:pb-0 px-5 sm:px-0 scrollbar-none w-full">
                {/* Pending */}
                <Link href="/orders" className="block min-w-[130px] flex-1">
                  <div className="bg-[#F3F4F6] border border-zinc-200 rounded-xl p-4 flex flex-col items-start gap-1 justify-between h-[100px] text-left">
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">PENDING</span>
                    <span className="font-bold text-[28px] text-[#006B21]">{String(pendingCount).padStart(2, '0')}</span>
                  </div>
                </Link>

                {/* Delivered */}
                <Link href="/orders" className="block min-w-[130px] flex-1">
                  <div className="bg-[#F3F4F6] border border-zinc-200 rounded-xl p-4 flex flex-col items-start gap-1 justify-between h-[100px] text-left">
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">DELIVERED</span>
                    <span className="font-bold text-[28px] text-[#006B21]">{String(deliveredCount).padStart(2, '0')}</span>
                  </div>
                </Link>

                {/* Cancelled */}
                <Link href="/orders" className="block min-w-[130px] flex-1">
                  <div className="bg-[#F3F4F6] border border-zinc-200 rounded-xl p-4 flex flex-col items-start gap-1 justify-between h-[100px] text-left">
                    <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">CANCELLED</span>
                    <span className="font-bold text-[28px] text-[#006B21]">{String(cancelledCount).padStart(2, '0')}</span>
                  </div>
                </Link>
              </div>
            </div>

            {/* Saved Addresses */}
            <div id="saved-addresses" className="bg-white border-0 sm:border border-zinc-200/80 rounded-none sm:rounded-[24px] p-5 sm:p-6 shadow-none sm:shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#0F291B] text-[18px]">Saved Addresses</h3>
                <button
                  onClick={() => {
                    setEditingAddressName(null);
                    setFormData({
                      fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "", saveAddress: false
                    });
                    setShowAddAddressModal(true);
                  }}
                  className="text-xs text-[#0D9740] font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD NEW ADDRESS
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {savedAddresses.length === 0 ? (
                  <span className="text-xs text-zinc-500">No saved addresses found.</span>
                ) : (
                  (() => {
                    // Mobile view: only show primary address. If no primary, show first address.
                    // Desktop view: show all.
                    const primaryAddress = savedAddresses.find(a => a.is_primary === 1) || savedAddresses[0];
                    const listToRender = isMobile ? [primaryAddress] : savedAddresses;

                    return listToRender.map((addr) => (
                      <div
                        key={addr.name}
                        className="border border-[#0D9740] bg-[#0D9740]/[0.01] rounded-[20px] p-5 flex flex-col gap-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px] text-[#0D9740]"><Home className="w-4 h-4" /></span>
                            <span className="font-bold text-xs text-[#0F291B]">{addr.address_title}</span>
                          </div>
                          {addr.is_primary === 1 && (
                            <span className="bg-emerald-50 text-[#0D9740] text-[9px] font-bold py-0.5 px-2 rounded">
                              PRIMARY
                            </span>
                          )}
                          {!isMobile && addr.is_primary !== 1 && (
                            <button
                              onClick={() => handleMakePrimary(addr.name)}
                              className="bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-[9px] font-bold py-0.5 px-2 rounded"
                            >
                              MAKE PRIMARY
                            </button>
                          )}
                        </div>

                        <p className="text-zinc-700 text-xs mt-1 font-medium leading-relaxed">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                          {(() => {
                            const names = getPlaceNames(addr);
                            return `${names.marketplace}, ${names.tahsil}, ${names.district}, ${addr.state} - ${addr.pincode}`;
                          })()} <br />
                          <span className="text-zinc-500 font-medium block mt-1">Phone: {addr.phone}</span>
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider mt-2 border-t border-zinc-100 pt-3">
                          <button onClick={() => openEditAddressModal(addr)} className="text-zinc-500 hover:text-[#0D9740] flex items-center gap-1"><Edit3 className="w-3.5 h-3.5" /> EDIT</button>
                          {addr.is_primary !== 1 && (
                            <button
                              onClick={() => handleDeleteAddress(addr.name)}
                              className="text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> DELETE
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>

          </div>

          {/* Right Column (Payment Info & Support) */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Payment Info Card — Hidden on Mobile */}
            <div className="hidden lg:flex bg-[#F8F9FA] border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-5 text-left">
              <h3 className="font-bold text-[#0F291B] text-lg">Payment Info</h3>

              <div className="flex flex-col gap-3.5 text-xs text-[#374151]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Full Payment Orders</span>
                  <span className="font-bold">{String(fullPaymentCount).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Booking Orders</span>
                  <span className="font-bold">{String(bookingCount).padStart(2, '0')}</span>
                </div>
              </div>

              <Link href="/payments" className="w-full mt-2">
                <button className="w-full h-12 bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold text-xs rounded-[10px] shadow-sm transition-all">
                  Manage Payments
                </button>
              </Link>
            </div>

            {/* Mobile Redesigned Help & Support section */}
            <div className="block lg:hidden w-full bg-[#FDFDFD] pb-8" style={{ paddingTop: "12px", paddingRight: "20px", paddingLeft: "20px", gap: "16px" }}>
              <h3 className="font-bold text-[#1F2937] text-[20px] text-left mb-4 tracking-tight">Help & Support</h3>

              <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden flex flex-col w-full" style={{ minHeight: "172px" }}>
                {/* Visit FAQs */}
                <Link
                  href="/help-centre"
                  className="flex items-center justify-between p-4 border-b border-zinc-150 hover:bg-zinc-50 transition-colors w-full text-left"
                  style={{ height: "57px" }}
                >
                  <span className="flex items-center gap-3 text-[16px] text-[#1F2937] font-medium">
                    <HelpCircle className="w-5 h-5 text-[#006B21] stroke-[2]" /> Visit FAQs
                  </span>
                  <span className="text-zinc-400 text-lg">›</span>
                </Link>

                {/* Contact Support */}
                <Link
                  href="/help-centre"
                  className="flex items-center justify-between p-4 border-b border-zinc-150 hover:bg-zinc-50 transition-colors w-full text-left"
                  style={{ height: "57px" }}
                >
                  <span className="flex items-center gap-3 text-[16px] text-[#1F2937] font-medium">
                    <MessageSquare className="w-5 h-5 text-[#006B21] stroke-[2]" /> Contact Support
                  </span>
                  <span className="text-zinc-400 text-lg">›</span>
                </Link>

                {/* WhatsApp Support / Chat with Nova */}
                {whatsappEnabled === 1 && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors w-full text-left"
                    style={{ height: "57px" }}
                  >
                    <span className="flex items-center gap-3 text-[16px] text-[#1F2937] font-medium">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#006B21]/20">
                        <Image src="/assets/nova.jpeg" alt="Nova Logo" width={24} height={24} className="object-cover w-full h-full" />
                      </div>
                      Chat with Nova
                    </span>
                    <span className="text-zinc-400 text-lg">›</span>
                  </a>
                )}
              </div>
            </div>

            {/* Desktop Original Help & Support Section — untouched */}
            <div className="hidden lg:flex bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-[#0F291B] text-lg">Help & Support</h3>

              <div className="flex flex-col gap-1 text-xs text-[#374151]">
                <Link
                  href="/help-centre"
                  className="flex items-center justify-between py-3 border-b border-zinc-100 hover:text-[#0D9740] transition-colors"
                >
                  <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-zinc-500" /> Visit FAQs</span>
                  <span className="text-zinc-400">›</span>
                </Link>
                <Link href="/help-centre" className="flex items-center justify-between py-3 border-b border-zinc-100 text-left hover:text-[#0D9740] transition-colors">
                  <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-zinc-500" /> Contact Support</span>
                  <span className="text-zinc-400">›</span>
                </Link>
                {whatsappEnabled === 1 && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between py-3 bg-[#F0FAF2] mt-1 px-3 rounded-lg text-left text-[#0F291B] hover:bg-[#e4f5e8] border border-[#006B21]/20 transition-colors font-bold group"
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#006B21]/20">
                        <Image src="/assets/nova.jpeg" alt="Nova Logo" width={24} height={24} className="object-cover w-full h-full" />
                      </div>
                      Chat with Nova
                    </span>
                    <span className="text-[14px] text-zinc-400 group-hover:text-[#0D9740]">↗</span>
                  </a>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 flex flex-col gap-5 shadow-xl text-center">
            <h3 className="font-bold text-[#0F291B] text-lg text-left">Update Profile Photo</h3>

            {/* Image Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-2 border-emerald-500 overflow-hidden bg-emerald-50 flex items-center justify-center text-3xl font-bold uppercase text-emerald-700 shadow">
                {profileImage ? (
                  <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span>{userName?.charAt(0)}</span>
                )}
              </div>

              <label className="cursor-pointer bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs py-2.5 px-5 rounded-full shadow transition-all">
                Select Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-zinc-400 font-semibold mt-1">Allowed formats: JPG, PNG. Max limit: 1 MB.</p>
            </div>

            {/* Read-Only Account Details */}
            <div className="border-t border-zinc-150 pt-4 flex flex-col gap-2 text-left text-xs text-[#374151]">
              <div className="flex justify-between py-1 border-b border-zinc-50">
                <span className="text-zinc-400 font-bold">Full Name</span>
                <span className="font-semibold">{userFullName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400 font-bold">Phone Number</span>
                <span className="font-semibold">{userPhone}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="h-10 px-5 bg-[#0F291B] hover:bg-[#08170f] text-white rounded-[10px] font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Address Modal (Checkout style) */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveAddress}
            className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-8 flex flex-col gap-5 shadow-xl my-8"
          >
            <h3 className="font-bold text-[#0F291B] text-xl pb-3 border-b border-zinc-100">
              {editingAddressName ? "Edit Address" : "Add New Address"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter recipient name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-11 px-3 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500">Mobile Number</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="h-11 px-3 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <SearchableDropdown
                  label="State"
                  value={formData.state}
                  options={states}
                  placeholder="Select state"
                  getLabel={(item: any) => item.name}
                  getValue={(item: any) => item.name}
                  onSelect={(value) => setFormData({ ...formData, state: value, district: "", city: "", marketplace: "" })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <SearchableDropdown
                  label="District"
                  value={formData.district}
                  options={districts}
                  disabled={!formData.state}
                  placeholder="Select district"
                  getLabel={(item: any) => item.name}
                  getValue={(item: any) => String(item.id)}
                  onSelect={(value) => setFormData({ ...formData, district: value, city: "", marketplace: "" })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <SearchableDropdown
                  label="Tahsil / City"
                  value={formData.city}
                  options={tahsils}
                  disabled={!formData.district}
                  placeholder="Select tahsil"
                  getLabel={(item: any) => item.name}
                  getValue={(item: any) => String(item.id)}
                  onSelect={(value) => setFormData({ ...formData, city: value, marketplace: "" })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <SearchableDropdown
                  label="Marketplace"
                  value={formData.marketplace}
                  options={marketplaces}
                  disabled={!formData.city}
                  placeholder="Select marketplace"
                  getLabel={(item: any) => item.name}
                  getValue={(item: any) => String(item.id)}
                  onSelect={(value) => setFormData({ ...formData, marketplace: value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500">PIN Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6-digit PIN"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  className="h-11 px-3 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500">Address Line 1</label>
                <input
                  type="text"
                  required
                  placeholder="House No., Building Name, Street"
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  className="h-11 px-3 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-zinc-500">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Area, Colony, Landmark"
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                  className="h-11 px-3 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="h-11 px-6 border border-zinc-300 rounded-[10px] text-sm font-bold text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAddress}
                className="h-11 px-8 bg-[#0D9740] hover:bg-[#0a7d34] text-white rounded-[10px] font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSavingAddress ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>
                ) : (
                  editingAddressName ? "Update Address" : "Add Address"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}
