'use client';

import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/context/app-context';

interface DetailActionsProps {
  product: Product;
}

export default function ProductDetailActions({ product }: DetailActionsProps) {
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const incrementQty = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (product.stock <= 0) return;
    
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity:</span>
          <div className="flex items-center border border-slate-300 rounded overflow-hidden bg-white">
            <button
              onClick={decrementQty}
              disabled={quantity <= 1 || isAdding}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-4 py-1.5 text-sm font-semibold text-slate-800 min-w-10 text-center">
              {quantity}
            </span>
            <button
              onClick={incrementQty}
              disabled={quantity >= product.stock || isAdding}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-xs text-slate-500">({product.stock} available)</span>
        </div>
      )}

      {/* Add To Cart Trigger */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        className={`w-full max-w-xs flex items-center justify-center gap-2 py-3 px-6 rounded text-sm font-bold tracking-wide transition-colors cursor-pointer ${
          isOutOfStock
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <ShoppingCart className="w-4 h-4" />
        <span>{isAdding ? 'Adding to Cart...' : isOutOfStock ? 'Out of Stock' : 'Add To Cart'}</span>
      </button>
    </div>
  );
}
