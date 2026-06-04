'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    params.set('page', '1'); // reset page on sort change
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Sort By:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={handleSortChange}
        className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
      >
        <option value="newest">Newest Arrivals</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="name_asc">Product Name (A-Z)</option>
      </select>
    </div>
  );
}

export default function SortSelector() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort By:</span>
        <div className="w-32 h-8 bg-white border border-slate-200 rounded animate-pulse" />
      </div>
    }>
      <SortDropdown />
    </Suspense>
  );
}
