'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/lib/types';
import { useApp } from '@/lib/context/app-context';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useApp();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Don't navigate to details page when clicking add to cart button
    setIsAdding(true);
    try {
      await addToCart(product, 1);
    } finally {
      setIsAdding(false);
    }
  };

  const getStockBadge = () => {
    if (product.stock === 0) {
      return (
        <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2 py-0.5 rounded">
          Out of Stock
        </span>
      );
    }
    if (product.stock <= 10) {
      return (
        <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">
          Only {product.stock} left!
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded">
        In Stock
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden flex flex-col group hover:shadow-md transition-shadow duration-200">
      {/* Product Image Link */}
      <Link href={`/products/${product.id}`} className="relative block aspect-video overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-slate-900/90 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            {product.category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          {getStockBadge()}
          <span className="text-slate-900 font-extrabold text-lg">${product.price.toFixed(2)}</span>
        </div>

        <Link href={`/products/${product.id}`} className="block group-hover:text-indigo-600 transition-colors">
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-1 mb-1">{product.name}</h3>
        </Link>
        
        <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-grow">{product.description}</p>

        {/* Action Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
            product.stock === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isAdding ? 'Adding...' : product.stock === 0 ? 'Out of stock' : 'Add To Cart'}</span>
        </button>
      </div>
    </div>
  );
}
