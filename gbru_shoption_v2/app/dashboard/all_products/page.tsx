import React from 'react';
import AllProducts from '@/components/AllProducts';

export const metadata = {
  title: 'All Products (Dashboard) - GBRU',
  description: 'Explore our curated collection of industrial-grade machinery and farming tools.',
};

export default function DashboardAllProductsPage() {
  // Normally you would check for authentication here and redirect if not logged in
  return <AllProducts />;
}
