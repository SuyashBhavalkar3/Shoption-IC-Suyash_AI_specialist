import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Product } from '@/lib/types';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import ProductDetailActions from './detail-actions';
import AnalyticsTracker from './analytics-tracker';

const CATEGORIES = ['Mobiles', 'Laptops', 'Audio', 'Gaming', 'Accessories', 'Smart Home'];

// Fallback logic to locate the product if database query fails or hasn't seeded yet
function findFallbackProduct(id: string): Product | null {
  const basePrices: Record<string, number> = {
    Mobiles: 699, Laptops: 1299, Audio: 149, Gaming: 349, Accessories: 39, 'Smart Home': 129
  };

  // Check fallbacks
  for (let i = 0; i < 100; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const generatedId = `fallback-id-${i}`;
    if (generatedId === id) {
      return {
        id: generatedId,
        name: `${cat} Device Model #${i + 1}`,
        description: `Premium grade high efficiency device listed under the ${cat} category. Highly optimized architecture with industry-grade performance metrics, built to survive strenuous deployments.`,
        price: basePrices[cat] + (i * 2.5) % 150,
        image_url: `https://images.unsplash.com/photo-${1600000000000 + i * 12345}?w=600&auto=format&fit=crop&q=60`,
        category: cat,
        stock: i % 7 === 0 ? 0 : (i * 3) % 80 + 1,
        created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
      };
    }
  }

  // Also match fallback IDs from featured products
  const features = [
    { id: 'f1', name: 'Quantum X Pro', price: 999.00, cat: 'Mobiles', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' },
    { id: 'f2', name: 'AeroBook Pro 14', price: 1299.00, cat: 'Laptops', img: 'https://picsum.photos/id/0/600/400' },
    { id: 'f3', name: 'AeroPods Max Noise-Cancelling', price: 299.00, cat: 'Audio', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' },
    { id: 'f4', name: 'Vortex Console X', price: 499.00, cat: 'Gaming', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600' }
  ];

  const matchedFeature = features.find(f => f.id === id);
  if (matchedFeature) {
    return {
      id: matchedFeature.id,
      name: matchedFeature.name,
      description: `Premium grade high efficiency product. Beautiful, minimalist styling, designed to enhance user workflow.`,
      price: matchedFeature.price,
      image_url: matchedFeature.img,
      category: matchedFeature.cat,
      stock: 15,
      created_at: new Date().toISOString()
    };
  }

  return null;
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  let product: Product | null = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      product = data;
    } else {
      product = findFallbackProduct(id);
    }
  } catch (e) {
    product = findFallbackProduct(id);
  }

  if (!product) {
    notFound();
  }

  const getStockBadge = () => {
    if (product!.stock === 0) {
      return (
        <span className="bg-rose-100 text-rose-800 text-sm font-semibold px-3 py-1 rounded">
          Out of Stock
        </span>
      );
    }
    if (product!.stock <= 10) {
      return (
        <span className="bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded">
          Only {product!.stock} left - Order Soon
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1 rounded">
        In Stock
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Analytics Trigger */}
      <AnalyticsTracker product={product} />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-indigo-600 transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-indigo-600 transition-colors">
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-700 truncate">{product.name}</span>
      </nav>

      {/* Back button */}
      <div>
        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Product Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white border border-slate-200 rounded p-6 sm:p-8">
        {/* Left column - Image */}
        <div className="aspect-[4/3] relative rounded overflow-hidden bg-slate-50 border border-slate-100">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right column - Meta Details & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                {product.category}
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-slate-950">${product.price.toFixed(2)}</span>
              {getStockBadge()}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>

          {/* Client Action Components (Qty select, Add-to-cart sync) */}
          <div className="border-t border-slate-100 pt-6">
            <ProductDetailActions product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
