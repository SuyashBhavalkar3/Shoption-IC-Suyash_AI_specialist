'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShoppingBag, Calendar, Truck, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { trackPurchase } from '@/lib/analytics';
import { Order, OrderItem } from '@/lib/types';

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState<{ order: Order; items: OrderItem[] } | null>(null);

  useEffect(() => {
    // Retrieve details from localStorage
    const savedDetails = localStorage.getItem('last_order_details');
    if (!savedDetails) {
      // If none, direct them to home
      router.push('/');
      return;
    }

    try {
      const parsed = JSON.parse(savedDetails);
      setOrderInfo(parsed);

      // Trigger analytics
      trackPurchase(parsed.order, parsed.items);

      // Fire confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error('Error loading order success info:', e);
    }

    // Clean up to prevent duplicate tracks on refresh
    return () => {
      localStorage.removeItem('last_order_details');
    };
  }, [router]);

  if (!orderInfo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 font-semibold">Processing order confirmation...</p>
      </div>
    );
  }

  const { order, items } = orderInfo;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-full mb-2">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Order Placed Successfully!</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Thank you for your purchase. We have received your order and are preparing the shipment.
        </p>
      </div>

      {/* Order Meta details */}
      <div className="bg-white border border-slate-200 rounded divide-y divide-slate-100 shadow-sm">
        <div className="p-5 sm:p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[11px] mb-1">Order ID</span>
            <span className="font-bold text-slate-800 break-all select-all">{order.id}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[11px] mb-1">Order Date</span>
            <span className="font-medium text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-450" />
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 col-span-2">
            <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[11px] mb-1">Shipping Address</span>
            <span className="font-medium text-slate-800 block">{order.shipping_name}</span>
            <span className="text-slate-500 text-xs block">{order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</span>
          </div>
        </div>

        {/* Item Summaries */}
        <div className="p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Purchased Items</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-10 relative bg-slate-50 border border-slate-100 rounded overflow-hidden flex-shrink-0">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 line-clamp-1">{item.product?.name || 'Product'}</span>
                    <span className="text-xs text-slate-400 font-medium">Quantity: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Price details */}
        <div className="p-5 sm:p-6 bg-slate-50/55 text-sm flex justify-between items-center font-extrabold text-slate-950">
          <span>Amount Charged</span>
          <span className="text-lg">${order.total_amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Next Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/products"
          className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 bg-slate-900 hover:bg-slate-950 text-white font-semibold px-6 py-3 rounded text-sm transition-colors text-center cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
        <Link
          href="/account/orders"
          className="w-full sm:w-auto inline-flex justify-center items-center gap-1 bg-white hover:bg-slate-50 text-slate-800 border border-slate-350 font-semibold px-6 py-3 rounded text-sm transition-colors text-center cursor-pointer"
        >
          <span>View Past Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
