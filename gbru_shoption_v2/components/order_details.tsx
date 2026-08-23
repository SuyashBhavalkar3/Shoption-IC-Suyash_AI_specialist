"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Tag,
  Banknote,
  Copy,
  Check,
  Truck,
  Info,
  CreditCard,
  Headphones,
  ChevronDown,
  ChevronUp,
  Printer,
  ArrowLeft,
  Download,
  X,
  Wallet,
  IndianRupee,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function OrderDetails({ orderId }: { orderId: string }) {
  const decodedOrderId = decodeURIComponent(orderId || "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Cancel order state
  const [showCancelToast, setShowCancelToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [cancelling, setCancelling] = useState(false);

  // Tracking state
  const [expandedInvoiceIdx, setExpandedInvoiceIdx] = useState<number | null>(0);
  const [expandedTrackingId, setExpandedTrackingId] = useState<string | null>(null);
  const [individualTrackingData, setIndividualTrackingData] = useState<Record<string, { data?: any; loading: boolean; error?: string }>>({});
  const [activeTrackingSticker, setActiveTrackingSticker] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!decodedOrderId) return;
      try {
        const stored = localStorage.getItem("gbru_user");
        if (!stored) {
          setError("User not logged in");
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(stored);
        const mobile_no = parsed.customer_id?.split('-')[1] || parsed.user_id || parsed.mobile_no;

        const res = await fetch('/api/orders/details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile_no, order_id: decodedOrderId })
        });
        const data = await res.json();

        let listOrder = {};
        try {
          const listRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile_no, page_size: 200, page: 1 })
          });
          if (listRes.ok) {
            const listJson = await listRes.json();
            if (listJson.message?.status && Array.isArray(listJson.message?.data?.data)) {
              const matched = listJson.message.data.data.find((o: any) => o.order_id === decodedOrderId);
              if (matched) {
                listOrder = matched;
              }
            }
          }
        } catch (e) {

        }

        if (data?.message?.status && data?.message?.data) {
          setOrder({ ...listOrder, ...data.message.data });
        } else {
          setError("Failed to fetch order details");
        }
      } catch (err) {

        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [decodedOrderId]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }
    setCancelling(true);
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        setToastType("error");
        setToastMessage("User not logged in");
        setShowCancelToast(true);
        setTimeout(() => setShowCancelToast(false), 3000);
        setCancelling(false);
        return;
      }
      const parsed = JSON.parse(stored);
      let mobile_no = parsed.customer_id?.split('-')[1] || parsed.user_id || parsed.mobile_no;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];

      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          order_id: decodedOrderId
        })
      });
      const data = await res.json();
      if (data?.message?.status) {
        setToastType("success");
        setToastMessage(data.message.message || "Sales order cancelled successfully.");
        setShowCancelToast(true);
        // Refresh details after 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setToastType("error");
        setToastMessage(data?.message?.message || "Failed to cancel order.");
        setShowCancelToast(true);
        setTimeout(() => setShowCancelToast(false), 3000);
      }
    } catch (err) {

      setToastType("error");
      setToastMessage("Something went wrong while cancelling the order.");
      setShowCancelToast(true);
      setTimeout(() => setShowCancelToast(false), 3000);
    } finally {
      setCancelling(false);
    }
  };

  const handlePayNow = async () => {
    try {
      const stored = localStorage.getItem("gbru_user");
      if (!stored) {
        setToastType("error");
        setToastMessage("User not logged in");
        setShowCancelToast(true);
        setTimeout(() => setShowCancelToast(false), 3000);
        return;
      }
      const parsed = JSON.parse(stored);
      let mobile_no = parsed.customer_id?.split('-')[1] || parsed.user_id || parsed.mobile_no;
      if (mobile_no?.includes("@")) mobile_no = mobile_no.split("@")[0];
      const email = parsed.user_id && parsed.user_id.includes("@") ? parsed.user_id : (parsed.email || "");

      const res = await fetch("/api/orders/pay-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_no,
          order_id: decodedOrderId,
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
        setToastType("error");
        setToastMessage(data.error || data.message || "Failed to initiate payment.");
        setShowCancelToast(true);
        setTimeout(() => setShowCancelToast(false), 3000);
      }
    } catch (err) {

      setToastType("error");
      setToastMessage("An error occurred while initiating payment.");
      setShowCancelToast(true);
      setTimeout(() => setShowCancelToast(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-20">
          <svg className="animate-spin h-10 w-10 text-[#1E532E]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-20 text-rose-500 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center py-20 text-zinc-500 font-medium">
          No details found.
        </div>
      </div>
    );
  }

  const summary = order.order_summary || {};
  const totalAmount = Number(summary.total_amount || summary.order_amount || order.total_amount || order.order_amount || 0);
  const receivedAmount = Number(summary.received_amount || summary.received || order.received_amount || order.received || 0);
  const pendingAmount = Number(summary.pending_amount || order.pending_amount || (totalAmount - receivedAmount));
  const unsettledAmount = Number(summary.unsettled_amount || order.unsettled_amount || 0);
  const preferredAmount = Number(summary.payupreferedamount || order.payupreferedamount || 0);
  const preferredMode = summary.payupreferedmode || order.payupreferedmode || "Online";

  const preferredModeStr = String(summary.payupreferedmode || order.payupreferedmode || summary.payment_type || order.payment_type || "Online").toLowerCase();
  const isFullPayment = !preferredModeStr.includes("cash") && !preferredModeStr.includes("cod") && preferredModeStr !== "pay later";
  const isBookingPaid = receivedAmount >= preferredAmount;

  const payAmount = isFullPayment
    ? pendingAmount
    : (!isBookingPaid ? preferredAmount : 0);
  const shipment = order.shipment || {};
  const items = shipment.items || [];
  const statusDisplay = shipment.status || summary.allowed_action || "Pending Payment";
  const hasTransactions = order.transactions && order.transactions.length > 0;
  const hasInvoices = order.invoices && order.invoices.length > 0;

  const isCancelled = String(statusDisplay || summary.allowed_action || "").toLowerCase().includes("cancel");
  const showPayButton = payAmount > 10 && !isCancelled;

  let invoiceTransporterName = "";
  if (order.invoices && order.invoices.length > 0) {
    for (const inv of order.invoices) {
      if (inv.transporter_details && inv.transporter_details.length > 0 && inv.transporter_details[0].transporter_name) {
        invoiceTransporterName = inv.transporter_details[0].transporter_name;
        break;
      }
      if (inv.lr_and_stickers && inv.lr_and_stickers.length > 0 && inv.lr_and_stickers[0].transporter_name) {
        invoiceTransporterName = inv.lr_and_stickers[0].transporter_name;
        break;
      }
    }
  }

  const transportEntries: { transporter_name: string; shipment_date: string; status: string }[] = [];
  const seenTransporters = new Set<string>();

  if (order.invoices && order.invoices.length > 0) {
    for (const inv of order.invoices) {
      let invDate = inv.dispatch_date || inv.invoice_date || shipment.date || summary.order_date || "--";
      if (invDate && invDate.includes(" ")) {
        invDate = invDate.split(" ")[0]; // Get only the YYYY-MM-DD date part
      }
      const invStatus = inv.dispatch_status || shipment.status || "Dispatched";

      if (inv.selected_transport_entries && inv.selected_transport_entries.length > 0) {
        for (const entry of inv.selected_transport_entries) {
          const name = entry.transporter_name || entry.transporter || "Not Assigned";
          const key = `${name.toLowerCase()}_${invDate}_${invStatus}`;
          if (!seenTransporters.has(key)) {
            seenTransporters.add(key);
            transportEntries.push({
              transporter_name: name,
              shipment_date: invDate,
              status: invStatus
            });
          }
        }
      } else if (inv.lr_and_stickers && inv.lr_and_stickers.length > 0) {
        for (const entry of inv.lr_and_stickers) {
          const name = entry.transporter_name || entry.transporter || "Not Assigned";
          const key = `${name.toLowerCase()}_${invDate}_${invStatus}`;
          if (!seenTransporters.has(key)) {
            seenTransporters.add(key);
            transportEntries.push({
              transporter_name: name,
              shipment_date: invDate,
              status: invStatus
            });
          }
        }
      }
    }
  }

  if (transportEntries.length === 0) {
    let shipDate = shipment.date || summary.order_date || "--";
    if (shipDate && shipDate.includes(" ")) {
      shipDate = shipDate.split(" ")[0];
    }
    transportEntries.push({
      transporter_name: shipment.transporter_name || "Not Assigned",
      shipment_date: shipDate,
      status: shipment.status || "Pending Payment"
    });
  }

  const displayTransporterName = shipment.transporter_name || invoiceTransporterName || "Not Assigned";

  // Extract LR and stickers
  const deliverySlips = shipment.delivery_slips || [];
  const dispatchDetails = order.dispatch_details || [];
  const allDispatches = [...deliverySlips, ...dispatchDetails];

  const isIndianPost = (nameOrId: string) => {
    const term = String(nameOrId || "").toLowerCase();
    return term.includes("indian post") || term.includes("india post");
  };

  const extractedLrs: any[] = [];
  const extractedStickers: string[] = [];

  // Parse from dispatches
  allDispatches.forEach((d: any) => {
    if (d.lr_no || d.lr_attachment || d.lr_photo || d.lr_url) {
      extractedLrs.push({
        lr_no: d.lr_no || d.lr_number || "LR",
        lr_attachment: d.lr_attachment || d.lr_photo || d.lr_url
      });
    }
    const isTransporterIndianPost = isIndianPost(d.transporter_name) || isIndianPost(d.transporter) || isIndianPost(shipment.transporter_name);
    if (isTransporterIndianPost) {
      const stCode = d.sticker_no || d.sticker || d.tracking_id || d.tracking_no || d.barcode;
      if (stCode) {
        extractedStickers.push(stCode);
      }
    }
  });

  // Parse from invoices
  const invoicesList = order.invoices || [];
  invoicesList.forEach((inv: any) => {
    // 1. lr_and_stickers (explicitly checks if item.type is sticker)
    const lrAndStickersList = inv.lr_and_stickers || [];
    lrAndStickersList.forEach((item: any) => {
      if (item.type?.toLowerCase() === "lr") {
        extractedLrs.push({
          lr_no: item.entry_id || item.lr_number || "LR",
          lr_attachment: item.document_url || item.print_url || item.lr_copy
        });
      } else if (item.type?.toLowerCase() === "sticker") {
        if (item.tracking_id) {
          extractedStickers.push(item.tracking_id);
        }
      }
    });

    // 2. transporter_details
    const transportDetails = inv.transporter_details || [];
    transportDetails.forEach((item: any) => {
      if (item.lr_number) {
        extractedLrs.push({
          lr_no: item.lr_number,
          lr_attachment: item.lr_copy || item.document_url
        });
      }
      if (isIndianPost(item.transporter_name) || isIndianPost(item.transporter)) {
        if (item.tracking_id) {
          extractedStickers.push(item.tracking_id);
        }
      }
    });

    // 3. selected_transport_entries
    const selectedEntries = inv.selected_transport_entries || [];
    selectedEntries.forEach((item: any) => {
      if (item.lr_number) {
        extractedLrs.push({
          lr_no: item.lr_number,
          lr_attachment: item.lr_copy || item.document_url
        });
      }
      if (isIndianPost(item.transporter_name) || isIndianPost(item.transporter)) {
        if (item.tracking_id) {
          extractedStickers.push(item.tracking_id);
        }
      }
    });
  });

  // Filter duplicates
  const finalLrs = extractedLrs.filter((v, i, a) => a.findIndex(t => t.lr_no === v.lr_no) === i);
  const finalStickers = Array.from(new Set(extractedStickers));

  const handleCopy = () => {
    if (summary.order_id) {
      navigator.clipboard.writeText(summary.order_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("resolve") || s.includes("close") || s.includes("complete") || s.includes("delivered")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (s.includes("progress") || s.includes("pending") || s.includes("process")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  const showActionMsg = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  };

  const handlePrintLR = () => {
    if (finalLrs.length > 0) {
      const url = finalLrs[0].lr_attachment || finalLrs[0].lr_photo || finalLrs[0].lr_url;
      if (url) {
        window.location.href = url;
      } else {
        showActionMsg("LR Attachment URL not found.");
      }
    } else {
      showActionMsg("Order not yet dispatched");
    }
  };

  const handleTrackOrder = () => {
    if (finalStickers.length > 0) {
      handleTrackSticker(finalStickers[0]);
    } else {
      showActionMsg("Order not yet dispatched");
    }
  };

  const handleTrackSticker = async (stickerCode: string) => {
    setActiveTrackingSticker(stickerCode);
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingData(null);
    try {
      const res = await fetch("/api/tracking/indian-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_id: stickerCode })
      });
      const resData = await res.json();
      if (resData.success && resData.data && resData.data[0]) {
        setTrackingData(resData.data[0]);
      } else {
        setTrackingError(resData.message || "Failed to retrieve tracking data from Indian Post.");
      }
    } catch (err) {

      setTrackingError("Failed to fetch tracking details. Please try again.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleTrackStickerInline = async (stickerCode: string) => {
    if (individualTrackingData[stickerCode]?.data) {
      return;
    }
    setIndividualTrackingData(prev => ({
      ...prev,
      [stickerCode]: { loading: true }
    }));
    try {
      const res = await fetch("/api/tracking/indian-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracking_id: stickerCode })
      });
      const resData = await res.json();
      if (resData.success && resData.data && resData.data[0]) {
        setIndividualTrackingData(prev => ({
          ...prev,
          [stickerCode]: { data: resData.data[0], loading: false }
        }));
      } else {
        setIndividualTrackingData(prev => ({
          ...prev,
          [stickerCode]: { error: resData.message || "Failed to retrieve tracking data.", loading: false }
        }));
      }
    } catch (err) {

      setIndividualTrackingData(prev => ({
        ...prev,
        [stickerCode]: { error: "Failed to fetch tracking details.", loading: false }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FBF9] font-roboto flex flex-col relative">
      <Navbar />

      {/* ====================================================== */}
      {/* MOBILE LAYOUT — Figma spec, visible only on mobile      */}
      {/* ====================================================== */}
      <div className="block md:hidden flex-1 flex flex-col bg-[#F5F6FA]">

        {/* HEADER — w:390 h:74, border-bottom 1px */}
        <div className="w-full bg-white flex items-center justify-between px-4 border-b border-zinc-200" style={{ height: "74px" }}>
          <div className="flex items-center gap-2">
            <Link href="/orders" className="text-zinc-600 hover:text-[#1E532E] transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h2 className="text-[18px] font-bold text-[#0F291B] leading-tight">Order Details</h2>
              <p className="text-[11px] text-zinc-400 font-medium">Order ID: {summary.order_id}</p>
            </div>
          </div>
          {/* Status badge */}
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(statusDisplay)}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusDisplay}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-10" style={{ paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>



          {/* ── ORDER SUMMARY CARD — w:350 h:~270 br:16 p:20 gap:12 border:1 ── */}
          <div className="bg-white rounded-[16px] border border-zinc-200" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 className="text-[16px] font-bold text-[#0F291B]">Order Summary</h3>

            {/* Order Date */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-100">
              <span className="text-[13px] text-zinc-500 font-medium">Order Date</span>
              <span className="text-[13px] font-bold text-[#0F291B]">
                {summary.order_date ? new Date(summary.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--"}
              </span>
            </div>

            {/* Order ID + copy */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-100">
              <span className="text-[13px] text-zinc-500 font-medium">Order ID</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[#0F291B]">{summary.order_id}</span>
                <button onClick={handleCopy} className="text-emerald-700 hover:text-emerald-800 transition-colors" title="Copy Order ID">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between py-2 border-b border-zinc-100">
              <span className="text-[13px] text-zinc-500 font-medium">Discount</span>
              <span className="text-[13px] font-bold text-red-500">- ₹{Number(summary.discount_received || 0).toLocaleString("en-IN")}</span>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between py-2">
              <span className="text-[14px] font-bold text-[#0F291B]">Total Amount</span>
              <span className="text-[16px] font-extrabold text-[#0D9740]">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {/* Pay Now button (if applicable) */}
            {showPayButton && (
              <button
                onClick={handlePayNow}
                className="w-full min-h-[52px] py-3 bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 mt-1"
              >
                <span className="text-[14px] leading-snug">
                  {isFullPayment ? "Pay Pending" : "Pay Booking Deposit"} (₹{payAmount.toLocaleString("en-IN")})
                </span>
              </button>
            )}

            {/* Cancel Order */}
            {String(summary.allowed_action || "").toLowerCase() === "cancel" && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            {actionMessage && (
              <p className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">⚠️ {actionMessage}</p>
            )}
          </div>

          {/* ── SHIPMENT CARD — w:350 h:235 br:16 p:16 gap:16 border:1 ── */}
          <div className="bg-white rounded-[16px] border border-zinc-200" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-[#0F291B]">Shipment 1 of 1</h3>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(statusDisplay)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {statusDisplay}
              </span>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <p className="text-center text-zinc-500 text-sm font-medium py-4">No items in shipment.</p>
            ) : (
              <div className="bg-zinc-50 rounded-xl px-4 py-2 flex flex-col">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="border-b border-zinc-200/60 last:border-b-0 py-3 last:pb-2 first:pt-2 flex flex-col gap-1 text-left">
                    <p className="text-[13px] font-bold text-[#0F291B] leading-snug">{item.item_name}</p>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-zinc-500 font-medium">Qty: {item.qty}</span>
                      <span className="font-bold text-[#0F291B]">
                        Rate: ₹{Number(items.length === 1 ? (Number(summary.order_amount) / item.qty) : item.rate).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Track Order + Print LR buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTrackOrder}
                className="flex-1 h-11 bg-[#1B5E20] hover:bg-[#154a19] text-white font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" /> Track Order
              </button>
              <button
                onClick={handlePrintLR}
                className="flex-1 h-11 border-2 border-[#1B5E20] text-[#1B5E20] font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-[#1B5E20]/5"
              >
                <Printer className="w-4 h-4" /> Print LR
              </button>
            </div>
          </div>

          {/* ── TRANSPORT DETAILS CARD — w:355 pt:24 pr:12 pb:24 pl:14 gap:16 br:16 border:1 ── */}
          <div className="bg-white rounded-[16px] border border-zinc-200" style={{ paddingTop: "24px", paddingRight: "12px", paddingBottom: "24px", paddingLeft: "14px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 className="text-[16px] font-bold text-[#0F291B]">Transport Details</h3>

            <div className="flex flex-col gap-6">
              {transportEntries.map((entry, idx) => (
                <div key={idx} className={`flex flex-col gap-4 ${idx > 0 ? "border-t border-zinc-100 pt-4" : ""}`}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Transport Name */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wide">
                        <Truck className="w-4 h-4 text-[#0D9740]" />
                        <span>Transport Name</span>
                      </div>
                      <p className="text-[13px] font-bold text-[#0F291B]">{entry.transporter_name}</p>
                    </div>

                    {/* Shipment Date */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wide">
                        <Calendar className="w-4 h-4 text-[#0D9740]" />
                        <span>Shipment Date</span>
                      </div>
                      <p className="text-[13px] font-bold text-[#0F291B]">{entry.shipment_date}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wide">
                      <Info className="w-4 h-4 text-amber-500" />
                      <span>Status</span>
                    </div>
                    <p className="text-[13px] font-extrabold text-amber-600">{entry.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TRANSACTIONS CARD ── */}
          <div className="bg-white rounded-[16px] border border-zinc-200 p-5">
            {hasTransactions ? (
              <div className="space-y-4">
                <h4 className="font-bold text-[#0F291B] text-[14px] border-b border-zinc-100 pb-2">Transactions</h4>
                {order.transactions.map((tx: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 space-y-1.5 text-xs">
                    <div className="flex justify-between font-bold text-zinc-700">
                      <span>TXN ID</span><span className="break-all">{tx.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Method</span>
                      <span className="font-semibold">{tx.mode_of_payment}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#1E532E]">
                      <span>Amount</span><span>₹{Number(tx.amount).toLocaleString("en-IN")}</span>
                    </div>
                    {tx.status && (
                      <div className="flex justify-between font-bold">
                        <span className="text-zinc-500">Status</span>
                        <span className={tx.status === "Success" ? "text-emerald-600" : "text-orange-600"}>{tx.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-[14px] font-bold text-[#0F291B]">No Transactions</p>
                <p className="text-[12px] text-zinc-400 font-medium leading-relaxed max-w-[220px]">Payment is required to generate transaction records.</p>
              </div>
            )}
          </div>

          {/* ── INVOICE CARD ── */}
          <div className="bg-white rounded-[16px] border border-zinc-200 p-5">
            {hasInvoices ? (
              <div className="space-y-4">
                <h4 className="font-bold text-[#0F291B] text-[14px] border-b border-zinc-100 pb-2">Invoices</h4>
                {order.invoices.map((inv: any, idx: number) => {
                  const isExpanded = expandedInvoiceIdx === idx;
                  return (
                    <div key={idx} className="border border-zinc-100 rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedInvoiceIdx(isExpanded ? null : idx)}>
                        <div>
                          <p className="font-bold text-[#0F291B] text-sm">{inv.invoice_id}</p>
                          <p className="text-xs text-zinc-500">₹{Number(inv.amount || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{inv.dispatch_status || "Dispatched"}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="pt-3 border-t border-zinc-100 space-y-4 text-left">
                          {/* Invoice Date & Amount */}
                          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-500 pb-2">
                            <div>
                              <p className="mb-1">Invoice Date</p>
                              <p className="text-[#0F291B] font-bold text-sm">{inv.invoice_date}</p>
                            </div>
                            <div>
                              <p className="mb-1">Amount</p>
                              <p className="text-[#0F291B] font-bold text-sm">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          {/* Print Invoice Button */}
                          {inv.sales_invoice_print_url && (
                            <a
                              href={inv.sales_invoice_print_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print Invoice
                            </a>
                          )}

                          {/* Large Green Track Order Button */}
                          {inv.transporter_details?.[0] && String(inv.transporter_details[0].transporter_name).toLowerCase() === "indian post" && (
                            <button
                              onClick={() => {
                                const trackingId = inv.transporter_details[0].tracking_id;
                                if (expandedTrackingId === trackingId) {
                                  setExpandedTrackingId(null);
                                } else {
                                  setExpandedTrackingId(trackingId);
                                  handleTrackStickerInline(trackingId);
                                }
                              }}
                              className="w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold py-3.5 rounded-2xl text-xs font-roboto transition-all shadow-sm flex items-center justify-center gap-2 duration-300"
                            >
                              Track Order ({inv.transporter_details[0].transporter_name || "Transporter"})
                            </button>
                          )}

                          {/* Tracking cards list */}
                          {inv.transporter_details && inv.transporter_details.length > 0 && String(inv.transporter_details[0].transporter_name).toLowerCase() === "indian post" && (
                            <div className="space-y-4 mt-4">
                              {inv.transporter_details.map((pkg: any, pIdx: number) => {
                                const tInfo = individualTrackingData[pkg.tracking_id] || { loading: false };
                                const trackingExpanded = expandedTrackingId === pkg.tracking_id;

                                return (
                                  <div key={pIdx} className="border border-zinc-100 rounded-2xl bg-zinc-50/40 overflow-hidden">
                                    {/* Tracking Header */}
                                    <div className="bg-[#EBF3EF]/60 px-4 py-3 flex items-center justify-between border-b border-zinc-100">
                                      <div className="text-left">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tracking ID</p>
                                        <p className="font-extrabold text-sm text-[#0F291B]">{pkg.tracking_id}</p>
                                      </div>
                                      <span className="inline-flex items-center bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-orange-100">
                                        {tInfo.data?.del_status?.del_status || "NOT DELIVERED"}
                                      </span>
                                    </div>

                                    {/* Tracking Rows */}
                                    <div className="p-4 space-y-2 text-xs font-semibold text-zinc-500">
                                      <div className="flex justify-between">
                                        <span>Booked On</span>
                                        <span className="text-[#0F291B] font-bold">
                                          {tInfo.data?.booking_details?.booked_on
                                            ? new Date(tInfo.data.booking_details.booked_on).toLocaleDateString()
                                            : "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Article Type</span>
                                        <span className="text-[#0F291B] font-bold">N/A</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Origin</span>
                                        <span className="text-[#0F291B] font-bold">()</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Destination</span>
                                        <span className="text-[#0F291B] font-bold">()</span>
                                      </div>
                                    </div>

                                    {/* Nested Tracking History steps */}
                                    <div className="border-t border-zinc-100 bg-white">
                                      <button
                                        onClick={() => {
                                          if (trackingExpanded) {
                                            setExpandedTrackingId(null);
                                          } else {
                                            setExpandedTrackingId(pkg.tracking_id);
                                            handleTrackStickerInline(pkg.tracking_id);
                                          }
                                        }}
                                        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#0D9740] hover:bg-zinc-50 transition-colors"
                                      >
                                        <span>View Tracking History</span>
                                        {trackingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      </button>

                                      {trackingExpanded && (
                                        <div className="px-4 pb-4 pt-2 border-t border-zinc-100 text-[11px] space-y-3">
                                          {tInfo.loading && (
                                            <p className="text-zinc-500 py-2">Loading steps...</p>
                                          )}
                                          {tInfo.error && (
                                            <p className="text-rose-500 py-2">{tInfo.error}</p>
                                          )}
                                          {tInfo.data?.tracking_details && tInfo.data.tracking_details.map((step: any, sIdx: number) => (
                                            <div key={sIdx} className="flex gap-3 border-l-2 border-emerald-500 pl-3 py-1 text-left">
                                              <div className="flex-1">
                                                <p className="font-bold text-[#0F291B]">{step.office || step.event}</p>
                                                <p className="text-zinc-500 text-[10px]">{step.date} {step.time}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* LR / Stickers cards list */}
                          {inv.lr_and_stickers && inv.lr_and_stickers.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                              {inv.lr_and_stickers.map((lr: any, lrIdx: number) => (
                                <div key={lrIdx} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/30 space-y-3 text-xs font-semibold text-zinc-500 shadow-sm text-left">
                                  <div className="flex items-center gap-2 text-zinc-700 font-bold border-b border-zinc-100 pb-2 mb-1">
                                    <span>🚚</span>
                                    <span>LR / Stickers</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Transporter</span>
                                    <span className="text-[#0F291B] font-bold">{lr.transporter_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tracking ID</span>
                                    <span className="text-[#0F291B] font-bold">{lr.tracking_id}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Payment Status</span>
                                    <span className="text-[#2E7D32] font-bold">{lr.payment_status}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Charges</span>
                                    <span className="text-[#0F291B] font-bold">₹{Number(lr.charges || lr.amount || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>No of Boxes</span>
                                    <span className="text-[#0F291B] font-bold">{lr.no_of_boxes}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Created At</span>
                                    <span className="text-[#0F291B] font-bold">{lr.created_at}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Estimated Arrival Time</span>
                                    <span className="text-[#0F291B] font-bold">{lr.estimated_arrival_time}</span>
                                  </div>

                                  {/* Print LR Button */}
                                  {(lr.print_url || lr.document_url) && (
                                    <a
                                      href={lr.print_url || lr.document_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full mt-2 border border-zinc-200 hover:bg-zinc-50 text-[#0F291B] font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                      <Printer className="w-3.5 h-3.5" /> Print LR
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-[13px] text-zinc-400 font-medium leading-relaxed max-w-[220px]">Invoice will be generated after payment confirmation.</p>
              </div>
            )}
          </div>

          {/* ── NEED HELP CARD — w:363 h:134 br:12 p:16 gap:16 ── */}
          <div className="bg-[#EEF2FC] rounded-[12px]" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E6091] border border-blue-100 flex-shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#0F291B]">Need Help with Order?</h4>
                <p className="text-[11px] text-zinc-500 font-medium">Available 24/7 for trade assistance</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 bg-white border border-zinc-200 text-[#0F291B] font-bold text-[13px] rounded-xl flex items-center justify-center hover:bg-zinc-50 transition-colors"
              >
                Contact Support
              </a>
              <Link
                href={`/support-help?order_id=${summary.order_id}`}
                className="h-11 bg-white border border-zinc-200 text-[#0F291B] font-bold text-[13px] rounded-xl flex items-center justify-center text-center hover:bg-zinc-50 transition-colors"
              >
                Raise complain
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ====================================================== */}
      {/* DESKTOP LAYOUT — original, completely untouched         */}
      {/* ====================================================== */}
      <main className="hidden md:flex flex-1 w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-8 flex-col gap-6">

        {/* Header Navigation Section */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-3">
            <Link href="/orders" className="text-zinc-500 hover:text-[#1E532E] transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="text-left space-y-0.5">
              <h2 className="text-2xl font-bold text-[#0F291B] font-roboto">Order Details</h2>
              <p className="text-zinc-500 text-xs font-semibold">Order ID: {summary.order_id}</p>
            </div>
          </div>

          <div className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${getStatusColor(statusDisplay)}`}>
            ● {statusDisplay}
          </div>
        </div>



        {/* Main Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-10">

          {/* Left Column (8 cols): Order info, Items, Transport */}
          <div className="lg:col-span-8 space-y-6">

            {/* Card 1: Order Summary */}
            <div className="bg-white border border-[#CDE5D2] rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#0F291B] font-roboto border-b border-zinc-100 pb-2.5 text-left">
                Order Summary
              </h3>

              <div className="space-y-4">
                {/* Row 1: Order Date */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3 text-zinc-500 font-semibold text-sm">
                    <Calendar className="w-5 h-5 text-zinc-400 shrink-0" />
                    <span>Order Date</span>
                  </div>
                  <span className="font-bold text-[#0F291B] text-sm">
                    {summary.order_date ? new Date(summary.order_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--"}
                  </span>
                </div>
                <div className="h-[1px] bg-zinc-100" />

                {/* Row 2: Order ID */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3 text-zinc-500 font-semibold text-sm">
                    <FileText className="w-5 h-5 text-zinc-400 shrink-0" />
                    <span>Order ID</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0F291B] text-sm">{summary.order_id}</span>
                    <button
                      onClick={handleCopy}
                      className="text-emerald-700 hover:text-emerald-800 transition-colors p-1"
                      title="Copy Order ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="h-[1px] bg-zinc-100" />

                {/* Row 3: Discount */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3 text-zinc-500 font-semibold text-sm">
                    <Tag className="w-5 h-5 text-zinc-400 shrink-0" />
                    <span>Discount</span>
                  </div>
                  <span className="font-bold text-red-500 text-sm">
                    - ₹{Number(summary.discount_received || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-[1px] bg-zinc-100" />

                {/* Row 4: Order Amount Highlighted Box */}
                <div className="bg-[#F5F8F6] border border-[#E0EFE6] rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[#1E532E] font-bold text-sm">
                    <Banknote className="w-5 h-5 shrink-0" />
                    <span>Order Amount</span>
                  </div>
                  <span className="text-xl font-extrabold text-[#1E532E]">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {showPayButton && (
                  <button
                    onClick={handlePayNow}
                    className="w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold py-3.5 rounded-xl text-xs font-roboto transition-all shadow-md flex items-center justify-center duration-300 mt-2 active:scale-[0.98]"
                  >
                    <span>{isFullPayment ? "Pay Pending" : "Pay Booking Deposit"} (₹{payAmount.toLocaleString('en-IN')})</span>
                  </button>
                )}
              </div>

              {actionMessage && (
                <div className="text-rose-600 text-xs font-semibold text-left bg-rose-50 border border-rose-100/50 rounded-xl px-4 py-2.5 animate-pulse">
                  ⚠️ {actionMessage}
                </div>
              )}

              {/* Action Buttons */}
              {String(summary.allowed_action || "").toLowerCase() === "cancel" && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-2xl text-xs font-roboto transition-all shadow-sm flex items-center justify-center gap-1.5 duration-300 active:scale-[0.98] disabled:opacity-50"
                  >
                    {cancelling ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Cancelling...
                      </span>
                    ) : (
                      "Cancel Order"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Shipment Details */}
            <div className="bg-white border border-[#CDE5D2] rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#0F291B] font-roboto border-b border-zinc-100 pb-2.5 text-left">
                Shipment 1 of 1
              </h3>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 font-medium">No items in this shipment.</div>
                ) : (
                  items.map((item: any, idx: number) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 last:border-b-0 pb-4 last:pb-0 text-left">
                      <div className="flex items-start gap-4">
                        {item.image && (
                          <div className="w-16 h-16 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={item.image} alt={item.item_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="space-y-1.5">
                          <h4 className="text-md font-bold text-[#0F291B] font-roboto">{item.item_name}</h4>
                          <div className="text-xs text-zinc-500 font-medium">
                            Qty: {item.qty} • Rate: ₹{Number(items.length === 1 ? (Number(summary.order_amount) / item.qty) : item.rate).toLocaleString('en-IN')}
                          </div>
                          {items.length === 1 && Number(summary.discount_received) > 0 && (
                            <div className="text-xs text-rose-600 font-semibold mt-0.5">
                              Discount Received: -₹{Number(summary.discount_received).toLocaleString('en-IN')}
                            </div>
                          )}
                          <div className={`inline-flex items-center gap-1 bg-[#FFF8E1] text-[#F57F17] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border border-amber-200/50 mt-1`}>
                            ● {item.status || "Pending Payment"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right self-end md:self-center shrink-0">
                        <span className="text-lg font-extrabold text-[#0F291B]">
                          ₹{Number(items.length === 1 ? summary.order_amount : item.total).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Card 3: Transport Details */}
            <div className="bg-white border border-[#CDE5D2] rounded-[32px] p-6 lg:p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-[#0F291B] font-roboto border-b border-zinc-100 pb-2.5 text-left">
                Transport Details
              </h3>

              <div className="flex flex-col gap-6">
                {transportEntries.map((entry, idx) => (
                  <div key={idx} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left ${idx > 0 ? "border-t border-zinc-100 pt-6" : ""}`}>
                    {/* Transporter Name */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase font-roboto">
                        <Truck className="w-4 h-4 shrink-0 text-[#0D9740]" />
                        <span>Transport Name</span>
                      </div>
                      <p className="font-bold text-[#0F291B] text-sm">
                        {entry.transporter_name}
                      </p>
                    </div>

                    {/* Shipment Date */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase font-roboto">
                        <Calendar className="w-4 h-4 shrink-0 text-[#0D9740]" />
                        <span>Shipment Date</span>
                      </div>
                      <p className="font-bold text-[#0F291B] text-sm">
                        {entry.shipment_date}
                      </p>
                    </div>

                    {/* Transport Status */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-zinc-400 font-bold text-xs uppercase font-roboto">
                        <Info className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>Status</span>
                      </div>
                      <p className="font-extrabold text-amber-600 text-sm">
                        {entry.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column (4 cols): Transactions, Invoice, Support assistance */}
          <div className="lg:col-span-4 space-y-6">

            {/* Card A: Transactions */}
            <div className="bg-white border border-[#CDE5D2] rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center min-h-[220px] text-center space-y-4">
              {hasTransactions ? (
                <div className="w-full space-y-4 text-left">
                  <h4 className="font-bold text-[#0F291B] text-sm tracking-wide uppercase border-b pb-2">Transactions</h4>
                  {order.transactions.map((tx: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50/50 rounded-xl p-3 border border-zinc-100 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-zinc-700">
                        <span>TXN ID:</span>
                        <span className="break-all">{tx.transaction_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Method:</span>
                        <span className="font-semibold">{tx.mode_of_payment}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#1E532E]">
                        <span>Amount:</span>
                        <span>₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                      </div>
                      {tx.status && (
                        <div className="flex justify-between font-bold">
                          <span className="text-zinc-500">Status:</span>
                          <span className={tx.status === "Success" ? "text-emerald-600" : "text-orange-600"}>{tx.status}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 border border-zinc-100">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-[#0F291B] text-sm font-roboto">No Transactions Found</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
                      Transactions will appear here after payment is completed.
                    </p>
                  </div>
                  <button className="bg-[#1E532E] hover:bg-[#153B21] text-white font-bold py-3.5 px-6 rounded-2xl text-xs font-roboto transition-colors shadow-md w-full">
                    Pay Now
                  </button>
                </>
              )}
            </div>

            {/* Card B: Invoice */}
            <div className="bg-white border border-[#CDE5D2] rounded-[32px] p-6 shadow-sm w-full space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3 text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-[#0F291B] text-lg font-roboto">Invoices</h4>
              </div>

              {hasInvoices ? (
                <div className="space-y-6">
                  {order.invoices.map((inv: any, idx: number) => {
                    const isExpanded = expandedInvoiceIdx === idx;
                    return (
                      <div key={idx} className="border border-[#CDE5D2]/60 rounded-2xl p-4 space-y-4 bg-white shadow-sm">
                        {/* Invoice Header */}
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedInvoiceIdx(isExpanded ? null : idx)}
                        >
                          <div className="text-left">
                            <p className="font-extrabold text-[#0F291B] text-sm tracking-tight">{inv.invoice_id}</p>
                            <p className="text-zinc-800 font-bold text-sm mt-1">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center bg-[#EBF3EF] text-[#2E7D32] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border border-emerald-100">
                              {inv.dispatch_status || "Dispatched"}
                            </span>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-zinc-100 space-y-4 text-left">
                            {/* Invoice Date & Amount */}
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-500 pb-2">
                              <div>
                                <p className="mb-1">Invoice Date</p>
                                <p className="text-[#0F291B] font-bold text-sm">{inv.invoice_date}</p>
                              </div>
                              <div>
                                <p className="mb-1">Amount</p>
                                <p className="text-[#0F291B] font-bold text-sm">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</p>
                              </div>
                            </div>

                            {/* Print Invoice Button */}
                            {inv.sales_invoice_print_url && (
                              <a
                                href={inv.sales_invoice_print_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" /> Print Invoice
                              </a>
                            )}

                            {/* Large Green Track Order Button */}
                            {inv.transporter_details?.[0] && String(inv.transporter_details[0].transporter_name).toLowerCase() === "indian post" && (
                              <button
                                onClick={() => {
                                  const trackingId = inv.transporter_details[0].tracking_id;
                                  if (expandedTrackingId === trackingId) {
                                    setExpandedTrackingId(null);
                                  } else {
                                    setExpandedTrackingId(trackingId);
                                    handleTrackStickerInline(trackingId);
                                  }
                                }}
                                className="w-full bg-[#0D9740] hover:bg-[#0a7d34] text-white font-bold py-3.5 rounded-2xl text-xs font-roboto transition-all shadow-sm flex items-center justify-center gap-2 duration-300"
                              >
                                Track Order ({inv.transporter_details[0].transporter_name || "Transporter"})
                              </button>
                            )}

                            {/* Tracking cards list */}
                            {inv.transporter_details && inv.transporter_details.length > 0 && String(inv.transporter_details[0].transporter_name).toLowerCase() === "indian post" && (
                              <div className="space-y-4 mt-4">
                                {inv.transporter_details.map((pkg: any, pIdx: number) => {
                                  const tInfo = individualTrackingData[pkg.tracking_id] || { loading: false };
                                  const trackingExpanded = expandedTrackingId === pkg.tracking_id;

                                  return (
                                    <div key={pIdx} className="border border-zinc-100 rounded-2xl bg-zinc-50/40 overflow-hidden">
                                      {/* Tracking Header */}
                                      <div className="bg-[#EBF3EF]/60 px-4 py-3 flex items-center justify-between border-b border-zinc-100">
                                        <div className="text-left">
                                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tracking ID</p>
                                          <p className="font-extrabold text-sm text-[#0F291B]">{pkg.tracking_id}</p>
                                        </div>
                                        <span className="inline-flex items-center bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border border-orange-100">
                                          {tInfo.data?.del_status?.del_status || "NOT DELIVERED"}
                                        </span>
                                      </div>

                                      {/* Tracking Rows */}
                                      <div className="p-4 space-y-2 text-xs font-semibold text-zinc-500">
                                        <div className="flex justify-between">
                                          <span>Booked On</span>
                                          <span className="text-[#0F291B] font-bold">
                                            {tInfo.data?.booking_details?.booked_on
                                              ? new Date(tInfo.data.booking_details.booked_on).toLocaleDateString()
                                              : "N/A"}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Article Type</span>
                                          <span className="text-[#0F291B] font-bold">N/A</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Origin</span>
                                          <span className="text-[#0F291B] font-bold">()</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Destination</span>
                                          <span className="text-[#0F291B] font-bold">()</span>
                                        </div>
                                      </div>

                                      {/* Nested Tracking History steps */}
                                      <div className="border-t border-zinc-100 bg-white">
                                        <button
                                          onClick={() => {
                                            if (trackingExpanded) {
                                              setExpandedTrackingId(null);
                                            } else {
                                              setExpandedTrackingId(pkg.tracking_id);
                                              handleTrackStickerInline(pkg.tracking_id);
                                            }
                                          }}
                                          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#0D9740] hover:bg-zinc-50 transition-colors"
                                        >
                                          <span>View Tracking History</span>
                                          {trackingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>

                                        {trackingExpanded && (
                                          <div className="px-4 pb-4 pt-2 border-t border-zinc-100 text-[11px] space-y-3">
                                            {tInfo.loading && (
                                              <p className="text-zinc-500 py-2">Loading steps...</p>
                                            )}
                                            {tInfo.error && (
                                              <p className="text-rose-500 py-2">{tInfo.error}</p>
                                            )}
                                            {tInfo.data?.tracking_details && tInfo.data.tracking_details.map((step: any, sIdx: number) => (
                                              <div key={sIdx} className="flex gap-3 border-l-2 border-emerald-500 pl-3 py-1 text-left">
                                                <div className="flex-1">
                                                  <p className="font-bold text-[#0F291B]">{step.office || step.event}</p>
                                                  <p className="text-zinc-500 text-[10px]">{step.date} {step.time}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* LR / Stickers cards list */}
                            {inv.lr_and_stickers && inv.lr_and_stickers.length > 0 && (
                              <div className="space-y-4 pt-4 border-t border-zinc-100">
                                {inv.lr_and_stickers.map((lr: any, lrIdx: number) => (
                                  <div key={lrIdx} className="border border-zinc-100 rounded-2xl p-4 bg-zinc-50/30 space-y-3 text-xs font-semibold text-zinc-500 shadow-sm text-left">
                                    <div className="flex items-center gap-2 text-zinc-700 font-bold border-b border-zinc-100 pb-2 mb-1">
                                      <span>🚚</span>
                                      <span>LR / Stickers</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Transporter</span>
                                      <span className="text-[#0F291B] font-bold">{lr.transporter_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Tracking ID</span>
                                      <span className="text-[#0F291B] font-bold">{lr.tracking_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Payment Status</span>
                                      <span className="text-[#2E7D32] font-bold">{lr.payment_status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Charges</span>
                                      <span className="text-[#0F291B] font-bold">₹{Number(lr.charges || lr.amount || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>No of Boxes</span>
                                      <span className="text-[#0F291B] font-bold">{lr.no_of_boxes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Created At</span>
                                      <span className="text-[#0F291B] font-bold">{lr.created_at}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Estimated Arrival Time</span>
                                      <span className="text-[#0F291B] font-bold">{lr.estimated_arrival_time}</span>
                                    </div>

                                    {/* Print LR Button */}
                                    {(lr.print_url || lr.document_url) && (
                                      <a
                                        href={lr.print_url || lr.document_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full mt-2 border border-zinc-200 hover:bg-zinc-50 text-[#0F291B] font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                                      >
                                        <Printer className="w-3.5 h-3.5" /> Print LR
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 border border-zinc-100">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
                    Invoice will be generated after payment confirmation.
                  </p>
                </div>
              )}
            </div>

            {/* Card C: Support Assistance */}
            <div className="bg-[#EEF2FC] border border-[#D5E1F9] rounded-[32px] p-6 shadow-sm text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E6091] shrink-0 border border-blue-100">
                  <Headphones className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#0F291B] text-sm font-roboto">Need Help with Order?</h4>
                  <p className="text-zinc-500 text-[10px] font-medium leading-relaxed">Available 24/7 for trade assistance</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={process.env.NEXT_PUBLIC_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-zinc-200 hover:bg-zinc-50 text-[#0F291B] font-bold py-2.5 rounded-xl text-xs font-roboto transition-all shadow-sm flex items-center justify-center"
                >
                  Contact Support
                </a>

                <Link
                  href={`/support-help?order_id=${summary.order_id}`}
                  className="bg-white border border-zinc-200 hover:bg-zinc-50 text-[#0F291B] font-bold py-2.5 rounded-xl text-xs font-roboto transition-all shadow-sm flex items-center justify-center text-center"
                >
                  Raise complain
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Indian Post Tracking Overlay Modal */}
      {activeTrackingSticker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] border border-zinc-100 shadow-2xl max-w-[600px] w-full max-h-[85vh] flex flex-col overflow-hidden text-left animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F291B] font-roboto">Indian Post Tracking</h3>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Article Number: {activeTrackingSticker}</p>
              </div>
              <button
                onClick={() => setActiveTrackingSticker(null)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {trackingLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-emerald-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Fetching tracking details...</p>
                </div>
              )}

              {trackingError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs font-semibold text-center">
                  {trackingError}
                </div>
              )}

              {trackingData && (
                <div className="space-y-6">
                  {/* Booking Details Overview */}
                  <div className="bg-[#F5F8F6] border border-[#E0EFE6] rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs font-medium text-[#0F291B]">
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Booked At</span>
                      <span className="font-bold">{trackingData.booking_details?.booked_at || "--"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Booked On</span>
                      <span className="font-bold">
                        {trackingData.booking_details?.booked_on ? new Date(trackingData.booking_details.booked_on).toLocaleDateString() : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Delivery Location</span>
                      <span className="font-bold">{trackingData.booking_details?.delivery_location || "--"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px] uppercase font-bold tracking-wider">Delivery Status</span>
                      <span className="font-extrabold uppercase text-[#1E532E]">{trackingData.del_status?.del_status || "In Transit"}</span>
                    </div>
                  </div>

                  {/* Timeline History */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-[#0F291B] text-sm uppercase tracking-wide border-b pb-2">Tracking History</h4>

                    {(!trackingData.tracking_details || trackingData.tracking_details.length === 0) ? (
                      <p className="text-xs text-zinc-500 text-center font-medium py-4">No tracking history entries found.</p>
                    ) : (
                      <div className="relative pl-6 border-l-2 border-emerald-100 ml-3 space-y-5 py-2">
                        {trackingData.tracking_details.map((step: any, sIdx: number) => (
                          <div key={sIdx} className="relative text-xs">
                            {/* Circle Dot on timeline */}
                            <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${sIdx === 0 ? "border-[#1E532E]" : "border-emerald-200"
                              } flex items-center justify-center`}>
                              {sIdx === 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#1E532E]" />}
                            </div>

                            {/* Content */}
                            <div className="space-y-0.5 text-left">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${sIdx === 0 ? "text-[#1E532E] text-[13px]" : "text-[#0F291B]"}`}>
                                  {step.event}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-semibold shrink-0">
                                  {step.date ? new Date(step.date).toLocaleDateString() : "--"} {step.time || ""}
                                </span>
                              </div>
                              <p className="text-zinc-500 text-[11px] font-semibold">{step.office || "--"}</p>
                              {step.remarks && <p className="text-zinc-400 text-[10px] italic">Remarks: {step.remarks}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification with Progress Bar */}
      {showCancelToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-300">
          <div className={`${toastType === "error" ? "bg-red-950" : "bg-[#0F291B]"} text-white py-4 px-6 rounded-2xl shadow-xl flex flex-col gap-2 relative overflow-hidden min-w-[320px]`}>
            <div className="flex items-center gap-2">
              <span className={toastType === "error" ? "text-red-400 text-lg" : "text-emerald-400 text-lg"}>
                {toastType === "error" ? "⚠️" : "✓"}
              </span>
              <span className="text-xs font-bold font-roboto">{toastMessage}</span>
            </div>
            {/* Decreasing Line / Progress Bar */}
            <div className={`absolute bottom-0 left-0 h-1 ${toastType === "error" ? "bg-red-500" : "bg-[#0D9740]"} w-full`} style={{
              animation: 'shrinkWidth 3s linear forwards'
            }} />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />

      <Footer />
    </div>
  );
}
export const dynamic = 'force-dynamic';
