"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMobileNo } from "@/utils/cartUtils";

export default function PopularItemsModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [addedItemName, setAddedItemName] = useState("");
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingCartItemCode, setAddingCartItemCode] = useState<string | null>(null);
  const [addedItemsState, setAddedItemsState] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleAddedToCart = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { category, subcategory, brand, item_name } = customEvent.detail || {};

      setAddedItemName(item_name || "Item");
      setPopularItems([]);
      setAddedItemsState({});
      setIsOpen(true);
      setLoading(true);

      try {
        const userStr = localStorage.getItem("gbru_user");
        let mobile_no = "";
        if (userStr) {
          const user = JSON.parse(userStr);
          mobile_no = getMobileNo(user);
        }

        // Fetch active cart status to sync button states
        if (mobile_no) {
          try {
            const resCart = await fetch(`/api/cart?t=${Date.now()}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ mobile_no }),
              cache: "no-store"
            });
            if (resCart.ok) {
              const jsonCart = await resCart.json();
              const items = jsonCart.message?.data?.items || [];
              const initialAddedState: { [key: string]: boolean } = {};
              items.forEach((item: any) => {
                if (item.item) {
                  initialAddedState[String(item.item).trim().toLowerCase()] = true;
                }
              });
              setAddedItemsState(initialAddedState);
            }
          } catch (e) {
            
            setAddedItemsState({});
          }
        } else {
          setAddedItemsState({});
        }

        const res = await fetch(`/api/products/popular?t=${Date.now()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: category || null,
            subcategory: subcategory || null,
            brand: brand || "175",
            mobile_no: mobile_no || null,
          }),
          cache: "no-store"
        });

        const data = await res.json();
        if (data?.message?.status && data.message.data?.data) {
          setPopularItems(data.message.data.data.slice(0, 2));
        }
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("productAddedToCart" as any, handleAddedToCart);
    return () => window.removeEventListener("productAddedToCart" as any, handleAddedToCart);
  }, []);

  const [selectedItemForPayment, setSelectedItemForPayment] = useState<any | null>(null);
  const [paymentOption, setPaymentOption] = useState<"full" | "booking">("full");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const handleAddPopularToCart = async (item: any) => {
    setAddingCartItemCode(item.item_code);
    try {
      const res = await fetch("/api/products/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_code: item.item_code }),
      });
      const data = await res.json();
      if (data?.message?.status && data.message.data) {
        setSelectedItemForPayment({ ...item, ...data.message.data });
      } else {
        setSelectedItemForPayment(item);
      }
      setPaymentOption("full");
    } catch {
      setSelectedItemForPayment(item);
      setPaymentOption("full");
    } finally {
      setAddingCartItemCode(null);
    }
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedItemForPayment) return;
    const item = selectedItemForPayment;
    const userStr = localStorage.getItem("gbru_user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const mobile_no = getMobileNo(user);
      if (!mobile_no) return;

      setSubmittingPayment(true);

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          items: [
            {
              item: item.item_code,
              quantity: item.moq || 1,
              is_moq_applicable: 0,
              payment_type: paymentOption === "full" ? "Full Payment" : "Cash On Delivery",
              full_payment_amount: item.full_payment_amount || item.price || 0.0,
              full_payment_discount: item.full_payment_discount || 0.0,
              cod_value: item.cod_value || item.COD_value || 0.0,
              cod_display: item.cod_display || item.COD_Display || 0.0,
              cod_discount: item.cod_discount || item.COD_discount || 0.0,
              COD_value: item.cod_value || item.COD_value || 0.0,
              COD_Display: item.cod_display || item.COD_Display || 0.0,
              COD_discount: item.cod_discount || item.COD_discount || 0.0,
            },
          ],
        }),
      });

      const resJson = await res.json();
      if (resJson.message?.status || resJson.success) {
        setAddedItemsState((prev) => ({ ...prev, [item.item_code]: true }));
        window.dispatchEvent(new Event("cartUpdate"));
        setSelectedItemForPayment(null);
      } else {
        alert(resJson.message?.message || resJson.error || "Failed to add to cart");
      }
    } catch (err: any) {
      alert(`Error adding to cart: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-[580px] p-6 lg:p-8 shadow-2xl relative flex flex-col gap-6 text-left border border-zinc-100 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100"
        >
          ✕
        </button>

        {/* Success Header */}
        <div className="flex flex-col items-center text-center gap-3 border-b border-zinc-100 pb-5">
          <div className="w-12 h-12 rounded-full bg-[#EBF5EE] text-[#0D9740] flex items-center justify-center text-2xl">
            ✓
          </div>
          <h3 className="font-roboto font-extrabold text-[#0F291B] text-xl">
            Added to Cart Successfully!
          </h3>
          <p className="text-zinc-500 text-xs font-semibold max-w-[380px]">
            "{addedItemName}" has been successfully added to your shopping cart.
          </p>
        </div>

        {/* Popular Recommendations */}
        <div>
          <h4 className="font-bold text-[#0F291B] text-xs uppercase tracking-wider mb-4">
            Popular Add-ons Recommended for You
          </h4>

          {loading ? (
            <div className="h-32 flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-[#0D9740]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-zinc-400 text-xs font-bold">Fetching recommended items...</span>
            </div>
          ) : popularItems.length === 0 ? (
            <p className="text-zinc-400 text-xs italic py-4">No popular recommendations found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {popularItems.map((item) => (
                <div
                  key={item.item_code}
                  className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-3 flex flex-col justify-between hover:border-zinc-300 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-white border border-zinc-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative">
                      {item.custom_image_1 ? (
                        <img src={item.custom_image_1} alt={item.item_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🌱</span>
                      )}
                      {item.discount > 0 && (
                        <div className="absolute top-1 left-1 bg-[#0D9740] text-white text-[8px] font-bold px-1 rounded">
                          {Math.round(item.discount)}%
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-bold text-[#0F291B] text-xs truncate">{item.item_name}</h5>
                      <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-extrabold mt-0.5">
                        {item.brand || "GBRU"}
                      </p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-[#0D9740] font-extrabold text-xs">
                          ₹{Number(item.price).toLocaleString("en-IN")}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-[9px] line-through text-zinc-400 font-semibold">
                            ₹{Number(item.mrp).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddPopularToCart(item)}
                    disabled={addingCartItemCode === item.item_code || addedItemsState[String(item.item_code).trim().toLowerCase()]}
                    className={`w-full mt-3 h-8 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                      addedItemsState[String(item.item_code).trim().toLowerCase()]
                        ? "bg-zinc-200 text-zinc-500 cursor-not-allowed"
                        : "bg-[#0D9740] hover:bg-[#0a7d34] text-white shadow-sm"
                    }`}
                  >
                    {addingCartItemCode === item.item_code ? (
                      <span className="animate-pulse">Adding...</span>
                    ) : addedItemsState[String(item.item_code).trim().toLowerCase()] ? (
                      "✓ Added to Cart"
                    ) : (
                      "+ Add to Cart"
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="flex gap-3 pt-4 border-t border-zinc-100">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 h-12 border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-bold text-xs rounded-xl transition-all"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push("/cart");
            }}
            className="flex-1 h-12 bg-[#0F291B] hover:bg-[#081810] text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Go to Cart
          </button>
        </div>
      </div>

      {/* ── Payment Option Selection Popup ── */}
      {selectedItemForPayment && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItemForPayment(null)}>
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left border border-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mb-0.5">Select Payment Option</p>
                <h4 className="font-bold text-[#0F291B] text-sm line-clamp-2 leading-snug">{selectedItemForPayment.item_name}</h4>
              </div>
              <button onClick={() => setSelectedItemForPayment(null)} className="text-zinc-400 hover:text-zinc-700 mt-0.5 shrink-0">
                ✕
              </button>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col gap-3">
              {/* Full Payment Card */}
              <div
                onClick={() => setPaymentOption("full")}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentOption === "full" ? "border-[#0d9740] bg-[#F5F5F5]" : "border-zinc-200 bg-[#F5F5F5] hover:border-zinc-300"
                }`}
              >
                {paymentOption === "full" && (
                  <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">✓</div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === "full" ? "border-[#0D9740]" : "border-zinc-400"}`}>
                    {paymentOption === "full" && <div className="w-2 h-2 rounded-full bg-[#0D9740]" />}
                  </div>
                  <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Full Payment</span>
                  <span className="ml-auto bg-[#DFB33F] text-white text-[9px] font-bold py-0.5 px-2 rounded-full">MOST PREFERRED</span>
                </div>
                <div className="h-px bg-zinc-200 mb-2" />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[13px] text-[#4A4A4A]">
                    <span>Order Total</span>
                    <span>₹{Number(selectedItemForPayment.actual_rate || selectedItemForPayment.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-[#0D9740]">
                    <span>Instant Discount</span>
                    <span>- ₹{Number((selectedItemForPayment.actual_rate || selectedItemForPayment.price || 0) - (selectedItemForPayment.full_payment_amount || selectedItemForPayment.price || 0)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-zinc-200">
                    <span className="text-[15px] font-bold text-black">Pay Now</span>
                    <span className="text-[15px] font-bold text-black">₹{Number(selectedItemForPayment.full_payment_amount || selectedItemForPayment.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Book Now / COD Card */}
              {Number(selectedItemForPayment.cod_value || selectedItemForPayment.COD_value || 0) > 0 && (
                <div
                  onClick={() => setPaymentOption("booking")}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentOption === "booking" ? "border-[#0d9740] bg-white" : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  {paymentOption === "booking" && (
                    <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">✓</div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentOption === "booking" ? "border-[#0D9740]" : "border-zinc-400"}`}>
                      {paymentOption === "booking" && <div className="w-2 h-2 rounded-full bg-[#0D9740]" />}
                    </div>
                    <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Book Now &amp; Pay On Delivery</span>
                  </div>
                  <div className="bg-[#F5F9F7] rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px] text-[#4A4A4A]">
                      <span>Order Total</span>
                      <span className="font-bold text-[#1A1A1A]">₹{Number(selectedItemForPayment.actual_rate || selectedItemForPayment.price || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-[#0D9740]">
                      <span>Instant Discount</span>
                      <span>- ₹{Number((selectedItemForPayment.actual_rate || selectedItemForPayment.price || 0) - (selectedItemForPayment.price || 0)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[12px] bg-[#D4E8DC] px-2 py-1 rounded text-[#0F291B] mt-0.5">
                      <span>Effective Total</span>
                      <span>₹{Number(selectedItemForPayment.price || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold text-black text-[13px]">Pay Now (Booking)</span>
                      <span className="font-bold text-[#0D9740] text-[14px]">₹{Number(selectedItemForPayment.cod_display || selectedItemForPayment.COD_Display || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 flex justify-between">
                      <span className="font-bold text-[#6B7280] text-[13px]">Pay on Delivery</span>
                      <span className="font-bold text-black text-[14px]">₹{Number(selectedItemForPayment.cod_value || selectedItemForPayment.COD_value || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
             <button
               onClick={handleConfirmAddToCart}
               disabled={submittingPayment}
               className="w-full h-12 rounded-2xl bg-[#0D9740] hover:bg-[#0b8234] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2 notranslate"
             >
              {submittingPayment ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  Adding to Cart...
                </>
              ) : (
                "Confirm & Add to Cart"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
