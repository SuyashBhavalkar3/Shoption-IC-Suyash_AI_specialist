'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/app-context';
import { createClient } from '@/lib/supabase/client';
import { trackCheckoutStarted } from '@/lib/analytics';
import { CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, user, showToast } = useApp();
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger trackCheckoutStarted on mount
  useEffect(() => {
    if (cart.length > 0) {
      trackCheckoutStarted(cart);
    }
  }, [cart]);

  // If cart is empty, redirect back to products
  useEffect(() => {
    if (cart.length === 0 && !isSubmitting) {
      router.push('/products');
    }
  }, [cart, router, isSubmitting]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Full name is required';
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim())) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (!form.address.trim()) newErrors.address = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (form.postalCode.trim().length < 3) {
      newErrors.postalCode = 'Postal code must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct the validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    const shippingCost = cartTotal > 500 ? 0 : 15;
    const finalAmount = cartTotal + shippingCost;

    try {
      if (!user) {
        throw new Error('You must be signed in to place an order.');
      }

      // 1. Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: finalAmount,
          status: 'completed', // Since it is a simulated paid flow, default to completed
          shipping_name: form.name,
          shipping_phone: form.phone,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_postal_code: form.postalCode,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItemsToInsert = cart.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)
        .select(`
          id,
          order_id,
          product_id,
          quantity,
          price,
          product:products (*)
        `);

      if (itemsError) throw itemsError;

      // 3. Subtract product stock (best effort in mock setup)
      for (const item of cart) {
        if (item.product) {
          const newStock = Math.max(0, item.product.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);
        }
      }

      // 4. Save order receipt to localStorage so we can show it on success page & track purchase event
      localStorage.setItem(
        'last_order_details',
        JSON.stringify({
          order: orderData,
          items: insertedItems,
        })
      );

      // 5. Clear cart
      await clearCart();
      showToast('Payment successful! Order placed.', 'success');

      // 6. Redirect to success page
      router.push('/order-success');
    } catch (err: any) {
      console.warn('Database order failed, simulating checkout order in memory:', err.message);
      
      // Simulate order success locally (e.g. if DB keys aren't set up yet)
      const mockOrderId = Math.random().toString(36).substring(2, 15).toUpperCase();
      const simulatedOrder = {
        id: mockOrderId,
        user_id: user?.id || 'mock-user-id',
        total_amount: finalAmount,
        status: 'completed',
        shipping_name: form.name,
        shipping_phone: form.phone,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_postal_code: form.postalCode,
        created_at: new Date().toISOString(),
      };

      const simulatedItems = cart.map((item) => ({
        id: Math.random().toString(36).substring(2, 9),
        order_id: mockOrderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price || 0,
        product: item.product,
      }));

      localStorage.setItem(
        'last_order_details',
        JSON.stringify({
          order: simulatedOrder,
          items: simulatedItems,
        })
      );

      await clearCart();
      showToast('Simulated payment successful!', 'success');
      router.push('/order-success');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingCost = cartTotal > 500 ? 0 : 15;
  const orderTotal = cartTotal + shippingCost;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cart</span>
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Checkout</h1>

      <form onSubmit={handlePayNow} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left - Shipping Info Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Shipping Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.name ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="text-rose-600 text-xs font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.phone ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="+1 555-0199"
              />
              {errors.phone && <p className="text-rose-600 text-xs font-medium mt-1">{errors.phone}</p>}
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="address">
                Street Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.address ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="123 Main St"
              />
              {errors.address && <p className="text-rose-600 text-xs font-medium mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="city">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.city ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="San Francisco"
              />
              {errors.city && <p className="text-rose-600 text-xs font-medium mt-1">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="state">
                State / Province
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={form.state}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.state ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="CA"
              />
              {errors.state && <p className="text-rose-600 text-xs font-medium mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1" htmlFor="postalCode">
                Postal Code
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                value={form.postalCode}
                onChange={handleInputChange}
                className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-600 ${
                  errors.postalCode ? 'border-rose-500 bg-rose-50/50' : 'border-slate-300'
                }`}
                placeholder="94107"
              />
              {errors.postalCode && <p className="text-rose-600 text-xs font-medium mt-1">{errors.postalCode}</p>}
            </div>
          </div>
        </div>

        {/* Right - Order Review & Submit */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Review Order</h2>

            {/* Cart item summaries */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 line-clamp-1">
                      {item.product?.name}
                    </span>
                    <span className="text-slate-400 font-medium">x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between font-extrabold text-base text-slate-950">
                <span>Total Amount</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded transition-colors text-sm text-center cursor-pointer disabled:bg-indigo-400"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Payment...' : 'Pay Now'}</span>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-1">Simulated Transaction</span>
            By clicking "Pay Now", the system will bypass a real credit card checkout, record the completed orders inside Supabase, and dispatch a purchase analytics event.
          </div>
        </div>
      </form>
    </div>
  );
}
