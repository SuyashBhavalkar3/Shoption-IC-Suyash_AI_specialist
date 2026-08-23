"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getMobileNo } from "@/utils/cartUtils";

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartSummary, setCartSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const stored = localStorage.getItem("gbru_user");
        if (!stored) {
          router.push("/otp");
          return;
        }

        const parsed = JSON.parse(stored);
        // Extract mobile number from session keys, prioritizing actual mobile properties
        const mobile_no = localStorage.getItem("mobile_no");

        if (!mobile_no) {
          router.push("/otp");
          return;
        }

        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no }),
        });

        if (!res.ok) {
          setError("Failed to retrieve cart. Please log in again.");
          return;
        }

        const data = await res.json();
        if (data?.message?.status && data.message.data) {
          const normalizedItems = (data.message.data.items || []).map((item: any) => {
            const qty = item.quantity || item.qty || 1;
            const unitPrice = item.price || (item.rate === item.amount ? item.rate / qty : item.rate) || 0;
            return {
              ...item,
              quantity: qty,
              price: unitPrice,
              rate: unitPrice,
              amount: unitPrice * qty
            };
          });
          setCartItems(normalizedItems);
          setCartSummary(data.message.data);
        } else {
          setError(data?.message?.message || "Failed to load cart.");
        }
      } catch (err: any) {

        setError("Error loading cart details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [router]);

  const handleUpdateQty = async (itemObj: any, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    // Locally update quantity for immediate response
    setCartItems(prev =>
      prev.map(item =>
        item.item === itemObj.item
          ? { ...item, quantity: newQty, amount: item.rate * newQty }
          : item
      )
    );

    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const mobile_no = getMobileNo(parsed);
      if (!mobile_no) return;

      const payload = {
        mobile_no,
        item: itemObj.item,
        quantity: newQty,
        payment_type: itemObj.payment_type || "Full Payment",
        full_payment_amount: itemObj.full_payment_amount || 0.0,
        full_payment_discount: itemObj.full_payment_discount || 0.0,
        COD_value: itemObj.cod_value || 0.0,
        COD_Display: itemObj.cod_display || 0.0,
        COD_discount: itemObj.cod_discount || 0.0
      };

      const res = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();

      if (resJson?.message?.status) {
        window.dispatchEvent(new Event("cartUpdate"));

        // Re-fetch cart details to sync final calculations from ERP
        const refreshRes = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData?.message?.status && refreshData.message.data) {
            const normalizedItems = (refreshData.message.data.items || []).map((item: any) => {
              const qty = item.quantity || item.qty || 1;
              const unitPrice = item.price || (item.rate === item.amount ? item.rate / qty : item.rate) || 0;
              return {
                ...item,
                quantity: qty,
                price: unitPrice,
                rate: unitPrice,
                amount: unitPrice * qty
              };
            });
            setCartItems(normalizedItems);
            setCartSummary(refreshData.message.data);
          }
        }
      } else {

      }
    } catch (e) {

    }
  };

  const handleDeleteItem = async (itemId: string) => {
    // Locally remove item for immediate response
    setCartItems(prev => prev.filter(item => item.item !== itemId));

    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const mobile_no = getMobileNo(parsed);
      if (!mobile_no) return;

      const res = await fetch("/api/cart/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_no, item: itemId })
      });

      const resJson = await res.json();
      if (resJson.message?.status) {
        window.dispatchEvent(new Event("cartUpdate"));
        setToastMessage("Product removed from cart successfully!");
        setTimeout(() => {
          setToastMessage("");
        }, 1500);

        // Re-fetch cart details to sync final calculations from ERP
        const refreshRes = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData?.message?.status && refreshData.message.data) {
            const normalizedItems = (refreshData.message.data.items || []).map((item: any) => {
              const qty = item.quantity || item.qty || 1;
              const unitPrice = item.price || (item.rate === item.amount ? item.rate / qty : item.rate) || 0;
              return {
                ...item,
                quantity: qty,
                price: unitPrice,
                rate: unitPrice,
                amount: unitPrice * qty
              };
            });
            setCartItems(normalizedItems);
            setCartSummary(refreshData.message.data);
          }
        }
      } else {

      }
    } catch (e) {

    }
  };

  const handleProceedToCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const stored = localStorage.getItem("gbru_user");
    if (stored) {
      const user = JSON.parse(stored);
      const mobile_no = getMobileNo(user);

      const api_key = user.key_details?.api_key || user.api_key;
      const api_secret = user.key_details?.api_secret || user.api_secret;

      try {
        const addressRes = await fetch("/api/shipping-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no, api_key, api_secret })
        });

        if (addressRes.ok) {
          const json = await addressRes.json();
          if (json.message?.status && Array.isArray(json.message?.data)) {
            if (json.message.data.length === 0) {
              router.push("/location-details");
              return;
            }
          } else {
            router.push("/location-details");
            return;
          }
        } else {
          router.push("/location-details");
          return;
        }
      } catch (err) {

      }
    }
    router.push("/proceed-to-checkout");
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null) return "0.00";
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 pb-16 flex flex-col gap-6 animate-pulse">
          <div className="h-10 w-48 bg-zinc-200 rounded-[12px] mb-2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="h-32 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6"></div>
              <div className="h-32 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6"></div>
            </div>
            <div className="lg:col-span-4 bg-zinc-100 border border-zinc-200/60 rounded-[24px] p-6 h-64"></div>
          </div>
        </main>
      </div>
    );
  }

  const cartPaymentType = cartItems[0]?.payment_type || "Full Payment";
  const isFullPayment = cartPaymentType === "Full Payment";

  const totalMrp = cartSummary?.total_amount || 0;

  const totalFullPaymentDiscount = cartItems.reduce((acc, curr) => {
    return acc + (Number(curr.full_payment_discount || 0) * (curr.quantity || 1));
  }, 0);

  const totalCodDiscount = cartItems.reduce((acc, curr) => {
    return acc + (Number(curr.cod_discount || 0) * (curr.quantity || 1));
  }, 0);

  const totalPayOnDelivery = cartItems.reduce((acc, curr) => {
    if (curr.payment_type === "Cash On Delivery") {
      return acc + (Number(curr.cod_value || 0) * (curr.quantity || 1));
    }
    return acc;
  }, 0);

  const totalCodBooking = cartItems.reduce((acc, curr) => {
    return acc + (Number(curr.cod_display || 0) * (curr.quantity || 1));
  }, 0);

  // If Full Payment: Pay Now = totalMrp - totalFullPaymentDiscount
  // If COD: Pay Now = totalCodBooking
  const totalPayNow = isFullPayment
    ? Math.max(0, totalMrp - totalFullPaymentDiscount)
    : totalCodBooking;

  const subtotal = totalMrp;
  const gst = 0;
  const total = totalPayNow;

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 pb-16 flex flex-col gap-6">

        {/* Back Link */}
        <Link
          href="/all_products"
          className="flex items-center gap-1.5 text-sm font-bold text-[#0D9740] hover:underline"
        >
          ← Back to Shopping
        </Link>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[36px] font-extrabold text-[#0F291B] tracking-tight">
            Your Cart
          </h1>
          <p className="text-[#6B7280] text-sm">
            Review your items and proceed to checkout
          </p>
        </div>

        {error ? (
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 text-center flex flex-col items-center gap-4 mt-4 shadow-sm">
            <span className="text-[48px]">⚠️</span>
            <h3 className="font-bold text-[#0F291B] text-lg">{error}</h3>
            <Link
              href="/login"
              className="bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs py-3 px-6 rounded-full shadow transition-all mt-2"
            >
              Sign In
            </Link>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 text-center flex flex-col items-center gap-4 mt-4 shadow-sm">
            <span className="text-[48px]">🛒</span>
            <h3 className="font-bold text-[#0F291B] text-lg">Your cart is empty</h3>
            <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
              Looks like you haven&apos;t added any products to your cart yet. Let&apos;s head back to browse GBRU heavy-duty tools.
            </p>
            <Link
              href="/all_products"
              className="bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs py-3 px-6 rounded-full shadow transition-all mt-2"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          /* Column Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">

            {/* ── Left Column (Cart Item & Trust Badges) ── */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Product Cards List */}
              {cartItems.map((item) => {
                const itemImage = item.image || "/assets/sprayer.png";

                return (
                  <div key={item.item} className="bg-white border border-zinc-200/80 rounded-[24px] p-6 flex flex-col md:flex-row items-stretch gap-6 relative shadow-sm">

                    {/* Product Image */}
                    <Link
                      href={`/products/view_product?item_code=${item.item}`}
                      className="relative w-full md:w-[160px] h-[160px] rounded-[16px] overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0 flex items-center justify-center p-2 hover:opacity-95 transition-opacity"
                    >
                      <img
                        src={itemImage}
                        alt={item.item_name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex flex-col justify-between flex-1 py-1 text-left">

                      {/* Info Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/products/view_product?item_code=${item.item}`}
                            className="hover:text-[#0D9740] transition-colors"
                          >
                            <h3 className="font-bold text-[#0F291B] text-[18px] leading-snug">
                              {item.item_name}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#6B7280]">
                            Brand: <span className="font-bold text-[#0D9740]">{item.brand || "GBRU"}</span>
                          </p>

                          {/* Payment Mode Badge */}
                          <div className="mt-2.5">
                            <span className="bg-[#EBF5EE] text-[#0D9740] text-[11px] font-bold py-1 px-3 rounded-[9999px]">
                              {item.payment_type ? item.payment_type.toUpperCase() : "FULL PAYMENT"}
                            </span>
                          </div>
                        </div>

                        {/* Trash Button */}
                        <button
                          onClick={() => handleDeleteItem(item.item)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Remove Item"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.587 7.402a.75.75 0 01.796.7l.25 4a.75.75 0 11-1.492.094l-.25-4a.75.75 0 01.7-.796zm3-.7l.25 4a.75.75 0 01-.796.796a.75.75 0 01-.7-.796l.25-4a.75.75 0 011 .7z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>

                      {/* Quantity & Total Price Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t border-zinc-100">
                        {/* Quantity Toggle */}
                        <div className="flex items-center bg-[#F4F6F4] rounded-[9999px] px-3 py-1.5 gap-4">
                          <button
                            onClick={() => handleUpdateQty(item, item.quantity, -1)}
                            className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-[16px] px-1"
                          >
                            −
                          </button>
                          <span className="font-bold text-sm text-[#0F291B] min-w-4 text-center notranslate" translate="no">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item, item.quantity, 1)}
                            className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-[16px] px-1"
                          >
                            +
                          </button>
                        </div>

                        {/* Price display */}
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Total Price</span>
                          <span className="font-extrabold text-[#0F291B] text-[20px] notranslate" translate="no">
                            ₹{formatPrice(item.amount)}
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}

              {/* Trust Badges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex items-center gap-3.5 shadow-sm text-left">
                  <div className="w-11 h-11 rounded-[12px] bg-[#ECFDF3] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#1A1A1A]">Secure Transaction</span>
                    <span className="text-[11px] text-[#6B7280]">100% Safe Payment</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex items-center gap-3.5 shadow-sm text-left">
                  <div className="w-11 h-11 rounded-[12px] bg-[#FFF9EA] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#D9A320]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#1A1A1A]">Fast Delivery</span>
                    <span className="text-[11px] text-[#6B7280]">3-5 Days</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-[16px] p-4 flex items-center gap-3.5 shadow-sm text-left">
                  <div className="w-11 h-11 rounded-[12px] bg-[#EDF2EF] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#0D4E2F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.89-1.46-5.366-3.936-6.826-6.826l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#1A1A1A]">Expert Support</span>
                    <span className="text-[11px] text-[#6B7280]">24/7 Available</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right Column (Order Summary & Estimates) ── */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">

              {/* Summary Box */}
              <div className="bg-white border border-zinc-200/80 rounded-[24px] p-6 shadow-sm flex flex-col gap-5">
                <h3 className="font-roboto font-bold text-[#0F291B] text-lg">
                  Order Summary
                </h3>

                <div className="flex flex-col gap-4 text-sm text-[#374151]">
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-bold text-[#0F291B] text-[16px]">Total Amount</span>
                    <span className="font-extrabold text-[#0D9740] text-[28px] notranslate" translate="no">
                      ₹{formatPrice(cartSummary?.total_amount || 0)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full h-14 rounded-[14px] bg-[#1A4D2E] hover:bg-[#133c23] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 cursor-pointer active:scale-[0.98]"
                >
                  Proceed to Checkout
                  <span className="text-[18px]">→</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#0D9740] text-white px-5 py-3.5 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span>🗑️</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
