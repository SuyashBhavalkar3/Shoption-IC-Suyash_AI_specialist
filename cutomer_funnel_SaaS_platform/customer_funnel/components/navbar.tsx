'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCart, User, LogOut, Search, Menu, X, Laptop } from 'lucide-react';
import { useApp } from '@/lib/context/app-context';

export default function Navbar() {
  const { user, cartCount, signOut } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              <Laptop className="w-6 h-6 text-indigo-400" />
              <span>TECH<span className="text-indigo-400 font-extrabold">STORE</span></span>
            </Link>
          </div>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-grow max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Search gadgets, devices, accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-sm text-slate-200 pl-4 pr-10 py-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 border border-slate-700 transition-all"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
              <Search className="w-4.5 h-4.5" />
            </button>
          </form>

          {/* Desktop Actions */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Browse Store
            </Link>
            
            {/* Cart Icon */}
            <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/account/orders"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Orders</span>
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative p-2 text-slate-300 hover:text-white transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-2 pb-4 space-y-3">
          {/* Search bar - mobile */}
          <form onSubmit={handleSearchSubmit} className="relative w-full py-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-sm text-slate-200 pl-4 pr-10 py-2 rounded focus:outline-none border border-slate-700"
            />
            <button type="submit" className="absolute right-3 top-3.5 text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </button>
          </form>

          <Link
            href="/products"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-base font-medium text-slate-300 hover:text-white py-2"
          >
            Browse Store
          </Link>

          {/* Categories list in Mobile view */}
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categories</p>
            <div className="grid grid-cols-2 gap-2">
              {['Mobiles', 'Laptops', 'Audio', 'Gaming', 'Accessories', 'Smart Home'].map((cat) => (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm text-slate-400 hover:text-white py-1"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            {user ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 mb-2">Logged in as {user.email}</div>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-base font-medium text-slate-300 hover:text-white py-2"
                >
                  <User className="w-5 h-5" />
                  <span>My Orders</span>
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-base font-medium text-rose-400 hover:text-rose-300 py-2 text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded transition-colors text-center"
              >
                <User className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
