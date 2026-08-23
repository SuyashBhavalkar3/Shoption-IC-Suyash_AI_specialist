"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginPrompt from "./LoginPrompt";
import { addToCartUtil, getMobileNo } from "@/utils/cartUtils";
import PaymentOptionModal from "./PaymentOptionModal";

interface ERPProduct {
  item_code: string;
  item_name: string;
  item_group: string;
  brand: string;
  stock_uom: string;
  gst_hsn_code: string;
  custom_sub_category: string;
  custom_image_path: string | null;
  custom_image_1: string | null;
  brand_id: string;
  moq: number;
  price_list: string;
  mrp: number;
  discount: number;
  oem_code: string | null;
  no_gst_price: number;
  price: number;
  actual_rate: number;
}

export default function FeaturedProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<ERPProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [cartItemCodes, setCartItemCodes] = useState<string[]>([]);
  
  // Payment Option Modal state variables
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ERPProduct | null>(null);

  useEffect(() => {
    const fetchCartStatus = async () => {
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
          setCartItemCodes(items.map((i: any) => i.item));
        }
      } catch (e) {

      }
    };

    fetchCartStatus();
    window.addEventListener("cartUpdate", fetchCartStatus);
    return () => window.removeEventListener("cartUpdate", fetchCartStatus);
  }, []);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch("/api/products?category_id=");
        if (!res.ok) {
          throw new Error("Failed to load featured products.");
        }
        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch (e) {

          throw new Error("Invalid JSON from featured endpoint");
        }
        if (json?.message?.status && Array.isArray(json.message.data?.data)) {
          // Take the first 10 items for the featured display
          setProducts(json.message.data.data.slice(0, 10));
        }
      } catch (err) {

      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const handleAddToCart = (product: ERPProduct) => {
    const user = localStorage.getItem("gbru_user");
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setSelectedProduct(product);
      setShowPaymentModal(true);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#006B21] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white font-roboto relative">
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

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 w-full">

        {/* Header controls */}
        <div className="flex items-center justify-between mb-6 lg:mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#0F291B] tracking-tight">
            Featured Products
          </h2>
          <Link
            href="/products"
            className="text-sm font-bold text-[#006B21] hover:text-[#005a1b] transition-colors flex items-center gap-1.5 shrink-0"
          >
            View all products <span>→</span>
          </Link>
        </div>

        {/* Mobile horizontal scroller */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-3">
          <div className="flex flex-nowrap gap-4 min-w-max">
            {products.map((product) => {
              const itemImage = product.custom_image_1 && product.custom_image_1.startsWith("http")
                ? product.custom_image_1
                : "/assets/sprayer.png";

              const mockRating = "5.0";
              const mockReviews = 40 + (parseInt(product.item_code) % 95);

              return (
                <div
                  key={product.item_code}
                  onClick={() => handleAddToCart(product)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 relative p-4 group shadow-sm w-[260px] shrink-0 cursor-pointer hover:shadow-md"
                >
                  <div>
                    {/* Image box with embedded badge */}
                    <div className="relative w-full aspect-square bg-[#E8F3EB] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-4">
                      {product.discount && product.discount > 0 ? (
                        <div className="absolute top-0 left-0 px-3 py-1.5 text-[13px] font-medium bg-[#FFD700] text-[#1F2937] z-10 rounded-br-xl">
                          {product.discount.toFixed(0)}% OFF
                        </div>
                      ) : null}
                      <img
                        src={itemImage}
                        alt={product.item_name}
                        className="object-contain max-h-full max-w-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <h3 className="font-normal text-[18px] text-[#1A1A1A] line-clamp-2 leading-snug min-h-[48px] mb-2 transition-colors">
                      {product.item_name}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-3 text-[14px]">
                      <span className="text-[#FBBF24] text-lg leading-none">★</span>
                      <span className="text-[#FBBF24] font-medium">{mockRating}</span>
                      <span className="text-gray-400">({mockReviews})</span>
                    </div>

                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-[26px] font-medium text-[#1A1A1A]">₹{formatPrice(product.price)}</span>
                      {product.mrp > product.price && (
                        <span className="text-[15px] text-gray-400 line-through">₹{formatPrice(product.mrp)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    className="w-full h-12 bg-[#276342] hover:bg-[#1e4d33] text-white font-medium text-[16px] rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    {cartItemCodes.includes(product.item_code) ? "Update Cart" : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {products.map((product) => {
            const itemImage = product.custom_image_1 && product.custom_image_1.startsWith("http")
              ? product.custom_image_1
              : "/assets/sprayer.png";

            // Fixed star rating mock for premium feel
            const mockRating = "5.0";
            const mockReviews = 40 + (parseInt(product.item_code) % 95);

            return (
              <div
                key={product.item_code}
                onClick={() => handleAddToCart(product)}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg relative p-4 group cursor-pointer"
              >
                <div>
                  {/* Image box with embedded badge */}
                  <div className="relative w-full aspect-square bg-[#E8F3EB] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-4">
                    {product.discount && product.discount > 0 ? (
                      <div className="absolute top-0 left-0 px-3 py-1.5 text-[13px] font-medium bg-[#FFD700] text-[#1F2937] z-10 rounded-br-xl">
                        {product.discount.toFixed(0)}% OFF
                      </div>
                    ) : null}
                    <img
                      src={itemImage}
                      alt={product.item_name}
                      className="object-contain max-h-full max-w-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Content */}
                  <h3 className="font-normal text-[18px] text-[#1A1A1A] line-clamp-2 leading-snug min-h-[48px] mb-2 transition-colors">
                    {product.item_name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mb-3 text-[14px]">
                    <span className="text-[#FBBF24] text-lg leading-none">★</span>
                    <span className="text-[#FBBF24] font-medium">{mockRating}</span>
                    <span className="text-gray-400">({mockReviews})</span>
                  </div>

                  {/* Prices */}
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-[26px] font-medium text-[#1A1A1A]">₹{formatPrice(product.price)}</span>
                    {product.mrp > product.price && (
                      <span className="text-[15px] text-gray-400 line-through">₹{formatPrice(product.mrp)}</span>
                    )}
                  </div>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                  className="w-full h-12 bg-[#276342] hover:bg-[#1e4d33] text-white font-medium text-[16px] rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  {cartItemCodes.includes(product.item_code) ? "Update Cart" : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Login Prompt Popup */}
        <LoginPrompt
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
        />

        {/* Payment Option Modal */}
        <PaymentOptionModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          itemCode={selectedProduct?.item_code || ""}
        />
      </div>
    </section>
  );
}
