"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Receipt, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";

interface OrderData {
  order_id: string;
  date: string;
  total_amount: number;
  received_amount: number;
  pending_amount: number;
  unsettled_amount: number;
  status: string;
  paynow_eligibility_date?: string;
  paynow_message?: string;
  allowed_action?: string;
  payupreferedamount?: number;
  payupreferedmode?: string;
  payment_type?: string;
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchPendingPayments() {
      try {
        const userStr = localStorage.getItem("gbru_user");
        if (!userStr) {
          setLoading(false);
          return;
        }

        const user = JSON.parse(userStr);
        const mobile_no = user.customer_id?.split('-')[1] || user.user_id || user.mobile_no || user.mobile;

        // Fetch orders utilizing existing proxy endpoint
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            mobile_no, 
            from_date: "2020-01-01", // Fetch far back to catch old pending payments
            to_date: new Date().toISOString().split('T')[0],
            page_size: 200, 
            page: 1 
          })
        });

        if (res.ok) {
          const json = await res.json();
          if (json.message?.status && json.message?.data?.data) {
            const allOrders: OrderData[] = json.message.data.data;
            // Filter strictly for orders that actually have a pending payment from the user perspective:
            // 1. Full Payment orders with pending_amount > 0
            // 2. COD/Booking orders where the booking deposit has NOT been paid yet
            const pendingOrders = allOrders.filter(o => {
              // Never show cancelled orders in Manage Payments
              if (String(o.status || "").toLowerCase().includes("cancel")) return false;

              const isFullPayment = o.payupreferedmode === "Full Payment" || String(o.payment_type || "").toLowerCase() === "full payment";
              const isBookingPaid = Number(o.received_amount || 0) >= Number(o.payupreferedamount || 0);
              
              const isCancelled = String(o.status || "").toLowerCase() === "cancelled";
              if (isCancelled) return false;

              if (isFullPayment) {
                return Number(o.pending_amount || 0) > 0;
              } else {
                return !isBookingPaid && Number(o.payupreferedamount || 0) > 0;
              }
            });
            setOrders(pendingOrders);
          }
        } else {
          showToast("Failed to load payment data from server", "error");
        }
      } catch (err) {
        
        showToast("Error loading payment data", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchPendingPayments();
  }, [showToast]);

  const handleAction = async (order: OrderData) => {
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        showToast("User not logged in", "error");
        return;
      }

      const parsed = JSON.parse(stored);
      let mobile_no = parsed.customer_id?.split('-')[1] || parsed.user_id || parsed.mobile_no;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const email = parsed.user_id && parsed.user_id.includes("@") ? parsed.user_id : (parsed.email || "");

      const isFullPayment = order.payupreferedmode === "Full Payment" || String(order.payment_type || "").toLowerCase() === "full payment";
      const payAmount = isFullPayment ? order.pending_amount : (order.payupreferedamount || 0);

      setPayingOrderId(order.order_id);
      showToast(`Initiating payment for ${order.order_id}...`, "info");

      const res = await fetch("/api/orders/pay-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          order_id: order.order_id,
          amount: payAmount,
          email
        })
      });
      
      const data = await res.json();
      if (data.status && data.token && data.actionUrl) {
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
        showToast(data.error || data.message || "Failed to initiate payment.", "error");
      }
    } catch (err) {
      
      showToast("An error occurred while initiating payment.", "error");
    } finally {
      setPayingOrderId(null);
    }
  };

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
              Pending Payments
            </h1>
          </div>
        </div>
        <div className="md:hidden mb-6">
          <Link href="/user-profile" className="w-full h-10 flex items-center justify-center border border-[#0D9740] text-[#0D9740] font-bold text-xs rounded-lg transition-all bg-white">
            Edit Profile
          </Link>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-[#0FA84D] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-zinc-500">Loading your payments...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-zinc-200/80 rounded-[24px] p-12 md:p-24 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-[#0FA84D]" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-bold text-[#0F291B] mb-3">
              All clear!
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed mb-8">
              You currently have no pending payments. Great job keeping your account up to date.
            </p>
            
            <Link 
              href="/products" 
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold rounded-[14px] shadow-sm hover:shadow transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const isFullPayment = order.payupreferedmode === "Full Payment" || String(order.payment_type || "").toLowerCase() === "full payment";
              const payAmount = isFullPayment ? order.pending_amount : (order.payupreferedamount || 0);

              return (
                <div key={order.order_id} className="bg-white border border-zinc-200/80 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative overflow-hidden text-left">
                  {/* Status Indicator Bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-500"></div>

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div>
                      <h3 className="font-bold text-lg text-[#0F291B]">{order.order_id}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{order.date.split(" ")[0]}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200/50">
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-zinc-50/50 rounded-xl p-4 mb-4 flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Total Amount</span>
                      <span className="font-bold text-[#0D9740]">₹{order.total_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-zinc-500">Received</span>
                      <span className="font-bold text-[#0D9740]">₹{order.received_amount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-200/80 mt-2">
                      <span className="text-sm font-bold text-zinc-800">
                        {isFullPayment ? "Pending Amount" : "Booking Deposit"}
                      </span>
                      <span className="text-lg font-extrabold text-[#0D9740]">
                        ₹{payAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>


                  <button 
                    disabled={payingOrderId === order.order_id}
                    onClick={() => handleAction(order)}
                    className="w-full mt-auto bg-[#0FA84D] hover:bg-[#0b8a3d] text-white font-bold h-12 rounded-[12px] flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all group disabled:opacity-50"
                  >
                    {payingOrderId === order.order_id ? "Initiating..." : isFullPayment ? "Pay Now" : "Pay Booking Deposit"}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
