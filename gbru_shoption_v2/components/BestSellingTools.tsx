"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginPrompt from "./LoginPrompt";
import PaymentOptionModal from "./PaymentOptionModal";
import { getMobileNo } from "@/utils/cartUtils";

export default function BestSellingTools() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cartItemCodes, setCartItemCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products/featured", { method: "POST" });
        if (!res.ok) {
          throw new Error("Failed to load featured tools.");
        }
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {

          throw new Error("Invalid JSON");
        }
        if (data?.message?.status && Array.isArray(data.message.data?.data)) {
          setProducts(data.message.data.data.slice(0, 4));
        }
      } catch (e) {

      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

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

  const handleAddToCart = (product: any) => {
    setSelectedProduct(product);
    setShowPaymentModal(true);
  };

  const formatPrice = (num: any) => {
    const val = parseFloat(num);
    return isNaN(val) ? "0.00" : val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center">
        <svg className="animate-spin h-8 w-8 text-[#1E532E]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (products.length === 0) {
    return null; // Don't render empty section
  }

  return (
    <section className="relative w-full bg-[#EAF5EE] pt-10 xl:pb-12 pb-2 px-4 xl:px-[64px] flex flex-col items-center justify-start overflow-hidden">
      {/* Header Container */}
      <div className="relative z-10 w-full xl:w-[1152px] flex items-center justify-between">

        {/* MOBILE heading — smaller font, mobile only */}
        <h2
          className="block xl:hidden text-[#0F291B]"
          style={{
            fontFamily: "Roboto, sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            lineHeight: "28px",
            letterSpacing: "-0.44px",
          }}
        >
          Best Selling Tools
        </h2>

        {/* DESKTOP heading — original size, untouched */}
        <h2
          className="hidden xl:block text-[#0F291B]"
          style={{
            fontFamily: "Roboto, sans-serif",
            fontWeight: 700,
            fontSize: "48px",
            lineHeight: "56px",
            letterSpacing: "-0.96px",
            verticalAlign: "middle"
          }}
        >
          Best Selling Tools
        </h2>

        <Link href="/all_products">
          <button className="w-[100px] h-[32px] bg-[#0D9740] hover:bg-[#0a7d34] text-white font-roboto font-bold text-[12px] rounded-full flex items-center justify-center transition-all duration-300 shadow-md">
            View All
          </button>
        </Link>
      </div>

      {/* Mobile horizontal scroller — Figma Exact */}
      <div className="relative z-10 w-full mt-8 xl:hidden -mx-4 px-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
        <div className="flex flex-nowrap gap-4 min-w-max">
          {products.map((product) => {
            const discountVal = product.discount || 0;
            const itemImage = product.custom_image_1 || product.image || "/assets/sprayer.png";

            const name = (product.item_name || "").toLowerCase();
            let tags = ["Farmer's Choice"];
            let features = ["Durable Build", "High Performance"];
            if (name.includes("spray") || name.includes("तूफान")) {
              tags = ["Farmer's Choice", "1 Year Warranty"];
              features = ["20L Tank Capacity", "High-Pressure Nozzle"];
            } else if (name.includes("pump")) {
              tags = ["Farmer's Choice"];
              features = ["Cast Iron Body", "Low Fuel Consumption"];
            } else if (name.includes("seed")) {
              tags = ["Farmer's Choice"];
              features = ["Cast Iron Body", "efficient"];
            } else if (name.includes("weed")) {
              tags = ["Easy Maintenance"];
              features = ["9HP Engine Power", "Adjustable Tilling Width"];
            }

            return (
              <div
                key={product.item_code}
                onClick={() => handleAddToCart(product)}
                className="bg-white overflow-hidden flex flex-col relative text-left shrink-0 snap-start cursor-pointer hover:shadow-md transition-shadow"
                style={{
                  width: "202px",
                  height: "402px",
                  borderRadius: "20.48px",
                  borderWidth: "0.64px",
                  borderColor: "rgba(15, 41, 27, 0.1)",
                  padding: "16px",
                }}
              >
                {/* Product Image Section */}
                <div
                  className="relative overflow-hidden flex items-center justify-center bg-[#EAF5EE] rounded-[14px]"
                  style={{
                    width: "170px",
                    height: "170px",
                  }}
                >
                  {discountVal > 0 ? (
                    <div className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold rounded-[6px] z-10 bg-[#FEF5D1] text-[#78350F] border border-[#FDF4CE]">
                      {discountVal.toFixed(0)}% OFF
                    </div>
                  ) : null}
                  <img
                    src={itemImage}
                    alt={product.item_name}
                    className="object-contain w-[140px] h-[140px]"
                  />
                </div>

                {/* Content section */}
                <div className="flex flex-col flex-1 mt-3 justify-between">
                  <div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="bg-[#FEF08A] text-[#854D0E] text-[8px] font-bold px-2 py-0.5 rounded-full">
                        Farmer's Choice
                      </span>
                      <span className="bg-[#FEF08A] text-[#854D0E] text-[8px] font-bold px-2 py-0.5 rounded-full">
                        1 Year Warranty
                      </span>
                    </div>

                    <h3 className="font-roboto font-bold text-[14px] text-[#0F291B] leading-tight line-clamp-2">
                      {product.item_name}
                    </h3>

                    <ul className="flex flex-col gap-1.5 mb-6 text-[#4B5563]">
                      {features.map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1.5"
                          style={{
                            fontFamily: 'Roboto, sans-serif',
                            fontWeight: 400,
                            fontSize: '11.84px',
                            lineHeight: '17.76px',
                            letterSpacing: '0px',
                            verticalAlign: 'middle',
                          }}
                        >
                          <svg className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                        className="w-full h-[40px] bg-[#006B21] hover:bg-[#005a1b] text-white font-bold text-[13px] rounded-full shadow-sm transition-all duration-300 flex items-center justify-center active:scale-[0.99]"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Grid Container */}
      <div className="hidden xl:grid relative z-10 w-full xl:w-[1152px] mt-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[20.85px] items-stretch">
          {products.map((product) => {
            const discountVal = product.discount || 0;
            const itemImage = product.custom_image_1 || product.image || "/assets/sprayer.png";

            const name = (product.item_name || "").toLowerCase();
            let tags = ["Farmer's Choice"];
            let features = ["Durable Build", "High Performance"];
            if (name.includes("spray") || name.includes("तूफान")) {
              tags = ["Farmer's Choice", "1 Year Warranty"];
              features = ["20L Tank Capacity", "High-Pressure Nozzle"];
            } else if (name.includes("pump")) {
              tags = ["Farmer's Choice"];
              features = ["Cast Iron Body", "Low Fuel Consumption"];
            } else if (name.includes("seed")) {
              tags = ["Farmer's Choice"];
              features = ["Cast Iron Body", "efficient"];
            } else if (name.includes("weed")) {
              tags = ["Easy Maintenance"];
              features = ["9HP Engine Power", "Adjustable Tilling Width"];
            }

            return (
              <div
                key={product.item_code}
                onClick={() => handleAddToCart(product)}
                className="bg-white rounded-[24px] border border-gray-100 overflow-hidden flex flex-col transition-shadow hover:shadow-lg relative text-left p-3 cursor-pointer"
              >
                <div className="relative h-[220px] w-full bg-[#EAF0E7] rounded-[16px] overflow-hidden flex items-center justify-center p-4 hover:opacity-90 transition-opacity">
                  {discountVal > 0 ? (
                    <div className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold rounded-md z-10 bg-[#FEF5D1] text-[#78350F] border border-[#FDF4CE]">
                      {discountVal.toFixed(0)}% OFF
                    </div>
                  ) : null}
                  <img
                    src={itemImage}
                    alt={product.item_name}
                    className="object-contain max-h-full max-w-full mix-blend-multiply"
                  />
                </div>

                <div className="pt-4 flex flex-col flex-1 px-1">
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {tags.map((tag, i) => (
                      <span key={i} className="bg-[#FFD100] text-[#111] text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="hover:text-[#006B21] transition-colors">
                    <h3
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 700,
                        fontSize: '17.76px',
                        lineHeight: '23.68px',
                        letterSpacing: '-0.18px',
                        verticalAlign: 'middle',
                      }}
                      className="text-[#1A1A1A] mb-3 line-clamp-2"
                    >
                      {product.item_name}
                    </h3>
                  </div>

                  <ul className="flex flex-col gap-1.5 mb-6 text-[#4B5563]">
                    {features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-1.5"
                        style={{
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          fontSize: '11.84px',
                          lineHeight: '17.76px',
                          letterSpacing: '0px',
                          verticalAlign: 'middle',
                        }}
                      >
                        <svg className="w-3.5 h-3.5 text-[#374151] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className="w-full h-[42px] bg-[#2E6B4A] hover:bg-[#235339] text-white font-bold text-[14px] rounded-full shadow-sm transition-all duration-300 flex items-center justify-center active:scale-[0.99]"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <PaymentOptionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        itemCode={selectedProduct?.item_code || ""}
      />
    </section>
  );
}

