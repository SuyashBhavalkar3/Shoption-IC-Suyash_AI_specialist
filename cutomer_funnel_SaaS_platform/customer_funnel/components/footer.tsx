import Link from 'next/link';
import { Laptop } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
              <Laptop className="w-5 h-5 text-indigo-400" />
              <span>TECHSTORE</span>
            </Link>
            <p className="text-sm">
              Your premium shop for consumer electronics, mobiles, audio, gaming gear, smart home systems, and accessories.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Shop Categories</h3>
            <ul className="space-y-2 text-sm">
              {['Mobiles', 'Laptops', 'Audio', 'Gaming', 'Accessories', 'Smart Home'].map((cat) => (
                <li key={cat}>
                  <Link href={`/products?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies & Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
              <li><Link href="/account/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><span className="text-slate-500">Terms of Service</span></li>
              <li><span className="text-slate-500">Privacy Policy</span></li>
            </ul>
          </div>

          {/* SAAS Analytics Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Analytics Testing Environment</h3>
            <p className="text-sm leading-relaxed">
              This store is a mock ecommerce platform designed to generate customer funnel telemetry. It simulates real product views, cart additions, and checkouts for analytics integration.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} TECHSTORE Inc. Built for funnel testing. No real payments processed.</p>
        </div>
      </div>
    </footer>
  );
}
