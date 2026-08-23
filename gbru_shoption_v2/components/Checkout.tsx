"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastContext";
import Navbar from "@/components/Navbar";
import { getPlaceNames } from "@/utils/addressUtils";
import { getMobileNo } from "@/utils/cartUtils";

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
    <div className="relative">
      <label className="text-xs font-bold text-[#0F291B]">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-12 px-4 border border-zinc-200 rounded-[10px] bg-white text-left ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#0D9740]"} flex items-center justify-between gap-2 text-sm text-[#0F291B]`}
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

export default function Checkout() {
  const router = useRouter();
  const { showToast } = useToast();
  // Interactivity States
  const [paymentMode, setPaymentMode] = useState<"full" | "booking">("full");
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isOffersOpen, setIsOffersOpen] = useState(true);
  const [isAmbassadorOpen, setIsAmbassadorOpen] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState("");
  const [ambassadorApplied, setAmbassadorApplied] = useState(false);
  const [ambassadorError, setAmbassadorError] = useState("");

  // Dynamic Checkout States
  const [checkoutDetails, setCheckoutDetails] = useState<any>(null);
  const [proceedData, setProceedData] = useState<any>(null);
  const [defaultProceedData, setDefaultProceedData] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-reset invalid coupon message after 2 seconds
  useEffect(() => {
    if (couponCode === "Invalid code") {
      const timer = setTimeout(() => {
        setCouponCode("");
        setCouponError("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [couponCode]);

  // Address Interactivity States
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isSelectingAddress, setIsSelectingAddress] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(0);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingAddressName, setEditingAddressName] = useState<string | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: "alert", title: "", message: "" });

  const showAlert = (message: string, title = "Message") => {
    setModalConfig({ isOpen: true, type: "alert", title, message });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = "Confirm") => {
    setModalConfig({ isOpen: true, type: "confirm", title, message, onConfirm });
  };

  const [states, setStates] = useState<any[]>([]);

  const [districts, setDistricts] = useState<any[]>([]);
  const [tahsils, setTahsils] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);

  const fetchProceedData = async (items: any[], couponCodeToApply?: string) => {
    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const mobile_no = getMobileNo(user);
      if (!mobile_no) return;

      const formattedItems = items.map(i => ({
        item: i.item,
        quantity: i.quantity
      }));

      const res = await fetch("/api/cart/proceed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          items: formattedItems,
          coupon_code: couponCodeToApply || null
        })
      });
      const data = await res.json();

      if (data?.message?.data?.requires_full_registration) {
        if (userStr) {
          const u = JSON.parse(userStr);
          u.status = "IN PROGRESS";
          localStorage.setItem("gbru_user", JSON.stringify(u));
        }
        router.push("/location-details");
        return;
      }

      if (data?.message?.status && data.message.data) {
        setProceedData(data.message.data);
        if (!couponCodeToApply) {
          setDefaultProceedData(data.message.data);
        }
        const appliedCoupon = data.message.data.coupon;
        if (appliedCoupon && !appliedCoupon.error) {
          setCouponApplied(true);
          setCouponCode(appliedCoupon.code || couponCodeToApply || "");
          setCouponError("");
          if (couponCodeToApply) {
            showToast("coupon applied successfully", "success");
          }
        } else if (couponCodeToApply) {
          setCouponError(`${couponCodeToApply} invalid`);
          setCouponCode("Invalid code");
          setCouponApplied(false);
          showToast("coupon failed", "error");
        }
      } else {
        if (couponCodeToApply) {
          setCouponError(`${couponCodeToApply} invalid`);
          setCouponCode("Invalid code");
          setCouponApplied(false);
          showToast("coupon failed", "error");
        }
      }
    } catch (e) {
      if (couponCodeToApply) {
        showToast("coupon failed", "error");
      }
    }
  };

  useEffect(() => {
    async function fetchAddressesAndCheckout() {
      try {
        setLoadingCheckout(true);
        const userStr = localStorage.getItem("gbru_user");
        if (!userStr) {
          setLoadingAddresses(false);
          setIsAddingAddress(true);
          setLoadingCheckout(false);
          return;
        }

        const user = JSON.parse(userStr);
        if (user.status?.toUpperCase() === "IN PROGRESS") {
          router.push("/location-details");
          return;
        }
        const mobile_no = getMobileNo(user);

        // Real-time API check fallback in case localStorage status is stale or missing
        try {
          const statusRes = await fetch('/api/user-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_no })
          });
          if (statusRes.ok) {
            const statusJson = await statusRes.json();
            if (statusJson?.message?.status && statusJson?.message?.data) {
              const currentStatus = statusJson.message.data.status;
              if (currentStatus?.toUpperCase() === "IN PROGRESS") {
                const updatedUser = { ...user, status: "IN PROGRESS" };
                localStorage.setItem("gbru_user", JSON.stringify(updatedUser));
                router.push("/location-details");
                return;
              }
            }
          }
        } catch (e) {
          
        }

        const api_key = user.key_details?.api_key || user.api_key;
        const api_secret = user.key_details?.api_secret || user.api_secret;

        // 1. Fetch Shipping Addresses
        const res = await fetch("/api/shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no, api_key, api_secret })
        });

        if (res.ok) {
          const json = await res.json();
          
          if (json.message?.status && Array.isArray(json.message?.data)) {
            // Intercept: If shipping address list is empty, open the add address form inline
            if (json.message.data.length === 0) {
              
              setIsAddingAddress(true);
              setIsAddressSaved(false);
            }

            setSavedAddresses(json.message.data);
            setIsAddressSaved(true);
            const primaryIdx = json.message.data.findIndex((a: any) => a.is_primary === 1);
            if (primaryIdx !== -1) setSelectedAddressIndex(primaryIdx);
          } else {
            
            setIsAddingAddress(true);
          }
        } else {
          
          setIsAddingAddress(true);
        }

        // 2. Fetch Checkout Details
        const checkoutMobile = getMobileNo(user);
        const checkoutRes = await fetch("/api/cart/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no: checkoutMobile })
        });
        if (checkoutRes.ok) {
          const text_checkoutJson = await checkoutRes.text();
          let checkoutJson;
          try {
            checkoutJson = JSON.parse(text_checkoutJson);
          } catch (e) {
            
            checkoutJson = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
          }
          if (checkoutJson.message?.status && checkoutJson.message.data) {
            const checkoutItems = checkoutJson.message.data.items || [];
            if (checkoutItems.length === 0) {
              router.push("/cart");
              return;
            }
            setCheckoutDetails(checkoutJson.message.data);

            // Populate fallback proceed data immediately from items
            const fallbackItems = checkoutJson.message.data.items || [];
            const mrpSubtotal = fallbackItems.reduce((sum: number, i: any) => {
              const mrp = i.mrp || i.price || i.rate || 0;
              const qty = i.quantity || i.qty || 1;
              return sum + (mrp * qty);
            }, 0);
            const payableAmount = fallbackItems.reduce((sum: number, i: any) => {
              if (i.amount) return sum + Number(i.amount);
              const rate = i.price || i.rate || 0;
              const qty = i.quantity || i.qty || 1;
              return sum + (rate * qty);
            }, 0);

            const totalFullPaymentDiscount = fallbackItems.reduce((sum: number, i: any) => {
              return sum + Number(i.full_payment_discount || 0);
            }, 0);

            const totalCodDiscount = fallbackItems.reduce((sum: number, i: any) => {
              return sum + Number(i.cod_discount || 0);
            }, 0);

            const totalCodBooking = fallbackItems.reduce((sum: number, i: any) => {
              return sum + Number(i.cod_display || 0);
            }, 0);

            const mockProceedData = {
              payment_summary: {
                original_amount: mrpSubtotal,
                full_payment: {
                  payable_amount: payableAmount,
                  discount_amount: totalFullPaymentDiscount,
                  label: "Discount",
                  discount_amount_without_gst: 0,
                  coupen_discount: 0
                },
                cash_on_delivery: {
                  pay_now: totalCodBooking,
                  discount_amount: totalCodDiscount,
                  pay_on_delivery: Math.max(0, payableAmount - totalCodBooking),
                  coupen_discount: 0
                }
              },
              grand_total: payableAmount,
              sub_total: payableAmount
            };
            setProceedData(mockProceedData);
            setDefaultProceedData(mockProceedData);

            // Set paymentMode based on checkout items' payment type
            const firstItem = checkoutJson.message.data.items?.[0];
            if (firstItem?.payment_type === "Cash On Delivery") {
              setPaymentMode("booking");
            } else {
              setPaymentMode("full");
            }

            // Immediately load Proceed details
            await fetchProceedData(checkoutJson.message.data.items);
          }
        }
      } catch (e) {
        
        setIsAddingAddress(true);
      } finally {
        setLoadingAddresses(false);
        setLoadingCheckout(false);
      }
    }

    async function fetchStates() {
      try {
        const res = await fetch("/api/states", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (res.ok) {
          const text_json = await res.text();
          let json;
          try {
            json = JSON.parse(text_json);
          } catch (e) {
            
            json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
          }
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setStates(json.message.data);
          }
        }
      } catch (e) {
        
      }
    }

    fetchAddressesAndCheckout();
    fetchStates();
  }, []);

  // Address Form States
  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    pin: "",
    marketplace: "",
    city: "", // Tehsil
    district: "",
    state: "",
    address1: "",
    address2: "",
    saveAddress: false,
  });

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
          const text_json = await res.text();
          let json;
          try {
            json = JSON.parse(text_json);
          } catch (e) {
            
            json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
          }
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setDistricts(json.message.data);
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
          const text_json = await res.text();
          let json;
          try {
            json = JSON.parse(text_json);
          } catch (e) {
            
            json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
          }
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setTahsils(json.message.data);
          }
        }
      } catch (e) {
        
      }
    }
    fetchTahsils();
  }, [formData.district]);

  useEffect(() => {
    if (!formData.district || !tahsils.length || !formData.city || /^\d+$/.test(formData.city)) return;
    const match = tahsils.find((item: any) => item.name === formData.city);
    if (match) {
      setFormData((p) => ({ ...p, city: String(match.id) }));
    }
  }, [tahsils, formData.district, formData.city]);

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
          const text_json = await res.text();
          let json;
          try {
            json = JSON.parse(text_json);
          } catch (e) {
            
            json = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
          }
          if (json.message?.status && Array.isArray(json.message?.data)) {
            setMarketplaces(json.message.data);
          }
        }
      } catch (e) {
        
      }
    }
    fetchMarketplaces();
  }, [formData.city]);

  useEffect(() => {
    if (!formData.city || !marketplaces.length || !formData.marketplace || /^\d+$/.test(formData.marketplace)) return;
    const match = marketplaces.find((item: any) => item.name === formData.marketplace);
    if (match) {
      setFormData((p) => ({ ...p, marketplace: String(match.id) }));
    }
  }, [marketplaces, formData.city, formData.marketplace]);

  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const requestDeleteAddress = (name: string) => {
    showConfirm("Are you sure you want to delete this address?", () => performDeleteAddress(name), "Delete Address");
  };

  const performDeleteAddress = async (name: string) => {
    // Optimistically remove from state for now
    const previousAddresses = [...savedAddresses];
    const previousIndex = selectedAddressIndex;

    const updatedAddresses = savedAddresses.filter(a => a.name !== name);
    setSavedAddresses(updatedAddresses);
    if (selectedAddressIndex >= updatedAddresses.length) {
      setSelectedAddressIndex(Math.max(0, updatedAddresses.length - 1));
    }
    if (updatedAddresses.length === 0) {
      setIsAddressSaved(false);
      setIsAddingAddress(true);
    }

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
        // Revert optimistic update
        setSavedAddresses(previousAddresses);
        setSelectedAddressIndex(previousIndex);
        if (previousAddresses.length > 0) {
          setIsAddressSaved(true);
          setIsAddingAddress(false);
        }

        let errorMsg = json.error || json.message?.message || "Failed to delete address";
        if (json._server_messages) {
          try {
            const serverMsgs = JSON.parse(json._server_messages);
            if (serverMsgs.length > 0) {
              const msgObj = JSON.parse(serverMsgs[0]);
              if (msgObj.message) {
                errorMsg = msgObj.message.replace(/<[^>]*>?/gm, '');
              }
            }
          } catch (e) { }
        }
        showToast(errorMsg, "error");
      }
    } catch (e) {
      
      // Revert optimistic update
      setSavedAddresses(previousAddresses);
      setSelectedAddressIndex(previousIndex);
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
        // Revert optimistic update
        setSavedAddresses(previousAddresses);

        let errorMsg = json.error || json.message?.message || "Failed to set primary address";
        if (json._server_messages) {
          try {
            const serverMsgs = JSON.parse(json._server_messages);
            if (serverMsgs.length > 0) {
              const msgObj = JSON.parse(serverMsgs[0]);
              if (msgObj.message) {
                errorMsg = msgObj.message.replace(/<[^>]*>?/gm, '');
              }
            }
          } catch (e) { }
        }
        showToast(errorMsg, "error");
      }
    } catch (e) {
      
      // Revert optimistic update
      setSavedAddresses(previousAddresses);
      showToast("Error setting primary address", "error");
    }
  };

  const handleSaveAddress = async () => {
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
          const idx = updatedAddresses.findIndex(a => a.name === returnedAddress.name);
          if (idx !== -1) setSelectedAddressIndex(idx);
        } else {
          const newAddresses = [...savedAddresses, returnedAddress];
          setSavedAddresses(newAddresses);
          setSelectedAddressIndex(newAddresses.length - 1);
        }
        setIsAddressSaved(true);
        setIsAddingAddress(false);
        setIsSelectingAddress(false);
        setEditingAddressName(null);
        setFormData({
          fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "", saveAddress: false
        });
      } else {
        let errorMsg = json.error || json.message?.message || "Failed to save address";

        if (json._server_messages) {
          try {
            const serverMsgs = JSON.parse(json._server_messages);
            if (serverMsgs.length > 0) {
              const msgObj = JSON.parse(serverMsgs[0]);
              // Remove HTML tags for clean alert text
              if (msgObj.message) {
                errorMsg = msgObj.message.replace(/<[^>]*>?/gm, '');
              }
            }
          } catch (e) {
            
          }
        }

        showAlert(errorMsg, "Error Saving Address");
      }
    } catch (e) {
      
      showToast("Error saving address", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode) return;
    setPincodeStatus("checking");
    setTimeout(() => {
      // Mock check: pincodes starting with 1, 2, 3, or 4 are available
      if (/^[1-4]/.test(pincode)) {
        setPincodeStatus("available");
      } else {
        setPincodeStatus("unavailable");
      }
    }, 800);
  };

  const applyCoupon = () => {
    if (!couponCode) return;
    if (!checkoutDetails?.items) return;
    fetchProceedData(checkoutDetails.items, couponCode);
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponError("");
    if (checkoutDetails?.items) {
      fetchProceedData(checkoutDetails.items, "");
    }
  };

  const applyAmbassadorCode = async () => {
    if (!ambassadorCode) return;
    setAmbassadorError("");
    setAmbassadorApplied(false);
    
    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) {
        showToast("Please log in to validate ambassador code", "error");
        return;
      }
      const user = JSON.parse(userStr);
      const mobile_no = getMobileNo(user);
      if (!mobile_no) {
        showToast("Customer profile not found", "error");
        return;
      }

      const res = await fetch("/api/cart/validate-ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, brand_ambassador: ambassadorCode }),
      });

      const data = await res.json();
      
      if (data?.message?.status) {
        setAmbassadorApplied(true);
        showToast(data.message.message || "Brand Ambassador Code Applied!", "success");
      } else {
        const errorMsg = data?.message?.message || data?.error || "Invalid Ambassador Code";
        setAmbassadorError(errorMsg);
        showToast(errorMsg, "error");
      }
    } catch (err: any) {
      setAmbassadorError("Failed to validate ambassador code");
      showToast("Failed to validate ambassador code", "error");
    }
  };

  const handleRemoveAmbassadorCode = () => {
    setAmbassadorCode("");
    setAmbassadorApplied(false);
    setAmbassadorError("");
    showToast("Ambassador Code Removed", "info");
  };

  const handleSelectPaymentMode = (mode: "full" | "booking") => {
    setPaymentMode(mode);
  };

  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    if (!checkoutDetails?.items) {
      setModalConfig({
        isOpen: true,
        title: "Alert",
        message: "No items in checkout details.",
        type: "alert"
      });
      return;
    }
    setPlacingOrder(true);
    try {
      const userStr = localStorage.getItem("gbru_user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const mobile_no = getMobileNo(user);
      if (!mobile_no) return;

      const formattedItems = checkoutDetails.items.map((i: any) => ({
        item: i.item,
        quantity: i.quantity
      }));

      // Determine payment type and transaction amount dynamically based on paymentMode selection
      const payment_type = paymentMode === "full" ? "Full Payment" : "Cash On Delivery";
      const transaction_amount = paymentMode === "full"
        ? (proceedData?.payment_summary?.full_payment?.payable_amount || total)
        : (defaultProceedData?.payment_summary?.cash_on_delivery?.pay_now || proceedData?.payment_summary?.cash_on_delivery?.pay_now);

      const email = user.user_id && user.user_id.includes("@") ? user.user_id : (user.email || "");

      const res = await fetch("/api/cart/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          items: formattedItems,
          coupon_code: couponApplied ? (proceedData?.coupon?.code || couponCode) : null,
          payment_type,
          transaction_amount,
          email
        })
      });

      const text_data = await res.text();
      let data;
      try {
        data = JSON.parse(text_data);
      } catch (e) {
        
        data = { message: { status: false, message: "Invalid JSON response" }, error: "Invalid JSON response" };
      }
      if (data.status && data.token && data.actionUrl) {
        // Clear cart to avoid showing stale cart items upon return
        localStorage.removeItem("gbru_cart");
        window.dispatchEvent(new Event("cartUpdate"));

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
        setModalConfig({
          isOpen: true,
          title: "Error",
          message: data.error || data.message || "Failed to place order.",
          type: "alert"
        });
      }
    } catch (e: any) {
      
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: "An error occurred while placing your order.",
        type: "alert"
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null) return "0.00";
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Pricing calculations based on paymentMode and proceedData
  const activePricingData = proceedData || defaultProceedData;
  const subtotal = activePricingData?.payment_summary?.original_amount || 0;
  const gst = activePricingData?.total_taxes_and_charges || 0;
  const delivery = 0;

  // Total discount
  const totalDiscount = paymentMode === "booking"
    ? (activePricingData?.payment_summary?.cash_on_delivery?.discount_amount || 0)
    : (activePricingData?.payment_summary?.full_payment?.discount_amount || 0);

  // Coupon discount
  const couponDiscount = paymentMode === "booking"
    ? (activePricingData?.payment_summary?.cash_on_delivery?.coupen_discount || 0)
    : (activePricingData?.payment_summary?.full_payment?.coupen_discount || 0);

  // Normal discount (full payment / COD specific discount before coupon)
  const normalDiscount = Math.max(0, totalDiscount - couponDiscount);

  const total = activePricingData?.grand_total || 0;

  // Full Payment Card helper variables
  const fullTotalDiscount = proceedData?.payment_summary?.full_payment?.discount_amount || 0;
  const fullCouponDiscount = proceedData?.payment_summary?.full_payment?.coupen_discount || 0;
  const fullNormalDiscount = Math.max(0, fullTotalDiscount - fullCouponDiscount);

  // Booking Card helper variables
  const bookingPricingData = proceedData || defaultProceedData;
  const bookingTotalDiscount = bookingPricingData?.payment_summary?.cash_on_delivery?.discount_amount || 0;
  const bookingCouponDiscount = bookingPricingData?.payment_summary?.cash_on_delivery?.coupen_discount || 0;
  const bookingNormalDiscount = Math.max(0, bookingTotalDiscount - bookingCouponDiscount);

  if (loadingCheckout) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col pb-16">
        <Navbar />
        <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 flex flex-col gap-6 animate-pulse">
          <div className="h-6 w-32 bg-zinc-200 rounded-[8px] mb-2"></div>
          <div className="h-10 w-64 bg-zinc-200 rounded-[12px] mb-2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="h-48 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6"></div>
              <div className="h-48 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6"></div>
            </div>
            <div className="lg:col-span-4 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6 h-96"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col pb-16">
      <Navbar />

      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 flex flex-col gap-6">

        {/* Back Link */}
        <Link
          href="/cart"
          className="flex items-center gap-1.5 text-sm font-bold text-[#0D9740] hover:underline"
        >
          ← Back to Cart
        </Link>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[36px] font-extrabold text-[#0F291B] tracking-tight">
            Checkout
          </h1>
          <p className="text-[#6B7280] text-sm">
            Complete your order in a few simple steps
          </p>
        </div>

        {/* Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">

          {/* ── Left Column (Forms & Selection Cards) ── */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            {/* 1. Payment Mode Selector */}
            {proceedData?.allowed_payment_types && proceedData.allowed_payment_types.length > 1 && (
              <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-[#0F291B] text-[16px]">Payment Mode</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mode 1: Full Payment */}
                  <div
                    onClick={() => handleSelectPaymentMode("full")}
                    className={`relative p-5 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${paymentMode === "full"
                      ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                      : "border-zinc-200 bg-white"
                      }`}
                  >
                    {paymentMode === "full" && (
                      <div className="absolute top-[-10px] right-[-10px] bg-[#0d9740] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                        ✓
                      </div>
                    )}

                    <div>
                      <div className="bg-[#DFB33F] text-white text-[9px] font-bold py-1 px-2 rounded-[6px] inline-block mb-3">
                        POPULAR
                      </div>
                      <h4 className="font-bold text-[#0F291B] text-[14px]">Full Payment</h4>
                      <p className="text-[11px] text-[#6B7280] mt-1">Pay complete amount now</p>

                      <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#374151] border-t border-zinc-100 pt-3 text-left">
                        <div className="flex justify-between">
                          <span>Order Total</span>
                          <span className="line-through text-zinc-400 notranslate" translate="no">₹{formatPrice(proceedData?.payment_summary?.original_amount)}</span>
                        </div>
                        {Number(fullNormalDiscount) > 0 && (
                          <div className="flex justify-between text-[#0D9740]">
                            <span>Instant Discount</span>
                            <span className="notranslate" translate="no">− ₹{formatPrice(fullNormalDiscount)} Off</span>
                          </div>
                        )}
                        {Number(fullCouponDiscount) > 0 && (
                          <div className="flex justify-between text-[#0D9740]">
                            <span>Promo Discount</span>
                            <span className="notranslate" translate="no">− ₹{formatPrice(fullCouponDiscount)} Off</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-zinc-100 pt-3">
                      <span className="text-[11px] font-medium text-[#6B7280]">Pay Now</span>
                      <div className="text-[20px] font-extrabold text-[#0f291b] notranslate" translate="no">
                        ₹{formatPrice(proceedData?.payment_summary?.full_payment?.payable_amount)}
                      </div>
                      {proceedData?.payment_summary?.full_payment?.discount_amount > 0 && (
                        <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-medium py-1 px-2.5 rounded-[6px] mt-2 flex items-center justify-center gap-1 notranslate" translate="no">
                          🎁 You'll save ₹{formatPrice(proceedData?.payment_summary?.full_payment?.discount_amount)} on this order!
                        </div>
                      )}
                    </div>
                  </div>

                  {proceedData?.allowed_payment_types?.includes("Cash On Delivery") && proceedData?.payment_summary?.cash_on_delivery && (
                    /* Mode 2: Book Now & Pay Later */
                    <div
                      onClick={() => handleSelectPaymentMode("booking")}
                      className={`relative p-5 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${paymentMode === "booking"
                        ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                        : "border-zinc-200 bg-white"
                        }`}
                    >
                      {paymentMode === "booking" && (
                        <div className="absolute top-[-10px] right-[-10px] bg-[#0d9740] text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                          ✓
                        </div>
                      )}

                      <div>
                        <div className="text-[9px] font-bold py-1 px-2 rounded-[6px] inline-block mb-3 border border-zinc-300 text-zinc-500">
                          BOOK NOW & PAY LATER
                        </div>
                        <h4 className="font-bold text-[#0F291B] text-[14px]">Book Now & Pay On Delivery</h4>
                        <p className="text-[11px] text-[#6B7280] mt-1">Confirm your order instantly</p>

                        <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#374151] border-t border-zinc-100 pt-3 text-left">
                          <div className="flex justify-between">
                            <span>Order Total</span>
                            <span className="line-through text-zinc-400 notranslate" translate="no">₹{formatPrice(defaultProceedData?.payment_summary?.original_amount || proceedData?.payment_summary?.original_amount)}</span>
                          </div>
                           {Number(bookingNormalDiscount) > 0 && (
                            <div className="flex justify-between text-[#0D9740]">
                              <span>Instant Discount</span>
                              <span className="notranslate" translate="no">− ₹{formatPrice(bookingNormalDiscount)} Off</span>
                            </div>
                          )}
                          {Number(bookingCouponDiscount) > 0 && (
                            <div className="flex justify-between text-[#0D9740]">
                              <span>Promo Discount</span>
                              <span className="notranslate" translate="no">− ₹{formatPrice(bookingCouponDiscount)} Off</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Effective Total</span>
                            <span className="notranslate" translate="no">₹{formatPrice((defaultProceedData?.payment_summary?.original_amount || proceedData?.payment_summary?.original_amount) - (proceedData?.payment_summary?.cash_on_delivery?.discount_amount || 0))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 border-t border-zinc-100 pt-3">
                        <span className="text-[11px] font-medium text-[#6B7280]">Pay Now (Booking)</span>
                        <div className="text-[20px] font-extrabold text-[#0f291b] notranslate" translate="no">
                          ₹{formatPrice(proceedData?.payment_summary?.cash_on_delivery?.pay_now || defaultProceedData?.payment_summary?.cash_on_delivery?.pay_now)}
                        </div>
                        <span className="text-[11px] text-zinc-500 block mt-1">
                          Pay on Delivery: <span className="font-bold text-[#0f291b] notranslate" translate="no">
                            ₹{formatPrice(proceedData?.payment_summary?.cash_on_delivery?.pay_on_delivery || defaultProceedData?.payment_summary?.cash_on_delivery?.pay_on_delivery)}
                          </span>
                        </span>
                        {proceedData?.payment_summary?.cash_on_delivery?.discount_amount > 0 && (
                          <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-medium py-1 px-2.5 rounded-[6px] mt-2 flex items-center justify-center gap-1 notranslate" translate="no">
                            🎁 You'll save ₹{formatPrice(proceedData?.payment_summary?.cash_on_delivery?.discount_amount)} on this order!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Delivery Address */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-[#0F291B] text-[18px]">Delivery Address</h3>
                  <p className="text-xs text-[#6B7280]">
                    Tell us where to deliver your agricultural equipment and supplies.
                  </p>
                </div>
                {isAddingAddress ? (
                  <button
                    onClick={() => {
                      setIsAddingAddress(false);
                      if (savedAddresses.length > 0) {
                        setIsAddressSaved(true);
                      } else {
                        setIsAddressSaved(false);
                      }
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-800 font-bold flex items-center gap-1 border border-zinc-200 rounded-lg py-1 px-2.5 bg-zinc-50 hover:bg-zinc-100 transition-all"
                    title="Minimize form"
                  >
                    ✕ Minimize
                  </button>
                ) : isAddressSaved && savedAddresses.length > 0 ? (
                  <button
                    onClick={() => setIsSelectingAddress(!isSelectingAddress)}
                    className="text-xs text-[#0D9740] hover:text-[#0a7d34] font-bold border border-[#0D9740]/20 rounded-lg py-1.5 px-3 bg-[#EBF5EE] hover:bg-[#EBF5EE]/80 transition-all"
                  >
                    {isSelectingAddress ? "✕ Close" : "Change"}
                  </button>
                ) : null}
              </div>

              {loadingAddresses ? (
                <div className="flex justify-center py-6 text-sm text-zinc-500 font-semibold">
                  Loading addresses...
                </div>
              ) : isAddressSaved && savedAddresses.length > 0 ? (
                /* Address is saved */
                isAddingAddress ? (
                  null
                ) : isSelectingAddress ? (
                  /* Saved Addresses List (Change Mode) */
                  <div className="flex flex-col gap-4">
                    {savedAddresses.map((addr, idx) => (
                      <div
                        key={addr.name}
                        onClick={() => {
                          setSelectedAddressIndex(idx);
                          setIsSelectingAddress(false);
                        }}
                        className={`relative border rounded-[16px] p-5 flex flex-col gap-2 cursor-pointer transition-all ${selectedAddressIndex === idx
                          ? "bg-[#F8FBB8]/20 border-[#0D9740]"
                          : "bg-white border-zinc-200 hover:border-zinc-300"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F291B] text-sm">{addr.address_title}</span>
                          {addr.is_primary === 1 && (
                            <span className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold py-0.5 px-2 rounded-[4px]">Primary</span>
                          )}
                          <div className="ml-auto flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
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
                                  saveAddress: false,
                                });
                                setEditingAddressName(addr.name);
                                setIsAddressSaved(false);
                                setIsAddingAddress(true);
                              }}
                              className="text-xs text-[#0D9740] hover:underline font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteAddress(addr.name);
                              }}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                              title="Delete Address"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <span className="text-xs text-[#374151] pr-6">
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {(() => {
                            const names = getPlaceNames(addr);
                            return `${names.marketplace ? `${names.marketplace}, ` : ""}${names.tahsil}, ${names.district}, ${addr.state} - ${addr.pincode}`;
                          })()}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">
                          Phone: {addr.phone}
                        </span>
                        {selectedAddressIndex === idx && addr.is_primary !== 1 && (
                          <div className="mt-1 pt-2 border-t border-zinc-100/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMakePrimary(addr.name);
                              }}
                              className="text-[11px] font-bold text-[#0D9740] bg-[#0D9740]/10 hover:bg-[#0D9740]/20 py-1.5 px-3 rounded-[8px] transition-colors"
                            >
                              Set as Primary Address
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => {
                          setIsAddressSaved(false);
                          setIsAddingAddress(true);
                          setEditingAddressName(null);
                          setFormData({
                            fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "", saveAddress: false
                          });
                        }}
                        className="h-12 px-8 border-2 border-dashed border-[#0D9740] hover:bg-[#0d9740]/[0.02] text-[#0D9740] font-bold text-sm rounded-[14px] transition-all flex items-center gap-2 shadow-sm"
                      >
                        ＋ Add Delivery Address
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Single Selected/Primary Address View (Default Mode) */
                  <div className="border rounded-[16px] p-5 flex flex-col gap-2 bg-white border-zinc-200">
                    {(() => {
                      const addr = savedAddresses[selectedAddressIndex] || savedAddresses[0];
                      if (!addr) return null;
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#0F291B] text-sm">{addr.address_title}</span>
                            {addr.is_primary === 1 && (
                              <span className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold py-0.5 px-2 rounded-[4px]">Primary</span>
                            )}
                          </div>
                          <span className="text-xs text-[#374151] pr-6">
                            {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {(() => {
                              const names = getPlaceNames(addr);
                              return `${names.marketplace ? `${names.marketplace}, ` : ""}${names.tahsil}, ${names.district}, ${addr.state} - ${addr.pincode}`;
                            })()}
                          </span>
                          <span className="text-xs text-zinc-500 font-medium">
                            Phone: {addr.phone}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )
              ) : !isAddingAddress ? (
                /* Initial "+ Add Address" button state */
                <div className="py-6 flex justify-center">
                  <button
                    onClick={() => {
                      setIsAddingAddress(true);
                      setEditingAddressName(null);
                      setFormData({
                        fullName: "", mobile: "", pin: "", marketplace: "", city: "", district: "", state: "", address1: "", address2: "", saveAddress: false
                      });
                    }}
                    className="h-12 px-8 border-2 border-dashed border-[#0D9740] hover:bg-[#0d9740]/[0.02] text-[#0D9740] font-bold text-sm rounded-[14px] transition-all flex items-center gap-2 shadow-sm"
                  >
                    ＋ Add Delivery Address
                  </button>
                </div>
              ) : (
                /* Address Entry Form */
                <div className="flex flex-col gap-6">
                  {/* Service Pincode Checker */}
                  <form onSubmit={checkPincode} className="bg-[#F8F9FA] rounded-[16px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 shrink-0 mr-1 relative">
                        <div 
                          className="w-[20px] h-[20px] border-[2.5px] border-[#0F291B] rounded-tl-full rounded-tr-full rounded-bl-full rotate-45 flex items-center justify-center bg-transparent relative top-[-2px]"
                          style={{ borderBottomRightRadius: '3px' }}
                        >
                          <div className="w-1.5 h-1.5 bg-[#0F291B] rounded-full" />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#0F291B]">Service Availability</span>
                        <span className="text-[10px] text-zinc-500">Check if we deliver to your village or area.</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        className="w-full md:w-40 h-10 px-3 bg-white border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] placeholder:text-zinc-400 focus:outline-[#0D9740]"
                      />
                      <button
                        type="submit"
                        className="h-10 px-6 bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs rounded-[10px] shadow transition-all whitespace-nowrap"
                      >
                        Check
                      </button>
                    </div>
                  </form>

                  {pincodeStatus === "checking" && (
                    <div className="text-xs text-zinc-500 font-semibold px-2">Checking service availability...</div>
                  )}
                  {pincodeStatus === "available" && (
                    <div className="text-xs text-emerald-600 font-bold px-2">✓ Service available in your area!</div>
                  )}
                  {pincodeStatus === "unavailable" && (
                    <div className="text-xs text-red-500 font-bold px-2">✗ Delivery unavailable to this pincode. Try a pincode starting with 1, 2, 3, or 4.</div>
                  )}

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0F291B]">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#0F291B]">Mobile Number</label>
                      <input
                        type="text"
                        placeholder="+91 10-digit number"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
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
                        label="Tehsil"
                        value={formData.city}
                        options={tahsils}
                        disabled={!formData.district}
                        placeholder="Select tehsil"
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
                      <label className="text-xs font-bold text-[#0F291B]">Pincode</label>
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                        className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#0F291B]">Address Line 1</label>
                      <input
                        type="text"
                        placeholder="Near Temple, School, or Shop"
                        value={formData.address1}
                        onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                        className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-[#0F291B]">Address Line 2</label>
                      <input
                        type="text"
                        placeholder="Near Temple, School, or Shop"
                        value={formData.address2}
                        onChange={(e) => setFormData({ ...formData, address2: e.target.value })}
                        className="h-12 px-4 border border-zinc-200 rounded-[10px] text-sm text-[#0F291B] focus:outline-[#0D9740]"
                      />
                    </div>
                  </div>

                  {/* Checkbox Save */}
                  <label className="flex items-center gap-2 text-xs text-zinc-600 select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.saveAddress}
                      onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                      className="w-4 h-4 accent-[#0D9740] border border-zinc-200 rounded focus:ring-[#0D9740]"
                    />
                    Save this address for future orders
                  </label>

                  {/* Save Address Button */}
                  <div className="flex items-center gap-3 mt-4 w-full justify-end sm:justify-end">
                    <button
                      onClick={() => {
                        setIsAddingAddress(false);
                        if (savedAddresses.length > 0) {
                          setIsAddressSaved(true);
                        } else {
                          setIsAddressSaved(false);
                        }
                      }}
                      className="h-12 px-4 sm:px-6 border border-zinc-300 hover:bg-zinc-50 text-zinc-600 font-bold text-xs sm:text-sm rounded-[10px] transition-all flex-1 sm:flex-none flex items-center justify-center whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAddress}
                      disabled={isSavingAddress}
                      className={`h-12 px-5 sm:px-8 ${isSavingAddress ? 'bg-zinc-400' : 'bg-[#0D9740] hover:bg-[#0a7d34]'} text-white font-bold text-xs sm:text-sm rounded-[10px] shadow transition-all flex items-center justify-center gap-1.5 flex-[2] sm:flex-none whitespace-nowrap`}
                    >
                      {isSavingAddress ? "Saving..." : (
                        <>Save and Continue <span>→</span></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>



          </div>

          {/* ── Right Column (Order Summary) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Summary Box */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-4 sm:p-6 shadow-sm flex flex-col gap-5 overflow-hidden w-full box-border">
              <h3 className="font-roboto font-bold text-[#0F291B] text-lg">
                Order Summary
              </h3>

              {/* Offers & Coupons Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Image src="/assets/coupon.png" alt="Coupon" width={20} height={20} className="shrink-0" />
                  <span className="text-xs font-semibold text-[#0F291B] block">Offers & Coupons</span>
                </div>
                <span className="text-[10px] text-zinc-500 block -mt-1">Tap to apply coupon code. Use "GBRU10" to save ₹500.</span>
                <div className={`flex w-full h-10 border rounded-[8px] overflow-hidden focus-within:ring-1 focus-within:border-[#0D9740] focus-within:ring-[#0D9740] ${
                  couponCode === "Invalid code" ? "border-red-500" : "border-zinc-200"
                }`}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      if (couponCode === "Invalid code") setCouponError("");
                      setCouponCode(e.target.value);
                    }}
                    onFocus={() => {
                      if (couponCode === "Invalid code") {
                        setCouponCode("");
                        setCouponError("");
                      }
                    }}
                    className={`flex-1 min-w-0 px-3 outline-none text-xs bg-transparent ${
                      couponCode === "Invalid code" ? "text-red-500" : "text-[#0F291B]"
                    }`}
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponApplied}
                    className={`px-4 font-bold text-xs transition-colors shrink-0 ${
                      couponApplied
                        ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                        : "bg-[#0F291B] hover:bg-[#08170f] text-white"
                    }`}
                  >
                    Apply
                  </button>
                </div>

                {couponApplied && (
                  <div className="flex items-center justify-between mt-1 bg-emerald-50/50 px-2 py-1.5 rounded-lg">
                    <span className="text-[11px] text-[#0D9740] font-bold">✓ {proceedData?.coupon?.code || couponCode} applied successfully</span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[10px] text-red-600 hover:text-red-800 font-extrabold flex items-center gap-0.5 hover:underline"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
                {/* Error message removed as per request to show it inside the input bar */}
              </div>

              {/* Brand Ambassador Code Section */}
              <div className="flex flex-col gap-3 mt-2">
                <span className="text-xs font-semibold text-[#0F291B] block">🎓 Brand Ambassador Code</span>
                <span className="text-[10px] text-zinc-500 block -mt-1">Enter your referral code if referred by a GBRU Ambassador.</span>
                <div className="flex w-full h-10 border border-zinc-200 rounded-[8px] overflow-hidden focus-within:border-[#0D9740] focus-within:ring-1 focus-within:ring-[#0D9740]">
                  <input
                    type="text"
                    placeholder="Enter Ambassador Code"
                    value={ambassadorCode}
                    onChange={(e) => setAmbassadorCode(e.target.value)}
                    className="flex-1 min-w-0 px-3 outline-none text-xs text-[#0F291B] bg-transparent"
                  />
                  <button
                    onClick={applyAmbassadorCode}
                    disabled={ambassadorApplied}
                    className={`px-4 font-bold text-xs transition-colors shrink-0 ${
                      ambassadorApplied
                        ? "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                        : "bg-[#0F291B] hover:bg-[#08170f] text-white"
                    }`}
                  >
                    Apply
                  </button>
                </div>

                {ambassadorApplied && (
                  <div className="flex items-center justify-between mt-1 bg-emerald-50/50 px-2 py-1.5 rounded-lg">
                    <span className="text-[11px] text-[#0D9740] font-bold">✓ Code applied successfully</span>
                    <button
                      onClick={handleRemoveAmbassadorCode}
                      className="text-[10px] text-red-600 hover:text-red-800 font-extrabold flex items-center gap-0.5 hover:underline"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
                {ambassadorError && (
                  <span className="text-[11px] text-red-500 font-bold">{ambassadorError}</span>
                )}
              </div>

              {/* Price Details */}
              <div className="flex flex-col gap-4 text-sm text-[#374151] border-t border-zinc-100 pt-4 text-left">
                {Number(activePricingData?.sub_total || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total</span>
                    <span className="font-bold notranslate" translate="no">₹{formatPrice(activePricingData?.sub_total)}</span>
                  </div>
                )}
                {Number(activePricingData?.total_taxes_and_charges || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Taxes & charges</span>
                    <span className="font-bold notranslate" translate="no">₹{formatPrice(activePricingData?.total_taxes_and_charges)}</span>
                  </div>
                )}
                {Number(activePricingData?.total_taxes_and_charges || 0) === 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Taxes & charges</span>
                    <span className="font-bold text-[#0d9740] notranslate" translate="no">FREE</span>
                  </div>
                )}

                {/* Full Payment Details */}
                {paymentMode === "full" && (
                  <>
                    {Number(fullNormalDiscount) > 0 && (
                      <div className="flex justify-between text-[#0d9740]">
                        <span>Discount (₹ {formatPrice(fullNormalDiscount)} Off)</span>
                        <span className="notranslate" translate="no">- ₹{formatPrice(fullNormalDiscount)}</span>
                      </div>
                    )}

                    {Number(fullCouponDiscount) > 0 && (
                      <div className="flex justify-between text-[#0d9740]">
                        <span>Coupon Discount (₹ {formatPrice(fullCouponDiscount)} Off)</span>
                        <span className="notranslate" translate="no">- ₹{formatPrice(fullCouponDiscount)}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Cash On Delivery Details */}
                {paymentMode === "booking" && (
                  <>
                    {Number(bookingNormalDiscount) > 0 && (
                      <div className="flex justify-between text-[#0d9740]">
                        <span>Discount (₹ {formatPrice(bookingNormalDiscount)} Off)</span>
                        <span className="notranslate" translate="no">- ₹{formatPrice(bookingNormalDiscount)}</span>
                      </div>
                    )}

                    {Number(bookingCouponDiscount) > 0 && (
                      <div className="flex justify-between text-[#0d9740]">
                        <span>Coupon Discount (₹ {formatPrice(bookingCouponDiscount)} Off)</span>
                        <span className="notranslate" translate="no">- ₹{formatPrice(bookingCouponDiscount)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-zinc-100">
                  <span className="font-bold text-[#0F291B] text-[16px]">Payable Amount</span>
                  <span className="font-extrabold text-[#0D9740] text-[24px] notranslate" translate="no">
                    {paymentMode === "full"
                      ? `₹${formatPrice(proceedData?.payment_summary?.full_payment?.payable_amount)}`
                      : `₹${formatPrice(proceedData?.payment_summary?.cash_on_delivery?.pay_now)}`
                    }
                  </span>
                </div>
                {paymentMode === "booking" && Number(proceedData?.payment_summary?.cash_on_delivery?.pay_on_delivery || 0) > 0 && (
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-zinc-500 text-[14px]">Pay on Delivery</span>
                    <span className="font-bold text-zinc-700 text-[18px] notranslate" translate="no">
                      ₹{formatPrice(proceedData?.payment_summary?.cash_on_delivery?.pay_on_delivery)}
                    </span>
                  </div>
                )}
                {totalDiscount > 0 && (
                  <div className="bg-[#EBF5EE] text-[#0D9740] text-[11px] font-semibold py-2 px-3 rounded-[10px] mt-3 flex items-center justify-center gap-1.5 border border-[#0D9740]/10 notranslate" translate="no">
                    🎁 You'll save ₹{formatPrice(totalDiscount)} on this order!
                  </div>
                )}
              </div>

              {/* Secure Checkout CTA */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className={`w-full h-14 rounded-[14px] ${placingOrder ? 'bg-zinc-400' : 'bg-gradient-to-r from-[#1A4D2E] to-[#2A6F45] hover:opacity-90 active:scale-[0.99]'} text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-sm mt-2`}
              >
                {placingOrder ? (
                  "Placing Order..."
                ) : (
                  <>
                    <div className="flex flex-col items-center justify-center w-5 h-5 shrink-0">
                      <div className="w-[8px] h-[6px] border-[2px] border-b-0 border-white rounded-t-[4px]" />
                      <div className="w-[12px] h-[10px] border-[2px] border-white rounded-[3px] -mt-[2px]" />
                    </div>
                    <span>Place Order Securely</span>
                  </>
                )}
              </button>

              <span className="text-[11px] text-zinc-500 text-center block">
                Your payment information is secure
              </span>
            </div>

          </div>

        </div>

      </main>

      {/* Custom Modal for Alerts/Confirms */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-[24px] shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center transform animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {modalConfig.type === "confirm" ? (
              <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-[#0D9740]/10 text-[#0D9740] rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
            )}

            <h3 className="font-bold text-lg text-zinc-900 mb-2">{modalConfig.title}</h3>
            <p className="text-sm text-zinc-500 mb-6">{modalConfig.message}</p>

            <div className="flex gap-3 w-full">
              {modalConfig.type === "confirm" && (
                <button
                  onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 px-4 rounded-[12px] font-bold text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                className={`flex-1 py-2.5 px-4 rounded-[12px] font-bold text-sm text-white shadow-sm transition-colors ${modalConfig.type === "confirm" ? "bg-red-500 hover:bg-red-600" : "bg-[#0D9740] hover:bg-[#0b8036]"
                  }`}
              >
                {modalConfig.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
