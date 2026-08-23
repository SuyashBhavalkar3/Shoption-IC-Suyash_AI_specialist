"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

  const selectedItem = options.find((item) => getValue(item) === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full text-left h-12 px-4 border border-zinc-200 rounded-[12px] bg-white ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#0D9740]"} flex items-center justify-between gap-3 text-sm text-[#0F291B]`}
      >
        <span className={`${selectedItem ? "text-[#0F291B]" : "text-zinc-400"}`}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full rounded-[16px] border border-zinc-200 bg-white shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-200">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              placeholder={`Search ${label.toLowerCase()}`}
              className="w-full h-11 px-3 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] outline-none focus:border-[#0D9740]"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
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

export default function LocationDetailsPage() {
  const router = useRouter();

  // User details from localStorage
  const [user, setUser] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [tehsil, setTehsil] = useState("");
  const [pincode, setPincode] = useState("");
  const [marketplace, setMarketplace] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [fromDocument, setFromDocument] = useState("");

  // Data Options
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [tahsils, setTahsils] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);

  // UI Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Load user from localStorage & load initial states
  useEffect(() => {
    const stored = localStorage.getItem("gbru_user");
    if (!stored) {
      router.push("/cart");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.status?.toUpperCase() === "ACTIVE" && parsed.is_completed) {
      router.push("/proceed-to-checkout");
      return;
    }
    setUser(parsed);
    if (parsed.Customer_name) {
      setName(parsed.Customer_name);
    } else if (parsed.name) {
      setName(parsed.name);
    }
    if (parsed.email) {
      setEmail(parsed.email);
    }

    async function loadStates() {
      try {
        const res = await fetch("/api/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setStates(json.message.data);
          }
        }
      } catch (err) {
        
      }
    }

    const isLeadId = (value: any): value is string =>
      typeof value === "string" && value.startsWith("CRM-LEAD");

    if (parsed.lead_id && isLeadId(parsed.lead_id)) {
      setFromDocument(parsed.lead_id);
    }

    loadStates();
  }, [router]);

  // Load districts when state changes
  useEffect(() => {
    if (!state) {
      setDistricts([]);
      setDistrict("");
      return;
    }
    async function loadDistricts() {
      try {
        const res = await fetch("/api/districts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state_id: state })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setDistricts(json.message.data);
          }
        }
      } catch (err) {
        
      }
    }
    loadDistricts();
  }, [state]);

  // Load tahsils when district changes
  useEffect(() => {
    if (!district) {
      setTahsils([]);
      setTehsil("");
      return;
    }
    async function loadTahsils() {
      try {
        const res = await fetch("/api/tahsils", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ district_id: district })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setTahsils(json.message.data);
          }
        }
      } catch (err) {
        
      }
    }
    loadTahsils();
  }, [district]);

  // Load marketplaces when tehsil changes
  useEffect(() => {
    if (!tehsil) {
      setMarketplaces([]);
      setMarketplace("");
      return;
    }
    async function loadMarketplaces() {
      try {
        const res = await fetch("/api/marketplaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tehsil_id: tehsil })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setMarketplaces(json.message.data);
          }
        }
      } catch (err) {
        
      }
    }
    loadMarketplaces();
  }, [tehsil]);

  const createLead = async (mobile_no: string, name: string) => {
    try {
      const leadRes = await fetch("/api/lead-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, name })
      });

      const leadJson = await leadRes.json();
      const leadValue = leadJson.message?.lead || leadJson.lead;
      if (leadRes.ok && leadValue) {
        return leadValue;
      }

      return null;
    } catch (_err) {
      return null;
    }
  };

  const resolveFromDocument = async (mobile_no: string, name: string, fallback?: string): Promise<string | null> => {
    let actualLeadId: string | null = fallback ?? null;
    if (!actualLeadId) {
      actualLeadId = await createLead(mobile_no, name);
    }

    if (actualLeadId) {
      setFromDocument(actualLeadId);
      const storedUser = window.localStorage.getItem("gbru_user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          parsedUser.lead_id = actualLeadId;
          window.localStorage.setItem("gbru_user", JSON.stringify(parsedUser));
        } catch (_e) {
        }
      }
    }

    return actualLeadId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !state || !district || !tehsil || !marketplace || !pincode || !addressLine1) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const mobile_no = user.mobile_no || user.customer_id?.split('-')[1] || user.user_id;
      if (!mobile_no) {
        setErrorMsg("User session expired. Please log in again.");
        setSubmitting(false);
        return;
      }

      const isLeadId = (value: any): value is string =>
        typeof value === "string" && value.startsWith("CRM-LEAD");

      let actualLeadId: string | null = null;
      if (isLeadId(user.lead_id)) {
        actualLeadId = user.lead_id;
      } else if (isLeadId(fromDocument)) {
        actualLeadId = fromDocument;
      }

      if (!actualLeadId) {
        actualLeadId = await resolveFromDocument(mobile_no, name);
      }

      if (actualLeadId && !isLeadId(actualLeadId)) {
        actualLeadId = await resolveFromDocument(mobile_no, name);
      }

      if (!actualLeadId) {
        setErrorMsg("Unable to obtain lead document. Please try again.");
        setSubmitting(false);
        return;
      }

      // Step 2: Submit Farmer Registration with the lead ID as from_document
      const payload = {
        from_document: actualLeadId,
        first_name: name,
        email_id: email,
        mobile_no: mobile_no,
        phone: mobile_no,
        country: "India",
        state: state,
        district: parseInt(district),
        tahshil: parseInt(tehsil),
        marketplace: parseInt(marketplace),
        pincode: parseInt(pincode),
        address_line_1: addressLine1,
        address_line_2: addressLine2
      };

      const res = await fetch("/api/farmer-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      
      if (res.ok && !json.error && (json.message?.status || json.message)) {
        // Also update local user status to ACTIVE
        const updatedUser = { ...user, status: "ACTIVE", is_completed: true };
        localStorage.setItem("gbru_user", JSON.stringify(updatedUser));

        setToastType("success");
        setToastMessage("Location details saved successfully!");
        setTimeout(() => {
          setToastMessage("");
          router.push("/proceed-to-checkout");
        }, 1500);
      } else {
        setErrorMsg(json.message?.message || json.error || "Failed to save details. Please try again.");
      }
    } catch (_err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-roboto flex flex-col relative">
      <Navbar />

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

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-10 md:py-16 flex-1 flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
        
        {/* Form Container */}
        <div className="w-full md:w-[60%] flex flex-col gap-6 text-left">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F291B] tracking-tight leading-tight mb-2">
              Share your location details, we'll show prices suited to your area 🌾
            </h1>
            <p className="text-zinc-500 text-sm md:text-base font-medium">
              Providing your location allows GBRU best pricing according to your area.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold rounded-xl px-4 py-3">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add your name"
                className="h-12 px-4 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] focus:outline-[#0D9740] bg-[#F5F7FA]/50"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="h-12 px-4 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] focus:outline-[#0D9740] bg-[#F5F7FA]/50"
              />
            </div>

            {/* State */}
            <div className="flex flex-col gap-1.5">
              <SearchableDropdown
                label="State"
                value={state}
                options={states}
                placeholder="Select state"
                getLabel={(item) => item.name}
                getValue={(item) => item.name}
                onSelect={(value) => {
                  setState(value);
                  setDistrict("");
                  setTehsil("");
                  setMarketplace("");
                  setDistricts([]);
                  setTahsils([]);
                  setMarketplaces([]);
                }}
              />
            </div>

            {/* District */}
            <div className="flex flex-col gap-1.5">
              <SearchableDropdown
                label="District"
                value={district}
                options={districts}
                disabled={!state}
                placeholder="Select district"
                getLabel={(item) => item.name}
                getValue={(item) => String(item.id)}
                onSelect={(value) => {
                  setDistrict(value);
                  setTehsil("");
                  setMarketplace("");
                  setTahsils([]);
                  setMarketplaces([]);
                }}
              />
            </div>

            {/* Tehsil */}
            <div className="flex flex-col gap-1.5">
              <SearchableDropdown
                label="Tehsil"
                value={tehsil}
                options={tahsils}
                disabled={!district}
                placeholder="Select tehsil"
                getLabel={(item) => item.name}
                getValue={(item) => String(item.id)}
                onSelect={(value) => {
                  setTehsil(value);
                  setMarketplace("");
                  setMarketplaces([]);
                }}
              />
            </div>

            {/* Marketplace */}
            <div className="flex flex-col gap-1.5">
              <SearchableDropdown
                label="Marketplace"
                value={marketplace}
                options={marketplaces}
                disabled={!tehsil}
                placeholder="Select marketplace"
                getLabel={(item) => item.name}
                getValue={(item) => String(item.id)}
                onSelect={(value) => setMarketplace(value)}
              />
            </div>

            {/* Pincode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pincode</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="6-digit PIN"
                className="h-12 px-4 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] focus:outline-[#0D9740] bg-[#F5F7FA]/50"
              />
            </div>

            {/* Address Line 1 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address Line 1</label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="address line 1"
                className="h-12 px-4 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] focus:outline-[#0D9740] bg-[#F5F7FA]/50"
              />
            </div>

            {/* Address Line 2 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address Line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="address line 2"
                className="h-12 px-4 border border-zinc-200 rounded-[12px] text-sm text-[#0F291B] focus:outline-[#0D9740] bg-[#F5F7FA]/50"
              />
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 flex justify-center mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-3.5 bg-[#006B21] hover:bg-[#005a1b] text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue <span>→</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Side Visual Banner */}
        <div className="w-full md:w-[40%] flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-[36px] overflow-hidden shadow-lg border border-zinc-150">
            <Image
              src="/assets/precision_farming_support.png"
              alt="Precision Farming Support"
              fill
              className="object-cover"
              sizes="(max-w-768px) 100vw, 40vw"
              priority
            />
            {/* Context Widget overlay */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white/40 flex items-center gap-4 text-left shadow-lg">
              <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500">
                <Image
                  src="/assets/precision_farming_support.png"
                  alt="Context Thumbnail"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">REGIONAL CONTEXT</span>
                <h4 className="text-sm font-extrabold text-[#0F291B] font-roboto">Precision Farming Support</h4>
                <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">We'll check your location to give you the best price</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
