"use client";

import React, { useEffect, useState } from "react";
import LoginPrompt from "./LoginPrompt";
import ActionPopup from "./ActionPopup";
import { getMobileNo } from "@/utils/cartUtils";

interface PaymentOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCode: string;
  onConfirm?: () => void;
}

export default function PaymentOptionModal({
  isOpen,
  onClose,
  itemCode,
  onConfirm,
}: PaymentOptionModalProps) {
  const [selectedOption, setSelectedOption] = useState<"full" | "booking">("full");
  const [productDetails, setProductDetails] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isInCart, setIsInCart] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ open: false, title: "", message: "" });

  useEffect(() => {
    if (!isOpen || !itemCode) return;

    const loadItemDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_code: itemCode }),
        });
        const data = await res.json();
        if (data?.message?.status && data.message.data) {
          setProductDetails(data.message.data);
          setQuantity(data.message.data.moq || 1);
          const codVal = data.message.data.COD_value || data.message.data.cod_value || 0;
          if (codVal <= 0) {
            setSelectedOption("full");
          }
        }
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };

    loadItemDetails();
  }, [isOpen, itemCode]);

  useEffect(() => {
    if (!isOpen || !itemCode) return;

    const checkCartStatus = async () => {
      const user = localStorage.getItem("gbru_user");
      if (!user) return;
      try {
        const parsed = JSON.parse(user);
        const mobile_no = getMobileNo(parsed);
        if (!mobile_no) return;
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile_no })
        });
        if (res.ok) {
          const json = await res.json();
          const items = json.message?.data?.items || [];
          const cartItem = items.find((i: any) => i.item === itemCode);
          if (cartItem) {
            setIsInCart(true);
            setQuantity(cartItem.quantity);
            if (cartItem.payment_type === "Cash On Delivery") {
              setSelectedOption("booking");
            } else {
              setSelectedOption("full");
            }
          } else {
            setIsInCart(false);
          }
        }
      } catch (e) {
        
      }
    };

    checkCartStatus();
  }, [isOpen, itemCode]);

  if (!isOpen) return null;

  const formatPrice = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddToCart = async () => {
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        const pendingItem = {
          item: itemCode,
          item_name: productDetails?.item_name,
          quantity: quantity,
          is_moq_applicable: 0,
          payment_type: selectedOption === "full" ? "Full Payment" : "Cash On Delivery",
          full_payment_amount: productDetails?.full_payment_amount || 0.0,
          full_payment_discount: productDetails?.full_payment_discount || 0.0,
          cod_value: productDetails?.COD_value || 0.0,
          cod_display: productDetails?.COD_Display || 0.0,
          cod_discount: productDetails?.COD_discount || 0.0,
        };
        localStorage.setItem("gbru_pending_cart_item", JSON.stringify(pendingItem));
        setShowLoginPrompt(true);
        return;
      }

      const parsed = JSON.parse(stored);
      const mobile_no = getMobileNo(parsed);
      if (!mobile_no) {
        const pendingItem = {
          item: itemCode,
          item_name: productDetails?.item_name,
          quantity: quantity,
          is_moq_applicable: 0,
          payment_type: selectedOption === "full" ? "Full Payment" : "Cash On Delivery",
          full_payment_amount: productDetails?.full_payment_amount || 0.0,
          full_payment_discount: productDetails?.full_payment_discount || 0.0,
          cod_value: productDetails?.COD_value || 0.0,
          cod_display: productDetails?.COD_Display || 0.0,
          cod_discount: productDetails?.COD_discount || 0.0,
          COD_value: productDetails?.COD_value || 0.0,
          COD_Display: productDetails?.COD_Display || 0.0,
          COD_discount: productDetails?.COD_discount || 0.0,
        };
        localStorage.setItem("gbru_pending_cart_item", JSON.stringify(pendingItem));
        setShowLoginPrompt(true);
        return;
      }

      setSubmitting(true);

      const endpoint = isInCart ? "/api/cart/update" : "/api/cart/add";
      const payload = isInCart
        ? {
            mobile_no,
            item: itemCode,
            quantity: quantity,
            payment_type: selectedOption === "full" ? "Full Payment" : "Cash On Delivery",
            full_payment_amount: productDetails?.full_payment_amount || 0.0,
            full_payment_discount: productDetails?.full_payment_discount || 0.0,
            COD_value: productDetails?.COD_value || 0.0,
            COD_Display: productDetails?.COD_Display || 0.0,
            COD_discount: productDetails?.COD_discount || 0.0,
          }
        : {
            mobile_no,
            items: [
              {
                item: itemCode,
                quantity: quantity,
                is_moq_applicable: 0,
                payment_type: selectedOption === "full" ? "Full Payment" : "Cash On Delivery",
                full_payment_amount: productDetails?.full_payment_amount || 0.0,
                full_payment_discount: productDetails?.full_payment_discount || 0.0,
                cod_value: productDetails?.COD_value || 0.0,
                cod_display: productDetails?.COD_Display || 0.0,
                cod_discount: productDetails?.COD_discount || 0.0,
                COD_value: productDetails?.COD_value || 0.0,
                COD_Display: productDetails?.COD_Display || 0.0,
                COD_discount: productDetails?.COD_discount || 0.0,
              }
            ]
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();

      if (resJson.message?.status || resJson.success) {
        window.dispatchEvent(new Event("cartUpdate"));
        window.dispatchEvent(new CustomEvent("productAddedToCart", {
          detail: {
            category: productDetails?.item_group,
            subcategory: productDetails?.custom_sub_category,
            brand: productDetails?.brand_id || "175",
            item_name: productDetails?.item_name
          }
        }));
        setToastType("success");
        setToastMessage(`${productDetails?.item_name || "Product"} ${isInCart ? "updated in" : "added to"} cart successfully!`);
        setIsInCart(true);
        setTimeout(() => {
          setToastMessage("");
          onClose();
          if (onConfirm) onConfirm();
        }, 1500);
      } else {
        setErrorPopup({
          open: true,
          title: "Add to Cart Failed",
          message: resJson.message?.message || resJson.error || `Failed to ${isInCart ? "update" : "add"} product.`,
        });
      }
    } catch (err) {
      
      setErrorPopup({
        open: true,
        title: "Add to Cart Failed",
        message: `Failed to ${isInCart ? "update" : "add"} product.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[640px] p-6 relative flex flex-col gap-6 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
          <div className="text-left">
            <h3 className="text-lg font-bold text-[#0F291B]">Choose Payment Method</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{productDetails?.item_name || "Select option below"}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center justify-center text-sm font-bold disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <svg className="animate-spin h-8 w-8 text-[#0D9740]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-zinc-500 font-medium">Fetching options...</span>
          </div>
        ) : (
          <>
            {/* Options container */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch overflow-y-auto pr-1">
              {/* Card 1: Full Payment */}
              <div
                onClick={() => setSelectedOption("full")}
                className={`flex-1 p-4 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  selectedOption === "full"
                    ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1 text-left">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    selectedOption === "full" ? "border-[#0d9740]" : "border-zinc-300"
                  }`}>
                    {selectedOption === "full" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0d9740]" />
                    )}
                  </div>
                  <span className="font-bold text-[#0F291B] text-[15px]">Full Payment</span>
                </div>
                <p className="text-[11px] text-zinc-500 mb-4 pl-6 text-left">Pay complete amount now</p>
                <div className="pl-6 pt-2 border-t border-zinc-100 mt-auto text-left flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-[11px] text-zinc-500">
                    <span>Order Total</span>
                    <span className="notranslate" translate="no">₹{formatPrice((productDetails?.actual_rate || productDetails?.price || 0) * quantity)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500">
                    <span>Instant Discount</span>
                    <span className="text-[#0d9740] font-medium notranslate" translate="no">-₹{formatPrice((productDetails?.full_payment_discount || 0) * quantity)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100 mt-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pay Now</span>
                    <span className="text-base font-extrabold text-[#0f291b] notranslate" translate="no">
                      ₹{formatPrice((productDetails?.full_payment_amount || productDetails?.price || 0) * quantity)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#0d9740] font-bold mt-2 text-center bg-[#E8F5E9] py-1.5 rounded-lg notranslate" translate="no">
                    🎁 You'll save ₹{formatPrice((productDetails?.full_payment_discount || 0) * quantity)} on this order!
                  </div>
                </div>
              </div>

              {/* Card 2: Cash On Delivery */}
              {productDetails && (productDetails.COD_value || productDetails.cod_value || 0) > 0 && (
                <div
                  onClick={() => setSelectedOption("booking")}
                  className={`flex-1 p-4 rounded-[20px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedOption === "booking"
                      ? "border-[#0d9740] bg-[#0d9740]/[0.02]"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-left">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedOption === "booking" ? "border-[#0d9740]" : "border-zinc-300"
                    }`}>
                      {selectedOption === "booking" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0d9740]" />
                      )}
                    </div>
                    <span className="font-bold text-[#0F291B] text-[15px]">Book Now & Pay On Delivery</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-4 pl-6 text-left">Confirm your order instantly</p>
                  <div className="pl-6 pt-2 border-t border-zinc-100 mt-auto text-left flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Order Total</span>
                      <span className="notranslate" translate="no">₹{formatPrice((productDetails?.actual_rate || productDetails?.price || 0) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Instant Discount</span>
                      <span className="notranslate" translate="no">-₹{formatPrice((productDetails?.COD_discount || 0) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Effective Total</span>
                      <span className="notranslate" translate="no">₹{formatPrice(((productDetails?.actual_rate || productDetails?.price || 0) - (productDetails?.COD_discount || 0)) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Pay Now (Booking)</span>
                      <span className="notranslate" translate="no">₹{formatPrice((productDetails?.COD_Display || productDetails?.cod_display || 0) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-100 mt-1">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pay on Delivery</span>
                      <span className="text-base font-extrabold text-[#0f291b] notranslate" translate="no">
                        ₹{formatPrice((productDetails?.COD_value || productDetails?.cod_value || 0) * quantity)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 font-bold mt-2 text-center bg-zinc-100 py-1.5 rounded-lg notranslate" translate="no">
                      🎁 You'll save ₹{formatPrice((productDetails?.COD_discount || 0) * quantity)} on this order!
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-3 px-4 bg-zinc-50 border border-zinc-100 rounded-[14px]">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-[#0F291B]">Quantity</span>
                {productDetails?.moq > 1 && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Minimum: {productDetails.moq} {productDetails.stock_uom || "Nos"}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white rounded-full border border-zinc-200 px-3 py-1 gap-4 shadow-sm">
                <button
                  onClick={() => setQuantity((prev) => Math.max(productDetails?.moq || 1, prev - 1))}
                  className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-sm px-1 transition-colors"
                >
                  −
                </button>
                <span className="font-extrabold text-sm text-[#0F291B] min-w-4 text-center notranslate" translate="no">{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-sm px-1 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 font-bold text-xs hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 notranslate"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isInCart ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  isInCart ? "Update Cart" : "Add to Cart"
                )}
              </button>
            </div>
          </>
        )}
      </div>

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
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <ActionPopup
        isOpen={errorPopup.open}
        title={errorPopup.title}
        message={errorPopup.message}
        type="error"
        onClose={() => setErrorPopup({ open: false, title: "", message: "" })}
      />

      {/* Login Prompt Popup */}
      <LoginPrompt isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </div>
  );
}
