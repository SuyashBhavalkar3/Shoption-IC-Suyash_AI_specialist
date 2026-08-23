import React from 'react';
import AddressList from '@/components/AddressList';

export const metadata = {
  title: 'My Address - GBRU',
  description: 'Manage your saved delivery addresses',
};

export default function AddressesPage() {
  return <AddressList />;
}
