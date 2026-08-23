import React from 'react';
import Categories from '@/components/Categories';

export const metadata = {
  title: 'Categories (Dashboard) - GBRU',
  description: 'Shop by category and discover our comprehensive range of agricultural solutions.',
};

export default function DashboardCategoriesPage() {
  // Authentication checking can be added here
  return <Categories />;
}
