import React from 'react';
import UserProfile from '@/components/UserProfile';

export const metadata = {
  title: 'My Profile - GBRU',
  description: 'Manage your GBRU account details, delivery address, and order summaries.',
};

export default function UserProfilePage() {
  return <div className="overflow-x-hidden"><UserProfile /></div>;
}
