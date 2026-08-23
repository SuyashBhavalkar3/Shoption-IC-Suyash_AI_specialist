import React from 'react';
import Profile from '@/components/Profile';

export const metadata = {
  title: 'Profile - GBRU',
  description: 'Share your location details',
};

export default function ProfilePage() {
  return <div className="overflow-x-hidden"><Profile /></div>;
}
