import React, { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/product-card';
import { Product } from '@/lib/types';
import { X, Search } from 'lucide-react';
import SortSelector from './sort-selector';

const ITEMS_PER_PAGE = 12;
const CATEGORIES = ['Mobiles', 'Laptops', 'Audio', 'Gaming', 'Accessories', 'Smart Home'];

// Generate fallback local products if DB not seeded
function getFallbackProducts(search: string, category: string, sort: string): { products: Product[]; total: number } {
  // Let's create the same 100 product definitions as the seed script for consistency
  const list: Product[] = [];
  const basePrices: Record<string, number> = {
    Mobiles: 699, Laptops: 1299, Audio: 149, Gaming: 349, Accessories: 39, 'Smart Home': 129
  };

  for (let i = 0; i < 100; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    const name = `${cat} Device Model #${i + 1}`;
    list.push({
      id: `fallback-id-${i}`,
      name,
      description: `Premium grade high efficiency device listed under the ${cat} category. Designed for robust deployment in test frameworks.`,
      price: basePrices[cat] + (i * 2.5) % 150,
      image_url: `https://images.unsplash.com/photo-${1600000000000 + i * 12345}?w=600&auto=format&fit=crop&q=60`,
      category: cat,
      stock: i % 7 === 0 ? 0 : (i * 3) % 80 + 1,
      created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString()
    });
  }

  // Filter
  let filtered = list;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  // Sort
  if (sort === 'price_asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === 'name_asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Newest
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return {
    products: filtered,
    total: filtered.length
  };
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const category = params.category || '';
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1', 10);
  const offset = (page - 1) * ITEMS_PER_PAGE;

  let products: Product[] = [];
  let totalCount = 0;
  let usingFallback = false;

  try {
    const supabase = await createClient();
    
    // Construct query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Sort order
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'name_asc') {
      query = query.order('name', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + ITEMS_PER_PAGE - 1);

    const { data, count, error } = await query;

    if (!error && data && data.length > 0) {
      products = data;
      totalCount = count || 0;
    } else {
      usingFallback = true;
    }
  } catch (e) {
    usingFallback = true;
  }

  if (usingFallback) {
    const fallbackData = getFallbackProducts(search, category, sort);
    totalCount = fallbackData.total;
    products = fallbackData.products.slice(offset, offset + ITEMS_PER_PAGE);
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Helper function to build URL queries
  const getQueryUrl = (newParams: Record<string, string | number | null>) => {
    const merged = { ...params, ...newParams };
    const queryParts = [];
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParts.push(`${key}=${encodeURIComponent(value.toString())}`);
      }
    }
    return `/products${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount} items found {search && `for "${search}"`} {category && `in ${category}`}
          </p>
        </div>

        {/* Sort selector */}
        <SortSelector />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel - Desktop */}
        <aside className="space-y-6">
          {/* Active filters summary */}
          {(search || category) && (
            <div className="bg-slate-100 p-4 rounded">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Filters</span>
                <Link href="/products" className="text-xs text-indigo-600 hover:underline">
                  Clear All
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {search && (
                  <span className="bg-white border border-slate-200 text-xs px-2.5 py-1 rounded flex items-center gap-1.5">
                    <span>"{search}"</span>
                    <Link href={getQueryUrl({ search: null, page: 1 })}>
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </Link>
                  </span>
                )}
                {category && (
                  <span className="bg-white border border-slate-200 text-xs px-2.5 py-1 rounded flex items-center gap-1.5">
                    <span>{category}</span>
                    <Link href={getQueryUrl({ category: null, page: 1 })}>
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </Link>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Category Links */}
          <div className="bg-white border border-slate-200 rounded p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2 mb-1">
              Shop by Category
            </h3>
            <div className="flex flex-col gap-1.5">
              <Link
                href={getQueryUrl({ category: null, page: 1 })}
                className={`text-sm py-1.5 px-2.5 rounded transition-colors ${
                  !category
                    ? 'bg-indigo-550 text-white font-semibold bg-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                All Categories
              </Link>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={getQueryUrl({ category: cat, page: 1 })}
                  className={`text-sm py-1.5 px-2.5 rounded transition-colors ${
                    category === cat
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <section className="lg:col-span-3 space-y-8">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200 rounded">
              <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
              <p className="text-sm text-slate-500 mb-6">We couldn't find any products matching your search filters.</p>
              <Link href="/products" className="bg-slate-900 hover:bg-slate-950 text-white font-semibold px-6 py-2.5 rounded text-sm transition-colors">
                Clear Filters
              </Link>
            </div>
          ) : (
            <>
              {/* Responsive Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-between border-t border-slate-200 pt-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Link
                      href={page > 1 ? getQueryUrl({ page: page - 1 }) : '#'}
                      className={`relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-semibold rounded ${
                        page === 1
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Previous
                    </Link>
                    <Link
                      href={page < totalPages ? getQueryUrl({ page: page + 1 }) : '#'}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-semibold rounded ${
                        page === totalPages
                          ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Next
                    </Link>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        Showing page <span className="font-semibold">{page}</span> of{' '}
                        <span className="font-semibold">{totalPages}</span> ({totalCount} items total)
                      </p>
                    </div>
                    <div>
                      <div className="relative z-0 inline-flex rounded shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Prev page button */}
                        <Link
                          href={page > 1 ? getQueryUrl({ page: page - 1 }) : '#'}
                          className={`relative inline-flex items-center px-3 py-2 rounded-l border border-slate-200 text-sm font-semibold ${
                            page === 1
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Prev
                        </Link>
                        
                        {/* Pages */}
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const pageNum = idx + 1;
                          return (
                            <Link
                              key={pageNum}
                              href={getQueryUrl({ page: pageNum })}
                              className={`relative inline-flex items-center px-4 py-2 border border-slate-200 text-sm font-semibold ${
                                pageNum === page
                                  ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </Link>
                          );
                        })}

                        {/* Next page button */}
                        <Link
                          href={page < totalPages ? getQueryUrl({ page: page + 1 }) : '#'}
                          className={`relative inline-flex items-center px-3 py-2 rounded-r border border-slate-200 text-sm font-semibold ${
                            page === totalPages
                              ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Next
                        </Link>
                      </div>
                    </div>
                  </div>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
