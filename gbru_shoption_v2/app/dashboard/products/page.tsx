import React, { Suspense } from 'react';
import Products from '@/components/Products';

export const metadata = {
  title: 'Products (Dashboard) - GBRU',
  description: 'View products in this category.',
};

export default function DashboardProductsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="w-10 h-10 border-4 border-[#006B21] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-zinc-500 font-medium font-roboto">Loading GBRU products...</span>
      </div>
    }>
      <Products />
    </Suspense>
  );
}
