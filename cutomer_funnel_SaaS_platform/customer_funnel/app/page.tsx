import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/product-card';
import { Product } from '@/lib/types';
import { Smartphone, Laptop, Headphones, Gamepad, Radio, Shield, ShoppingBag, ArrowRight } from 'lucide-react';

// Static fallbacks in case Supabase is not configured yet or has no data
const FALLBACK_FEATURED_PRODUCTS: Product[] = [
  {
    id: 'f1',
    name: 'Quantum X Pro',
    description: 'High-performance flagship smartphone with 5G connectivity and superior display properties.',
    price: 999.00,
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60',
    category: 'Mobiles',
    stock: 24,
    created_at: new Date().toISOString()
  },
  {
    id: 'f2',
    name: 'AeroBook Pro 14',
    description: 'Lightweight professional laptop powered by next-gen processing speeds and durable battery life.',
    price: 1299.00,
    image_url: 'https://picsum.photos/id/0/600/400',
    category: 'Laptops',
    stock: 12,
    created_at: new Date().toISOString()
  },
  {
    id: 'f3',
    name: 'AeroPods Max Noise-Cancelling',
    description: 'Premium over-ear wireless headphones with studio-quality audio isolation capabilities.',
    price: 299.00,
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60',
    category: 'Audio',
    stock: 45,
    created_at: new Date().toISOString()
  },
  {
    id: 'f4',
    name: 'Vortex Console X',
    description: 'Next-gen gaming console built to support native high-fidelity immersive gameplay.',
    price: 499.00,
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=60',
    category: 'Gaming',
    stock: 5,
    created_at: new Date().toISOString()
  }
];

const CATEGORIES = [
  { name: 'Mobiles', icon: Smartphone, color: 'bg-blue-600' },
  { name: 'Laptops', icon: Laptop, color: 'bg-indigo-600' },
  { name: 'Audio', icon: Headphones, color: 'bg-emerald-600' },
  { name: 'Gaming', icon: Gamepad, color: 'bg-rose-600' },
  { name: 'Accessories', icon: Shield, color: 'bg-amber-600' },
  { name: 'Smart Home', icon: Radio, color: 'bg-violet-600' }
];

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  let featuredProducts: Product[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(4);

    if (!error && data && data.length > 0) {
      featuredProducts = data;
    } else {
      featuredProducts = FALLBACK_FEATURED_PRODUCTS;
    }
  } catch (e) {
    console.warn('Could not load featured products from DB. Using fallbacks.');
    featuredProducts = FALLBACK_FEATURED_PRODUCTS;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">
              New Season Launch
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Smarter Gadgets for Modern Life
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl max-w-lg leading-relaxed">
              Explore our curated selection of high-performance laptops, mobile phones, audio systems, and smart home solutions. Built for power and speed.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded text-base transition-colors"
              >
                <span>Shop Catalog</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/products?category=Gaming"
                className="inline-flex items-center justify-center border border-slate-700 hover:border-white text-slate-300 hover:text-white font-semibold px-6 py-3 rounded text-base transition-colors"
              >
                Gaming Specials
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative aspect-[4/3] rounded overflow-hidden border border-slate-800 bg-slate-800/50">
            <img
              src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1000&auto=format&fit=crop&q=80"
              alt="Premium devices showcase"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.name}
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded hover:shadow-md transition-shadow group text-center"
              >
                <div className={`p-4 rounded-full ${category.color} text-white mb-4 group-hover:scale-105 transition-transform duration-200`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <span className="font-semibold text-slate-800 text-sm">{category.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Featured Releases</h2>
          <Link href="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5">
            <span>View all products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-700 text-white rounded p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight">Need smart upgrades for your home?</h2>
            <p className="text-indigo-100 max-w-md leading-relaxed">
              Explore the latest in connected home tech. Smart thermostats, leak sensors, secure cameras, and air purifiers are in stock today.
            </p>
            <Link
              href="/products?category=Smart%20Home"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-950 text-white text-sm font-bold px-6 py-3 rounded transition-colors"
            >
              <span>Explore Smart Home</span>
            </Link>
          </div>
          <div className="aspect-[2/1] relative rounded overflow-hidden bg-indigo-800">
            <img
              src="https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80"
              alt="Smart home appliances banner"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
