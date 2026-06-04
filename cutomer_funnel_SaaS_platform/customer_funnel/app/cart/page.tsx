'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context/app-context';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    isCartLoading,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
  } = useApp();

  const shippingCost = cartTotal > 500 ? 0 : cartTotal === 0 ? 0 : 15;
  const orderTotal = cartTotal + shippingCost;

  if (isCartLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-slate-500 font-semibold">Loading your shopping cart...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h1>
        <p className="text-slate-500 max-w-sm mx-auto">
          Looks like you haven't added any products to your cart yet. Let's find some gadgets!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left - Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row gap-4 items-center justify-between"
              >
                {/* Product details */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-16 relative rounded overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Link href={`/products/${product.id}`} className="font-semibold text-slate-800 text-sm hover:text-indigo-600 transition-colors line-clamp-1">
                      {product.name}
                    </Link>
                    <span className="text-xs text-slate-400 capitalize block mb-1">
                      Category: {product.category}
                    </span>
                    <span className="text-sm font-black text-slate-850">
                      ${product.price.toFixed(2)} each
                    </span>
                  </div>
                </div>

                {/* Actions & total */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                  {/* Quantity control */}
                  <div className="flex items-center border border-slate-300 rounded bg-white">
                    <button
                      onClick={() => updateQuantity(product.id, item.quantity - 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-semibold text-slate-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, item.quantity + 1)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Total price for item */}
                  <span className="text-sm font-bold text-slate-900 min-w-[70px] text-right">
                    ${(product.price * item.quantity).toFixed(2)}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Right - Cart Summary */}
        <div className="bg-white border border-slate-200 rounded p-6 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h2>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Total ({cartCount})</span>
              <span className="font-medium text-slate-800">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              {shippingCost === 0 ? (
                <span className="text-emerald-600 font-medium">Free</span>
              ) : (
                <span className="font-medium text-slate-800">${shippingCost.toFixed(2)}</span>
              )}
            </div>
            {shippingCost > 0 && (
              <p className="text-[11px] text-slate-450 italic">
                Tip: Spend over $500.00 for free shipping!
              </p>
            )}
            
            <div className="border-t border-slate-100 pt-4 flex justify-between text-base font-extrabold text-slate-950">
              <span>Total Price</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded transition-colors text-sm text-center cursor-pointer"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
