"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  district: string;
  state: string;
  pin: string;
  tag: string;
}

export default function CheckoutSummary() {
  // Interactivity States
  const [paymentMode, setPaymentMode] = useState<"full" | "booking">("full");
  const [selectedAddressId, setSelectedAddressId] = useState("addr-1");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isOffersOpen, setIsOffersOpen] = useState(true);
  
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "addr-1",
      name: "Arvind Kumar",
      phone: "+91 98765 43210",
      line1: "Green Valley Farm, Village Rampur,",
      line2: "Taluka Haveli,",
      landmark: "Landmark: Near Old Banyan Tree",
      city: "Pune",
      district: "Pune",
      state: "Maharashtra",
      pin: "411047",
      tag: "Home"
    },
    {
      id: "addr-2",
      name: "Sunita Deshmukh",
      phone: "+91 88888 12345",
      line1: "Plot No. 12, Adarsh Nagar,",
      line2: "Near Gram Panchayat,",
      landmark: "Landmark: Opposite Shiv Mandir",
      city: "Sangli",
      district: "Sangli",
      state: "Maharashtra",
      pin: "416416",
      tag: "Work"
    }
  ]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // New Address Form Data
  const [newAddr, setNewAddr] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    district: "",
    state: "",
    pin: ""
  });

  const handleRemoveAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
    if (selectedAddressId === id) {
      setSelectedAddressId("");
    }
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.name || !newAddr.phone || !newAddr.line1 || !newAddr.city || !newAddr.pin) return;
    
    const created: Address = {
      id: `addr-${Date.now()}`,
      name: newAddr.name,
      phone: `+91 ${newAddr.phone}`,
      line1: newAddr.line1,
      line2: newAddr.line2,
      landmark: newAddr.landmark ? `Landmark: ${newAddr.landmark}` : "",
      city: newAddr.city,
      district: newAddr.district || newAddr.city,
      state: newAddr.state || "Maharashtra",
      pin: newAddr.pin,
      tag: "Home"
    };

    setAddresses([...addresses, created]);
    setSelectedAddressId(created.id);
    setIsAddingNew(false);
    setNewAddr({
      name: "",
      phone: "",
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      pin: ""
    });
  };

  const applyCoupon = () => {
    if (!couponCode) return;
    if (couponCode.toUpperCase() === "GBRU10") {
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code. Try 'GBRU10'");
      setCouponApplied(false);
    }
  };

  // Pricing calculations
  const subtotal = 8499;
  const gst = 1530;
  const couponDiscount = couponApplied ? 500 : 0;
  const total = subtotal + gst - couponDiscount;

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

        {/* Grid Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          
          {/* ── Left Column (Selectors) ── */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* 1. Payment Mode */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[#0F291B] text-[16px]">Payment Mode</h3>
                <span className="text-xs text-[#0D9740] font-bold cursor-pointer hover:underline">
                  ✏️ Change
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mode 1: Full Payment */}
                <div
                  onClick={() => setPaymentMode("full")}
                  className={`relative p-5 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMode === "full"
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
                      RECOMMENDED
                    </div>
                    <h4 className="font-bold text-[#0F291B] text-[14px]">Full Payment</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[20px] font-extrabold text-[#0f291b]">₹8,499</span>
                      <span className="text-[12px] line-through text-zinc-400">₹9,999</span>
                    </div>
                    <div className="bg-emerald-50 text-[#0D9740] text-[10px] font-bold py-1 px-2 rounded-[6px] inline-block mt-2">
                      Save ₹1,500 (15% OFF)
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-3">Pay complete amount today</p>

                    <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#374151] border-t border-zinc-100 pt-3">
                      <div className="flex justify-between">
                        <span>Order Total</span>
                        <span>₹9,948</span>
                      </div>
                      <div className="flex justify-between text-[#0D9740]">
                        <span>Instant Discount</span>
                        <span>- ₹1,248.74</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-3">
                    <span className="text-[11px] font-medium text-[#6B7280]">Pay Now</span>
                    <div className="text-[20px] font-extrabold text-[#0f291b]">₹7,251</div>
                    <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-medium py-1 px-2.5 rounded-[6px] mt-2 flex items-center justify-center gap-1">
                      🎁 You'll save ₹1,248.74 on this order!
                    </div>
                  </div>
                </div>

                {/* Mode 2: Book Now & Pay Later */}
                <div
                  onClick={() => setPaymentMode("booking")}
                  className={`relative p-5 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    paymentMode === "booking"
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
                    <h4 className="font-bold text-[#0F291B] text-[14px]">Booking Deposit</h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[20px] font-extrabold text-[#0f291b]">₹9,999</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mt-3">Reserve with small amount</p>

                    <div className="mt-4 flex flex-col gap-1.5 text-xs text-[#374151] border-t border-zinc-100 pt-3">
                      <div className="flex justify-between">
                        <span>Order Total</span>
                        <span>₹9,948</span>
                      </div>
                      <div className="flex justify-between text-[#0D9740]">
                        <span>Instant Discount</span>
                        <span>- ₹948.74</span>
                      </div>
                      <div className="flex justify-between bg-emerald-50 px-1 py-0.5 rounded text-[11px]">
                        <span>Effective Total</span>
                        <span className="font-bold text-[#0d9740]">₹8,999</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-3">
                    <span className="text-[11px] font-medium text-[#6B7280]">Pay Now (Booking)</span>
                    <div className="text-[20px] font-extrabold text-[#0f291b]">₹1,000</div>
                    <span className="text-[11px] text-zinc-500 block mt-1">
                      Pay on Delivery: <span className="font-bold text-[#0f291b]">₹7,999</span>
                    </span>
                    <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-medium py-1 px-2.5 rounded-[6px] mt-2 flex items-center justify-center gap-1">
                      🎁 You'll save ₹948.74 on this order!
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Select Delivery Address */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[#0F291B] text-[18px]">Select Delivery Address</h3>
                <p className="text-xs text-[#6B7280]">
                  Choose a saved address or add a new one for your equipment delivery.
                </p>
              </div>

              {/* Address Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative p-5 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between gap-5 bg-white ${
                        isSelected
                          ? "border-[#0D9740] bg-[#0D9740]/[0.01]"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#0D9740]" : "border-zinc-300"
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#0D9740]"></div>}
                          </div>
                          <span className="font-bold text-xs text-[#0F291B]">{addr.tag}</span>
                        </div>

                        {/* Edit / Remove buttons */}
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                          <button className="text-zinc-500 hover:text-[#0D9740]">EDIT</button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAddress(addr.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex flex-col gap-1.5 text-xs text-[#374151]">
                        <span className="font-bold text-sm text-[#0F291B] block">{addr.name}</span>
                        <span className="text-[#6B7280] font-medium block">{addr.phone}</span>
                        <p className="leading-relaxed mt-1 text-zinc-600">
                          {addr.line1} <br />
                          {addr.line2} <br />
                          {addr.landmark} <br />
                          {addr.city}, {addr.district}, {addr.state} - {addr.pin}
                        </p>
                      </div>

                      {/* Deliver Button */}
                      {isSelected && (
                        <button className="w-full h-10 rounded-[10px] bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs shadow-sm transition-all mt-2">
                          Deliver to this Address
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Address Toggle button */}
              {!isAddingNew ? (
                <div
                  onClick={() => setIsAddingNew(true)}
                  className="border-2 border-dashed border-zinc-200 hover:border-[#0D9740]/60 rounded-[20px] py-8 text-center cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-[#0D9740] font-bold text-sm flex items-center gap-1">
                    ＋ Add Address
                  </span>
                </div>
              ) : (
                /* Add New Address Form */
                <form onSubmit={handleAddNewAddress} className="border border-zinc-200 rounded-[20px] p-5 flex flex-col gap-4">
                  <span className="font-bold text-xs text-[#0F291B] block uppercase tracking-wider">Enter Address Details</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      required
                      value={newAddr.name}
                      onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="10-digit Phone Number"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value.replace(/\D/g, "") })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      required
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] md:col-span-2 focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={newAddr.line2}
                      onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] md:col-span-2 focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={newAddr.landmark}
                      onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      required
                      maxLength={6}
                      value={newAddr.pin}
                      onChange={(e) => setNewAddr({ ...newAddr, pin: e.target.value.replace(/\D/g, "") })}
                      className="h-10 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="h-9 px-4 border border-zinc-300 text-zinc-500 rounded-[8px] font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-5 bg-[#0D9740] text-white rounded-[8px] font-bold text-xs"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-6">
              <h3 className="font-bold text-[#0F291B] text-[18px]">Payment Method</h3>
              
              <div className="flex flex-col gap-4">
                {/* UPI */}
                <div
                  onClick={() => setPaymentMethod("upi")}
                  className={`p-4 rounded-[16px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === "upi"
                      ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                      : "border-zinc-100 bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">📱</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#0F291B]">UPI</span>
                      <span className="text-[11px] text-zinc-500">Pay via UPI apps</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "upi" ? "border-[#0D9740] bg-[#0D9740]" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "upi" && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                </div>

                {/* Card */}
                <div
                  onClick={() => setPaymentMethod("card")}
                  className={`p-4 rounded-[16px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === "card"
                      ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                      : "border-zinc-100 bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">💳</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#0F291B]">Credit / Debit Card</span>
                      <span className="text-[11px] text-zinc-500">Visa, Mastercard, Rupay</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "card" ? "border-[#0D9740] bg-[#0D9740]" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "card" && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                </div>

                {/* Net Banking */}
                <div
                  onClick={() => setPaymentMethod("netbanking")}
                  className={`p-4 rounded-[16px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === "netbanking"
                      ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                      : "border-zinc-100 bg-[#F8F9FA]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">🏦</div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-[#0F291B]">Net Banking</span>
                      <span className="text-[11px] text-zinc-500">All major banks</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === "netbanking" ? "border-[#0D9740] bg-[#0D9740]" : "border-zinc-300"
                  }`}>
                    {paymentMethod === "netbanking" && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column (Order Summary) ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Summary Box */}
            <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
              <h3 className="font-roboto font-bold text-[#0F291B] text-lg">
                Order Summary
              </h3>

              {/* Offers & Coupons Collapsible Drawer */}
              <div className="border border-zinc-100 rounded-[14px] overflow-hidden">
                <button
                  onClick={() => setIsOffersOpen(!isOffersOpen)}
                  className="w-full bg-[#F8F9FA] px-4 py-3 flex items-center justify-between text-xs font-bold text-[#0F291B]"
                >
                  <span className="flex items-center gap-1.5">
                    <Image src="/assets/coupon.png" alt="Coupon" width={20} height={20} className="shrink-0" />
                    Offers & Coupons
                  </span>
                  <span>{isOffersOpen ? "▲" : "▼"}</span>
                </button>

                {isOffersOpen && (
                  <div className="p-4 flex flex-col gap-3 bg-white">
                    <span className="text-[10px] text-zinc-500 block">Tap to apply coupon code. Use "GBRU10" to save ₹500.</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 h-9 px-3 border border-zinc-200 rounded-[8px] text-xs text-[#0F291B] focus:outline-[#0D9740]"
                      />
                      <button
                        onClick={applyCoupon}
                        className="h-9 px-4 bg-[#0F291B] hover:bg-[#08170f] text-white font-bold text-xs rounded-[8px]"
                      >
                        Apply
                      </button>
                    </div>

                    {couponApplied && (
                      <span className="text-[11px] text-[#0D9740] font-bold">✓ Coupon "GBRU10" Applied! Saved ₹500.</span>
                    )}
                    {couponError && (
                      <span className="text-[11px] text-red-500 font-bold">{couponError}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Product Info Row */}
              <div className="bg-[#F8F9FA] rounded-[14px] p-4 flex flex-col gap-1">
                <span className="font-bold text-xs text-[#0F291B]">GBRU Pro-Series 5000</span>
                <span className="text-[10px] text-zinc-500">Qty: 1 • Full Payment</span>
              </div>

              {/* Price Details */}
              <div className="flex flex-col gap-4 text-sm text-[#374151] border-t border-zinc-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">GST (18%)</span>
                  <span className="font-bold">₹{gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Delivery</span>
                  <span className="font-bold text-[#0d9740]">FREE</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-[#0d9740]">
                    <span>Coupon Discount</span>
                    <span>- ₹{couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-baseline pt-2 border-t border-zinc-100">
                  <span className="font-bold text-[#0F291B] text-[16px]">Total</span>
                  <span className="font-extrabold text-[#0F291B] text-[24px]">
                    {paymentMode === "full" 
                      ? `₹${total.toLocaleString("en-IN")}`
                      : "₹1,000" // For booking, they only pay ₹1,000 now
                    }
                  </span>
                </div>
                {paymentMode === "booking" && (
                  <span className="text-[11px] text-zinc-500 text-right block leading-none">
                    (₹{ (total - 1000).toLocaleString("en-IN") } payable on delivery)
                  </span>
                )}
              </div>

              {/* Secure Checkout CTA */}
              <button className="w-full h-14 rounded-[14px] bg-gradient-to-r from-[#1A4D2E] to-[#2A6F45] hover:opacity-90 active:scale-[0.99] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-sm mt-2">
                <div className="flex flex-col items-center justify-center w-5 h-5 shrink-0">
                  <div className="w-[8px] h-[6px] border-[2px] border-b-0 border-white rounded-t-[4px]" />
                  <div className="w-[12px] h-[10px] border-[2px] border-white rounded-[3px] -mt-[2px]" />
                </div>
                <span>Place Order Securely</span>
              </button>

              <span className="text-[11px] text-zinc-500 text-center block">
                Your payment information is secure
              </span>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
