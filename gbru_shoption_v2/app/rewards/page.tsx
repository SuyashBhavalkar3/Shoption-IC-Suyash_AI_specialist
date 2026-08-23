"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Gift, Award, Copy, CheckCircle2, Lock, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";

export default function RewardsPage() {
  const [loading, setLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasBACode, setHasBACode] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    async function checkEligibility() {
      try {
        const userStr = localStorage.getItem("gbru_user");
        if (!userStr) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const mobile_no = user.mobile_no || user.mobile || user.customer_id?.split('-')[1] || user.user_id;

        // Default fallback referral code
        if (mobile_no) {
          setReferralCode(`GBRU${mobile_no.slice(-4)}VIP`);
        }

        // Fetch dynamic user details to check for actual brand ambassador code
        if (mobile_no) {
          const userDetailsRes = await fetch("/api/user-details", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mobile_no })
          });
          if (userDetailsRes.ok) {
            const userData = await userDetailsRes.json();
            if (userData?.message?.status && userData?.message?.data) {
              const code = userData.message.data.brand_ambassador || userData.message.data.brand_ambassador_name;
              if (code && code.trim() !== "") {
                setReferralCode(code);
                setHasBACode(true);
                // Sync to localStorage
                const updatedUser = { ...user, brand_ambassador: code };
                localStorage.setItem("gbru_user", JSON.stringify(updatedUser));
              }
            }
          }
        }

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mobile_no, 
            from_date: "2020-01-01",
            to_date: new Date().toISOString().split('T')[0],
            page_size: 20, 
            page: 1 
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && json.message?.data?.data) {
            // Count completed/valid orders to see if they bought >= 2 products/orders
            const validOrders = json.message.data.data.filter((o: any) => o.status !== "Cancelled");
            setOrderCount(validOrders.length);
          }
        }
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    }

    checkEligibility();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast("Referral code copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const isEligible = hasBACode;

  return (
    <div className="min-h-screen bg-[#F5F7F5] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/user-profile" 
              className="p-2 bg-white rounded-full border border-zinc-200/60 shadow-sm hover:shadow hover:bg-zinc-50 transition-all text-zinc-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F291B] tracking-tight">
              Rewards & Benefits
            </h1>
          </div>
        </div>

        {loading ? (
           <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="mt-4 font-bold text-zinc-500">Checking your benefits...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Brand Ambassador Benefit */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-[#0F291B] to-[#1E532E] rounded-[24px] p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-emerald-200 border border-white/10 mb-6 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Exclusively for You
                  </div>

                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
                    Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-100">Brand Ambassador</span>
                  </h2>
                  <p className="text-emerald-50/80 text-lg max-w-xl mb-8 leading-relaxed">
                    Purchase 2 or more products to unlock the Ambassador Program. Refer others with your unique code and earn exclusive commissions on their purchases!
                  </p>

                  {/* Dynamic Status Section */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    {isEligible ? (
                      <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-emerald-400 rounded-full flex items-center justify-center text-[#0F291B] shadow-lg shrink-0">
                            <Award className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">Status: Unlocked!</h3>
                            <p className="text-emerald-100 text-sm">You are officially a Brand Ambassador.</p>
                          </div>
                        </div>

                        <div className="w-full md:w-auto bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
                          <span className="text-xs font-semibold text-emerald-200 uppercase tracking-widest text-center">Your Referral Code</span>
                          <div className="flex items-center gap-3">
                            <code className="text-2xl font-black tracking-widest text-white">{referralCode}</code>
                            <button 
                              onClick={handleCopy}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
                              title="Copy Code"
                            >
                              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-zinc-300 group-hover:text-white" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-emerald-200 shrink-0">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-0.5">You are not a Brand Ambassador yet</h3>
                            <p className="text-emerald-100/90 text-sm">You should have at least 2 orders delivered to become a Brand Ambassador.</p>
                          </div>
                        </div>

                        <div className="w-full mt-2">
                          <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1.5">
                            <span>Progress</span>
                            <span>{orderCount} / 2 Orders Delivered</span>
                          </div>
                          <div className="w-full h-2.5 bg-black/35 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min((orderCount / 2) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Link 
                            href="/all_products"
                            className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 bg-white text-[#0F291B] font-bold rounded-xl shadow-lg hover:bg-emerald-50 transition-all text-sm"
                          >
                            Shop Now to Unlock
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Other Perks */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <h3 className="text-xl font-bold text-[#0F291B] px-2">More Perks</h3>
              
              <div className="bg-white border border-zinc-200/80 rounded-[20px] p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F291B] mb-1">Festive Bonuses</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Special discounts and early access during Diwali and other major festivals.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-[20px] p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F291B] mb-1">Volume Discounts</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Unlock permanent margin increases on all future orders after your first 10 purchases.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
