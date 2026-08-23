import React from 'react';
import OrderList from '@/components/order_list';

export const metadata = {
  title: 'My Purchased Orders - GBRU',
  description: 'View your GBRU orders',
};

export default function OrdersPage() {
  return <OrderList />;
}
