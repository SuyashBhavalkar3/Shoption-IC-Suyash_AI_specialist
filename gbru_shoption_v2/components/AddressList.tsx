"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useToast } from "./ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPlaceNames } from "@/utils/addressUtils";
import {
  Package, MapPin, Banknote, Bell, Headphones, Phone,
  Home, Plus, Edit3, Trash2, Loader2, ChevronDown, BadgeCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
    <div className="relative notranslate" ref={wrapperRef}>
      <label className="text-xs font-semibold text-zinc-500 mb-1 block">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-12 px-4 border border-zinc-200 rounded-lg text-left bg-white ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#0D9740]"} flex items-center justify-between gap-2 text-sm text-[#0F291B]`}
      >
        <span className={`${selectedItem ? "text-[#0F291B]" : "text-zinc-400"}`}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>
      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-200">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}`}
              className="w-full h-11 px-3 border border-zinc-200 rounded-xl text-sm text-[#0F291B] outline-none focus:border-[#0D9740]"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => (
                <button
                  key={getValue(item)}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-[#f3faf3] text-sm text-[#0F291B]"
                  onClick={() => {
                    onSelect(getValue(item));
                    setOpen(false);
                    setQuery("");
                  }}
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

export default function AddressList() {
  const router = useRouter();

  const [userName, setUserName] = useState("Loading...");
  const [userPhone, setUserPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddressName, setEditingAddressName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [formData, setFormData] = useState({
    fullName: "", mobile: "", pin: "", marketplace: "", city: "",
    district: "", state: "", address1: "", address2: "",
  });

  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tahsils, setTahsils] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);

  // Redirect desktop to /user-profile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      router.replace("/user-profile");
    }
  }, [router]);

  const loadProfile = () => {
    const stored = localStorage.getItem("gbru_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || parsed.customer_id?.split("-")[1];
        if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
        const fallbackName = parsed.Customer_name || parsed.customer_name || parsed.first_name || parsed.full_name || parsed.username || "User";
        setUserName(fallbackName.split(" ")[0]);
        setUserPhone(`+91 ${mobile_no}`);
        setProfileImage(parsed.profile_image || null);
        return mobile_no;
      } catch (_) { }
    }
    return "";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mobile_no = loadProfile();
        if (!mobile_no) { setLoading(false); return; }

        try {
          const res = await fetch("/api/user-details", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile_no }),
          });
          const data = await res.json();
          if (data?.message?.status && data?.message?.data) {
            const ud = data.message.data;
            setUserName(ud.Customer_name ? ud.Customer_name.split(" ")[0] : "User");
            setUserPhone(`+91 ${mobile_no}`);
            if (ud.profile_image) {
              setProfileImage(ud.profile_image);
              // Cache back
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
        } catch (_) { }

        const userStr = localStorage.getItem("gbru_user");
        if (!userStr) return;
        const parsed = JSON.parse(userStr);
        const api_key = parsed.key_details?.api_key || parsed.api_key;
        const api_secret = parsed.key_details?.api_secret || parsed.api_secret;
        const addrRes = await fetch("/api/shipping-address", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no, api_key, api_secret }),
        });
        if (addrRes.ok) {
          const json = await addrRes.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setSavedAddresses(json.message.data);
          }
        }
      } catch (_) { }
      finally { setLoading(false); }
    };
    fetchData();
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

  useEffect(() => {
    fetch("/api/states", { method: "POST", headers: { "Content-Type": "application/json" } })
      .then((r) => r.json())
      .then((json) => {
        if (json.message?.status && Array.isArray(json.message?.data)) {
          const unique = Array.from(new Map(json.message.data.map((i: any) => [i.name, i])).values());
          setStates(unique as any[]);
        }
      }).catch(() => { });
  }, []);

  useEffect(() => {
    if (!formData.state) { setDistricts([]); setTahsils([]); setMarketplaces([]); return; }
    fetch("/api/districts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: formData.state }),
    }).then((r) => r.json()).then((json) => {
      if (json.message?.status && Array.isArray(json.message?.data)) {
        const unique = Array.from(new Map(json.message.data.map((i: any) => [i.name, i])).values());
        setDistricts(unique as any[]);
      }
    }).catch(() => { });
    setFormData((p) => ({ ...p, district: "", city: "", marketplace: "" }));
  }, [formData.state]);

  useEffect(() => {
    if (!formData.state || !districts.length || !formData.district || /^\d+$/.test(formData.district)) return;
    const match = districts.find((item: any) => item.name === formData.district);
    if (match) {
      setFormData((p) => ({ ...p, district: String(match.id) }));
    }
  }, [districts, formData.state, formData.district]);

  useEffect(() => {
    if (!formData.district) { setTahsils([]); setMarketplaces([]); return; }
    fetch("/api/tahsils", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district_id: formData.district }),
    }).then((r) => r.json()).then((json) => {
      if (json.message?.status && Array.isArray(json.message?.data)) {
        const unique = Array.from(new Map(json.message.data.map((i: any) => [i.name, i])).values());
        setTahsils(unique as any[]);
      }
    }).catch(() => { });
    setFormData((p) => ({ ...p, city: "", marketplace: "" }));
  }, [formData.district]);

  useEffect(() => {
    if (!formData.district || !tahsils.length || !formData.city || /^\d+$/.test(formData.city)) return;
    const match = tahsils.find((item: any) => item.name === formData.city);
    if (match) {
      setFormData((p) => ({ ...p, city: String(match.id) }));
    }
  }, [tahsils, formData.district, formData.city]);

  useEffect(() => {
    if (!formData.city) { setMarketplaces([]); return; }
    fetch("/api/marketplaces", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tehsil_id: formData.city }),
    }).then((r) => r.json()).then((json) => {
      if (json.message?.status && Array.isArray(json.message?.data)) {
        setMarketplaces(json.message.data);
      }
    }).catch(() => { });
    setFormData((p) => ({ ...p, marketplace: "" }));
  }, [formData.city]);

  useEffect(() => {
    if (!formData.city || !marketplaces.length || !formData.marketplace || /^\d+$/.test(formData.marketplace)) return;
    const match = marketplaces.find((item: any) => item.name === formData.marketplace);
    if (match) {
      setFormData((p) => ({ ...p, marketplace: String(match.id) }));
    }
  }, [marketplaces, formData.city, formData.marketplace]);

  const openAddModal = () => {
    setEditingAddressName(null);
    setFormData({ fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "" });
    setShowAddModal(true);
  };

  const openEditModal = (addr: any) => {
    setEditingAddressName(addr.name);
    setFormData({
      fullName: addr.address_title || "", mobile: addr.phone || "",
      pin: addr.pincode || "", marketplace: addr.marketplace || "",
      city: addr.tahsil || "", district: addr.district || "",
      state: addr.state || "", address1: addr.address_line1 || "",
      address2: addr.address_line2 || "",
    });
    setShowAddModal(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.fullName || !formData.address1 || !formData.state || !formData.district || !formData.pin || !formData.mobile) {
      showToast("Please fill all required fields", "error"); return;
    }
    setIsSaving(true);
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const user = JSON.parse(stored);
      let mobile_no = user.customer_id?.split("-")[1] || user.user_id || user.mobile_no;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;
      const email_id = user.user_id?.includes("@") ? user.user_id : (user.email || "");

      const selectedMarketplace = marketplaces.find((item) => String(item.id) === formData.marketplace);
      const selectedTahsil = tahsils.find((item) => String(item.id) === formData.city);
      const selectedDistrict = districts.find((item) => String(item.id) === formData.district);
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
        email_id,
        phone: formData.mobile,
      };
      if (editingAddressName) address_data.name = editingAddressName;

      const endpoint = editingAddressName ? "/api/shipping-address/update" : "/api/shipping-address/add";
      const res = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, address_data }),
      });
      const json = await res.json();
      if (res.ok && json.message?.status) {
        const returned = json.message.data;
        if (editingAddressName) {
          setSavedAddresses((prev) => prev.map((a) => (a.name === editingAddressName ? returned : a)));
        } else {
          setSavedAddresses((prev) => [...prev, returned]);
        }
        setShowAddModal(false);
        showToast(editingAddressName ? "Address updated successfully" : "Address saved successfully", "success");
      } else {
        showToast(json.error || json.message?.message || "Failed to save address", "error");
      }
    } catch (_) {
      showToast("Error saving address", "error");
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (name: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    const prev = [...savedAddresses];
    setSavedAddresses((a) => a.filter((x) => x.name !== name));
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const user = JSON.parse(stored);
      let mobile_no = user.mobile_no || user.user_id || user.customer_id;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;
      const res = await fetch("/api/shipping-address/delete", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, name }),
      });
      const json = await res.json();
      if (!res.ok || !json.message?.status) {
        setSavedAddresses(prev);
        showToast(json.error || "Failed to delete address", "error");
      } else {
        showToast("Address deleted successfully", "success");
      }
    } catch (_) {
      setSavedAddresses(prev);
      showToast("Error deleting address", "error");
    }
  };

  const handleMakePrimary = async (name: string) => {
    const prev = [...savedAddresses];
    setSavedAddresses((a) => a.map((x) => ({ ...x, is_primary: x.name === name ? 1 : 0 })));
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const user = JSON.parse(stored);
      let mobile_no = user.mobile_no || user.user_id || user.customer_id;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;
      const res = await fetch("/api/shipping-address/make-primary", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, api_key, api_secret, name }),
      });
      const json = await res.json();
      if (!res.ok || !json.message?.status) {
        setSavedAddresses(prev);
        showToast("Failed to set primary address", "error");
      } else {
        showToast("Primary address updated", "success");
      }
    } catch (_) {
      setSavedAddresses(prev);
      showToast("Error setting primary address", "error");
    }
  };

  const inputCls = "w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#0D9740]/30 focus:border-[#0D9740] bg-white";
  const selectCls = `${inputCls} appearance-none`;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
      <Navbar />

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === "success" ? "bg-[#0D9740]" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <main className="max-w-[1280px] w-full mx-auto flex-1 flex flex-col">

        {/* Mobile header + shortcuts */}
        <div className="block lg:hidden w-full" style={{ padding: "12px 20px 16px 20px" }}>
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

          <div className="mt-4 flex flex-col gap-3">
            <span className="text-[14px] text-[#374151] font-semibold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-zinc-600" /> {userPhone}
            </span>
            <Link href="/user-profile" className="w-full h-10 flex items-center justify-center border border-[#0D9740] text-[#0D9740] font-bold text-xs rounded-lg transition-all">
              Edit Profile
            </Link>
          </div>

          {/* Shortcuts — Addresses active */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none w-full justify-between">
            <Link href="/orders" className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center"><Package className="w-4 h-4" /></div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">My Purchased Orders</span>
            </Link>
            {/* Active: Addresses */}
            <div className="bg-[#E8F3EB] border border-[#0D9740]/20 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]">
              <div className="w-8 h-8 rounded-full bg-white text-[#0D9740] flex items-center justify-center"><MapPin className="w-4 h-4" /></div>
              <span className="font-semibold text-[9px] text-[#0D9740] whitespace-nowrap">My Address</span>
            </div>
            <Link href="/payments" className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center"><Banknote className="w-4 h-4" /></div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Payments</span>
            </Link>
            <Link href="/notifications" className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center"><Bell className="w-4 h-4" /></div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Notifications</span>
            </Link>
            <Link href="/help-centre" className="bg-white border border-zinc-200/80 rounded-xl p-2.5 flex flex-col items-center gap-1.5 text-center flex-1 min-w-[62px]">
              <div className="w-8 h-8 rounded-full bg-[#E8F3EB] text-[#0D9740] flex items-center justify-center"><Headphones className="w-4 h-4" /></div>
              <span className="font-semibold text-[9px] text-[#4B5563] whitespace-nowrap">Help</span>
            </Link>
          </div>
        </div>

        {/* Addresses content */}
        <div className="px-5 pb-10 flex flex-col gap-4">
          <div className="flex items-center justify-between pt-2">
            <h2 className="font-bold text-[#1F2937] text-[18px] tracking-tight">Saved Addresses</h2>
            <button onClick={openAddModal} className="flex items-center gap-1.5 h-9 px-4 bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs rounded-lg shadow-sm transition-all">
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#0D9740] animate-spin" />
            </div>
          ) : savedAddresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-[#0D9740]" />
              </div>
              <p className="text-[#374151] font-semibold text-sm">No saved addresses yet</p>
              <p className="text-zinc-400 text-xs">Add your first delivery address to get started</p>
              <button onClick={openAddModal} className="mt-2 h-10 px-6 bg-[#0D9740] text-white font-bold text-xs rounded-xl shadow-sm">
                + Add Address
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedAddresses.map((addr) => (
                <div key={addr.name} className="border border-[#0D9740]/40 bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#0D9740] flex items-center justify-center flex-shrink-0">
                        <Home className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm text-[#0F291B]">{addr.address_title}</span>
                    </div>
                    {addr.is_primary === 1 ? (
                      <span className="bg-emerald-50 text-[#0D9740] text-[9px] font-bold py-0.5 px-2 rounded border border-[#0D9740]/20">PRIMARY</span>
                    ) : (
                      <button onClick={() => handleMakePrimary(addr.name)} className="bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-[9px] font-bold py-0.5 px-2 rounded">
                        MAKE PRIMARY
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#374151] leading-relaxed pl-9">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}<br />
                    {(() => {
                      const names = getPlaceNames(addr);
                      return `${names.marketplace ? `${names.marketplace}, ` : ""}${names.tahsil}, ${names.district}, ${addr.state} — ${addr.pincode}`;
                    })()}
                    <br />
                    <span className="text-zinc-500 font-medium mt-0.5 block">📞 {addr.phone}</span>
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider border-t border-zinc-100 pt-3 pl-1">
                    <button onClick={() => openEditModal(addr)} className="text-zinc-500 hover:text-[#0D9740] flex items-center gap-1 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {addr.is_primary !== 1 && (
                      <button onClick={() => handleDelete(addr.name)} className="text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0F291B] text-lg">{editingAddressName ? "Edit Address" : "Add New Address"}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600 text-2xl leading-none">×</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Full Name *</label>
                <input className={inputCls} placeholder="e.g. Home, Farm, Office" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Mobile Number *</label>
                <input className={inputCls} placeholder="+91 XXXXX XXXXX" value={formData.mobile} onChange={(e) => setFormData((p) => ({ ...p, mobile: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Address Line 1 *</label>
                <input className={inputCls} placeholder="House / Plot / Street" value={formData.address1} onChange={(e) => setFormData((p) => ({ ...p, address1: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">Address Line 2</label>
                <input className={inputCls} placeholder="Landmark (optional)" value={formData.address2} onChange={(e) => setFormData((p) => ({ ...p, address2: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SearchableDropdown
                    label="State"
                    value={formData.state}
                    options={states}
                    placeholder="Select state"
                    getLabel={(item: any) => item.name}
                    getValue={(item: any) => item.name}
                    onSelect={(value) => setFormData((p) => ({ ...p, state: value, district: "", city: "", marketplace: "" }))}
                  />
                </div>
                <div>
                  <SearchableDropdown
                    label="District"
                    value={formData.district}
                    options={districts}
                    disabled={!states.length || !formData.state}
                    placeholder="Select district"
                    getLabel={(item: any) => item.name}
                    getValue={(item: any) => String(item.id)}
                    onSelect={(value) => setFormData((p) => ({ ...p, district: value, city: "", marketplace: "" }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SearchableDropdown
                    label="Tahsil"
                    value={formData.city}
                    options={tahsils}
                    disabled={!districts.length || !formData.district}
                    placeholder="Select tahsil"
                    getLabel={(item: any) => item.name}
                    getValue={(item: any) => item.name}
                    onSelect={(value) => setFormData((p) => ({ ...p, city: value, marketplace: "" }))}
                  />
                </div>
                <div>
                  <SearchableDropdown
                    label="Marketplace"
                    value={formData.marketplace}
                    options={marketplaces}
                    disabled={!tahsils.length || !formData.city}
                    placeholder="Select marketplace"
                    getLabel={(item: any) => item.name}
                    getValue={(item: any) => item.name}
                    onSelect={(value) => setFormData((p) => ({ ...p, marketplace: value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-500 mb-1 block">PIN Code *</label>
                <input className={inputCls} placeholder="6-digit PIN" maxLength={6} value={formData.pin} onChange={(e) => setFormData((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "") }))} />
              </div>
            </div>
            <button onClick={handleSaveAddress} disabled={isSaving} className="w-full h-12 bg-[#0D9740] hover:bg-[#0a7d34] disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2 mt-1">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? "Saving..." : editingAddressName ? "Update Address" : "Save Address"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
