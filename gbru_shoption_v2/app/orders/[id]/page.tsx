import React from 'react';
import OrderDetails from '@/components/order_details';

export const metadata = {
  title: 'Order Details - GBRU',
  description: 'View the details of your GBRU order',
};

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <OrderDetails orderId={resolvedParams.id} />;
}
