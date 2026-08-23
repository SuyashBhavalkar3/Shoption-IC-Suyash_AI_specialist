import React from 'react';
import OrderConfirmed from '@/components/OrderConfirmed';

export const metadata = {
  title: 'Order Confirmed - GBRU',
  description: 'Thank you for choosing GBRU. Your order has been placed successfully.',
};

export default function PlaceOrderPage() {
  return <OrderConfirmed />;
}
