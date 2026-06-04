import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Order, OrderItem } from '@/lib/types';
import { Calendar, Package, ArrowRight, ShoppingBag, Info } from 'lucide-react';

interface DBOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    image_url: string;
  } | null;
}

interface DBOrder {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  created_at: string;
  order_items: DBOrderItem[];
}

export const revalidate = 0; // Disable server caching for order history to always show freshest status

export default async function AccountOrdersPage() {
  let orders: DBOrder[] = [];
  let userEmail = '';
  let errorMsg = '';

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      userEmail = user.email || '';
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            order_id,
            product_id,
            quantity,
            price,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      orders = (data as any) || [];
    }
  } catch (e: any) {
    errorMsg = e.message;
    console.warn('Could not load orders from database:', e.message);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Orders</h1>
        {userEmail && (
          <p className="text-sm text-slate-500 mt-1">Logged in as: <span className="font-semibold text-slate-700">{userEmail}</span></p>
        )}
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border-l-4 border-amber-600 text-amber-900 p-4 rounded flex gap-3 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <span className="font-bold block">Database offline or unconfigured</span>
            Past orders cannot be retrieved directly from the database because Supabase is not connected yet. Try setting up environment variables or place a simulated checkout order.
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded space-y-5">
          <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400">
            <Package className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No orders found</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            You haven't placed any orders yet. Once you place an order, it will appear here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm flex flex-col divide-y divide-slate-100"
            >
              {/* Order Header info */}
              <div className="p-4 sm:p-5 bg-slate-50/50 flex flex-wrap justify-between items-center gap-4 text-sm">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Date Placed</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-slate-450" />
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Amount</span>
                    <span className="font-bold text-slate-850 block mt-0.5">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Order ID</span>
                    <span className="font-medium text-slate-600 block mt-0.5 break-all select-all">{order.id}</span>
                  </div>
                </div>

                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order items nested list */}
              <div className="p-4 sm:p-5 space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm gap-4">
                    <div className="flex items-center gap-3">
                      {item.product?.image_url && (
                        <div className="w-12 h-10 relative bg-slate-50 border border-slate-100 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {item.product?.name || 'Product'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Qty: {item.quantity} at ${item.price.toFixed(2)} each
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Order Shipping status */}
              <div className="p-4 sm:p-5 bg-slate-50/20 text-xs text-slate-500">
                <span className="font-semibold text-slate-700 block mb-1">Shipping Details</span>
                Deliver to: <span className="font-medium text-slate-700">{order.shipping_name}</span> ({order.shipping_phone}) at {order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
