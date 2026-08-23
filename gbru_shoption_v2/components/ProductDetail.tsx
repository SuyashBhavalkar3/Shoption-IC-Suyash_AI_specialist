"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginPrompt from "./LoginPrompt";
import { addToCartUtil } from "@/utils/cartUtils";
import ActionPopup from "./ActionPopup";
import { useShoptionSetting } from "@/hooks/useShoptionSetting";
import { Share2 } from "lucide-react";

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemCode = searchParams.get("item_code") || "24529";

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [paymentOption, setPaymentOption] = useState<"full" | "booking">("full");
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "guide" | "warranty" | "faqs">("specs");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { whatsappLink, whatsappEnabled } = useShoptionSetting();
  const [quantity, setQuantity] = useState(1);
  const [isInCart, setIsInCart] = useState(false);
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  // Similar-product cart popup state
  const [similarCartItem, setSimilarCartItem] = useState<any | null>(null);
  const [similarPaymentOption, setSimilarPaymentOption] = useState<"full" | "booking">("full");
  const [similarSubmitting, setSimilarSubmitting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/products/details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_code: itemCode }),
        });
        const data = await res.json();
        if (data?.message?.status && data.message.data) {
          setProduct(data.message.data);
          setActiveImgIdx(0);
          setQuantity(data.message.data.moq || 1);
        } else {
          setError(data?.message?.message || "Failed to load product details.");
        }
      } catch (err: any) {

        setError("Error loading product details.");
      } finally {
        setLoading(false);
      }
    };
    if (itemCode) {
      fetchDetails();
    }
  }, [itemCode]);

  useEffect(() => {
    const checkCartStatus = async () => {
      const user = localStorage.getItem("gbru_user");
      if (!user) return;
      try {
        const parsed = JSON.parse(user);
        let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || "";
        if (mobile_no.includes("@")) {
          mobile_no = mobile_no.split("@")[0];
        }
        if (!mobile_no) {
          mobile_no = parsed.customer_id?.split('-')[1] || "";
        }
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
              setPaymentOption("booking");
            } else {
              setPaymentOption("full");
            }
          } else {
            setIsInCart(false);
          }
        }
      } catch (e) {

      }
    };
    if (itemCode) {
      checkCartStatus();
    }
  }, [itemCode]);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!product) return;
      try {
        setLoadingSimilar(true);
        const res = await fetch("/api/products/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: product.item_group,
            subcategory: product.custom_sub_category,
            item_code: product.item_code,
          }),
        });
        const data = await res.json();
        if (data?.message?.status && data.message.data?.data) {
          // Filter out the current product
          const filtered = data.message.data.data.filter((item: any) => item.item_code !== product.item_code);
          setSimilarItems(filtered);
        }
      } catch (err) {

      } finally {
        setLoadingSimilar(false);
      }
    };
    fetchSimilar();
  }, [product]);

  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [errorPopup, setErrorPopup] = useState({ open: false, title: "", message: "" });

  const handleAddToCart = async () => {
    const user = localStorage.getItem("gbru_user");
    if (!user) {
      const pendingItem = {
        item: product.item_code,
        item_name: product.item_name,
        quantity: quantity,
        is_moq_applicable: 0,
        payment_type: paymentOption === "full" ? "Full Payment" : "Cash On Delivery",
        full_payment_amount: product.full_payment_amount || 0.0,
        full_payment_discount: product.full_payment_discount || 0.0,
        cod_value: product.cod_value || product.COD_value || 0.0,
        cod_display: product.cod_display || product.COD_Display || 0.0,
        cod_discount: product.cod_discount || product.COD_discount || 0.0,
        COD_value: product.cod_value || product.COD_value || 0.0,
        COD_Display: product.cod_display || product.COD_Display || 0.0,
        COD_discount: product.cod_discount || product.COD_discount || 0.0,
      };
      localStorage.setItem("gbru_pending_cart_item", JSON.stringify(pendingItem));
      setShowLoginPrompt(true);
      return;
    }

    try {
      const parsed = JSON.parse(user);
      let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || "";
      if (mobile_no.includes("@")) {
        mobile_no = mobile_no.split("@")[0];
      }
      if (!mobile_no) {
        mobile_no = parsed.customer_id?.split('-')[1] || "";
      }
      if (!mobile_no) {
        setShowLoginPrompt(true);
        return;
      }

      setSubmitting(true);

      const endpoint = isInCart ? "/api/cart/update" : "/api/cart/add";
      const payload = isInCart
        ? {
          mobile_no,
          item: product.item_code,
          quantity: quantity,
          payment_type: paymentOption === "full" ? "Full Payment" : "Cash On Delivery",
          full_payment_amount: product.full_payment_amount || 0.0,
          full_payment_discount: product.full_payment_discount || 0.0,
          COD_value: product.cod_value || product.COD_value || 0.0,
          COD_Display: product.cod_display || product.COD_Display || 0.0,
          COD_discount: product.cod_discount || product.COD_discount || 0.0,
        }
        : {
          mobile_no,
          items: [
            {
              item: product.item_code,
              quantity: quantity,
              is_moq_applicable: 0,
              payment_type: paymentOption === "full" ? "Full Payment" : "Cash On Delivery",
              full_payment_amount: product.full_payment_amount || 0.0,
              full_payment_discount: product.full_payment_discount || 0.0,
              cod_value: product.cod_value || product.COD_value || 0.0,
              cod_display: product.cod_display || product.COD_Display || 0.0,
              cod_discount: product.cod_discount || product.COD_discount || 0.0,
              COD_value: product.cod_value || product.COD_value || 0.0,
              COD_Display: product.cod_display || product.COD_Display || 0.0,
              COD_discount: product.cod_discount || product.COD_discount || 0.0,
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
            category: product.item_group,
            subcategory: product.custom_sub_category,
            brand: product.brand_id || "175",
            item_name: product.item_name
          }
        }));
        setToastType("success");
        setToastMessage(`${product.item_name} ${isInCart ? "updated in" : "added to"} cart successfully!`);
        setIsInCart(true);
        setTimeout(() => setToastMessage(""), 3000);
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

  // ── Add-to-cart for similar product cards ─────────────────────────────────
  const [loadingSimilarDetail, setLoadingSimilarDetail] = useState(false);
  const [loadingItemCode, setLoadingItemCode] = useState<string | null>(null);

  const openSimilarCartPopup = async (listingItem: any) => {
    setLoadingItemCode(listingItem.item_code);
    setLoadingSimilarDetail(true);
    try {
      const res = await fetch("/api/products/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_code: listingItem.item_code }),
      });
      const data = await res.json();
      if (data?.message?.status && data.message.data) {
        setSimilarPaymentOption("full");
        setSimilarCartItem(data.message.data);
      } else {
        setSimilarPaymentOption("full");
        setSimilarCartItem(listingItem);
      }
    } catch {
      setSimilarPaymentOption("full");
      setSimilarCartItem(listingItem);
    } finally {
      setLoadingSimilarDetail(false);
      setLoadingItemCode(null);
    }
  };

  const handleSimilarAddToCart = async () => {
    if (!similarCartItem) return;
    const item = similarCartItem;
    const user = localStorage.getItem("gbru_user");
    if (!user) {
      setSimilarCartItem(null);
      setShowLoginPrompt(true);
      return;
    }
    const parsed = JSON.parse(user);
    let mobile_no = parsed.mobile_no || parsed.mobile || parsed.user_id || "";
    if (mobile_no.includes("@")) {
      mobile_no = mobile_no.split("@")[0];
    }
    if (!mobile_no) {
      mobile_no = parsed.customer_id?.split('-')[1] || "";
    }
    if (!mobile_no) { setSimilarCartItem(null); setShowLoginPrompt(true); return; }

    setSimilarSubmitting(true);
    try {
      const payload = {
        mobile_no,
        items: [{
          item: item.item_code,
          quantity: item.moq || 1,
          is_moq_applicable: 0,
          payment_type: similarPaymentOption === "full" ? "Full Payment" : "Cash On Delivery",
          full_payment_amount: item.full_payment_amount || item.price || 0,
          full_payment_discount: item.full_payment_discount || 0,
          cod_value: item.cod_value || item.COD_value || 0,
          cod_display: item.cod_display || item.COD_Display || 0,
          cod_discount: item.cod_discount || item.COD_discount || 0,
          COD_value: item.cod_value || item.COD_value || 0,
          COD_Display: item.cod_display || item.COD_Display || 0,
          COD_discount: item.cod_discount || item.COD_discount || 0,
        }]
      };
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resJson = await res.json();
      if (resJson.message?.status || resJson.success) {
        window.dispatchEvent(new Event("cartUpdate"));
        setSimilarCartItem(null);
        setToastType("success");
        setToastMessage(`${item.item_name} added to cart!`);
        setTimeout(() => setToastMessage(""), 3000);
      } else {
        setSimilarCartItem(null);
        setErrorPopup({ open: true, title: "Add to Cart Failed", message: resJson.message?.message || resJson.error || "Failed to add product." });
      }
    } catch {
      setSimilarCartItem(null);
      setErrorPopup({ open: true, title: "Add to Cart Failed", message: "Failed to add product." });
    } finally {
      setSimilarSubmitting(false);
    }
  };

  const handleShare = async () => {
    const cleanUrl = window.location.href.split(" ")[0]; // Strip out any accidental trailing spaces/strings
    const shareData = {
      url: cleanUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        
      }
    } else {
      try {
        await navigator.clipboard.writeText(cleanUrl);
        setToastType("success");
        setToastMessage("Product link copied to clipboard!");
        setTimeout(() => setToastMessage(""), 3000);
      } catch (err) {
        setToastType("error");
        setToastMessage("Failed to copy link.");
        setTimeout(() => setToastMessage(""), 3000);
      }
    }
  };

  const formatPrice = (val: any) => {
    if (val === undefined || val === null) return "0.00";
    const num = parseFloat(val);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col justify-center items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-[#0D9740]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-zinc-500 font-semibold text-xs">Loading Product Details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] font-roboto flex flex-col">
        <Navbar />
        <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 py-16 text-center flex flex-col items-center gap-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-red-600">{error || "Product Not Found"}</h2>
          <Link href="/all_products" className="text-[#0D9740] font-bold hover:underline">
            Back to All Products
          </Link>
        </main>
      </div>
    );
  }

  // Get dynamic valid images list
  const validImages: string[] = [];
  if (product.images) {
    Object.keys(product.images).forEach((key) => {
      const url = product.images[key];
      if (url && url.startsWith("http") && !url.endsWith("/0")) {
        validImages.push(url);
      }
    });
  }
  if (validImages.length === 0) {
    validImages.push("/assets/sprayer.png");
  }

  const activeImg = validImages[activeImgIdx] || validImages[0];

  const hasCod = Number(product?.COD_value || product?.cod_value || 0) > 0;

  const getFeaturesList = () => {
    const raw = product?.key_features || product?.features;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      return raw.split(/\n+/).map(line => line.replace(/^[\*\-\u2022]\s*/, "").trim()).filter(Boolean);
    }
    const desc = product?.description || "";
    if (desc && !desc.includes("<p>") && !desc.includes("<div>")) {
      return desc.split(/[\n\.]+/).map((line: string) => line.trim()).filter((line: string) => line.length > 5);
    }
    return [
      `Premium quality ${product?.item_name || 'equipment'} designed for Indian farming terrains.`,
      `Engineered for durability, high performance, and fuel efficiency.`,
      `Comes with standard manufacturer warranty and PAN-India service support.`
    ];
  };

  const featuresList = getFeaturesList();

  return (
    <div className="min-h-screen bg-white font-roboto relative">
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

      <ActionPopup
        isOpen={errorPopup.open}
        title={errorPopup.title}
        message={errorPopup.message}
        type="error"
        onClose={() => setErrorPopup({ open: false, title: "", message: "" })}
      />

      {/* Main Container */}
      <main className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 pt-8 flex flex-col gap-6">

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#4A4A4A] uppercase">
          <Link href="/" className="hover:text-[#0D9740]">Home</Link>
          <span>/</span>
          <Link href="/all_products" className="hover:text-[#0D9740]">Products</Link>
          <span>/</span>
          <span className="text-[#111] font-extrabold">{product.item_name}</span>
        </div>

        {/* Product Meta Header (Title, Subtitle, Badges) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[32px] md:text-[36px] font-bold text-[#0F291B] tracking-tight leading-tight flex-1">
              {product.item_name}
            </h1>
            <button
              onClick={handleShare}
              title="Share product"
              className="mt-1 flex items-center justify-center w-11 h-11 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-[#0D9740] shadow-sm hover:shadow transition-all shrink-0 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#6B7280] text-[16px] font-medium">
            Brand: <span className="text-[#0D9740] font-bold">{product.brand || "GBRU"}</span>
          </p>

          {/* Quick Badges Row */}
          <div className="flex flex-wrap items-center gap-6 mt-2 text-sm text-[#374151]">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-lg">★★★★★</span>
              <span className="font-bold">5.0</span>
            </div>
            <div className="h-4 w-px bg-zinc-300"></div>
            <div className="flex items-center gap-1.5 text-[#374151]">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-zinc-400">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
              </svg>
              3-5 Days Delivery
            </div>
          </div>
        </div>

        {/* Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">

          {/* ── Left Column (Media Gallery & Details) ── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Main Showcase Image */}
            <div className="relative w-full h-[320px] md:h-[480px] rounded-[24px] overflow-hidden border border-zinc-200/80 bg-zinc-50 shadow-sm flex items-center justify-center p-4">
              <img
                src={activeImg}
                alt={product.item_name}
                className="max-h-full max-w-full object-contain"
              />
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-[#DFB33F] text-white text-[12px] font-bold py-1.5 px-3 rounded-[9999px] shadow-sm">
                  {product.discount.toFixed(0)}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {validImages.length > 1 && (
              <div className="flex flex-wrap gap-4">
                {validImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative w-20 h-20 rounded-[12px] overflow-hidden border-2 bg-zinc-50 transition-all p-2 flex items-center justify-center ${activeImgIdx === idx ? "border-[#0D9740] ring-2 ring-[#0D9740]/20" : "border-zinc-200 hover:border-zinc-300"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Key Highlights */}
            <div className="bg-[#F4F6F4]/60 border border-[#E1E6E1] rounded-[20px] p-6 mt-4">
              <h3 className="font-roboto font-bold text-[#0F291B] text-[16px] mb-4">
                Key Highlights
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-bold text-[#0F291B] text-[16px] leading-tight">MOQ</span>
                  <span className="text-[#6B7280] text-[13px]">{product.moq} {product.measurement_unit || "Nos"}</span>
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <span className="font-bold text-[#0d9740] text-[16px] leading-tight">Authentic Brand</span>
                  <span className="text-[#6B7280] text-[13px]">100% GBRU Quality</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── Mobile-Only: Pricing Card (block lg:hidden) ── */}
          {/* Shown between image and booking section on mobile screens only */}
          <div className="block lg:hidden w-full">
            <div
              className="flex items-center justify-between text-white overflow-hidden"
              style={{
                background: "linear-gradient(90deg, #1A4D2E 0%, #1E4F30 7.14%, #235233 14.29%, #275435 21.43%, #2A5738 28.57%, #2E593B 35.71%, #325B3D 42.86%, #365E40 50%, #396042 57.14%, #3D6345 64.29%, #416547 71.43%, #44684A 78.57%, #486A4D 85.71%, #4B6D4F 92.86%, #4F6F52 100%)",
                borderRadius: "16px",
                padding: "16px",
                width: "100%",
                minHeight: "88px",
              }}
            >
              {/* Left: Label + Price + MRP — shrinks if needed */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-3">
                <span className="text-[10px] font-bold tracking-widest text-[#A7C7B6] uppercase">
                  LIMITED TIME OFFER
                </span>
                <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                  <span className="text-[26px] font-extrabold leading-none whitespace-nowrap">
                    ₹{formatPrice(product.price)}
                  </span>
                  {product.mrp > product.price && (
                    <span className="text-[13px] line-through text-[#8CAF9C] whitespace-nowrap">
                      ₹{formatPrice(product.mrp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Discount badge — never shrinks */}
              {product.discount > 0 && (
                <div className="bg-[#22C55E] text-[12px] font-bold py-2 px-3 rounded-[10px] shadow-sm whitespace-nowrap shrink-0 flex items-center justify-center">
                  Get {product.discount.toFixed(0)}% OFF
                </div>
              )}
            </div>
          </div>


          {/* ── Right Column (Booking & Checkout Options) ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Limited Time Offer Price Banner — desktop only */}
            <div className="hidden lg:flex bg-[#2D5A42] rounded-[16px] p-5 text-white items-center justify-between shadow-sm gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-bold tracking-widest text-[#A7C7B6] uppercase truncate">
                  LIMITED TIME OFFER
                </span>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[32px] font-extrabold leading-none">₹{formatPrice(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="text-[16px] line-through text-[#8CAF9C]">₹{formatPrice(product.mrp)}</span>
                  )}
                </div>
              </div>
              {product.discount > 0 && (
                <div className="bg-[#22C55E] text-[12px] font-bold py-2 px-4 rounded-[10px] shadow-sm whitespace-nowrap shrink-0 text-center flex items-center justify-center">
                  Get {product.discount.toFixed(0)}% OFF
                </div>
              )}
            </div>

            {/* Option Cards Row */}
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 items-stretch">

              {/* Card 1: Full Payment */}
              <div
                onClick={() => setPaymentOption("full")}
                className={`relative flex-1 p-3.5 rounded-[16px] border-2 cursor-pointer transition-all flex flex-col justify-between ${paymentOption === "full"
                  ? "border-[#0d9740] bg-[#F5F5F5]"
                  : "border-transparent bg-[#F5F5F5] hover:border-zinc-200"
                  }`}
              >
                {paymentOption === "full" && (
                  <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">
                    ✓
                  </div>
                )}

                <div>
                  <div className="flex justify-center mb-3">
                    <div className="bg-[#DFB33F] text-white text-[10px] font-bold py-1 px-3 rounded-full flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      MOST PREFERRED
                    </div>
                  </div>

                  <div className="text-left mb-3">
                    <h4 className="font-bold text-[#6B7280] text-[13px]">Full Payment</h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">Pay complete amount now</p>
                  </div>

                  <div className="h-[1px] bg-zinc-200 w-full mb-3"></div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-[14px] text-[#4A4A4A]">
                      <span>Order Total</span>
                      <span>₹{formatPrice((product.actual_rate || product.price) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[14px] text-[#0D9740]">
                      <span>Instant Discount</span>
                      <span>- ₹{formatPrice(((product.actual_rate || product.price) - (product.full_payment_amount || product.price)) * quantity)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-zinc-200">
                      <span className="text-[18px] font-bold text-black">Pay Now</span>
                      <span className="text-[18px] font-bold text-black">₹{formatPrice((product.full_payment_amount || product.price) * quantity)}</span>
                    </div>
                  </div>

                  <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold py-1.5 px-2.5 rounded-[6px] mt-3 flex items-center justify-center gap-1 text-center">
                    🎁 You'll save ₹{formatPrice(((product.actual_rate || product.price) - (product.full_payment_amount || product.price)) * quantity)} on this order!
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-[1px] bg-zinc-200 w-full mb-3"></div>
                  <p className="text-[11px] text-[#6B7280] leading-tight">
                    Most farmers choose full payment for faster processing.
                  </p>
                </div>
              </div>

              {/* Card 2: Cash On Delivery */}
              {hasCod && (
                <div
                  onClick={() => setPaymentOption("booking")}
                  className={`relative flex-1 p-3.5 rounded-[16px] border-2 cursor-pointer transition-all flex flex-col justify-between ${paymentOption === "booking"
                    ? "border-[#0d9740] bg-white"
                    : "border-zinc-200 bg-white"
                    }`}
                >
                  {paymentOption === "booking" && (
                    <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">
                      ✓
                    </div>
                  )}

                  <div>
                    <div className="text-left mb-3">
                      <h4 className="font-bold text-[#6B7280] text-[13px] uppercase tracking-wide">Book Now & Pay On Delivery</h4>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">Confirm your order instantly</p>
                    </div>

                    <div className="bg-[#F5F9F7] rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[13px] text-[#4A4A4A]">
                        <span>Order Total</span>
                        <span className="font-bold text-[#1A1A1A]">₹{formatPrice((product.actual_rate || product.price) * quantity)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] text-[#0D9740]">
                        <span>Instant Discount</span>
                        <span>- ₹{formatPrice(((product.actual_rate || product.price) - product.price) * quantity)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[12px] bg-[#D4E8DC] px-2 py-1 rounded text-[#0F291B] mt-0.5">
                        <span>Effective Total</span>
                        <span>₹{formatPrice(product.price * quantity)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="font-bold text-black text-[13px]">Pay Now (Booking)</span>
                        <span className="font-bold text-[#0D9740] text-[14px]">₹{formatPrice(product.COD_Display * quantity)}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-200 flex justify-between items-center">
                        <span className="font-bold text-[#6B7280] text-[13px]">Pay on Delivery</span>
                        <span className="font-bold text-black text-[14px]">₹{formatPrice(product.COD_value * quantity)}</span>
                      </div>
                    </div>

                    <div className="bg-zinc-100 text-zinc-600 text-[10px] font-bold py-1.5 px-2.5 rounded-[6px] mt-3 flex items-center justify-center gap-1 text-center font-roboto">
                      🎁 You'll save ₹{formatPrice(((product.actual_rate || product.price) - product.price) * quantity)} on this order!
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-[1px] bg-zinc-200 w-full mb-3"></div>
                    <p className="text-[11px] text-[#6B7280] leading-tight">
                      Only ₹{formatPrice(product.COD_Display)} required to reserve this product today. Remaining balance can be paid on delivery.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-3 px-4 bg-zinc-50 border border-zinc-100 rounded-[14px] mt-2 mb-1">
              <div className="flex flex-col gap-0.5 text-left">
                <span className="text-xs font-bold text-[#0F291B]">Select Quantity</span>
                {product?.moq > 1 && (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Minimum: {product.moq} {product.stock_uom || "Nos"}
                  </span>
                )}
              </div>
              <div className="flex items-center bg-white rounded-[9999px] border border-zinc-200 px-3 py-1 gap-4 shadow-sm">
                <button
                  onClick={() => setQuantity(prev => Math.max(product?.moq || 1, prev - 1))}
                  className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-[16px] px-1 transition-colors"
                >
                  −
                </button>
                <span className="font-extrabold text-sm text-[#0F291B] min-w-4 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="text-zinc-500 hover:text-[#0F291B] font-extrabold text-[16px] px-1 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                disabled={submitting}
                className="w-full h-14 rounded-[14px] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: '#1A4D2E' }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isInCart ? "Updating Cart..." : "Adding to Cart..."}
                  </>
                ) : (
                  isInCart ? "Update Cart" : "Add to Cart"
                )}
              </button>

              {whatsappEnabled === 1 && (
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full h-14 rounded-[14px] bg-white hover:bg-zinc-50 border border-zinc-200 text-black font-bold text-[16px] transition-all flex items-center justify-center gap-3 shadow-sm">
                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-white">
                  <Image
                    src="/assets/nova.jpeg"
                    alt="Nova Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                Chat with Nova
              </a>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6">
              <div className="flex items-center gap-2.5 text-sm text-[#4A4A4A] font-medium">
                <svg className="w-4 h-4 text-[#0F291B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                PAN India
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#4A4A4A] font-medium">
                <svg className="w-4 h-4 text-[#0F291B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Genuine Parts
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#4A4A4A] font-medium">
                <svg className="w-4 h-4 text-[#0F291B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Every 12 KM
              </div>
              <div className="flex items-center gap-2.5 text-sm text-[#4A4A4A] font-medium">
                <svg className="w-4 h-4 text-[#0F291B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secure Payment
              </div>
            </div>

            <div className="mt-5 bg-[#F6F8F6] border border-zinc-100 rounded-2xl p-4 flex items-center justify-center gap-2">
              <span className="text-[18px]">🏆</span>
              <span className="text-[#0F291B] font-bold text-[15px]">Trusted by 3,524 Farmers across India</span>
            </div>

          </div>

        </div>

      </main>

      {/* ── Trust Banner Section ── */}
      <section
        className="w-full py-12 border-t border-zinc-200 mt-8"
        style={{ background: 'linear-gradient(135deg, #1A4D2E 0%, #1E4F30 7.14%, #235233 14.29%, #275435 21.43%, #2A5738 28.57%, #2E593B 35.71%, #325B3D 42.86%, #365E40 50%, #396042 57.14%, #3D6345 64.29%, #416547 71.43%, #44684A 78.57%, #486A4D 85.71%, #4B6D4F 92.86%, #4F6F52 100%)' }}
      >
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center text-white">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-[15px] mb-1">PAN India Support</h4>
              <p className="text-[12px] text-white/80">Service in 18,000+ locations</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h4 className="font-bold text-[15px] mb-1">Spare Parts Available</h4>
              <p className="text-[12px] text-white/80">24/7 availability guarantee</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-[15px] mb-1">Presence Every 12 KM</h4>
              <p className="text-[12px] text-white/80">Quick service access</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-[15px] mb-1">Fast Service</h4>
              <p className="text-[12px] text-white/80">Same day response</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4 shadow-sm border border-white/5">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-bold text-[15px] mb-1">Secure Payment</h4>
              <p className="text-[12px] text-white/80">100% safe & encrypted</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Tabs & Technical Specifications ── */}
      <section className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-12">
        {/* Tabs Bar */}
        <div className="flex flex-wrap border-b border-zinc-200 text-sm font-semibold text-zinc-500 mb-8">
          <button
            onClick={() => setActiveTab("specs")}
            className={`py-4 px-6 border-b-2 transition-all ${activeTab === "specs"
              ? "border-[#0D9740] text-[#0F291B] font-bold"
              : "border-transparent hover:text-[#0f291b]"
              }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`py-4 px-6 border-b-2 transition-all ${activeTab === "features"
              ? "border-[#0D9740] text-[#0F291B] font-bold"
              : "border-transparent hover:text-[#0f291b]"
              }`}
          >
            Key Features
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-4 px-6 border-b-2 transition-all ${activeTab === "guide"
              ? "border-[#0D9740] text-[#0F291B] font-bold"
              : "border-transparent hover:text-[#0f291b]"
              }`}
          >
            User Guide
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white border border-zinc-100 rounded-[24px] p-6 lg:p-8 shadow-sm">
          {activeTab === "specs" && (
            <div className="flex flex-col gap-6">
              <h4 className="font-bold text-[#0F291B] text-lg">Technical Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Item Name</span>
                  <span className="font-bold text-[#0F291B]">{product.item_name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Brand</span>
                  <span className="font-bold text-[#0F291B]">{product.brand || "GBRU"}</span>
                </div>

                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Minimum Order Quantity</span>
                  <span className="font-bold text-[#0F291B]">{product.moq} {product.measurement_unit || "Nos"}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-zinc-100">
                  <span className="text-zinc-500">Valid From</span>
                  <span className="font-bold text-[#0F291B]">{product.valid_from || "N/A"}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-[#0F291B] text-lg">Key Features</h4>
              <ul className="list-disc list-inside text-sm text-[#374151] flex flex-col gap-2">
                {featuresList.map((feat: string, fIdx: number) => (
                  <li key={fIdx}>{feat}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="flex flex-col gap-4">
              <h4 className="font-bold text-[#0F291B] text-lg">User Guide & Description</h4>
              <p className="text-sm text-[#374151] leading-relaxed">
                {product.description || "No manual description is currently available for this product."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── See It in Action Section ── */}
      <section className="w-full bg-[#F6F8F6] py-12">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0F291B]">See It in Action</h2>
            <p className="text-sm text-zinc-500 mt-1">Real farmers, real results from across India</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Video 1 */}
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-zinc-100 group"
              onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/3rhBieQevLA?autoplay=1")}
            >
              <div className="relative aspect-video">
                <img src="https://img.youtube.com/vi/3rhBieQevLA/hqdefault.jpg" alt="Farmer Success Story" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-[#0F291B] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  3:24
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#0F291B] text-[14px]">Farmer Success Story</h4>
                <p className="text-[12px] text-zinc-500 mt-1">Ramesh Kumar from Punjab</p>
              </div>
            </div>

            {/* Video 2 */}
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-zinc-100 group"
              onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/7gGJHSmBGOM?autoplay=1")}
            >
              <div className="relative aspect-video">
                <img src="https://img.youtube.com/vi/7gGJHSmBGOM/hqdefault.jpg" alt="Field Demo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-[#0F291B] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  5:12
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#0F291B] text-[14px]">Field Demo</h4>
                <p className="text-[12px] text-zinc-500 mt-1">Ploughing Performance</p>
              </div>
            </div>

            {/* Video 3 */}
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-zinc-100 group"
              onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/DX5_nQpXYjA?autoplay=1")}
            >
              <div className="relative aspect-video">
                <img src="https://img.youtube.com/vi/DX5_nQpXYjA/hqdefault.jpg" alt="Installation Guide" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-[#0F291B] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  2:45
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#0F291B] text-[14px]">Installation Guide</h4>
                <p className="text-[12px] text-zinc-500 mt-1">Setup in 20 Minutes</p>
              </div>
            </div>

            {/* Video 4 */}
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-zinc-100 group"
              onClick={() => setActiveVideoUrl("https://www.youtube.com/embed/fGxiAGA4uf0?autoplay=1")}
            >
              <div className="relative aspect-video">
                <img src="https://img.youtube.com/vi/fGxiAGA4uf0/hqdefault.jpg" alt="Exhibition Highlights" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-[#0F291B] ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  4:18
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#0F291B] text-[14px]">Exhibition Highlights</h4>
                <p className="text-[12px] text-zinc-500 mt-1">India Agri Expo 2026</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Similar Products Section */}
      {similarItems.length > 0 && (
        <section className="max-w-[1280px] w-full mx-auto px-4 lg:px-8 pb-16 mt-8">
          <div className="border-t border-zinc-150 pt-10 text-left">
            <h3 className="text-2xl font-bold text-[#0F291B] font-roboto tracking-tight mb-2">
              Similar Products
            </h3>
            <p className="text-zinc-500 text-xs mb-8 font-semibold">
              Customers who viewed this item also bought these alternative solutions
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {similarItems.map((item: any) => (
                <div
                  key={item.item_code}
                  className="bg-white border border-zinc-200/80 rounded-3xl p-4 flex flex-col justify-between hover:shadow-md hover:border-[#0D9740]/40 transition-all group text-left"
                >
                  {/* Clickable product info area → navigate to view product */}
                  <Link href={`/products/view_product?item_code=${item.item_code}`} className="flex flex-col gap-3">
                    {/* Image container */}
                    <div className="aspect-square bg-zinc-50 rounded-2xl overflow-hidden relative flex items-center justify-center border border-zinc-100/50">
                      {item.custom_image_1 ? (
                        <img
                          src={item.custom_image_1}
                          alt={item.item_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <span className="text-zinc-300 text-3xl">🌱</span>
                      )}
                      {item.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#0D9740] text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {Math.round(item.discount)}% OFF
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">{item.brand || "GBRU"}</p>
                      <h4 className="font-bold text-[#0F291B] text-xs line-clamp-2 leading-snug group-hover:text-[#0D9740] transition-colors h-8">
                        {item.item_name}
                      </h4>
                    </div>

                    {/* Pricing info */}
                    <div className="pt-3 mt-1 border-t border-zinc-100 flex items-baseline justify-between gap-1.5 flex-wrap">
                      <div>
                        <span className="text-[#0D9740] font-extrabold text-sm">
                          ₹{Number(item.price).toLocaleString("en-IN")}
                        </span>
                        {item.mrp > item.price && (
                          <span className="text-[10px] line-through text-zinc-400 ml-1.5 font-bold">
                            ₹{Number(item.mrp).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        Min: {item.moq || 1}
                      </span>
                    </div>
                  </Link>

                  {/* Add to Cart button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openSimilarCartPopup(item); }}
                    disabled={loadingItemCode === item.item_code}
                    className="mt-3 w-full h-9 rounded-xl bg-[#0F291B] hover:bg-[#1a4530] text-white font-bold text-[12px] flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98] disabled:opacity-60"
                  >
                    {loadingItemCode === item.item_code ? (
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    )}
                    {loadingItemCode === item.item_code ? "Loading..." : "Add to Cart"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Similar-item Payment Option Popup ─────────────────────────────── */}
      {similarCartItem && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setSimilarCartItem(null)}>
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mb-0.5">Adding to cart</p>
                <h4 className="font-bold text-[#0F291B] text-sm line-clamp-2 leading-snug">{similarCartItem.item_name}</h4>
              </div>
              <button onClick={() => setSimilarCartItem(null)} className="text-zinc-400 hover:text-zinc-700 mt-0.5 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Payment option cards — same detail as main product */}
            <div className="flex flex-col gap-3">

              {/* Full Payment Card */}
              <div
                onClick={() => setSimilarPaymentOption("full")}
                className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${similarPaymentOption === "full" ? "border-[#0d9740] bg-[#F5F5F5]" : "border-zinc-200 bg-[#F5F5F5] hover:border-zinc-300"
                  }`}
              >
                {similarPaymentOption === "full" && (
                  <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">✓</div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${similarPaymentOption === "full" ? "border-[#0D9740]" : "border-zinc-400"}`}>
                    {similarPaymentOption === "full" && <div className="w-2 h-2 rounded-full bg-[#0D9740]" />}
                  </div>
                  <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Full Payment</span>
                  <span className="ml-auto bg-[#DFB33F] text-white text-[9px] font-bold py-0.5 px-2 rounded-full">MOST PREFERRED</span>
                </div>
                <div className="h-px bg-zinc-200 mb-2" />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[13px] text-[#4A4A4A]">
                    <span>Order Total</span>
                    <span>₹{Number(similarCartItem.actual_rate || similarCartItem.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-[13px] text-[#0D9740]">
                    <span>Instant Discount</span>
                    <span>- ₹{Number((similarCartItem.actual_rate || similarCartItem.price || 0) - (similarCartItem.full_payment_amount || similarCartItem.price || 0)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-zinc-200">
                    <span className="text-[15px] font-bold text-black">Pay Now</span>
                    <span className="text-[15px] font-bold text-black">₹{Number(similarCartItem.full_payment_amount || similarCartItem.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="bg-[#EBF5EE] text-[#0D9740] text-[10px] font-bold py-1.5 px-2 rounded-lg mt-2 text-center">
                  🎁 You&apos;ll save ₹{Number((similarCartItem.actual_rate || similarCartItem.price || 0) - (similarCartItem.full_payment_amount || similarCartItem.price || 0)).toLocaleString("en-IN")} on this order!
                </div>
              </div>

              {/* Book Now / COD Card */}
              {Number(similarCartItem.cod_value || similarCartItem.COD_value || 0) > 0 && (
                <div
                  onClick={() => setSimilarPaymentOption("booking")}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${similarPaymentOption === "booking" ? "border-[#0d9740] bg-white" : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                >
                  {similarPaymentOption === "booking" && (
                    <div className="absolute top-[-8px] right-[-8px] bg-[#0d9740] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md text-xs">✓</div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${similarPaymentOption === "booking" ? "border-[#0D9740]" : "border-zinc-400"}`}>
                      {similarPaymentOption === "booking" && <div className="w-2 h-2 rounded-full bg-[#0D9740]" />}
                    </div>
                    <span className="text-[12px] font-bold text-[#6B7280] uppercase tracking-wide">Book Now &amp; Pay On Delivery</span>
                  </div>
                  <div className="bg-[#F5F9F7] rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[13px] text-[#4A4A4A]">
                      <span>Order Total</span>
                      <span className="font-bold text-[#1A1A1A]">₹{Number(similarCartItem.actual_rate || similarCartItem.price || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[12px] text-[#0D9740]">
                      <span>Instant Discount</span>
                      <span>- ₹{Number((similarCartItem.actual_rate || similarCartItem.price || 0) - (similarCartItem.price || 0)).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-[12px] bg-[#D4E8DC] px-2 py-1 rounded text-[#0F291B] mt-0.5">
                      <span>Effective Total</span>
                      <span>₹{Number(similarCartItem.price || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-bold text-black text-[13px]">Pay Now (Booking)</span>
                      <span className="font-bold text-[#0D9740] text-[14px]">₹{Number(similarCartItem.cod_display || similarCartItem.COD_Display || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 flex justify-between">
                      <span className="font-bold text-[#6B7280] text-[13px]">Pay on Delivery</span>
                      <span className="font-bold text-black text-[14px]">₹{Number(similarCartItem.cod_value || similarCartItem.COD_value || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-100 text-zinc-600 text-[10px] font-bold py-1.5 px-2 rounded-lg mt-2 text-center">
                    🎁 You&apos;ll save ₹{Number((similarCartItem.actual_rate || similarCartItem.price || 0) - (similarCartItem.price || 0)).toLocaleString("en-IN")} on this order!
                  </div>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <button
              onClick={handleSimilarAddToCart}
              disabled={similarSubmitting}
              className="w-full h-12 rounded-2xl bg-[#0D9740] hover:bg-[#0b8234] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {similarSubmitting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Adding...</>
              ) : "Confirm & Add to Cart"}
            </button>
          </div>
        </div>
      )}

      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
      />

      {/* Video Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 z-50 p-2"
            onClick={() => setActiveVideoUrl(null)}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={activeVideoUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <span className="text-zinc-500 font-medium">Loading GBRU Platform...</span>
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}
