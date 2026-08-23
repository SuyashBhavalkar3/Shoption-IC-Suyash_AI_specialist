"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "./Navbar";
import LoginPrompt from "./LoginPrompt";
import PaymentOptionModal from "./PaymentOptionModal";

import { getMobileNo } from "@/utils/cartUtils";

function AllProductsContent() {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cartItemCodes, setCartItemCodes] = useState<string[]>([]);
  const searchParams = useSearchParams();

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
  const searchQuery = searchParams.get("search");

  useEffect(() => {
    async function fetchFeatured() {
      try {
        let res;
        if (searchQuery) {
          res = await fetch(`/api/products?q=${encodeURIComponent(searchQuery)}`);
        } else {
          res = await fetch("/api/products/featured", { method: "POST" });
        }
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch(e) {
          
          throw new Error("Invalid JSON");
        }
        
        if (searchQuery) {
          if (data?.message?.data?.data && Array.isArray(data.message.data.data)) {
            setProductsList(data.message.data.data);
          }
        } else {
          if (data?.message?.status && Array.isArray(data.message.data?.data)) {
            setProductsList(data.message.data.data);
          }
        }
      } catch (e) {
        
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, [searchQuery]);

  const handleAddToCart = (product: any) => {
    setSelectedProduct(product);
    setShowPaymentModal(true);
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null) return "0.00";
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-roboto relative">
      <Navbar />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm font-medium mb-6">
          <Link href="/" className="text-[#4A4A4A] hover:text-[#006B21]">Home</Link>
          <span className="text-[#4A4A4A]">&gt;</span>
          <span className="text-[#006B21]">All Featured Products</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Featured Agricultural Solutions"}
          </h1>
          <p className="text-[#4A4A4A] max-w-3xl leading-relaxed text-sm md:text-base">
            {searchQuery 
              ? "Browse through the products matching your search criteria." 
              : "Explore our curated collection of industrial-grade machinery, smart irrigation systems, and professional farming tools designed for the modern agri-enterprise."}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="animate-spin h-8 w-8 text-[#006B21]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-zinc-500 font-semibold">Loading GBRU Featured Products...</span>
          </div>
        ) : productsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <span className="text-4xl">📦</span>
            <h3 className="font-bold text-[#0F291B] text-lg">No Products Found</h3>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {productsList.length} <span className="text-gray-500 font-normal">items</span>
              </span>
            </div>

            {/* Product Grid — 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12">
              {productsList.map((product) => {
                const discountVal = product.discount || 0;
                const itemImage = product.custom_image_1 || product.image || "/assets/sprayer.png";

                return (
                  <div key={product.item_code} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
                    {/* Product Image */}
                    <Link href={`/products/view_product?item_code=${product.item_code}`} className="cursor-pointer">
                      <div className="relative h-28 sm:h-48 bg-gray-50 p-2 sm:p-4 flex items-center justify-center hover:opacity-90 transition-opacity">
                        {discountVal > 0 && (
                          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#FEF5D1] text-[#78350F] text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-[#FDF4CE]">
                            {discountVal.toFixed(0)}% OFF
                          </div>
                        )}
                        <img
                          src={itemImage}
                          alt={product.item_name}
                          className="object-contain max-h-full max-w-full p-1 sm:p-4"
                        />
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-2.5 sm:p-5 flex flex-col flex-1 text-left">
                      <div className="flex justify-between items-center mb-1 sm:mb-2">
                        <span className="text-[#006B21] text-[9px] sm:text-xs font-bold tracking-wide uppercase">{product.brand || "GBRU"}</span>
                      </div>

                      <Link href={`/products/view_product?item_code=${product.item_code}`} className="cursor-pointer hover:text-[#006B21] transition-colors">
                        <h3 className="text-[#1A1A1A] font-bold mb-1.5 sm:mb-3 line-clamp-2 leading-snug min-h-[32px] sm:min-h-[40px] text-[11px] sm:text-base">
                          {product.item_name}
                        </h3>
                      </Link>

                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-4 flex-wrap">
                          <span className="text-sm sm:text-xl font-bold text-[#006B21]">₹{formatPrice(product.price)}</span>
                          {product.mrp > product.price && (
                            <span className="text-[9px] sm:text-xs text-[#6B7280] line-through">₹{formatPrice(product.mrp)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full h-8 sm:h-11 bg-[#006B21] hover:bg-[#005a1b] text-white font-bold text-[10px] sm:text-sm rounded-xl shadow-sm transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 active:scale-[0.99]"
                        >
                          {cartItemCodes.includes(product.item_code) ? "Update Cart" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Login Prompt Popup */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      <PaymentOptionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        itemCode={selectedProduct?.item_code || ""}
      />
    </div>
  );
}

export default function AllProducts() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFDFD] font-roboto flex items-center justify-center">Loading...</div>}>
      <AllProductsContent />
    </Suspense>
  );
}
